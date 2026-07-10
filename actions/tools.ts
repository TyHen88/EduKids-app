"use server";

import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { userProgress } from "@/db/schema";

export type ImageResult = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source: string;
  link: string;
  width?: number;
  height?: number;
};

// The assistant tools live in the admin and parent panels, so allow either an
// admin or a parent account.
export const assertAdminOrParent = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");
  if (await getIsAdmin()) return;

  const up = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { role: true },
  });
  if (up?.role !== "parent") throw new Error("Unauthorized.");
};

/**
 * Image-only search via serper.dev (Google Images). Returns a list of results
 * the user can copy an image URL from (e.g. for a book cover or page). `page`
 * (1-indexed) maps to serper's `page` param so the UI can load more results.
 */
export const searchImages = async (
  query: string,
  page = 1
): Promise<ImageResult[]> => {
  await assertAdminOrParent();

  const q = query.trim();
  if (!q) return [];

  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("Image search is not configured.");

  const safePage = Math.max(1, Math.floor(page) || 1);

  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q, page: safePage }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[searchImages] serper ${res.status}: ${detail}`);
    // 401/403 means the SERPER_API_KEY is missing, invalid, or out of credits.
    if (res.status === 401 || res.status === 403) {
      throw new Error("Image search is not configured. Check SERPER_API_KEY.");
    }
    throw new Error("Image search failed. Please try again.");
  }

  const data = (await res.json()) as { images?: unknown[] };
  const images = Array.isArray(data.images) ? data.images : [];

  return images
    .map((raw) => {
      const i = raw as Record<string, unknown>;
      return {
        title: typeof i.title === "string" ? i.title : "",
        imageUrl: typeof i.imageUrl === "string" ? i.imageUrl : "",
        thumbnailUrl:
          typeof i.thumbnailUrl === "string"
            ? i.thumbnailUrl
            : typeof i.imageUrl === "string"
            ? i.imageUrl
            : "",
        source: typeof i.source === "string" ? i.source : "",
        link: typeof i.link === "string" ? i.link : "",
        width: typeof i.imageWidth === "number" ? i.imageWidth : undefined,
        height: typeof i.imageHeight === "number" ? i.imageHeight : undefined,
      } satisfies ImageResult;
    })
    .filter((i) => i.imageUrl);
};
