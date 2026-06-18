import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { channel: (name: string) => ({ __name: name, on: () => ({ subscribe: () => ({}) }) }) },
}));

import { isChannelNameAllowed, safeChannel } from "@/lib/realtime-guard";

describe("realtime-guard", () => {
  it("accepts known channel names", () => {
    expect(isChannelNameAllowed("unread-notifs")).toBe(true);
    expect(isChannelNameAllowed("home-events-sync")).toBe(true);
    expect(isChannelNameAllowed("user_notifications:11111111-1111-1111-1111-111111111111")).toBe(true);
    expect(isChannelNameAllowed("follows:22222222-2222-2222-2222-222222222222")).toBe(true);
  });

  it("rejects unknown/sensitive topics", () => {
    expect(isChannelNameAllowed("ticket_orders")).toBe(false);
    expect(isChannelNameAllowed("event_invitations:*")).toBe(false);
    expect(isChannelNameAllowed("profiles")).toBe(false);
    expect(isChannelNameAllowed("user_notifications:not-a-uuid")).toBe(false);
    expect(isChannelNameAllowed("")).toBe(false);
    expect(isChannelNameAllowed("x".repeat(200))).toBe(false);
  });

  it("safeChannel throws on unauthorized topic", () => {
    expect(() => safeChannel("ticket_orders")).toThrow(/Unauthorized realtime topic/);
    expect(() => safeChannel("user_notifications:*")).toThrow();
  });

  it("safeChannel returns a channel for allowed topic", () => {
    const ch: any = safeChannel("unread-notifs");
    expect(ch.__name).toBe("unread-notifs");
  });
});
