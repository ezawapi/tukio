const YOUTUBE_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i;

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];

export type AdMediaKind = "youtube" | "video" | "image";

export const getYouTubeEmbedUrl = (url: string): string | null => {
  const match = url.match(YOUTUBE_REGEX);
  if (!match?.[1]) return null;
  return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
};

export const getAdMediaKind = (url: string): AdMediaKind => {
  if (getYouTubeEmbedUrl(url)) return "youtube";

  const normalized = url.toLowerCase().split("?")[0];
  if (VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext))) {
    return "video";
  }

  return "image";
};