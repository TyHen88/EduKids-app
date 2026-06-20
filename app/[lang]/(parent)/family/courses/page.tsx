import { getCoursesForParent, getChildren, getCourseAssignments } from "@/db/queries";
import { CoursesClient } from "./courses-client";

type Props = {
  params: Promise<{ lang: string }>;
};

const FamilyCoursesPage = async ({ params }: Props) => {
  const { lang } = await params;
  
  const [courses, children, assignments] = await Promise.all([
    getCoursesForParent(),
    getChildren(),
    getCourseAssignments(),
  ]);

  return (
    <CoursesClient
      courses={courses}
      childrenData={children}
      assignments={assignments}
      lang={lang}
    />
  );
};

export default FamilyCoursesPage;
