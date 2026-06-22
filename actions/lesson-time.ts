"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { lessonTime } from "@/db/schema";

// Records how long the current user spent on a lesson and which question
// blocks they answered wrong (with counts). Stores the most recent run's
// values (overwrites any previous value for this user + lesson).
export const saveLessonTime = async (
  lessonId: number,
  seconds: number,
  wrongDetail: { blockId: number; count: number; optionIds?: number[] }[] = []
) => {
  const { userId } = await auth();
  if (!userId) return;
  if (!Number.isFinite(seconds) || seconds < 0) return;

  const safeSeconds = Math.min(Math.floor(seconds), 60 * 60 * 12); // cap at 12h

  // Sanitize the per-block detail and derive the total.
  const detail = (Array.isArray(wrongDetail) ? wrongDetail : [])
    .filter(
      (d) =>
        d &&
        Number.isFinite(d.blockId) &&
        Number.isFinite(d.count) &&
        d.count > 0
    )
    .map((d) => ({
      blockId: Math.floor(d.blockId),
      count: Math.min(Math.floor(d.count), 9999),
      optionIds: Array.isArray(d.optionIds)
        ? d.optionIds.filter((id) => Number.isFinite(id)).map((id) => Math.floor(id))
        : [],
    }));
  const safeWrong = detail.reduce((s, d) => s + d.count, 0);

  const existing = await db.query.lessonTime.findFirst({
    where: and(eq(lessonTime.userId, userId), eq(lessonTime.lessonId, lessonId)),
  });

  if (existing) {
    await db
      .update(lessonTime)
      .set({
        seconds: safeSeconds,
        wrongAnswers: safeWrong,
        wrongDetail: detail,
        updatedAt: new Date(),
      })
      .where(eq(lessonTime.id, existing.id));
  } else {
    await db.insert(lessonTime).values({
      userId,
      lessonId,
      seconds: safeSeconds,
      wrongAnswers: safeWrong,
      wrongDetail: detail,
    });
  }
};
