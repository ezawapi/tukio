import { describe, expect, it } from "vitest";
import { isConfirmedSignup, signupVerificationInput } from "@/lib/signup-confirmation";

describe("Signup email ownership", () => {
  it("submits the email-bound code as signup verification, not sign-in or recovery", () => {
    expect(signupVerificationInput(" Owner@Example.com ", " 123456 ")).toEqual({ email: "owner@example.com", token: "123456", type: "signup" });
  });
  it("does not accept a missing, malformed or truncated confirmation code", () => {
    for (const code of ["", "12345", "123456789", "12ab56", "123 456"]) {
      expect(() => signupVerificationInput("owner@example.com", code)).toThrow();
    }
    expect(signupVerificationInput("owner@example.com", "12345678").token).toBe("12345678");
  });
  it("does not treat account creation or an unconfirmed session as verification", () => {
    expect(isConfirmedSignup({ session: null, user: { email_confirmed_at: null } })).toBe(false);
    expect(isConfirmedSignup({ session: {}, user: { email_confirmed_at: null } })).toBe(false);
    expect(isConfirmedSignup({ session: {}, user: { email_confirmed_at: "2026-10-23T11:38:00Z" } })).toBe(true);
  });
});