import { describe, expect, it } from "vitest";
import { getPageSeo, isIndexableEvent, safeJsonLd } from "@/lib/page-seo";

describe("Search index eligibility", () => {
  it("indexes public pages with the official Tukio domain", () => {
    expect(getPageSeo("/events").canonical).toBe("https://tukio.cd/events");
    expect(getPageSeo("/events").indexable).toBe(true);
    expect(getPageSeo("/map").canonical).toBe("https://tukio.cd/explorer");
  });
  it("does not index account, admin or invitation pages", () => {
    for (const path of ["/auth", "/create", "/profile", "/admin", "/admin/roles", "/settings", "/invite/token", "/events/id/edit", "/unknown"]) {
      expect(getPageSeo(path).indexable, path).toBe(false);
    }
  });
  it("indexes only approved published public events", () => {
    expect(isIndexableEvent({ visibility: "public", status: "approved", is_published: true })).toBe(true);
    expect(isIndexableEvent({ visibility: "private", status: "approved", is_published: true })).toBe(false);
    expect(isIndexableEvent({ visibility: "public", status: "pending", is_published: true })).toBe(false);
    expect(isIndexableEvent({ visibility: "public", status: "approved", is_published: false })).toBe(false);
  });
  it("escapes HTML delimiters in structured event content", () => {
    expect(safeJsonLd({ name: "</script>" })).not.toContain("<");
    expect(JSON.parse(safeJsonLd({ name: "</script>" })).name).toBe("</script>");
  });
});