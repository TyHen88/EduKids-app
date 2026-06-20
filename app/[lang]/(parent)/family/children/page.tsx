import { getChildren } from "@/db/queries";
import { ChildrenClient } from "./children-client";

type Props = {
  params: Promise<{ lang: string }>;
};

const ChildrenPage = async ({ params }: Props) => {
  const { lang } = await params;
  const children = await getChildren();

  return <ChildrenClient initialChildren={children} lang={lang} />;
};

export default ChildrenPage;
