import { ArrowUpRight, LayoutGrid } from "lucide-react";

type Props = {
  dict: Record<string, string>;
};

// Companion apps we cross-promote. Add new entries here — the section grows
// automatically. `tagKey` is looked up in the dictionary with a fallback.
type SuggestedApp = {
  key: string;
  name: string;
  emoji: string;
  url: string;
  gradient: string;
  tagKey: string;
  tagFallback: string;
};

const APPS: SuggestedApp[] = [
  {
    key: "ebookmine",
    name: "eBookMine",
    emoji: "📚",
    url: "https://ebookmine.vercel.app/",
    gradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
    tagKey: "learn.ebookmineSubtitle",
    tagFallback: "Read & explore eBooks online, anytime.",
  },
  // Add more companion apps here, e.g.:
  // { key: "mathmine", name: "MathMine", emoji: "🧮", url: "https://...",
  //   gradient: "from-emerald-500 to-teal-500",
  //   tagKey: "learn.mathmineSubtitle", tagFallback: "Practice math games." },
];

// Sidebar section suggesting our other companion apps, presented as an
// app list — each row links out to that app in a new tab.
export const AppSuggest = ({ dict }: Props) => {
  if (APPS.length === 0) return null;

  return (
    <section className="hidden lg:block">
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-800">
          <LayoutGrid className="h-5 w-5 text-indigo-500" />{" "}
          {dict["learn.moreApps"] || "More Apps"}
        </h2>
      </div>

      <div className="space-y-3 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-4 shadow-sm">
        {APPS.map((app) => (
          <a
            key={app.key}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50"
          >
            {/* App-icon logo */}
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border-2 border-white bg-gradient-to-br text-2xl shadow-md transition-transform group-hover:scale-105 group-hover:rotate-3 ${app.gradient}`}
            >
              {app.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-black leading-tight text-slate-800">
                {app.name}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-500">
                {dict[app.tagKey] || app.tagFallback}
              </p>
            </div>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
};
