import { notFound } from "next/navigation";

// Catch-all for any URL under a locale that no other route matches
// (e.g. /km/my-family/1). Specific routes always take precedence over this
// catch-all, so it only fires for genuinely unknown paths. Calling notFound()
// renders `app/[lang]/not-found.tsx` inside `[lang]/layout.tsx`, so the 404 UI
// gets the app fonts, DictionaryProvider, and locale — unlike a root-level
// not-found, which would bypass that layout.
const CatchAllNotFound = () => {
  notFound();
};

export default CatchAllNotFound;
