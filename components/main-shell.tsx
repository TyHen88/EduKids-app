"use client";

import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Map as MapIcon,
  Backpack,
  Trophy,
  Flame,
  Star,
  Heart,
  Rocket,
  LayoutDashboard,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/app/[lang]/lang-provider";
import { NotificationBell } from "@/components/notification-bell";

type MainShellProps = {
  points: number;
  hearts: number;
  streak: number;
  isAdmin: boolean;
  userImageSrc: string;
  userName: string;
  initialNotifications?: any[];
  initialUnreadCount?: number;
  isChild?: boolean;
  children: ReactNode;
};

export const MainShell = ({
  points,
  hearts,
  streak,
  isAdmin,
  userImageSrc,
  userName,
  initialNotifications = [],
  initialUnreadCount = 0,
  isChild = false,
  children,
}: MainShellProps) => {
  const locale = useLocale();
  const pathname = usePathname();

  const studentLinks = [
    { name: "Home", href: `/${locale}/learn`, icon: Home },
    { name: "Star Map", href: `/${locale}/path`, icon: MapIcon },
    { name: "Backpack", href: `/${locale}/courses`, icon: Backpack },
    ...(isChild
      ? [{ name: "Family", href: `/${locale}/my-family`, icon: Heart }]
      : [{ name: "Friends", href: `/${locale}/friends`, icon: Users }]),
    { name: "Galaxy", href: `/${locale}/achievements`, icon: Trophy },
  ];

  const isLinkActive = (href: string) => {
    const home = `/${locale}/learn`;
    if (href === home) return pathname === home;
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <Link
          href={`/${locale}/learn`}
          className="flex shrink-0 items-center gap-2 text-xl font-bold text-indigo-600"
        >
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Rocket className="h-6 w-6" />
          </div>
          <span className="hidden lg:inline">EduKids</span>
        </Link>

        {/* Top nav (tablet/desktop) */}
        <nav className="mx-4 hidden shrink-0 items-center space-x-1 rounded-3xl border border-slate-100 bg-slate-50 p-1.5 sm:space-x-2 md:flex">
          {studentLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300",
                  isActive
                    ? "border border-slate-100 bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                )}
              >
                <link.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-indigo-600" : "text-slate-400"
                  )}
                />
                <span className="hidden lg:inline">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
          {/* Streak */}
          <div className="hidden items-center space-x-2 rounded-2xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm sm:flex sm:px-4 sm:py-2">
            <Flame className="h-4 w-4 fill-current text-orange-500 sm:h-5 sm:w-5" />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Streak
              </p>
              <p className="text-sm font-black text-orange-500 sm:text-base">
                {streak}
              </p>
            </div>
          </div>

          {/* Hearts */}
          <div className="hidden items-center space-x-2 rounded-2xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm sm:flex sm:px-4 sm:py-2">
            <Heart className="h-4 w-4 fill-current text-rose-500 sm:h-5 sm:w-5" />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Hearts
              </p>
              <p className="text-sm font-black text-rose-500 sm:text-base">
                {hearts}
              </p>
            </div>
          </div>

          {/* Stardust / points */}
          <div className="flex items-center space-x-2 rounded-2xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">
            <Star className="h-4 w-4 fill-current text-indigo-600 sm:h-5 sm:w-5" />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Stardust
              </p>
              <p className="text-sm font-black text-indigo-600 sm:text-base">
                {points}
              </p>
            </div>
          </div>

          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              className="ml-1 hidden h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-500 shadow-sm transition-colors hover:border-indigo-500 hover:text-indigo-600 sm:flex"
              title="Admin"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}

          <div className="ml-1 sm:ml-2">
            <NotificationBell 
              initialNotifications={initialNotifications} 
              initialUnreadCount={initialUnreadCount} 
            />
          </div>

          <Link
            href={`/${locale}/profile`}
            title={userName}
            className={cn(
              "relative ml-1 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 bg-slate-100 shadow-sm transition-colors sm:ml-2",
              isLinkActive(`/${locale}/profile`)
                ? "border-indigo-500"
                : "border-slate-200 hover:border-indigo-400"
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

      <main className="w-full flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-8 md:pb-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto h-full w-full max-w-7xl"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom nav (mobile) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center p-4 md:hidden">
        <nav className="pointer-events-auto mx-auto flex w-full max-w-[400px] items-center justify-between rounded-[32px] border border-b-4 border-slate-200 bg-white/90 px-6 py-3 text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] backdrop-blur-xl">
          {studentLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className="group relative flex w-14 flex-col items-center"
              >
                <div
                  className={cn(
                    "transform rounded-2xl p-2.5 transition-all duration-300",
                    isActive
                      ? "-translate-y-2 scale-110 border border-indigo-100 bg-indigo-50 text-indigo-600"
                      : "text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600"
                  )}
                >
                  <link.icon
                    className={cn("h-6 w-6", isActive && "fill-indigo-100")}
                  />
                </div>
                <span
                  className={cn(
                    "absolute -bottom-1 w-full text-center text-[8px] font-extrabold uppercase tracking-widest transition-all duration-300",
                    isActive
                      ? "text-indigo-600 opacity-100"
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
