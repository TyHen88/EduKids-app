"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Flame, Heart, Star, Trophy } from "lucide-react";

import { Input } from "@/components/ui/input";

export type StudentRow = {
  userId: string;
  userName: string;
  userImageSrc: string;
  points: number;
  hearts: number;
  streak: number;
  activeCourse: string | null;
  badges: number;
};

export const StudentsTable = ({ students }: { students: StudentRow[] }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.userName.toLowerCase().includes(q));
  }, [query, students]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students..."
          className="rounded-2xl border-2 border-slate-200 pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-[32px] border-2 border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Student</th>
                <th className="px-4 py-4">Active Course</th>
                <th className="px-4 py-4 text-center">Gems</th>
                <th className="px-4 py-4 text-center">Hearts</th>
                <th className="px-4 py-4 text-center">Streak</th>
                <th className="px-6 py-4 text-center">Badges</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.userId}
                  className="border-b border-slate-50 transition-colors last:border-0 hover:bg-indigo-50/30"
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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                      <Trophy className="h-4 w-4" /> {s.badges}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center font-medium text-slate-400"
                  >
                    {students.length === 0
                      ? "No students have enrolled yet."
                      : "No students match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
