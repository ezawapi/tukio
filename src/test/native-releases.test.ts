import { describe, expect, it } from "vitest";
import { detectNativePlatform, getReleaseUrl, nativeReleases } from "@/lib/native-releases";

describe("Native installation", () => {
  it("detects Android separately from Linux", () => {
    expect(detectNativePlatform("Mozilla/5.0 (Linux; Android 14)" )).toBe("android");
  });
  it("detects iPhone and iPad desktop mode separately from macOS", () => {
    expect(detectNativePlatform("iPhone OS 18_0")).toBe("ios");
    expect(detectNativePlatform("Macintosh", 5)).toBe("ios");
    expect(detectNativePlatform("Macintosh", 0)).toBe("macos");
  });
  it("detects desktop systems and does not guess unknown devices", () => {
    expect(detectNativePlatform("Windows NT 10.0")).toBe("windows");
    expect(detectNativePlatform("X11; Linux x86_64")).toBe("linux");
    expect(detectNativePlatform("unknown")).toBeNull();
  });
  it("offers no fabricated downloads before native releases exist", () => {
    expect(nativeReleases.map(r => r.platform)).toEqual(["android", "ios", "windows", "macos", "linux"]);
    expect(nativeReleases.every(r => getReleaseUrl(r) === null)).toBe(true);
  });
  it("only accepts secure store links or same-origin downloadable files", () => {
    const release = { platform: "android" as const, label: "Android", url: "javascript:alert(1)" };
    expect(getReleaseUrl(release)).toBeNull();
    expect(getReleaseUrl({ ...release, url: "http://example.com/app.apk" })).toBeNull();
    expect(getReleaseUrl({ ...release, url: "/downloads/../secrets" })).toBeNull();
    expect(getReleaseUrl({ ...release, url: "/downloads/tukio.apk" })).toBe("/downloads/tukio.apk");
    expect(getReleaseUrl({ ...release, url: "https://play.google.com/store/apps/details?id=app.tukio" })).toContain("https://play.google.com/");
  });
});