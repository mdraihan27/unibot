/**
 * Auth API functions - all authentication endpoint calls live here.
 * Import these functions in components; never call fetch() directly.
 */

import { apiRequest } from "./client";
import { TokenStorage } from "./tokenStorage";
import type {
  ApiResponse,
  LoginPayload,
  OtpResendPayload,
  OtpVerifyPayload,
  RegisterPayload,
  TokenData,
  UserPublic,
  UserProfile,
} from "./types";

/** GET /auth/me */
export async function getMe(): Promise<ApiResponse<UserProfile>> {
  const token = typeof window !== "undefined" ? TokenStorage.getAccess() ?? undefined : undefined;
  return apiRequest<UserProfile>("/auth/me", {
    method: "GET",
    token,
  });
}

/** POST /auth/google — Sign in with a Google ID token */
export async function googleSignIn(
  idToken: string
): Promise<ApiResponse<TokenData>> {
  return apiRequest<TokenData>("/auth/google", {
    method: "POST",
    body: { id_token: idToken },
  });
}

// ── Email/Password auth — COMMENTED OUT ───────────────────────────────────────

/** POST /auth/register */
// export async function registerUser(
//   payload: RegisterPayload
// ): Promise<ApiResponse<UserPublic>> {
//   return apiRequest<UserPublic>("/auth/register", {
//     method: "POST",
//     body: payload,
//   });
// }

/** POST /auth/login */
// export async function loginUser(
//   payload: LoginPayload
// ): Promise<ApiResponse<TokenData>> {
//   return apiRequest<TokenData>("/auth/login", {
//     method: "POST",
//     body: payload,
//   });
// }

/** POST /auth/otp/verify */
// export async function verifyOtp(
//   payload: OtpVerifyPayload
// ): Promise<ApiResponse<null>> {
//   return apiRequest<null>("/auth/otp/verify", {
//     method: "POST",
//     body: payload,
//   });
// }

/** POST /auth/otp/resend */
// export async function resendOtp(
//   payload: OtpResendPayload
// ): Promise<ApiResponse<null>> {
//   return apiRequest<null>("/auth/otp/resend", {
//     method: "POST",
//     body: payload,
//   });
// }

// Keep these exports to avoid breaking existing type-only references
export type { RegisterPayload, LoginPayload, OtpVerifyPayload, OtpResendPayload, UserPublic };
