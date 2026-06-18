import { describe, it, expect, beforeEach } from "vitest";

/**
 * Regression tests: verify that an unauthenticated (anon) client cannot read
 * the sensitive email columns exposed on `event_invitations.invited_email`
 * and `ticket_orders.buyer_email`. These checks emulate the production RLS
 * behaviour for these two tables:
 *
 *  - event_invitations.SELECT  → only invited_by, invited_user_id, or admin
 *  - ticket_orders.SELECT      → only buyer_user_id or admin (organizers go
 *                                through the `ticket_orders_organizer_view`
 *                                which excludes buyer_email)
 *
 * The mock client below mirrors the policies so a regression that loosens
 * them — or a UI that tries to read emails as a stranger — fails the suite.
 */

type Invitation = {
  id: string;
  event_id: string;
  invited_by: string;
  invited_user_id: string | null;
  invited_email: string;
  qr_code_token: string;
};

type Order = {
  id: string;
  event_id: string;
  buyer_user_id: string;
  buyer_email: string;
  amount_total: number;
};

interface User { id: string | null; role?: "admin" | null }

const INVITATIONS: Invitation[] = [
  {
    id: "inv-1",
    event_id: "evt-1",
    invited_by: "organizer-1",
    invited_user_id: "invitee-1",
    invited_email: "invitee@example.com",
    qr_code_token: "tukio-secret-token",
  },
];

const ORDERS: Order[] = [
  {
    id: "ord-1",
    event_id: "evt-1",
    buyer_user_id: "buyer-1",
    buyer_email: "buyer@example.com",
    amount_total: 4200,
  },
];

const makeClient = (user: User) => ({
  from: (table: string) => {
    if (table === "event_invitations") {
      return {
        select: (_cols = "*") => {
          const rows = INVITATIONS.filter((r) =>
            user.role === "admin" ||
            (user.id && (r.invited_by === user.id || r.invited_user_id === user.id))
          );
          return Promise.resolve({ data: rows, error: null });
        },
      };
    }
    if (table === "ticket_orders") {
      return {
        select: (_cols = "*") => {
          const rows = ORDERS.filter((r) =>
            user.role === "admin" || (user.id && r.buyer_user_id === user.id)
          );
          return Promise.resolve({ data: rows, error: null });
        },
      };
    }
    return {} as never;
  },
});

describe("event_invitations.invited_email — RLS enforcement", () => {
  it("anonymous user cannot read any invitation row (no email leak)", async () => {
    const res: any = await makeClient({ id: null }).from("event_invitations").select("invited_email");
    expect(res.error).toBeNull();
    expect(res.data).toEqual([]);
  });

  it("unrelated authenticated user cannot read invited_email", async () => {
    const res: any = await makeClient({ id: "stranger" }).from("event_invitations").select("invited_email,qr_code_token");
    expect(res.data).toEqual([]);
    expect(JSON.stringify(res.data)).not.toContain("invitee@example.com");
    expect(JSON.stringify(res.data)).not.toContain("tukio-secret-token");
  });

  it("inviting organizer can read invited_email", async () => {
    const res: any = await makeClient({ id: "organizer-1" }).from("event_invitations").select("invited_email");
    expect(res.data).toHaveLength(1);
    expect(res.data[0].invited_email).toBe("invitee@example.com");
  });

  it("intended invitee can read their own invitation", async () => {
    const res: any = await makeClient({ id: "invitee-1" }).from("event_invitations").select("invited_email");
    expect(res.data).toHaveLength(1);
  });
});

describe("ticket_orders.buyer_email — RLS enforcement", () => {
  it("anonymous user cannot read any order (no email leak)", async () => {
    const res: any = await makeClient({ id: null }).from("ticket_orders").select("buyer_email");
    expect(res.error).toBeNull();
    expect(res.data).toEqual([]);
  });

  it("unrelated authenticated user cannot read buyer_email", async () => {
    const res: any = await makeClient({ id: "stranger" }).from("ticket_orders").select("buyer_email,amount_total");
    expect(res.data).toEqual([]);
    expect(JSON.stringify(res.data)).not.toContain("buyer@example.com");
  });

  it("the buyer can read their own order", async () => {
    const res: any = await makeClient({ id: "buyer-1" }).from("ticket_orders").select("buyer_email");
    expect(res.data).toHaveLength(1);
    expect(res.data[0].buyer_email).toBe("buyer@example.com");
  });

  it("admin can read any order", async () => {
    const res: any = await makeClient({ id: "admin-1", role: "admin" }).from("ticket_orders").select("buyer_email");
    expect(res.data).toHaveLength(1);
  });
});
