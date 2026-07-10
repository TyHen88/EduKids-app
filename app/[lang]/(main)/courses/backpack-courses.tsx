"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CourseWithProgress } from "@/db/queries";
import { useDictionary } from "@/app/[lang]/lang-provider";

import { CourseCard } from "./course-card";

type BackpackCoursesProps = {
  courses: CourseWithProgress[];
  lang: string;
  pageSize?: number;
};

// Backpack grid that reveals `pageSize` (default 10) courses at a time. New
// pages load on click or automatically when the "load more" sentinel scrolls
// into view.
export const BackpackCourses = ({
  courses,
  lang,
  pageSize = 10,
}: BackpackCoursesProps) => {
  const dict = useDictionary();
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const shown = courses.slice(0, visible);
  const hasMore = visible < courses.length;
  const remaining = courses.length - visible;

  const loadMore = () =>
    setVisible((v) => Math.min(v + pageSize, courses.length));

  // Auto-load the next page when the sentinel nears the viewport.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, pageSize, courses.length]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 px-2 md:grid-cols-2">
        {shown.map((course) => (
          <CourseCard key={course.id} course={course} lang={lang} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="mt-8 flex justify-center px-2">
          <Button variant="primaryOutline" onClick={loadMore}>
            {dict["courses.loadMore"] || "Load more"} ({remaining})
          </Button>
        </div>
      )}
    </>
  );
};
