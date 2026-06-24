"use client";

import Link from "next/link";
import {
  ScrollText,
  LogIn,
  LogOut,
  UserPlus,
  Baby,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useDictionary } from "@/app/[lang]/lang-provider";
import { cn } from "@/lib/utils";

type AuditRow = {
  id: number;
  userId: string;
  userName: string | null;
  role: string | null;
  event: string;
  loginType: string | null;
  reason: string | null;
  createdAt: Date | string;
};

type Props = {
  rows: AuditRow[];
  page: number;
  totalPages: number;
};

const eventMeta: Record<
  string,
  { icon: typeof LogIn; className: string; labelKey: string; fallback: string }
> = {
  login: {
    icon: LogIn,
    className: "bg-indigo-50 text-indigo-600",
    labelKey: "admin.auditEventLogin",
    fallback: "Login",
  },
  logout: {
    icon: LogOut,
    className: "bg-slate-100 text-slate-600",
    labelKey: "admin.auditEventLogout",
    fallback: "Logout",
  },
  signup: {
    icon: UserPlus,
    className: "bg-emerald-50 text-emerald-600",
    labelKey: "admin.auditEventSignup",
    fallback: "Sign up",
  },
  create_child: {
    icon: Baby,
    className: "bg-amber-50 text-amber-600",
    labelKey: "admin.auditEventCreateChild",
    fallback: "New child",
  },
  change_password: {
    icon: KeyRound,
    className: "bg-purple-50 text-purple-600",
    labelKey: "admin.auditEventChangePassword",
    fallback: "Password change",
  },
};

export const AuditLogTable = ({ rows, page, totalPages }: Props) => {
  const dict = useDictionary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          {dict["admin.auditTitle"] || "Audit Log"}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {dict["admin.auditSubtitle"] ||
            "Recent account activity across the platform."}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <ScrollText className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">
              {dict["admin.auditEmpty"] || "No activity recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">
                    {dict["admin.auditColUser"] || "User"}
                  </th>
                  <th className="px-6 py-4">
                    {dict["admin.auditColEvent"] || "Event"}
                  </th>
                  <th className="px-6 py-4">
                    {dict["admin.auditColReason"] || "Reason"}
                  </th>
                  <th className="px-6 py-4">
                    {dict["admin.auditColWhen"] || "When"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const meta = eventMeta[row.event] ?? eventMeta.login;
                  const Icon = meta.icon;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-black text-indigo-600">
                            {(row.userName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="leading-tight">
                            <p className="font-bold text-slate-800">
                              {row.userName || "Unknown"}
                            </p>
                            {row.role && (
                              <p className="text-xs font-medium capitalize text-slate-400">
                                {row.role}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                            meta.className
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {dict[meta.labelKey as keyof typeof dict] ||
                            meta.fallback}
                          {row.loginType && (
                            <span className="font-medium opacity-70">
                              · {row.loginType}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {row.reason || "—"}
                      </td>
                      <td
                        className="px-6 py-4 font-medium text-slate-500"
                        suppressHydrationWarning
                      >
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <PagerLink
            page={page - 1}
            disabled={page <= 1}
            label={dict["admin.auditPrev"] || "Previous"}
            dir="prev"
          />
          <span className="text-sm font-bold text-slate-500">
            {(dict["admin.auditPageOf"] || "Page {page} of {total}")
              .replace("{page}", String(page))
              .replace("{total}", String(totalPages))}
          </span>
          <PagerLink
            page={page + 1}
            disabled={page >= totalPages}
            label={dict["admin.auditNext"] || "Next"}
            dir="next"
          />
        </div>
      )}
    </div>
  );
};

const PagerLink = ({
  page,
  disabled,
  label,
  dir,
}: {
  page: number;
  disabled: boolean;
  label: string;
  dir: "prev" | "next";
}) => {
  const className = cn(
    "inline-flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors",
    disabled
      ? "cursor-not-allowed border-slate-100 text-slate-300"
      : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
  );

  if (disabled) {
    return (
      <span className={className}>
        {dir === "prev" && <ChevronLeft className="h-4 w-4" />}
        {label}
        {dir === "next" && <ChevronRight className="h-4 w-4" />}
      </span>
    );
  }

  return (
    <Link href={`?page=${page}`} scroll={false} className={className}>
      {dir === "prev" && <ChevronLeft className="h-4 w-4" />}
      {label}
      {dir === "next" && <ChevronRight className="h-4 w-4" />}
    </Link>
  );
};
