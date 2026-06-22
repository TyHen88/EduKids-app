"use client";

import { useEffect, useState } from "react";

const greetingFor = (hour: number) => {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const Greeting = ({ name }: { name: string }) => {
  // Compute from the browser's local time. Re-set on mount so it reflects the
  // user's timezone rather than the server's.
  const [greeting, setGreeting] = useState(() => greetingFor(new Date().getHours()));

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <h1
      className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl"
      suppressHydrationWarning
    >
      {greeting}, {name}! 👋
    </h1>
  );
};
