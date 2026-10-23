export type NativePlatform = "android" | "ios" | "windows" | "macos" | "linux";
export type NativeRelease = { platform: NativePlatform; label: string; url: string | null; filename?: string };

// Set URLs only after signed, tested releases are hosted or approved in a store.
export const nativeReleases: NativeRelease[] = [
  { platform: "android", label: "Android", url: null },
  { platform: "ios", label: "iPhone / iPad", url: null },
  { platform: "windows", label: "Windows", url: null },
  { platform: "macos", label: "macOS", url: null },
  { platform: "linux", label: "Linux", url: null },
];

export function detectNativePlatform(userAgent: string, maxTouchPoints = 0): NativePlatform | null {
  if (/android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
  if (/Linux/i.test(userAgent)) return "linux";
  return null;
}

export function getReleaseUrl(release: NativeRelease): string | null {
  if (!release.url) return null;
  if (release.url.startsWith("/downloads/") && !/[\\?#]/.test(release.url) && !release.url.includes("..")) return release.url;
  try {
    const url = new URL(release.url);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}