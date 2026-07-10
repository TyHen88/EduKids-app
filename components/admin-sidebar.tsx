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
  BookText,
  Video,
  Settings,
  LogOut,
  ScrollText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";

type AdminNotification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
};

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

export const AdminShell = ({
  children,
  userId,
  initialNotifications = [],
  initialUnreadCount = 0,
}: {
  children: ReactNode;
  userId: string;
  initialNotifications?: AdminNotification[];
  initialUnreadCount?: number;
}) => {
  const locale = useLocale();
  const dict = useDictionary();
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  useLockBodyScroll();

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
      name: dict["admin.navBooks"] || "Books",
      href: `/${locale}/admin/books`,
      icon: BookText,
    },
    {
      name: dict["admin.navVideos"] || "Videos",
      href: `/${locale}/admin/videos`,
      icon: Video,
    },
    {
      name: dict["admin.navAudit"] || "Login Audit",
      href: `/${locale}/admin/audit`,
      icon: ScrollText,
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
      case "videos":
        return dict["admin.navVideos"] || "Videos";
      case "audit":
        return dict["admin.navAudit"] || "Login Audit";
      case "settings":
        return dict["admin.navSettings"] || "Settings";
      default:
        return dict["admin.navDashboard"] || "Dashboard";
    }
  };
  const headerTitle = pageTitle || sectionTitle();

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="z-10 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-[calc(5rem+env(safe-area-inset-top))] items-center border-b border-slate-100 px-6 pt-[env(safe-area-inset-top)]">
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
        <header className="z-10 flex h-[calc(5rem+env(safe-area-inset-top))] items-center justify-between border-b border-slate-200 bg-white px-4 pt-[env(safe-area-inset-top)] md:px-6">
          <div className="flex items-center gap-2 text-xl font-bold text-indigo-600 md:hidden">
            <GraduationCap className="h-6 w-6" />
            <span>{dict["admin.brandShort"] || "Admin"}</span>
          </div>
          <h1 className="hidden truncate text-2xl font-bold tracking-tight text-slate-800 md:block">
            {headerTitle}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell
              userId={userId}
              initialNotifications={initialNotifications}
              initialUnreadCount={initialUnreadCount}
            />
            <LanguageToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-4 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-6xl pb-28 md:pb-0">
            <AdminTitleContext.Provider value={setPageTitle}>
              {children}
            </AdminTitleContext.Provider>
          </div>
        </main>

        {/* Mobile bottom nav — the sidebar is hidden below md, so phones get a
            floating menu like the student/parent shells. */}
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
          <nav className="pointer-events-auto mx-auto flex w-full max-w-[420px] items-center justify-between rounded-[32px] border border-b-4 border-slate-200 bg-white/90 px-3 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            {adminLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.name}
                  className="group relative flex flex-col items-center"
                >
                  <div
                    className={cn(
                      "transform rounded-2xl p-2.5 transition-all duration-300",
                      active
                        ? "-translate-y-1 scale-110 border border-indigo-100 bg-indigo-50 text-indigo-600"
                        : "text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600"
                    )}
                  >
                    <link.icon className="h-6 w-6" />
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
