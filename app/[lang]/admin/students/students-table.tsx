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
import { setUserActive } from "@/actions/admin-users";
import { useDictionary } from "@/app/[lang]/lang-provider";

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
  const dict = useDictionary();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<StudentRow | null>(null);
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
                      {s.userId === adminId ? (
                        <span className="text-[10px] font-medium text-slate-300">
                          {dict["admin.you"] || "You"}
                        </span>
                      ) : (
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
    </div>
  );
};
