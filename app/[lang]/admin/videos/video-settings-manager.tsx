"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, RefreshCw, Loader2, Tag, Tv } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/app/[lang]/lang-provider";
import type { VideoKeyword, VideoChannel } from "@/db/queries";
import {
  addVideoKeyword,
  updateVideoKeyword,
  deleteVideoKeyword,
  addVideoChannel,
  updateVideoChannel,
  deleteVideoChannel,
  refreshVideoFeed,
} from "@/actions/videos";

type Props = {
  keywords: VideoKeyword[];
  channels: VideoChannel[];
  lang: string;
};

export const VideoSettingsManager = ({ keywords, channels, lang }: Props) => {
  const dict = useDictionary() as Record<string, string>;
  const t = (key: string, fallback: string) => dict[key] || fallback;

  const [pending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelTitle, setChannelTitle] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : dict["common.somethingWentWrong"] || "Something went wrong."
        );
      }
    });

  const onAddKeyword = () => {
    const k = keyword.trim();
    if (!k) return;
    run(async () => {
      await addVideoKeyword({ keyword: k, category: category.trim() }, lang);
      setKeyword("");
      setCategory("");
    });
  };

  const onAddChannel = () => {
    const c = channelId.trim();
    if (!c) return;
    run(async () => {
      await addVideoChannel({ channelId: c, title: channelTitle.trim() }, lang);
      setChannelId("");
      setChannelTitle("");
    });
  };

  return (
    <div className="space-y-8">
      {/* Refresh */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          {t(
            "admin.videosCacheHint",
            "Feeds are cached ~6h to respect the YouTube quota. Refresh to fetch immediately after changes."
          )}
        </p>
        <Button
          variant="primaryOutline"
          disabled={pending}
          onClick={() => run(() => refreshVideoFeed(lang))}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {t("admin.refreshFeed", "Refresh feed")}
        </Button>
      </div>

      {/* Keywords */}
      <section className="rounded-[32px] border-2 border-slate-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-1 flex items-center gap-2">
          <Tag className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            {t("admin.videoKeywords", "Keywords")}
          </h2>
        </div>
        <p className="mb-5 text-sm font-medium text-slate-500">
          {t(
            "admin.videoKeywordsHint",
            "Topics used to build the default kids feed (e.g. English for kids, Math)."
          )}
        </p>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("admin.videoKeywordPlaceholder", "e.g. English for kids")}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && onAddKeyword()}
          />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("admin.videoCategory", "Category (optional)")}
            className="sm:w-48"
            onKeyDown={(e) => e.key === "Enter" && onAddKeyword()}
          />
          <Button variant="primary" disabled={pending || !keyword.trim()} onClick={onAddKeyword}>
            <Plus className="mr-1 h-4 w-4" /> {t("common.add", "Add")}
          </Button>
        </div>

        {keywords.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">
            {t("admin.videoNoKeywords", "No keywords yet.")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {keywords.map((k) => (
              <li key={k.id} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="flex-1">
                  <span className="font-bold text-slate-800">{k.keyword}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {k.category}
                  </span>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500">
                  <input
                    type="checkbox"
                    checked={k.enabled}
                    disabled={pending}
                    onChange={(e) =>
                      run(() =>
                        updateVideoKeyword(k.id, { enabled: e.target.checked }, lang)
                      )
                    }
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {t("admin.enabled", "Enabled")}
                </label>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteVideoKeyword(k.id, lang))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                  aria-label={t("common.delete", "Delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Channel allowlist */}
      <section className="rounded-[32px] border-2 border-slate-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-1 flex items-center gap-2">
          <Tv className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            {t("admin.videoChannels", "Channel allowlist")}
          </h2>
        </div>
        <p className="mb-5 text-sm font-medium text-slate-500">
          {t(
            "admin.videoChannelsHint",
            "When set, the default feed only shows videos from these trusted channels. Paste the channel ID (starts with UC…)."
          )}
        </p>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <Input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && onAddChannel()}
          />
          <Input
            value={channelTitle}
            onChange={(e) => setChannelTitle(e.target.value)}
            placeholder={t("admin.videoChannelName", "Name (optional)")}
            className="sm:w-48"
            onKeyDown={(e) => e.key === "Enter" && onAddChannel()}
          />
          <Button variant="primary" disabled={pending || !channelId.trim()} onClick={onAddChannel}>
            <Plus className="mr-1 h-4 w-4" /> {t("common.add", "Add")}
          </Button>
        </div>

        {channels.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">
            {t("admin.videoNoChannels", "No channels — the feed is open to all channels.")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {channels.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-800">
                    {c.title || c.channelId}
                  </span>
                  {c.title && (
                    <span className="ml-2 truncate text-xs text-slate-400">
                      {c.channelId}
                    </span>
                  )}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500">
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    disabled={pending}
                    onChange={(e) =>
                      run(() =>
                        updateVideoChannel(c.id, { enabled: e.target.checked }, lang)
                      )
                    }
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {t("admin.enabled", "Enabled")}
                </label>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteVideoChannel(c.id, lang))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                  aria-label={t("common.delete", "Delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
