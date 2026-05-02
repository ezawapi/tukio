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

export { defaultEventImg };
