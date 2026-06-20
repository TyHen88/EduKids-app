import Image from "next/image";
import Link from "next/link";
import { Users, BookOpen, Star, Flame, Heart, ArrowRight } from "lucide-react";

import { getChildren } from "@/db/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ lang: string }>;
};

const FamilyDashboardPage = async ({ params }: Props) => {
  const { lang } = await params;
  const children = await getChildren();

  const totalPoints = children.reduce((acc, child) => acc + child.points, 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Family Dashboard
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Monitor and manage your family's learning progress.
        </p>
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
            {children.map((child) => (
              <div
                key={child.userId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border-2 border-slate-100 bg-white shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyDashboardPage;
