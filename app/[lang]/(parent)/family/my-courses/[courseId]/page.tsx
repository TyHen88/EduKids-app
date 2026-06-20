import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getParentCourseTree } from "@/db/queries";
import { ContentManager } from "@/app/[lang]/admin/courses/[courseId]/content-manager";

type Props = {
  params: Promise<{ lang: string; courseId: string }>;
};

const ParentCourseContentPage = async ({ params }: Props) => {
  const { lang, courseId } = await params;
  const course = await getParentCourseTree(Number(courseId));

  if (!course) redirect(`/${lang}/family/my-courses`);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link
          href={`/${lang}/family/my-courses`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition-colors hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my courses
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          {course.title} — Content
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Manage units, lessons, blocks and answer options.
        </p>
      </div>

      <ContentManager
        course={{ id: course.id, title: course.title, units: course.units }}
        lang={lang}
      />
    </div>
  );
};

export default ParentCourseContentPage;
