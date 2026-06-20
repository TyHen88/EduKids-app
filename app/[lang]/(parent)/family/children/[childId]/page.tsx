import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Flame, Heart, Star, BookOpen, Trophy } from "lucide-react";

import { getChildProgress } from "@/db/queries";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ lang: string; childId: string }>;
};

const ChildDetailPage = async ({ params }: Props) => {
  const { lang, childId } = await params;
  const child = await getChildProgress(childId);

  if (!child) {
    redirect(`/${lang}/family/children`);
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full">
          <Link href={`/${lang}/family/children`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {child.userName}'s Progress
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Profile overview */}
        <div className="flex shrink-0 flex-col items-center gap-4 rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm md:w-64">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50">
            <Image
              src={child.userImageSrc}
              alt={child.userName}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800">{child.userName}</h2>
            <p className="text-sm font-medium text-slate-500">Learner</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center gap-2 rounded-[32px] border-2 border-slate-100 bg-white p-6 shadow-sm">
            <Star className="h-8 w-8 text-indigo-500" />
            <div className="text-center">
              <div className="text-2xl font-black text-slate-800">{child.points}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">XP</div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-[32px] border-2 border-slate-100 bg-white p-6 shadow-sm">
            <Flame className="h-8 w-8 text-orange-500" />
            <div className="text-center">
              <div className="text-2xl font-black text-slate-800">{child.streak}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Day Streak</div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-[32px] border-2 border-slate-100 bg-white p-6 shadow-sm">
            <Heart className="h-8 w-8 text-rose-500" />
            <div className="text-center">
              <div className="text-2xl font-black text-slate-800">{child.hearts}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Hearts</div>
            </div>
          </div>
          <div className="col-span-2 flex flex-col justify-center rounded-[32px] border-2 border-slate-100 bg-white p-6 shadow-sm sm:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-500" />
              <h3 className="text-lg font-black text-slate-800">Active Course</h3>
            </div>
            {child.activeCourse ? (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                  <Image
                    src={child.activeCourse.imageSrc}
                    alt={child.activeCourse.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{child.activeCourse.title}</div>
                  <div className="text-sm font-medium text-slate-500">{child.activeCourse.category}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                No active course selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDetailPage;
