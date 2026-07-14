"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { videoKeywords, videoChannels, videoCache, userProgress } from "@/db/schema";
import { getUserProgress } from "@/db/queries";
import { getDefaultVideos, searchVideos, type VideoPage } from "@/lib/youtube";

const assertAdmin = async () => {
  if (!(await getIsAdmin())) throw new Error("Unauthorized.");
};

// Editing keywords/channels changes the learner feed, so drop the cached
// YouTube responses to force a fresh fetch.
const clearVideoCache = async () => {
  await db.delete(videoCache);
};

const revalidate = (lang: string) => {
  revalidatePath(`/${lang}/admin/videos`);
  revalidatePath(`/${lang}/videos`);
};

// ── Keywords ─────────────────────────────────────────────────────────────

export const addVideoKeyword = async (
  input: { keyword: string; category?: string; language?: string },
  lang = "en"
) => {
  await assertAdmin();
  const keyword = input.keyword.trim();
  if (!keyword) throw new Error("Keyword is required.");

  const [{ value: maxOrder } = { value: 0 }] = await db
    .select({ value: max(videoKeywords.order) })
    .from(videoKeywords);

  await db.insert(videoKeywords).values({
    keyword,
    category: input.category?.trim() || "General",
    language: input.language?.trim() || "en",
    order: (maxOrder ?? 0) + 1,
  });

  await clearVideoCache();
  revalidate(lang);
  return { success: true };
};

export const updateVideoKeyword = async (
  id: number,
  input: { keyword?: string; category?: string; language?: string; enabled?: boolean },
  lang = "en"
) => {
  await assertAdmin();

  const patch: Record<string, unknown> = {};
  if (input.keyword !== undefined) patch.keyword = input.keyword.trim();
  if (input.category !== undefined) patch.category = input.category.trim() || "General";
  if (input.language !== undefined) patch.language = input.language.trim() || "en";
  if (input.enabled !== undefined) patch.enabled = !!input.enabled;

  if (Object.keys(patch).length > 0) {
    await db.update(videoKeywords).set(patch).where(eq(videoKeywords.id, id));
    await clearVideoCache();
  }
  revalidate(lang);
  return { success: true };
};

export const deleteVideoKeyword = async (id: number, lang = "en") => {
  await assertAdmin();
  await db.delete(videoKeywords).where(eq(videoKeywords.id, id));
  await clearVideoCache();
  revalidate(lang);
  return { success: true };
};

// ── Channel allowlist ────────────────────────────────────────────────────

export const addVideoChannel = async (
  input: { channelId: string; title?: string },
  lang = "en"
) => {
  await assertAdmin();
  const channelId = input.channelId.trim();
  if (!channelId) throw new Error("Channel ID is required.");

  await db.insert(videoChannels).values({
    channelId,
    title: input.title?.trim() || "",
  });

  await clearVideoCache();
  revalidate(lang);
  return { success: true };
};

export const updateVideoChannel = async (
  id: number,
  input: { title?: string; enabled?: boolean },
  lang = "en"
) => {
  await assertAdmin();

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.enabled !== undefined) patch.enabled = !!input.enabled;

  if (Object.keys(patch).length > 0) {
    await db.update(videoChannels).set(patch).where(eq(videoChannels.id, id));
    await clearVideoCache();
  }
  revalidate(lang);
  return { success: true };
};

export const deleteVideoChannel = async (id: number, lang = "en") => {
  await assertAdmin();
  await db.delete(videoChannels).where(eq(videoChannels.id, id));
  await clearVideoCache();
  revalidate(lang);
  return { success: true };
};

// Manually drop the cache (admin "refresh feed" button).
export const refreshVideoFeed = async (lang = "en") => {
  await assertAdmin();
  await clearVideoCache();
  revalidate(lang);
  return { success: true };
};

// ── Learner feed (used by the /videos grid for search + infinite scroll) ──

// One entry point: a non-empty query runs open search; otherwise the curated
// default feed. Any signed-in learner/child may call it.
export const loadVideos = async (
  query: string,
  pageToken?: string
): Promise<VideoPage> => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");

  const q = query.trim();
  return q ? searchVideos(q, pageToken) : getDefaultVideos(pageToken);
};

export const awardVideoPoints = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error("User progress not found.");

  await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10, // Award 10 Stardust
      buddyXp: currentUserProgress.buddyXp + 15, // Award 15 Buddy XP
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/learn`);
  revalidatePath(`/path`);
  revalidatePath(`/achievements`);
  revalidatePath(`/videos`);
  return { success: true };
};
