/** Only direct EzaWapi venue pages are accepted; never external destinations. */
export const normalizeVenueUrl = (raw?: string | null): string | null => {
  const value = (raw || "").trim();
  if (!value || /[\s\\\x00-\x1f\x7f]/.test(value) || /%(?:00|0a|0d|5c)/i.test(value)) return null;
  const candidate = /^(?:www\.)?ezawapi\.cd\//i.test(value) ? `https://${value}` : value;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !["ezawapi.cd", "www.ezawapi.cd"].includes(url.hostname) ||
      url.username || url.password || url.port || url.pathname === "/" || url.search || url.hash) return null;
    return url.href;
  } catch {
    return null;
  }
};

export const VENUE_URL_ERROR = "Ajoutez le lien direct d’un lieu sur https://ezawapi.cd/… (sans paramètres ni fragment).";