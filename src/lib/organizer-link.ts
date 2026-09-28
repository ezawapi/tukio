/** Normalise un lien organisateur : URL http(s) externe ou chemin interne ("/u/slug"). */
export const normalizeOrganizerUrl = (raw?: string | null): string | null => {
  const v = (raw || "").trim();
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v.slice(0, 300);
  if (/^https?:\/\//i.test(v)) return v.slice(0, 500);
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`.slice(0, 500);
  return null;
};

export const isExternalLink = (url: string) => /^https?:\/\//i.test(url);
