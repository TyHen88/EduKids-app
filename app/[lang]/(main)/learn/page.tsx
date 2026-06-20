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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { QUESTS } from "@/constants";
import {
  getCoursesWithProgress,
  getTopFriends,
  getUserBadges,
  getUserProgress,
} from "@/db/queries";

import { Button } from "@/components/ui/button";
import { CompanionBuddy } from "./companion-buddy";
import { DailyChest } from "./daily-chest";

type Props = {
  params: Promise<{ lang: string }>;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const LearnPage = async ({ params }: Props) => {
  const { lang } = await params;

  const [userProgress, courses, badges, topFriends] = await Promise.all([
    getUserProgress(),
    getCoursesWithProgress(),
    getUserBadges(),
    getTopFriends(),
  ]);

  if (!userProgress || !userProgress.activeCourseId)
    redirect(`/${lang}/courses`);

  const currentCourse =
    courses.find((c) => c.isActive) ??
    courses.find((c) => c.status === "In Progress") ??
    courses[0];

  const name = userProgress.userName || "friend";

  // Real, points-based daily goals (uses existing QUESTS thresholds).
  const goals = QUESTS.slice(0, 3).map((q) => ({
    title: `Earn ${q.value} XP`,
    value: q.value,
    done: userProgress.points >= q.value,
  }));
  const goalsDone = goals.filter((g) => g.done).length;

  const chestAvailable = !(
    userProgress.lastChestAt &&
    isSameDay(new Date(userProgress.lastChestAt), new Date())
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-[32px] border-[4px] border-indigo-700/50 bg-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10 text-center sm:text-left">
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">
            Hi {name}! 👋
          </h1>
          <p className="mb-4 text-sm font-bold tracking-wide text-indigo-200">
            ✦ {userProgress.points} Stardust · 🔥 {userProgress.streak} day streak
          </p>
        </div>
        <div className="absolute bottom-0 right-0 top-0 hidden w-1/2 opacity-20 sm:block">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 C30,50 70,50 100,0 L100,100 Z"
              fill="currentColor"
              className="text-indigo-500"
            />
          </svg>
        </div>
      </div>

      {/* Daily engagement: buddy + chest */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 md:col-span-1 lg:col-span-2">
          {/* Continue adventure */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 px-2 text-lg font-black tracking-tight text-slate-800">
              <Target className="h-5 w-5 text-indigo-500" /> Continue Adventure
            </h2>
            {currentCourse ? (
              <div className="group relative flex flex-col gap-6 overflow-hidden rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-indigo-200 sm:flex-row">
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
                    <PlayCircle className="h-5 w-5" /> Jump In!
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[32px] border-2 border-slate-100 bg-white p-6 text-slate-500 shadow-sm">
                No course yet.{" "}
                <Link
                  href={`/${lang}/courses`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Pick one!
                </Link>
              </div>
            )}
          </section>

          {/* Daily goals (points-based) */}
          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-800">
                <Award className="h-5 w-5 text-orange-500" /> Today&apos;s Goals
              </h2>
              <span className="text-sm font-bold text-slate-400">
                {goalsDone}/{goals.length} Done
              </span>
            </div>
            <div className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.value}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border-2 p-4 transition-transform hover:scale-[1.02]",
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
                        {goal.done ? "Completed" : "In progress"}
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
                <Star className="h-5 w-5 text-yellow-500" /> Recent Rewards
              </h2>
              <Link
                href={`/${lang}/achievements`}
                className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline"
              >
                See All
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
                        Earned
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm font-medium text-slate-400">
                  No rewards yet — keep learning!
                </p>
              )}
              <Link
                href={`/${lang}/achievements`}
                className="mt-4 block w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3.5 text-center font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                Open Rewards Island
              </Link>
            </div>
          </section>

          {/* Friends Club */}
          <section className="hidden lg:block">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-800">
                <Users className="h-5 w-5 text-purple-500" /> Friends Club
              </h2>
            </div>
            <div className="space-y-3 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
              {topFriends.length <= 1 ? (
                <div className="text-center py-4">
                  <Image
                    src="/mascot.svg"
                    alt="Mascot"
                    width={60}
                    height={60}
                    className="mx-auto mb-2 opacity-50 grayscale"
                  />
                  <p className="text-slate-500 font-bold mb-1 text-sm">No friends yet!</p>
                  <Button variant="secondary" className="w-full mt-2" asChild>
                    <Link href={`/${lang}/friends`}>Find Friends</Link>
                  </Button>
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
                            {isYou ? "You" : u.userName}
                          </div>
                          <div className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Rank #{i + 1}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-black text-indigo-600">
                        {u.points} <Star className="h-3 w-3 fill-current" />
                      </div>
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
