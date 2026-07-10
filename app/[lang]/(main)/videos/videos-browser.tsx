"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/app/[lang]/lang-provider";
import { loadVideos } from "@/actions/videos";
import type { VideoItem } from "@/lib/youtube";

type Props = {
  lang: string;
  initialItems: VideoItem[];
  initialToken: string | null;
  configError?: boolean;
};

export const VideosBrowser = ({
  lang,
  initialItems,
  initialToken,
  configError = false,
}: Props) => {
  const dict = useDictionary() as Record<string, string>;
  const t = (key: string, fallback: string) => dict[key] || fallback;

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [items, setItems] = useState<VideoItem[]>(initialItems);
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    setLoading(true);
    setActiveQuery(q);
    try {
      const page = await loadVideos(q);
      setItems(page.items);
      setToken(page.nextPageToken);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : dict["common.somethingWentWrong"] || "Something went wrong."
      );
      setItems([]);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!token || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await loadVideos(activeQuery, token);
      setItems((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        return [...prev, ...page.items.filter((v) => !seen.has(v.id))];
      });
      setToken(page.nextPageToken);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : dict["common.somethingWentWrong"] || "Something went wrong."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeQuery, loadingMore, loading]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
            {t("videos.title", "Videos")} 📺
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
            {t("videos.subtitle", "Watch and learn fun videos!")}
          </p>
        </div>

        <form onSubmit={runSearch} className="flex items-center gap-2 sm:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("videos.searchPlaceholder", "Search videos…")}
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>

      {configError ? (
        <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center font-medium text-slate-500">
          {t("videos.notConfigured", "Videos are not available right now.")}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center font-medium text-slate-500">
          {t("videos.empty", "No videos found.")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <Link
                key={v.id}
                href={`/${lang}/videos/${v.id}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-900/5">
                  {v.thumbnail ? (
                    // Thumbnails come from many i.ytimg.com hosts — plain <img>.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                    <div className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white/95 text-indigo-600 opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                      <Play className="ml-0.5 h-6 w-6 fill-current" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-slate-800 transition-colors group-hover:text-indigo-600">
                    {v.title}
                  </h3>
                  <p className="mt-1 truncate text-xs font-medium text-slate-400">
                    {v.channelTitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {token && (
            <div ref={sentinelRef} className="flex justify-center pt-2">
              <Button
                variant="primaryOutline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("videos.loadMore", "Load more")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
