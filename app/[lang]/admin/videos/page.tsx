import { Video } from "lucide-react";

import { getVideoKeywords, getVideoChannels } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { VideoSettingsManager } from "./video-settings-manager";

type Props = {
  params: Promise<{ lang: string }>;
};

const AdminVideosPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = (await getDictionary(lang as "km" | "en")) as Record<string, string>;

  const [keywords, channels] = await Promise.all([
    getVideoKeywords(false),
    getVideoChannels(false),
  ]);

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {dict["admin.videos"] || "Videos"}
          </h1>
          <p className="mt-1 text-base text-slate-500 sm:mt-2 sm:text-lg">
            {dict["admin.videosSubtitle"] ||
              "Curate the safe learning-video feed for kids."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-rose-100 bg-rose-50 text-rose-500 sm:flex">
          <Video className="h-7 w-7" />
        </div>
      </div>

      <VideoSettingsManager keywords={keywords} channels={channels} lang={lang} />
    </div>
  );
};

export default AdminVideosPage;
