// Cosmic Explorer — companion buddy growth.
// The buddy gains XP as the kid learns (and from feeding Stardust), evolving
// through a series of space-themed stages.

export const FEED_COST = 20; // Stardust spent per feed
export const FEED_XP = 30; // buddy XP gained per feed
export const LESSON_XP = 5; // buddy XP gained per completed challenge

export type BuddyStage = {
  index: number;
  name: string;
  emoji: string;
};

export const BUDDY_STAGES: { threshold: number; stage: BuddyStage }[] = [
  { threshold: 0, stage: { index: 0, name: "Star Egg", emoji: "🥚" } },
  { threshold: 30, stage: { index: 1, name: "Star Sprout", emoji: "👾" } },
  { threshold: 90, stage: { index: 2, name: "Cosmo Explorer", emoji: "🚀" } },
  { threshold: 200, stage: { index: 3, name: "Galactic Hero", emoji: "🌟" } },
];

export const getBuddy = (xp: number) => {
  let current = BUDDY_STAGES[0];
  for (const entry of BUDDY_STAGES) {
    if (xp >= entry.threshold) current = entry;
  }

  const next = BUDDY_STAGES.find((e) => e.threshold > xp);

  const progressToNext = next
    ? Math.round(
        ((xp - current.threshold) / (next.threshold - current.threshold)) * 100
      )
    : 100;

  return {
    stage: current.stage,
    isMaxStage: !next,
    xp,
    nextThreshold: next?.threshold ?? null,
    xpToNext: next ? next.threshold - xp : 0,
    progressToNext,
  };
};
