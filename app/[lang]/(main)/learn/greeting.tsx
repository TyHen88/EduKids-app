"use client";

import { useEffect, useState } from "react";

import { useDictionary } from "@/app/[lang]/lang-provider";

const greetingFor = (hour: number) => {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
};

export const Greeting = ({ name }: { name: string }) => {
  const dict = useDictionary();

  // Compute from the browser's local time. Re-set on mount so it reflects the
  // user's timezone rather than the server's.
  const [period, setPeriod] = useState(() => greetingFor(new Date().getHours()));

  useEffect(() => {
    setPeriod(greetingFor(new Date().getHours()));
  }, []);

  const greeting =
    period === "morning"
      ? dict["learn.goodMorning"] || "Good morning"
      : period === "afternoon"
        ? dict["learn.goodAfternoon"] || "Good afternoon"
        : dict["learn.goodEvening"] || "Good evening";

  return (
    <h1
      className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl"
      suppressHydrationWarning
    >
      {greeting}, {name}! 👋
    </h1>
  );
};
