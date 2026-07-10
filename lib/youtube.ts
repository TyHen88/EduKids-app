import "server-only";

import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { videoCache } from "@/db/schema";
import { getVideoKeywords, getVideoChannels } from "@/db/queries";

// YouTube Data API v3. `search.list` costs 100 quota units/call (default cap
// 10k/day ≈ 100 calls), so every response is cached in `video_cache` and shared
// across all learners. Editing keywords/channels clears the cache (see
// actions/videos.ts).
const API = "https://www.googleapis.com/youtube/v3";
const SEARCH_TTL_MS = 6 * 60 * 60 * 1000; // 6h — search feeds
const META_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7d — video metadata/transcript
const PAGE_SIZE = "24";

export type VideoItem = {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
};

export type VideoPage = {
  items: VideoItem[];
  nextPageToken: string | null;
};

export type VideoDetails = {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
};

export type TranscriptSegment = { start: number; dur: number; text: string };

// ── Generic TTL cache (video_cache table) ─────────────────────────────────

async function readCache<T>(key: string, ttl: number): Promise<T | null> {
  const row = await db.query.videoCache.findFirst({
    where: eq(videoCache.cacheKey, key),
  });
  if (!row) return null;
  if (Date.now() - new Date(row.fetchedAt).getTime() > ttl) return null;
  return row.payload as T;
}

async function writeCache<T>(key: string, payload: T) {
  await db
    .insert(videoCache)
    .values({ cacheKey: key, payload: payload as object, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: videoCache.cacheKey,
      set: { payload: payload as object, fetchedAt: new Date() },
    });
}

// ── Search ────────────────────────────────────────────────────────────────

async function ytSearch(params: Record<string, string>): Promise<VideoPage> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube is not configured.");

  const url = new URL(`${API}/search`);
  url.searchParams.set("key", key);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", PAGE_SIZE);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[youtube] search ${res.status}: ${detail}`);
    throw new Error(`YouTube error (${res.status}).`);
  }

  const data = (await res.json()) as any;
  const items: VideoItem[] = (data.items ?? [])
    .map((it: any) => ({
      id: it.id?.videoId as string,
      title: it.snippet?.title ?? "",
      channelId: it.snippet?.channelId ?? "",
      channelTitle: it.snippet?.channelTitle ?? "",
      thumbnail:
        it.snippet?.thumbnails?.high?.url ??
        it.snippet?.thumbnails?.medium?.url ??
        it.snippet?.thumbnails?.default?.url ??
        "",
      publishedAt: it.snippet?.publishedAt ?? "",
    }))
    .filter((v: VideoItem) => v.id);

  return { items, nextPageToken: data.nextPageToken ?? null };
}

/**
 * The admin-curated default feed: enabled keywords (OR-joined) with strict
 * safe-search, then filtered to the enabled channel allowlist if any exists.
 */
export async function getDefaultVideos(pageToken?: string): Promise<VideoPage> {
  const cacheKey = `feed:${pageToken || "0"}`;
  const cached = await readCache<VideoPage>(cacheKey, SEARCH_TTL_MS);
  if (cached) return cached;

  const [keywords, channels] = await Promise.all([
    getVideoKeywords(true),
    getVideoChannels(true),
  ]);

  const q = keywords.map((k) => k.keyword).join(" | ") || "learning for kids";
  const allowed = new Set(channels.map((c) => c.channelId));

  const page = await ytSearch({ q, order: "relevance", pageToken: pageToken || "" });

  const result: VideoPage =
    allowed.size > 0
      ? { ...page, items: page.items.filter((i) => allowed.has(i.channelId)) }
      : page;

  await writeCache(cacheKey, result);
  return result;
}

/** Open learner search — strict safe-search, no channel restriction. */
export async function searchVideos(
  query: string,
  pageToken?: string
): Promise<VideoPage> {
  const q = query.trim();
  if (!q) return { items: [], nextPageToken: null };

  const cacheKey = `search:${q.toLowerCase()}:${pageToken || "0"}`;
  const cached = await readCache<VideoPage>(cacheKey, SEARCH_TTL_MS);
  if (cached) return cached;

  const page = await ytSearch({ q, pageToken: pageToken || "" });
  await writeCache(cacheKey, page);
  return page;
}

// ── Single video metadata (videos.list — 1 quota unit) ─────────────────────

export async function getVideoDetails(id: string): Promise<VideoDetails | null> {
  if (!id) return null;
  const cacheKey = `video:${id}`;
  const cached = await readCache<VideoDetails>(cacheKey, META_TTL_MS);
  if (cached) return cached;

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube is not configured.");

  const url = new URL(`${API}/videos`);
  url.searchParams.set("key", key);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", id);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error(`[youtube] videos.list ${res.status}`);
    return null;
  }
  const data = (await res.json()) as any;
  const it = data.items?.[0];
  if (!it) return null;

  const details: VideoDetails = {
    id,
    title: it.snippet?.title ?? "",
    channelId: it.snippet?.channelId ?? "",
    channelTitle: it.snippet?.channelTitle ?? "",
    description: it.snippet?.description ?? "",
    publishedAt: it.snippet?.publishedAt ?? "",
  };
  await writeCache(cacheKey, details);
  return details;
}

// ── Transcript (unofficial timedtext) ──────────────────────────────────────
// The Data API can't return captions for arbitrary videos (needs the owner's
// OAuth), so we read YouTube's public timedtext track like the common
// transcript libraries do. Not guaranteed — many videos have no captions and
// YouTube may block server fetches; callers must handle null.

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "CONSENT=YES+1",
};

async function fetchJson3(url: string): Promise<TranscriptSegment[]> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, cache: "no-store" });
    if (!res.ok) return [];
    const raw = await res.text();
    if (!raw.trim()) return [];
    const data = JSON.parse(raw) as any;
    return (data.events ?? [])
      .filter((e: any) => Array.isArray(e.segs))
      .map((e: any) => ({
        start: (e.tStartMs ?? 0) / 1000,
        dur: (e.dDurationMs ?? 0) / 1000,
        text: (e.segs.map((s: any) => s.utf8).join("") || "")
          .replace(/\s+/g, " ")
          .trim(),
      }))
      .filter((s: TranscriptSegment) => s.text);
  } catch {
    return [];
  }
}

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

async function fetchXml(url: string): Promise<TranscriptSegment[]> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, cache: "no-store" });
    if (!res.ok) return [];
    const xml = await res.text();
    const out: TranscriptSegment[] = [];
    const re = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml))) {
      const text = decodeEntities(m[3].replace(/<[^>]+>/g, ""))
        .replace(/\s+/g, " ")
        .trim();
      if (text) {
        out.push({ start: Number(m[1]), dur: Number(m[2] ?? 0), text });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function getTranscript(
  id: string
): Promise<TranscriptSegment[] | null> {
  if (!id) return null;
  const cacheKey = `transcript:${id}`;
  const cached = await readCache<TranscriptSegment[]>(cacheKey, META_TTL_MS);
  if (cached) return cached;

  try {
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${id}&hl=en`,
      { headers: BROWSER_HEADERS, cache: "no-store" }
    );
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const match = html.match(/"captionTracks":(\[[\s\S]*?\])/);
    if (!match) {
      await writeCache(cacheKey, []); // remember "none" so we don't refetch
      return null;
    }

    const tracks: { baseUrl?: string; languageCode?: string }[] = JSON.parse(
      match[1]
    );
    const track =
      tracks.find((t) => (t.languageCode || "").startsWith("en")) || tracks[0];
    if (!track?.baseUrl) {
      await writeCache(cacheKey, []);
      return null;
    }

    // Prefer JSON3; fall back to the default XML track (YouTube frequently
    // returns an empty body for server-side JSON3 requests).
    let segments = await fetchJson3(`${track.baseUrl}&fmt=json3`);
    if (!segments.length) segments = await fetchXml(track.baseUrl);

    await writeCache(cacheKey, segments); // cache [] too, so we don't refetch
    return segments.length ? segments : null;
  } catch (e) {
    console.error("[youtube] transcript failed:", e);
    return null;
  }
}
