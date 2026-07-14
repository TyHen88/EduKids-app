"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Heart, 
  Star, 
  Flame, 
  Trophy, 
  UserCog, 
  Compass, 
  Loader2, 
  Sparkles, 
  Rocket 
} from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getFamilyMemberDetail, type FamilyMemberDetailResult } from "@/actions/family";
import { cn } from "@/lib/utils";

type FamilyMember = {
  userId: string;
  userName: string;
  userImageSrc: string;
  points: number;
  role: string;
};

type Props = {
  initialMembers: FamilyMember[];
  familyInfo: {
    name: string;
    motto: string | null;
    cover: string | null;
  };
  dict: Record<string, string>;
};

export const FamilyClient = ({ initialMembers, familyInfo, dict }: Props) => {
  const [detailUser, setDetailUser] = useState<FamilyMember | null>(null);
  const [detailData, setDetailData] = useState<FamilyMemberDetailResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const parents = initialMembers.filter((m) => m.role === "parent");
  const siblings = initialMembers.filter((m) => m.role !== "parent");

  const handleOpenDetails = (member: FamilyMember) => {
    setDetailUser(member);
    setLoadingDetail(true);
    getFamilyMemberDetail(member.userId)
      .then((data) => {
        setDetailData(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
        setDetailUser(null);
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  };

  // Maps DB cover name to CSS gradients
  const getBannerGradient = (cover: string | null) => {
    switch (cover) {
      case "indigo":
        return "from-indigo-500 via-purple-500 to-pink-500";
      case "rose":
        return "from-rose-400 via-pink-500 to-purple-500";
      case "sunset":
        return "from-amber-400 via-orange-500 to-rose-500";
      case "cosmic":
        return "from-violet-600 via-indigo-600 to-sky-600";
      case "ocean":
        return "from-cyan-400 via-blue-500 to-indigo-600";
      case "emerald":
      default:
        return "from-emerald-400 via-teal-500 to-cyan-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* 🚀 Spaceship Command Center Header */}
      <div className={cn(
        "relative overflow-hidden rounded-[36px] bg-gradient-to-r p-8 text-white shadow-lg border-b-8 border-black/10",
        getBannerGradient(familyInfo.cover)
      )}>
        {/* Decorative Space Items */}
        <div className="absolute -right-6 -top-6 h-24 w-24 opacity-20">
          <Rocket className="h-full w-full rotate-45 animate-pulse" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300 animate-spin" />
            {dict["myFamily.commandCenter"] || "Crew Command Center"}
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              🚀 {familyInfo.name}
            </h1>
            {familyInfo.motto && (
              <div className="relative mt-4 inline-block rounded-2xl bg-black/20 p-4 border border-white/10 backdrop-blur-sm">
                <span className="text-xs font-black text-white/50 uppercase block mb-1">
                  📢 {dict["myFamily.motto"] || "Spaceship Motto"}
                </span>
                <p className="text-sm font-bold italic text-white/90">
                  “{familyInfo.motto}”
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🧑‍✈️ Crew Members: Parents & Siblings */}
      <div className="space-y-6">
        {parents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-2">
              🛰️ {parents.length > 1
                ? dict["myFamily.parents"] || "Parents"
                : dict["myFamily.parent"] || "Parent"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {parents.map((parent) => (
                <button
                  key={parent.userId}
                  onClick={() => handleOpenDetails(parent)}
                  className="group relative flex items-center gap-4 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:border-b-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-purple-50 bg-slate-100 shadow-sm transition-transform group-hover:scale-105">
                    <Image
                      src={parent.userImageSrc}
                      alt={parent.userName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-1.5">
                      <UserCog className="h-3.5 w-3.5" />
                      {dict["myFamily.roleCaptain"] || "Crew Captain"}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 truncate mt-1">
                      {parent.userName}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-purple-50 px-3 py-2 text-center text-xs font-black text-purple-600 group-hover:bg-purple-100 transition-colors">
                    {dict["myFamily.viewProfile"] || "View File"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {siblings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-2">
              🚀 {dict["myFamily.siblings"] || "Siblings"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {siblings.map((sibling) => (
                <button
                  key={sibling.userId}
                  onClick={() => handleOpenDetails(sibling)}
                  className="group relative flex items-center gap-4 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:border-b-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-emerald-50 bg-slate-100 shadow-sm transition-transform group-hover:scale-105">
                    <Image
                      src={sibling.userImageSrc}
                      alt={sibling.userName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 animate-spin-slow" />
                      {dict["myFamily.roleCadet"] || "Cadet Explorer"}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 truncate mt-1">
                      {sibling.userName}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        ⭐ {sibling.points}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    {dict["myFamily.viewProfile"] || "View File"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 🛸 Crew Member File Detail Modal */}
      <Dialog
        open={detailUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailUser(null);
            setDetailData(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-[36px] border-4 border-slate-200 bg-white p-6 shadow-2xl overflow-hidden max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>📋</span> {dict["myFamily.viewProfile"] || "View Crew File"}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : detailData ? (
            <div className="space-y-5 overflow-y-auto pr-1 max-h-[70vh]">
              {/* Identity Banner */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-indigo-100 bg-slate-100 shadow-sm">
                  <Image
                    src={detailData.userImageSrc}
                    alt={detailData.userName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{detailData.userName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                      detailData.role === "parent" ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {detailData.role === "parent" 
                        ? (dict["myFamily.roleCaptain"] || "Crew Captain") 
                        : (dict["myFamily.roleCadet"] || "Cadet Explorer")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border-2 border-slate-100 p-3 text-center shadow-sm">
                  <Star className="mx-auto h-5 w-5 fill-current text-indigo-500 mb-1" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dict["common.stardust"] || "Stardust"}</div>
                  <div className="text-base font-black text-slate-800">{detailData.points}</div>
                </div>
                <div className="rounded-2xl border-2 border-slate-100 p-3 text-center shadow-sm">
                  <Heart className="mx-auto h-5 w-5 fill-current text-rose-500 mb-1" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dict["common.hearts"] || "Hearts"}</div>
                  <div className="text-base font-black text-slate-800">{detailData.hearts}</div>
                </div>
                <div className="rounded-2xl border-2 border-slate-100 p-3 text-center shadow-sm">
                  <Flame className="mx-auto h-5 w-5 fill-current text-orange-500 mb-1" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dict["common.streak"] || "Streak"}</div>
                  <div className="text-base font-black text-slate-800">{detailData.streak}</div>
                </div>
                <div className="rounded-2xl border-2 border-slate-100 p-3 text-center shadow-sm">
                  <Trophy className="mx-auto h-5 w-5 text-yellow-500 mb-1" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dict["admin.colBadges"] || "Badges"}</div>
                  <div className="text-base font-black text-slate-800">{detailData.collectedBadges?.length || 0}</div>
                </div>
              </div>

              {/* Buddy Stats for kids */}
              {detailData.role !== "parent" && (
                <div className="rounded-2xl border-2 border-indigo-50 bg-indigo-50/30 p-4 flex items-center gap-3.5 shadow-sm">
                  <div className="relative h-12 w-12 shrink-0">
                    <Image src="/edu-logo.png" alt="Buddy" fill className="object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-indigo-900 uppercase tracking-widest leading-none">
                      {dict["admin.buddyName"] || "Mascot Buddy"}: {detailData.buddyName}
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-slate-500">
                      XP: <span className="font-extrabold text-indigo-600">{detailData.buddyXp}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Role-Specific Detail Panels */}
              {detailData.role === "parent" ? (
                // Parent Panel: Family & Children List
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-slate-100 p-4 space-y-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{dict["admin.familyProfile"] || "Family Profile"}</h4>
                    <p className="text-sm font-black text-slate-700">🏠 {detailData.familyName}</p>
                    {detailData.familyMotto && (
                      <p className="text-xs italic text-slate-500">“{detailData.familyMotto}”</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      👧 {dict["admin.linkedChildren"] || "Linked Children"} ({detailData.children?.length || 0})
                    </h4>
                    {detailData.children && detailData.children.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {detailData.children.map((c) => (
                          <div key={c.userId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 shadow-sm">
                            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200">
                              <Image src={c.userImageSrc} alt={c.userName} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-700 truncate">{c.userName}</p>
                              <p className="text-[10px] font-bold text-slate-400 leading-none mt-1">
                                ⭐ {c.points} | 🔥 {c.streak}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic bg-slate-50/50 p-3 rounded-xl text-center">
                        {dict["admin.noChildrenLinked"] || "No children linked to this parent yet."}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // Learner/Child Panel: Parent info & Course Assignments
                <div className="space-y-4">
                  {detailData.isChild && detailData.parentName && (
                    <div className="rounded-2xl border-2 border-slate-100 p-4 space-y-1 shadow-sm">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{dict["admin.linkedParent"] || "Parent Connection"}</h4>
                      <p className="text-sm font-black text-slate-700">👪 {detailData.parentName}</p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      📚 {dict["admin.assignedCourses"] || "Assigned Courses"} ({detailData.assignedCourses?.length || 0})
                    </h4>
                    {detailData.assignedCourses && detailData.assignedCourses.length > 0 ? (
                      <div className="space-y-2">
                        {detailData.assignedCourses.map((ac) => (
                          <div key={ac.courseId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 shadow-sm">
                            <div>
                              <p className="text-xs font-black text-slate-700">{ac.courseTitle}</p>
                              {ac.notes && (
                                <p className="text-[10px] font-bold text-slate-400 italic mt-1">“{ac.notes}”</p>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(ac.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic bg-slate-50/50 p-3 rounded-xl text-center">
                        {dict["admin.noCoursesAssigned"] || "No courses assigned to this learner yet."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Earned Badges Panel */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  🏆 {dict["admin.earnedBadges"] || "Earned Badges"} ({detailData.collectedBadges?.length || 0})
                </h4>
                {detailData.collectedBadges && detailData.collectedBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailData.collectedBadges.map((b) => (
                      <div key={b.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 shadow-sm" title={b.description}>
                        <span className="text-sm">{b.icon}</span>
                        <span className="text-[11px] font-black text-slate-700">{b.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic bg-slate-50/50 p-3 rounded-xl text-center">
                    {dict["admin.noBadgesEarned"] || "No badges earned yet."}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
