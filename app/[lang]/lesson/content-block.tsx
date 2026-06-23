"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";

type ContentBlockProps = {
  type: "TEXT" | "IMAGE" | "SELECT" | "ASSIST" | string;
  body?: string | null;
  imageSrc?: string | null;
  caption?: string | null;
  imagePosition?: string | null;
};

export const ContentBlock = ({
  type,
  body,
  imageSrc,
  caption,
  imagePosition,
}: ContentBlockProps) => {
  const dict = useDictionary();

  if (type === "TEXT") {
    // whitespace-pre-line keeps the line breaks the author typed in the body.
    const text = (
      <div className="prose prose-slate max-w-none whitespace-pre-line lg:prose-xl">
        <p>{body}</p>
      </div>
    );

    if (!imageSrc) return text;

    return (
      <div
        className={cn(
          "flex flex-col gap-6 lg:items-start",
          imagePosition === "right" ? "lg:flex-row-reverse" : "lg:flex-row"
        )}
      >
        {/* width/height 0 + sizes + w-full/h-auto keeps the image at its natural
            aspect ratio (no cropping), matching the admin preview. */}
        <Image
          src={imageSrc}
          alt={dict["lesson.lessonImage"] || "Lesson Image"}
          width={0}
          height={0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="h-auto w-full shrink-0 rounded-xl border-2 object-contain lg:w-1/2"
        />
        <div className="flex-1">{text}</div>
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
