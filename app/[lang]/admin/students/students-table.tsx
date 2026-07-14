"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Flame,
  Heart,
  Star,
  Trophy,
  UserCog,
  Link2,
  Ban,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { setUserActive, deleteUserAccount, getUserDetail, type UserDetailResult } from "@/actions/admin-users";
import { useDictionary } from "@/app/[lang]/lang-provider";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export type StudentRow = {
  userId: string;
  userName: string;
  userImageSrc: string;
  role: string; // "learner" | "parent"
  isActive: boolean;
  points: number;
  hearts: number;
  streak: number;
  activeCourse: string | null;
  badges: number;
  parentName: string | null;
};

export const StudentsTable = ({
  students,
  adminId,
  lang,
}: {
  students: StudentRow[];
  adminId: string | null;
  lang: string;
}) => {
  const dict = useDictionary() as Record<string, string>;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<StudentRow | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<StudentRow | null>(null);
  
  // User details modal state
  const [detailUser, setDetailUser] = useState<StudentRow | null>(null);
  const [detailData, setDetailData] = useState<UserDetailResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [, startTransition] = useTransition();

  // Deactivating asks for confirmation (it signs the user out); activating is
  // applied immediately.
  const requestToggle = (s: StudentRow) => {
    if (s.isActive) setConfirmUser(s);
    else performToggle(s);
  };

  const performToggle = (s: StudentRow) => {
    const deactivating = s.isActive;
    setPendingId(s.userId);
    startTransition(() => {
      setUserActive(s.userId, !s.isActive, lang)
        .then(() => {
          toast.success(
            deactivating
              ? dict["admin.userDeactivated"] || "User deactivated."
              : dict["admin.userActivated"] || "User activated."
          );
          router.refresh();
        })
        .catch((err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : dict["common.somethingWentWrong"] || "Something went wrong."
          )
        )
        .finally(() => setPendingId(null));
    });
  };

  const performDelete = (s: StudentRow) => {
    setPendingId(s.userId);
    startTransition(() => {
      deleteUserAccount(s.userId, lang)
        .then(() => {
          toast.success(dict["admin.userDeleted"] || "User deleted.");
          router.refresh();
        })
        .catch((err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : dict["common.somethingWentWrong"] || "Something went wrong."
          )
        )
        .finally(() => setPendingId(null));
    });
  };

  const handleViewDetails = (s: StudentRow) => {
    setDetailUser(s);
    setLoadingDetail(true);
    getUserDetail(s.userId)
      .then((data) => {
        setDetailData(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load user details.");
        setDetailUser(null);
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.userName.toLowerCase().includes(q) ||
        (s.parentName?.toLowerCase().includes(q) ?? false)
    );
  }, [query, students]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to the first page whenever the search narrows the result set.
  useEffect(() => {
    setPage(1);
  }, [query]);

  // Clamp the page if the underlying data shrinks (e.g. after a refresh).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict["admin.searchStudents"] || "Search students..."}
          className="rounded-2xl border-2 border-slate-200 pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-[32px] border-2 border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">{dict["admin.colStudent"] || "Student"}</th>
                <th className="px-4 py-4">{dict["admin.colRole"] || "Role"}</th>
                <th className="px-4 py-4">{dict["admin.colParent"] || "Parent"}</th>
                <th className="px-4 py-4">
                  {dict["admin.colActiveCourse"] || "Active Course"}
                </th>
                <th className="px-4 py-4 text-center">
                  {dict["admin.colGems"] || "Gems"}
                </th>
                <th className="px-4 py-4 text-center">
                  {dict["admin.colHearts"] || "Hearts"}
                </th>
                <th className="px-4 py-4 text-center">
                  {dict["admin.colStreak"] || "Streak"}
                </th>
                <th className="px-4 py-4 text-center">
                  {dict["admin.colBadges"] || "Badges"}
                </th>
                <th className="px-6 py-4 text-left">
                  {dict["admin.colStatus"] || "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr
                  key={s.userId}
                  className="group border-b border-slate-50 transition-colors last:border-0 hover:bg-indigo-50/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                        <Image
                          src={s.userImageSrc}
                          alt={s.userName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <span className="font-bold text-slate-800">
                        {s.userName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {s.role === "parent" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-purple-600">
                        <UserCog className="h-3.5 w-3.5" />
                        {dict["admin.roleParent"] || "Parent"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                        {dict["admin.roleLearner"] || "Learner"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {s.role === "parent" ? (
                      <span className="text-xs font-medium text-slate-300">
                        —
                      </span>
                    ) : s.parentName ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">
                        <Link2 className="h-3.5 w-3.5" />
                        {s.parentName}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        {dict["admin.noParent"] || "No parent"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {s.activeCourse ? (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {s.activeCourse}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1 font-bold text-indigo-600">
                      <Star className="h-4 w-4 fill-current" /> {s.points}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1 font-bold text-rose-500">
                      <Heart className="h-4 w-4 fill-current" /> {s.hearts}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1 font-bold text-orange-500">
                      <Flame className="h-4 w-4 fill-current" /> {s.streak}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                      <Trophy className="h-4 w-4" /> {s.badges}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {dict["admin.statusActive"] || "Active"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">
                          <Ban className="h-3.5 w-3.5" />
                          {dict["admin.statusDeactivated"] || "Deactivated"}
                        </span>
                      )}
                      
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={dict["admin.actions"] || "Actions"}
                            disabled={pendingId === s.userId}
                            className={
                              "flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-200 text-slate-500 opacity-0 transition-all hover:border-indigo-200 hover:text-indigo-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed group-hover:opacity-100 data-[state=open]:border-indigo-200 data-[state=open]:text-indigo-600 data-[state=open]:opacity-100 " +
                              (pendingId === s.userId ? "opacity-100" : "")
                            }
                          >
                            {pendingId === s.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={() => handleViewDetails(s)}
                            className="cursor-pointer font-bold text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700"
                          >
                            <Eye className="h-4 w-4" />
                            {dict["admin.viewDetails"] || "View Details"}
                          </DropdownMenuItem>

                          {s.userId !== adminId && (
                            <>
                              <div className="h-px bg-slate-100 my-1 mx-2" />
                              {s.isActive ? (
                                <DropdownMenuItem
                                  onSelect={() => requestToggle(s)}
                                  className="cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                >
                                  <Ban className="h-4 w-4" />
                                  {dict["admin.deactivate"] || "Deactivate"}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => requestToggle(s)}
                                  className="cursor-pointer font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  {dict["admin.activate"] || "Activate"}
                                </DropdownMenuItem>
                              )}
                              <div className="h-px bg-slate-100 my-1 mx-2" />
                              <DropdownMenuItem
                                  onSelect={() => setDeleteConfirmUser(s)}
                                  className="cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {dict["admin.delete"] || "Delete"}
                                </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center font-medium text-slate-400"
                  >
                    {students.length === 0
                      ? dict["admin.noStudentsEnrolled"] ||
                        "No students have enrolled yet."
                      : dict["admin.noStudentsMatch"] ||
                        "No students match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm font-medium text-slate-400">
            {dict["admin.showing"] || "Showing"}{" "}
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)}{" "}
            {dict["common.of"] || "of"} {filtered.length}
          </p>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}

      {/* User Details Modal */}
      <Dialog
        open={detailUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailUser(null);
            setDetailData(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-[32px] border-4 border-slate-200 bg-white p-6 shadow-2xl overflow-hidden max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>👤</span> {dict["admin.userDetails"] || "User Details"}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : detailData ? (
            <div className="space-y-5 overflow-y-auto pr-1 max-h-[70vh]">
              {/* User Identity Panel */}
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
                        ? (dict["admin.roleParent"] || "Parent") 
                        : detailData.isChild 
                        ? (dict["admin.roleChild"] || "Child") 
                        : (dict["admin.roleLearner"] || "Learner")}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                      detailData.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {detailData.isActive ? (dict["admin.statusActive"] || "Active") : (dict["admin.statusDeactivated"] || "Deactivated")}
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

      <ConfirmDialog
        open={confirmUser !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmUser(null);
        }}
        variant="danger"
        title={dict["admin.deactivateTitle"] || "Deactivate user?"}
        description={
          <>
            <span className="font-bold text-slate-700">
              {confirmUser?.userName}
            </span>{" "}
            {dict["admin.deactivateConfirmHint"] ||
              "will be signed out and won't be able to log in until reactivated."}
          </>
        }
        confirmLabel={dict["admin.deactivate"] || "Deactivate"}
        cancelLabel={dict["common.cancel"] || "Cancel"}
        loading={pendingId === confirmUser?.userId}
        onConfirm={() => {
          const user = confirmUser;
          setConfirmUser(null);
          if (user) performToggle(user);
        }}
      />

      <ConfirmDialog
        open={deleteConfirmUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmUser(null);
        }}
        variant="danger"
        title={dict["admin.deleteTitle"] || "Delete user?"}
        description={
          <>
            <span className="font-bold text-slate-700">
              {deleteConfirmUser?.userName}
            </span>{" "}
            {dict["admin.deleteConfirmHint"] ||
              "will be deleted permanently. This cannot be undone."}
          </>
        }
        confirmLabel={dict["admin.delete"] || "Delete"}
        cancelLabel={dict["common.cancel"] || "Cancel"}
        loading={pendingId === deleteConfirmUser?.userId}
        onConfirm={() => {
          const user = deleteConfirmUser;
          setDeleteConfirmUser(null);
          if (user) performDelete(user);
        }}
      />
    </div>
  );
};
