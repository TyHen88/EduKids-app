"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/app/[lang]/lang-provider";

export const AdminShell = ({ children }: { children: ReactNode }) => {
  const locale = useLocale();
  const pathname = usePathname();

  const adminLinks = [
    { name: "Dashboard", href: `/${locale}/admin`, icon: LayoutDashboard },
    { name: "Students", href: `/${locale}/admin/students`, icon: Users },
    { name: "Courses", href: `/${locale}/admin/courses`, icon: BookOpen },
    { name: "Settings", href: `/${locale}/admin/settings`, icon: Settings },
  ];

  const isActive = (href: string) => {
    const base = `/${locale}/admin`;
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="z-10 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-600">
            <GraduationCap className="h-6 w-6" />
            <span>EduKids Admin</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {adminLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200",
                isActive(link.href)
                  ? "bg-slate-100 text-indigo-600"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <link.icon
                className={cn(
                  "h-6 w-6",
                  isActive(link.href) ? "text-indigo-600" : "text-slate-400"
                )}
              />
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="mb-4 border-t border-slate-100 p-4">
          <Link
            href={`/${locale}/learn`}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            Switch to Student
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-8">
          <div className="flex items-center gap-2 text-xl font-bold text-indigo-600 md:hidden">
            <GraduationCap className="h-6 w-6" />
            <span>Admin</span>
          </div>
          <h1 className="hidden text-2xl font-bold capitalize tracking-tight text-slate-800 md:block">
            {pathname.split("/").pop() || "Dashboard"}
          </h1>
          <UserButton />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
