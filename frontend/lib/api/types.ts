// Matches the backend ApiResponse envelope exactly
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  code: string;
  data: T | null;
}

// Auth-specific data shapes
export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserPublic {
  email: string;
  is_verified: boolean;
}

export interface UserProfile {
  name?: string;
  roll?: string;
  department?: string;
  faculty?: string;
  email: string;
  is_verified?: boolean;
  role?: string;
  session_type?: string;
  created_at?: string | null;
}

// Request payloads
export interface RegisterPayload {
  name: string;
  roll: string;
  department: string;
  faculty: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpVerifyPayload {
  email: string;
  otp: string;
}

export interface OtpResendPayload {
  email: string;
}
