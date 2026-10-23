import { describe, expect, it } from "vitest";
import { normalizeVenueUrl } from "@/lib/venue-link";

describe("EzaWapi venue links", () => {
  it("accepts only direct pages on ezawapi.cd or its www alias", () => {
    expect(normalizeVenueUrl("https://ezawapi.cd/lieux/hotel")).toBe("https://ezawapi.cd/lieux/hotel");
    expect(normalizeVenueUrl("www.ezawapi.cd/lieux/hotel")).toBe("https://www.ezawapi.cd/lieux/hotel");
    expect(normalizeVenueUrl("ezawapi.cd/lieux/hotel")).toBe("https://ezawapi.cd/lieux/hotel");
    for (const value of ["https://example.com/hotel", "https://ezawapi.cd.evil.com/hotel", "https://evil.ezawapi.cd/hotel", "https://ezawapi.cd@evil.com/hotel", "https://user@ezawapi.cd/hotel", "https://ezawapi.cd:444/hotel", "javascript:alert(1)", "//ezawapi.cd/hotel", "http://ezawapi.cd/hotel", "https://ezawapi.cd/", "https://ezawapi.cd/hotel?redirect=https://evil.com", "https://ezawapi.cd/hotel#redirect", "https://ezawapi.cd/\\evil.com", "https://ezawapi.cd/a%0Ab"]) {
      expect(normalizeVenueUrl(value), value).toBeNull();
    }
  });
  it("leaves the venue link optional", () => {
    expect(normalizeVenueUrl("")).toBeNull();
    expect(normalizeVenueUrl(null)).toBeNull();
  });
});