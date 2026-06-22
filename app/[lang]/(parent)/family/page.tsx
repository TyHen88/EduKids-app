import Image from "next/image";
import Link from "next/link";
import { Users, BookOpen, Star, Flame, Heart, ArrowRight, Crown, Sparkles } from "lucide-react";

import { getChildren, getUserProgress } from "@/db/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ lang: string }>;
};

type PresetCover = {
  name: string;
  classes?: string;
  imageSrc?: string;
};

const PRESET_COVERS: Record<string, PresetCover> = {
  space: {
    name: "Space Adventure",
    imageSrc: "/uploads/family_cover_default.png",
  },
  emerald: {
    name: "Emerald Aurora",
    classes: "from-emerald-500 to-teal-600 border-emerald-100",
  },
  sunset: {
    name: "Sunset Glow",
    classes: "from-orange-500 to-rose-600 border-rose-100",
  },
  cosmic: {
    name: "Cosmic Stardust",
    classes: "from-indigo-600 to-violet-800 border-indigo-100",
  },
  ocean: {
    name: "Ocean Breeze",
    classes: "from-blue-500 to-cyan-600 border-cyan-100",
  },
};

const FamilyDashboardPage = async ({ params }: Props) => {
  const { lang } = await params;
  const [children, userProgress] = await Promise.all([
    getChildren(),
    getUserProgress(),
  ]);

  const totalPoints = children.reduce((acc, child) => acc + child.points, 0);

  // Top-ranked child by Stardust (only meaningful with 2+ kids who have points).
  const topChild = [...children].sort((a, b) => b.points - a.points)[0];
  const showCongrats = children.length >= 2 && !!topChild && topChild.points > 0;

  const familyName = userProgress?.familyName || "My Family";
  const familyCover = userProgress?.familyCover || "emerald";
  const familyMotto = userProgress?.familyMotto || "";

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Family Banner */}
      <div className={cn(
        "relative overflow-hidden rounded-[32px] border-4 p-8 text-white shadow-md min-h-[160px] flex flex-col justify-end bg-slate-100",
        PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.classes
          ? `bg-gradient-to-br ${PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS].classes}`
          : "border-slate-100"
      )}>
        {(PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.imageSrc || (!PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS] && familyCover)) && (
          <Image
            src={PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.imageSrc || familyCover}
            alt="Family Cover"
            fill
            className="object-cover animate-fade-in"
          />
        )}
        {(PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.imageSrc || (!PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS] && familyCover)) && (
          <div className="absolute inset-0 bg-black/35" />
        )}
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
            {familyName}
          </h1>
          {familyMotto ? (
            <p className="mt-2 text-sm sm:text-base font-semibold text-white/95 italic drop-shadow-sm max-w-xl">
              "{familyMotto}"
            </p>
          ) : (
            <p className="mt-1.5 text-sm sm:text-base font-medium text-white/85 drop-shadow-sm">
              Monitor and manage your family's learning progress.
            </p>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex items-center gap-4 rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <div className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
              Children
            </div>
            <div className="text-3xl font-black text-slate-800">
              {children.length}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600">
            <Star className="h-7 w-7" />
          </div>
          <div>
            <div className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
              Total Family Stardust
            </div>
            <div className="text-3xl font-black text-slate-800">
              {totalPoints}
            </div>
          </div>
        </div>
      </div>

      {/* Top Star congratulations */}
      {showCongrats && (
        <div className="relative overflow-hidden rounded-[32px] border-2 border-b-4 border-amber-200 border-b-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-sm">
          <Sparkles className="pointer-events-none absolute right-6 top-5 h-6 w-6 text-amber-300" />
          <Sparkles className="pointer-events-none absolute bottom-6 right-24 h-4 w-4 text-yellow-300" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-amber-200 bg-white">
                <Image
                  src={topChild.userImageSrc}
                  alt={topChild.userName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <span className="absolute -right-1 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow-md">
                <Crown className="h-4 w-4 fill-current" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-amber-600">
                <Crown className="h-3.5 w-3.5" /> Top Star
              </div>
              <h3 className="truncate text-xl font-black text-slate-800">
                🎉 Congratulations, {topChild.userName}!
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Leading the family with {topChild.points} Stardust. Keep it up!
              </p>
            </div>

            <div className="ml-auto hidden shrink-0 text-right sm:block">
              <div className="flex items-center gap-1 text-3xl font-black text-amber-500">
                <Star className="h-6 w-6 fill-current" />
                {topChild.points}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600/80">
                Stardust
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            Your Children
          </h2>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href={`/${lang}/family/children`}>Manage</Link>
          </Button>
        </div>

        {children.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-slate-100 bg-white p-12 text-center shadow-sm">
            <Image
              src="/mascot.svg"
              alt="Mascot"
              width={100}
              height={100}
              className="mb-4 opacity-50 grayscale"
            />
            <h3 className="mb-2 text-xl font-bold text-slate-700">
              No children added yet
            </h3>
            <p className="mb-6 max-w-sm text-slate-500">
              Create a profile for your child so they can start exploring and learning!
            </p>
            <Button asChild size="lg" className="rounded-2xl shadow-md">
              <Link href={`/${lang}/family/children`}>Add your first child</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const isTop = showCongrats && child.userId === topChild.userId;
              return (
              <div
                key={child.userId}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-[32px] border-2 bg-white shadow-sm transition-all hover:shadow-md",
                  isTop
                    ? "border-amber-200 ring-2 ring-amber-100"
                    : "border-slate-100 hover:border-emerald-200"
                )}
              >
                {isTop && (
                  <span className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    <Crown className="h-3 w-3 fill-current" /> Top Star
                  </span>
                )}
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div
                      className={cn(
                        "relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 bg-slate-50",
                        isTop ? "border-amber-200" : "border-slate-100"
                      )}
                    >
                      <Image
                        src={child.userImageSrc}
                        alt={child.userName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        {child.userName}
                      </h3>
                      <p className="text-sm font-bold text-slate-500">
                        {child.activeCourse?.title || "No active course"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-slate-600">
                      <Flame className="h-5 w-5 text-orange-500" />
                      {child.streak} Day{child.streak !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-slate-600">
                      <Star className="h-5 w-5 text-indigo-500" />
                      {child.points} XP
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-slate-100 bg-slate-50 p-4">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                  >
                    <Link href={`/${lang}/family/children/${child.userId}`}>
                      View Progress
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyDashboardPage;
