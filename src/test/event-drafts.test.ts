import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DRAFT_TTL_HOURS } from "@/hooks/use-event-draft";

const dir = join(process.cwd(), "drizzle/migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");

describe("event drafts", () => {
  it("are kept 48 hours", () => {
    expect(DRAFT_TTL_HOURS).toBe(48);
    expect(sql).toMatch(/NEW\.expires_at := now\(\) \+ interval '48 hours'/);
  });

  it("never get their deadline extended by later saves", () => {
    expect(sql).toMatch(/NEW\.expires_at := OLD\.expires_at/);
  });

  it("are hidden from their owner once expired", () => {
    expect(sql).toMatch(/user_id = auth\.uid\(\) AND expires_at > now\(\)/);
  });
});
