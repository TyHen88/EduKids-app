import { Star, ShieldCheck } from "lucide-react";

import { getBadges, getUserBadges, getUserProgress } from "@/db/queries";

import { BadgesGrid } from "./badges-grid";

const AchievementsPage = async () => {
  const [badges, userBadges, userProgress] = await Promise.all([
    getBadges(),
    getUserBadges(),
    getUserProgress(),
  ]);

  const earnedIds = userBadges.map((ub) => ub.badgeId);

  return (
    <div className="mx-auto w-full max-w-4xl px-2 pb-12">
      <div className="relative mb-10 flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[32px] border-[4px] border-indigo-400 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-10 text-white shadow-xl shadow-indigo-300/50 md:flex-row">
        <Star className="absolute right-10 top-6 h-4 w-4 fill-current text-white/40" />
        <Star className="absolute bottom-8 right-32 h-3 w-3 fill-current text-white/30" />
        <Star className="absolute left-1/2 top-10 h-2 w-2 fill-current text-white/40" />
        <div className="relative text-center md:text-left">
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">
            Galaxy Collection 🌌
          </h1>
          <p className="text-lg font-bold text-indigo-100">
            Finish lessons to collect star cards across the galaxy!
          </p>
        </div>

        <div className="relative flex items-center gap-8 rounded-2xl border border-white/20 bg-white/15 p-6 backdrop-blur-md">
          <div className="text-center">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-100">
              Collected
            </div>
            <div className="flex items-center justify-center gap-2 text-4xl font-black">
              {earnedIds.length}
              <span className="text-2xl text-indigo-200">/ {badges.length}</span>
            </div>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-100">
              Stardust
            </div>
            <div className="flex items-center justify-center gap-2 text-4xl font-black">
              {userProgress?.points ?? 0}{" "}
              <Star className="h-8 w-8 fill-current text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-6 flex items-center gap-3 px-2 text-xl font-black tracking-tight text-slate-800">
        <ShieldCheck className="h-6 w-6 text-indigo-500" />
        Your Star Cards
      </h2>

      {badges.length === 0 ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          No star cards have been created yet.
        </div>
      ) : (
        <BadgesGrid badges={badges} earnedIds={earnedIds} />
      )}
    </div>
  );
};

export default AchievementsPage;
