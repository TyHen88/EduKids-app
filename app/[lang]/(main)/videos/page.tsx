import { getDefaultVideos, type VideoPage } from "@/lib/youtube";

import { VideosBrowser } from "./videos-browser";

type Props = {
  params: Promise<{ lang: string }>;
};

// Learner/kids video feed. The first page is fetched server-side (cached in the
// DB); the browser handles search + infinite scroll from there.
const VideosPage = async ({ params }: Props) => {
  const { lang } = await params;

  let initial: VideoPage = { items: [], nextPageToken: null };
  let configError = false;

  try {
    initial = await getDefaultVideos();
  } catch (e) {
    console.error("[videos] initial feed failed:", e);
    configError = true;
  }

  return (
    <VideosBrowser
      lang={lang}
      initialItems={initial.items}
      initialToken={initial.nextPageToken}
      configError={configError}
    />
  );
};

export default VideosPage;
