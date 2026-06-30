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
  if (!book || book.units.length === 0) notFound();

  return (
    <Reader
      lang={lang}
      title={book.title}
      units={book.units.map((u) => ({
        id: u.id,
        title: u.title,
        content: u.content,
      }))}
      labels={{
        unit: dict["books.unit"] || "Unit",
        of: dict["common.of"] || "of",
        prev: dict["books.prev"] || "Previous",
        next: dict["books.next"] || "Next",
        exit: dict["books.exit"] || "Exit",
        theEnd: dict["books.theEnd"] || "The End!",
        backToLibrary: dict["books.backToLibrary"] || "Back to Library",
        contents: dict["books.contents"] || "Contents",
        byUnit: dict["books.byUnit"] || "By unit",
        readFull: dict["books.readFull"] || "Read full",
        finish: dict["books.finish"] || "Finish",
      }}
    />
  );
};

export default ReadBookPage;
