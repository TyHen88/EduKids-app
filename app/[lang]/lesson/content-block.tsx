"use client";

import Image from "next/image";

import { useDictionary } from "@/app/[lang]/lang-provider";

type ContentBlockProps = {
  type: "TEXT" | "IMAGE" | "SELECT" | "ASSIST" | string;
  body?: string | null;
  imageSrc?: string | null;
  caption?: string | null;
};

export const ContentBlock = ({
  type,
  body,
  imageSrc,
  caption,
}: ContentBlockProps) => {
  const dict = useDictionary();

  if (type === "TEXT") {
    return (
      <div className="prose prose-slate lg:prose-xl">
        <p>{body}</p>
      </div>
    );
  }

  if (type === "IMAGE") {
    return (
      <div className="flex flex-col items-center justify-center gap-y-4">
        {imageSrc && (
          <div className="relative aspect-video w-full max-w-[500px] overflow-hidden rounded-xl border-2">
            <Image
              src={imageSrc}
              alt={caption || dict["lesson.lessonImage"] || "Lesson Image"}
              fill
              className="object-cover"
            />
          </div>
        )}
        {caption && (
          <p className="text-center text-sm italic text-slate-500">
            {caption}
          </p>
        )}
      </div>
    );
  }

  return null;
};
