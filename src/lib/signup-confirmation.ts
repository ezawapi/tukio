import { z } from "zod";

// Hosted auth owns OTP length and expiration; accept its supported digit range.
export const signupCodeSchema = z.string().trim().regex(/^\d{6,8}$/, "Saisissez le code de 6 à 8 chiffres reçu par email.");

export function signupVerificationInput(email: string, code: string) {
  return { email: z.string().trim().email().parse(email).toLowerCase(), token: signupCodeSchema.parse(code), type: "signup" as const };
}

export function isConfirmedSignup(data: { session: unknown; user: { email_confirmed_at?: string | null } | null }): boolean {
  return Boolean(data.session && data.user?.email_confirmed_at);
}