import { notFound } from "next/navigation";

import { getBookForReader } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { Reader } from "./reader";

type Props = {
  params: Promise<{ lang: string; bookId: string }>;
};

const ReadBookPage = async ({ params }: Props) => {
  const { lang, bookId } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const id = Number(bookId);
  if (!Number.isFinite(id)) notFound();

  const book = await getBookForReader(id);
  if (!book || book.pages.length === 0) notFound();

  return (
    <Reader
      lang={lang}
      title={book.title}
      pages={book.pages.map((p) => ({ id: p.id, imageSrc: p.imageSrc }))}
      labels={{
        page: dict["books.page"] || "Page",
        of: dict["common.of"] || "of",
        prev: dict["books.prev"] || "Previous",
        next: dict["books.next"] || "Next",
        exit: dict["books.exit"] || "Exit",
        theEnd: dict["books.theEnd"] || "The End!",
        backToLibrary: dict["books.backToLibrary"] || "Back to Library",
      }}
    />
  );
};

export default ReadBookPage;
