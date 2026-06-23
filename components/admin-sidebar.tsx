"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";
import { LanguageToggle } from "@/components/language-toggle";

// Lets a page override the header title (e.g. show a course name instead of the
// raw id from the URL). Pages call useAdminTitle() to register their title.
const AdminTitleContext = createContext<(title: string | null) => void>(
  () => {}
);

export const useAdminTitle = (title: string) => {
  const setTitle = useContext(AdminTitleContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
};

export const AdminShell = ({ children }: { children: ReactNode }) => {
  const locale = useLocale();
  const dict = useDictionary();
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState<string | null>(null);

  const adminLinks = [
    {
      name: dict["admin.navDashboard"] || "Dashboard",
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
    },
    {
      name: dict["admin.navUsers"] || "Users",
      href: `/${locale}/admin/students`,
      icon: Users,
    },
    {
      name: dict["admin.navCourses"] || "Courses",
      href: `/${locale}/admin/courses`,
      icon: BookOpen,
    },
    {
      name: dict["admin.navSettings"] || "Settings",
      href: `/${locale}/admin/settings`,
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    const base = `/${locale}/admin`;
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(href);
  };

  // Localized header title. Pages can override via useAdminTitle(); otherwise we
  // derive a label from the route section (never the raw URL segment / course id).
  const sectionTitle = () => {
    const section = pathname.split("/").filter(Boolean)[2]; // [lang, "admin", section]
    switch (section) {
      case "students":
        return dict["admin.navUsers"] || "Users";
      case "courses":
        return dict["admin.navCourses"] || "Courses";
      case "settings":
        return dict["admin.navSettings"] || "Settings";
      default:
        return dict["admin.navDashboard"] || "Dashboard";
    }
  };
  const headerTitle = pageTitle || sectionTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="z-10 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-600">
            <GraduationCap className="h-6 w-6" />
            <span>{dict["admin.brandFull"] || "EduKids Admin"}</span>
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
            {dict["admin.switchToStudent"] || "Switch to Student"}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-2 text-xl font-bold text-indigo-600 md:hidden">
            <GraduationCap className="h-6 w-6" />
            <span>{dict["admin.brandShort"] || "Admin"}</span>
          </div>
          <h1 className="hidden truncate text-2xl font-bold tracking-tight text-slate-800 md:block">
            {headerTitle}
          </h1>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <AdminTitleContext.Provider value={setPageTitle}>
              {children}
            </AdminTitleContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
};
