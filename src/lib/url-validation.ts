/**
 * Validates a button/redirect URL.
 * Allowed: empty (optional), internal paths starting with "/", or http(s) URLs.
 */
export const validateBannerUrl = (url: string | null | undefined): { valid: boolean; error?: string } => {
  if (!url || !url.trim()) return { valid: true }; // optional
  const trimmed = url.trim();

  if (trimmed.startsWith("/")) {
    // basic internal path validation
    if (/\s/.test(trimmed)) return { valid: false, error: "Le chemin interne ne doit pas contenir d'espace" };
    return { valid: true };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (!u.hostname || !u.hostname.includes(".")) {
        return { valid: false, error: "Le domaine de l'URL semble invalide" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "URL externe invalide" };
    }
  }

  return { valid: false, error: "L'URL doit commencer par /, http:// ou https://" };
};
