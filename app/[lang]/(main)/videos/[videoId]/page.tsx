import {
  getVideoDetails,
  getTranscript,
  type VideoDetails,
  type TranscriptSegment,
} from "@/lib/youtube";

import { VideoWatch } from "./video-watch";

type Props = {
  params: Promise<{ lang: string; videoId: string }>;
};

// Full-page video watch view with a synced, interactive transcript.
const VideoWatchPage = async ({ params }: Props) => {
  const { lang, videoId } = await params;

  let details: VideoDetails | null = null;
  let transcript: TranscriptSegment[] = [];

  try {
    const [d, t] = await Promise.all([
      getVideoDetails(videoId),
      getTranscript(videoId),
    ]);
    details = d;
    transcript = t ?? [];
  } catch (e) {
    console.error("[videos/watch] load failed:", e);
  }

  return (
    <VideoWatch
      lang={lang}
      videoId={videoId}
      details={details}
      transcript={transcript}
    />
  );
};

export default VideoWatchPage;
