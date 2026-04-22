/**
 * Validates a button/redirect URL.
 * Allowed: empty (optional), internal paths starting with "/", or http(s) URLs.
 * Rejected: javascript:, data:, vbscript:, file:, about:, blank, whitespace, control chars, redirect markers.
 */

const SUSPICIOUS_PROTOCOLS = /^(javascript|data|vbscript|file|about|blob):/i;
const CONTROL_CHARS = /[\x00-\x1F\x7F]/;
const ENCODED_SCRIPT = /%(00|0a|0d|09|20)/i; // encoded null/newline/tab/space
const REDIRECT_MARKERS = /[?&](url|redirect|next|return|continue|dest|destination)=https?%3a/i;

export const validateBannerUrl = (
  url: string | null | undefined
): { valid: boolean; error?: string } => {
  if (!url || !url.trim()) return { valid: true }; // optional

  const trimmed = url.trim();

  // Reject any whitespace inside the URL
  if (/\s/.test(trimmed)) {
    return { valid: false, error: "L'URL ne doit contenir aucun espace ni caractère blanc." };
  }

  // Reject control characters
  if (CONTROL_CHARS.test(trimmed)) {
    return { valid: false, error: "L'URL contient des caractères de contrôle interdits." };
  }

  // Reject dangerous protocols
  if (SUSPICIOUS_PROTOCOLS.test(trimmed)) {
    return {
      valid: false,
      error: "Protocole interdit (javascript:, data:, vbscript:, file:, etc.). Utilisez https:// ou un chemin interne.",
    };
  }

  // Reject suspicious encoded sequences in path
  if (ENCODED_SCRIPT.test(trimmed)) {
    return { valid: false, error: "L'URL contient des séquences encodées suspectes (%00, %0A, etc.)." };
  }

  // Reject open-redirect patterns embedded in query
  if (REDIRECT_MARKERS.test(trimmed)) {
    return {
      valid: false,
      error: "L'URL semble contenir une redirection ouverte (paramètre ?url=, ?redirect=, etc.). Pointez directement vers la destination finale.",
    };
  }

  if (trimmed.startsWith("/")) {
    // internal path: must not be protocol-relative //evil.com
    if (trimmed.startsWith("//")) {
      return { valid: false, error: "Les URL protocole-relatives (//domaine) ne sont pas autorisées." };
    }
    return { valid: true };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (!u.hostname || !u.hostname.includes(".")) {
        return { valid: false, error: "Le domaine de l'URL semble invalide." };
      }
      // Reject userinfo (https://user:pass@evil.com)
      if (u.username || u.password) {
        return { valid: false, error: "Les URL avec identifiants intégrés (user:pass@) sont interdites." };
      }
      // Reject IP-based hosts to limit phishing-style URLs
      if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) {
        return { valid: false, error: "Les adresses IP brutes ne sont pas autorisées comme destination." };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "URL externe invalide ou mal formée." };
    }
  }

  return {
    valid: false,
    error: "L'URL doit commencer par / (chemin interne), https:// ou http://.",
  };
};
