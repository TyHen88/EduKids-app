"use client";

import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Users,
  BookOpen,
  Rocket,
  Settings,
  GraduationCap,
  UserCog,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDictionary, useLocale } from "@/app/[lang]/lang-provider";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";

type ParentNotification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
};

type ParentShellProps = {
  userId: string;
  userImageSrc: string;
  userName: string;
  initialNotifications?: ParentNotification[];
  initialUnreadCount?: number;
  children: ReactNode;
};

export const ParentShell = ({
  userId,
  userImageSrc,
  userName,
  initialNotifications = [],
  initialUnreadCount = 0,
  children,
}: ParentShellProps) => {
  const locale = useLocale();
  const dict = useDictionary();
  const pathname = usePathname();
  useLockBodyScroll();

  const parentLinks = [
    { name: dict["nav.dashboard"] || "Dashboard", href: `/${locale}/family`, icon: Home },
    { name: dict["nav.children"] || "Children", href: `/${locale}/family/children`, icon: Users },
    { name: dict["nav.members"] || "Members", href: `/${locale}/family/members`, icon: UserCog },
    { name: dict["nav.myCourses"] || "My Courses", href: `/${locale}/family/my-courses`, icon: GraduationCap },
    { name: dict["nav.courses"] || "Courses", href: `/${locale}/family/courses`, icon: BookOpen },
    { name: dict["nav.settings"] || "Settings", href: `/${locale}/family/settings`, icon: Settings },
  ];

  const isLinkActive = (href: string) => {
    const dashboard = `/${locale}/family`;
    if (href === dashboard) return pathname === dashboard;
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="z-10 flex h-[calc(5rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <Link
          href={`/${locale}/family`}
          className="flex shrink-0 items-center gap-2 text-xl font-bold text-emerald-600"
        >
          <div className="rounded-xl bg-emerald-600 p-2 text-white">
            <Rocket className="h-6 w-6" />
          </div>
          <span className="hidden lg:inline">EduKids Family</span>
        </Link>

        {/* Top nav (real desktop only — wide + mouse) */}
        <nav className="mx-4 hidden shrink-0 items-center space-x-1 rounded-3xl border border-slate-100 bg-slate-50 p-1.5 sm:space-x-2 desktop:flex">
          {parentLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300",
                  isActive
                    ? "border border-slate-100 bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                )}
              >
                <link.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-emerald-600" : "text-slate-400"
                  )}
                />
                <span className="hidden lg:inline">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
          <NotificationBell
            userId={userId}
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
          />
          <LanguageToggle />

          <Link
            href={`/${locale}/family/profile`}
            title={userName}
            className={cn(
              "relative ml-1 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 bg-slate-100 shadow-sm transition-colors sm:ml-2",
              isLinkActive(`/${locale}/family/profile`)
                ? "border-emerald-500"
                : "border-slate-200 hover:border-emerald-400"
            )}
          >
            <Image
              src={userImageSrc}
              alt={userName}
              fill
              className="object-cover"
              sizes="40px"
            />
          </Link>
        </div>
      </header>

      <main className="w-full flex-1 overflow-y-auto overscroll-contain px-4 pt-6 sm:px-8 desktop:pb-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          // Bottom clearance lives on the content (not on the scrolling <main>)
          // because iOS Safari ignores padding-bottom on a scroll container.
          // min-h-full lets it grow so the padding is part of the scroll height.
          className="mx-auto min-h-full w-full max-w-7xl pb-36 desktop:pb-0"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom float nav (everything except real desktop) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] desktop:hidden">
        <nav className="pointer-events-auto mx-auto flex w-full max-w-[400px] items-center justify-between rounded-[32px] border border-b-4 border-slate-200 bg-white/90 px-6 py-3 text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] backdrop-blur-xl">
          {parentLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative flex w-14 flex-col items-center"
              >
                <div
                  className={cn(
                    "transform rounded-2xl p-2.5 transition-all duration-300",
                    isActive
                      ? "-translate-y-2 scale-110 border border-emerald-100 bg-emerald-50 text-emerald-600"
                      : "text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600"
                  )}
                >
                  <link.icon
                    className={cn("h-6 w-6", isActive && "fill-emerald-100")}
                  />
                </div>
                <span
                  className={cn(
                    "absolute -bottom-1 w-full text-center text-[8px] font-extrabold uppercase tracking-widest transition-all duration-300",
                    isActive
                      ? "text-emerald-600 opacity-100"
                      : "pointer-events-none translate-y-2 text-slate-400 opacity-0 group-hover:opacity-100"
                  )}
                >
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
