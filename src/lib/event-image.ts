import defaultEventImg from "@/assets/fallback-tukio.png";

/**
 * Returns a usable image URL for an event card.
 * Falls back to the Tukio-branded image when the event has no image.
 */
export const getEventImage = (url?: string | null): string => {
  if (!url) return defaultEventImg;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "/placeholder.svg") return defaultEventImg;
  return trimmed;
};

/** True when the URL would resolve to the Tukio fallback image. */
export const isFallbackImage = (url?: string | null): boolean => {
  if (!url) return true;
  const trimmed = url.trim();
  return !trimmed || trimmed === "/placeholder.svg";
};

export { defaultEventImg };
