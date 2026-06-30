import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PlayCircle,
  Award,
  Target,
  Star,
  CheckCircle2,
  ShieldQuestion,
  Users,
  Globe,
  Crown,
  Medal,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { QUESTS } from "@/constants";
import {
  getCoursesWithProgress,
  getTopFriends,
  getUserBadges,
  getUserProgress,
  getIsChild,
  getUserRank,
} from "@/db/queries";

import { Button } from "@/components/ui/button";
import { CompanionBuddy } from "./companion-buddy";
import { DailyChest } from "./daily-chest";
import { Greeting } from "./greeting";

type Props = {
  params: Promise<{ lang: string }>;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Tiered leaderboard shout-out card theme for the welcome area.
const rankTheme = (
  rank: number,
  name: string,
  dict: Record<string, string>
) => {
  if (rank === 1)
    return {
      grad: "from-amber-50 to-yellow-50",
      border: "border-amber-200 border-b-amber-300",
      ring: "border-amber-200",
      badge: "bg-amber-400",
      chip: "text-amber-600",
      num: "text-amber-500",
      Icon: Crown,
      label: dict["learn.rankTopStar"] || "Top Star",
      title: `🎉 ${dict["learn.rankCongrats"] || "Congratulations"}, ${name}!`,
      subtitle:
        dict["learn.rankFirstSubtitle"] ||
        "You're #1 on the leaderboard — amazing work!",
    };
  if (rank === 2)
    return {
      grad: "from-slate-50 to-slate-100",
      border: "border-slate-200 border-b-slate-300",
      ring: "border-slate-200",
      badge: "bg-slate-400",
      chip: "text-slate-500",
      num: "text-slate-500",
      Icon: Medal,
      label: dict["learn.rankRunnerUp"] || "Runner-Up",
      title: `${dict["learn.rankAwesome"] || "Awesome"}, ${name}!`,
      subtitle:
        dict["learn.rankSecondSubtitle"] || "You're #2 — so close to the top!",
    };
  if (rank === 3)
    return {
      grad: "from-orange-50 to-amber-50",
      border: "border-orange-200 border-b-orange-300",
      ring: "border-orange-200",
      badge: "bg-orange-400",
      chip: "text-orange-600",
      num: "text-orange-500",
      Icon: Medal,
      label: dict["learn.rankBronzeStar"] || "Bronze Star",
      title: `${dict["learn.rankGreatGoing"] || "Great going"}, ${name}!`,
      subtitle:
        dict["learn.rankThirdSubtitle"] || "You're #3 — keep climbing!",
    };
  if (rank <= 10)
    return {
      grad: "from-indigo-50 to-violet-50",
      border: "border-indigo-200 border-b-indigo-300",
      ring: "border-indigo-200",
      badge: "bg-indigo-500",
      chip: "text-indigo-600",
      num: "text-indigo-500",
      Icon: Star,
      label: dict["learn.rankTop10"] || "Top 10",
      title: `${dict["learn.rankInTop10"] || "You're in the Top 10"}, ${name}!`,
      subtitle: `${dict["learn.rankNum"] || "Ranked"} #${rank} — ${dict["learn.rankPushPodium"] || "push for the podium!"}`,
    };
  return {
    grad: "from-sky-50 to-indigo-50",
    border: "border-sky-200 border-b-sky-300",
    ring: "border-sky-200",
    badge: "bg-sky-500",
    chip: "text-sky-600",
    num: "text-sky-500",
    Icon: Star,
    label: dict["learn.rankKeepGoing"] || "Keep Going",
    title: `${dict["learn.rankNiceWork"] || "Nice work"}, ${name}!`,
    subtitle: `${dict["learn.rankYoureRanked"] || "You're ranked"} #${rank} — ${dict["learn.rankEveryLesson"] || "every lesson moves you up!"}`,
  };
};

const LearnPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");

  const [userProgress, courses, badges, topFriends, isChild, rank] = await Promise.all([
    getUserProgress(),
    getCoursesWithProgress(),
    getUserBadges(),
    getTopFriends(),
    getIsChild(),
    getUserRank(),
  ]);

  if (!userProgress || !userProgress.activeCourseId)
    redirect(`/${lang}/courses`);

  const currentCourse =
    courses.find((c) => c.isActive) ??
    courses.find((c) => c.status === "In Progress") ??
    courses[0];

  const name = userProgress.userName || dict["learn.friend"] || "friend";

  // Celebratory rank card (kid-friendly), only when the rank is meaningful.
  const rankCard =
    rank && rank.points > 0 && rank.total > 1
      ? rankTheme(rank.rank, name, dict)
      : null;

  // Real, points-based daily goals (uses existing QUESTS thresholds).
  const goals = QUESTS.slice(0, 3).map((q) => ({
    title: (dict["learn.earnXp"] || "Earn {value} XP").replace(
      "{value}",
      String(q.value)
    ),
    value: q.value,
    done: userProgress.points >= q.value,
  }));
  const goalsDone = goals.filter((g) => g.done).length;

  const chestAvailable = !(
    userProgress.lastChestAt &&
    isSameDay(new Date(userProgress.lastChestAt), new Date())
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-12 sm:space-y-6">
      {/* Welcome */}
      <Greeting name={name} />

      {/* Leaderboard rank celebration */}
      {rankCard && rank && (
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border-2 border-b-4 bg-gradient-to-br p-5 shadow-sm sm:rounded-[32px] sm:p-6",
            rankCard.border,
            rankCard.grad
          )}
        >
          <Sparkles
            className={cn(
              "pointer-events-none absolute right-6 top-5 h-6 w-6 opacity-60",
              rankCard.chip
            )}
          />
          <Sparkles
            className={cn(
              "pointer-events-none absolute bottom-5 right-20 h-4 w-4 opacity-50",
              rankCard.chip
            )}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative shrink-0">
              <div
                className={cn(
                  "relative h-16 w-16 overflow-hidden rounded-full border-4 bg-white",
                  rankCard.ring
                )}
              >
                <Image
                  src={userProgress.userImageSrc}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <span
                className={cn(
                  "absolute -right-1 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md",
                  rankCard.badge
                )}
              >
                <rankCard.Icon className="h-4 w-4 fill-current" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] font-black uppercase tracking-widest",
                  rankCard.chip
                )}
              >
                <rankCard.Icon className="h-3.5 w-3.5" /> {rankCard.label}
              </div>
              <h3 className="truncate text-lg font-black text-slate-800 sm:text-xl">
                {rankCard.title}
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                {rankCard.subtitle}
              </p>
            </div>

            <div className="ml-auto hidden shrink-0 text-right sm:block">
              <div className={cn("text-3xl font-black", rankCard.num)}>
                #{rank.rank}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {dict["learn.of"] || "of"} {rank.total}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily engagement: buddy + chest */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <CompanionBuddy
          buddyName={userProgress.buddyName}
          buddyXp={userProgress.buddyXp}
          points={userProgress.points}
          lang={lang}
        />
        <DailyChest
          available={chestAvailable}
          streak={userProgress.streak}
          lang={lang}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 md:col-span-1 lg:col-span-2">
          {/* Continue adventure */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 px-2 text-lg font-black tracking-tight text-slate-800">
              <Target className="h-5 w-5 text-indigo-500" />{" "}
              {dict["learn.continueAdventure"] || "Continue Adventure"}
            </h2>
            {currentCourse ? (
              <div className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 sm:flex-row sm:gap-6 sm:rounded-[32px] sm:p-6">
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border-2 border-slate-50 shadow-sm sm:w-32">
                  <Image
                    src={currentCourse.imageSrc}
                    alt={currentCourse.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {currentCourse.category}
                  </div>
                  <h3 className="mb-2 text-xl font-black text-slate-800">
                    {currentCourse.title}
                  </h3>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${currentCourse.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-600">
                      {currentCourse.progress}%
                    </span>
                  </div>
                  <Link
                    href={`/${lang}/path`}
                    className="flex items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-6 py-3.5 text-center text-sm font-black text-white shadow-lg transition-all hover:bg-indigo-700 active:translate-y-1 active:border-b-0"
                  >
                    <PlayCircle className="h-5 w-5" />{" "}
                    {dict["learn.jumpIn"] || "Jump In!"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[32px] border-2 border-slate-100 bg-white p-6 text-slate-500 shadow-sm">
                {dict["learn.noCourseYet"] || "No course yet."}{" "}
                <Link
                  href={`/${lang}/courses`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {dict["learn.pickOne"] || "Pick one!"}
                </Link>
              </div>
            )}
          </section>

          {/* Daily goals (points-based) */}
          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-800">
                <Award className="h-5 w-5 text-orange-500" />{" "}
                {dict["learn.todaysGoals"] || "Today's Goals"}
              </h2>
              <span className="text-sm font-bold text-slate-400">
                {goalsDone}/{goals.length} {dict["common.done"] || "Done"}
              </span>
            </div>
            <div className="rounded-3xl border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.value}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-3 transition-transform hover:scale-[1.02] sm:gap-4 sm:p-4",
                      goal.done
                        ? "border-emerald-100 bg-emerald-50"
                        : "border-slate-100 bg-slate-50 opacity-80"
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 rounded-full p-1.5 shadow-sm",
                        goal.done
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {goal.done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <ShieldQuestion className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={cn(
                          "font-bold leading-tight",
                          goal.done ? "text-emerald-900" : "text-slate-700"
                        )}
                      >
                        {goal.title}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-[10px] font-bold uppercase tracking-widest",
                          goal.done ? "text-emerald-700/80" : "text-slate-500"
                        )}
                      >
                        {goal.done
                          ? dict["learn.completed"] || "Completed"
                          : dict["learn.inProgress"] || "In progress"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="hidden space-y-6 md:block">
          {/* Recent rewards */}
          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-800">
                <Star className="h-5 w-5 text-yellow-500" />{" "}
                {dict["learn.recentRewards"] || "Recent Rewards"}
              </h2>
              <Link
                href={`/${lang}/achievements`}
                className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline"
              >
                {dict["learn.seeAll"] || "See All"}
              </Link>
            </div>
            <div className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
              {badges.length > 0 ? (
                badges.slice(0, 2).map((ub) => (
                  <div
                    key={ub.id}
                    className="mb-3 flex items-center gap-4 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4 last:mb-0"
                  >
                    <div className="shrink-0 text-4xl drop-shadow filter">
                      {ub.badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black leading-tight text-yellow-900">
                        {ub.badge.name}
                      </h4>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-700/80">
                        {dict["learn.earned"] || "Earned"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm font-medium text-slate-400">
                  {dict["learn.noRewardsYet"] || "No rewards yet — keep learning!"}
                </p>
              )}
              <Link
                href={`/${lang}/achievements`}
                className="mt-4 block w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3.5 text-center font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                {dict["learn.openRewardsIsland"] || "Open Rewards Island"}
              </Link>
            </div>
          </section>

          {/* Friends Club / Family Club */}
          <section className="hidden lg:block">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-800">
                <Users className="h-5 w-5 text-purple-500" />{" "}
                {isChild
                  ? dict["learn.familyMembers"] || "Family Members"
                  : dict["learn.friendsClub"] || "Friends Club"}
              </h2>
            </div>
            <div className="space-y-3 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
              {topFriends.length <= 1 ? (
                <div className="text-center py-4">
                  <Image
                    src="/edu-logo.png"
                    alt="Mascot"
                    width={60}
                    height={60}
                    className="mx-auto mb-2 opacity-50 grayscale"
                  />
                  <p className="text-slate-500 font-bold mb-1 text-sm">{isChild ? (dict["learn.noFamilyYet"] || "No family members yet!") : (dict["learn.noFriendsYet"] || "No friends yet!")}</p>
                  {!isChild && (
                    <Button variant="secondary" className="w-full mt-2" asChild>
                      <Link href={`/${lang}/friends`}>{dict["learn.findFriends"] || "Find Friends"}</Link>
                    </Button>
                  )}
                </div>
              ) : (
                topFriends.slice(0, 4).map((u, i) => {
                  const isYou = u.userId === userProgress.userId;
                  return (
                    <div
                      key={u.userId}
                      className={cn(
                        "relative flex items-center justify-between rounded-2xl border-2 p-4 transition-transform hover:scale-[1.02]",
                        isYou
                          ? "border-indigo-200 bg-indigo-50"
                          : "border-purple-200 bg-purple-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                          <Image
                            src={u.userImageSrc}
                            alt={u.userName}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight text-slate-800">
                            {isYou ? dict["learn.you"] || "You" : u.userName}
                          </div>
                          <div className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {u.role === "parent"
                              ? dict["learn.parent"] || "Parent"
                              : `${dict["learn.rank"] || "Rank"} #${i + 1}`}
                          </div>
                        </div>
                      </div>
                      {u.role !== "parent" && (
                        <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-black text-indigo-600">
                          {u.points} <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
