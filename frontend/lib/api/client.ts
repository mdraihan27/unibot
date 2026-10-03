/**
 * Base API client - single source of truth for the backend URL and
 * the fetch wrapper that always returns the ApiResponse envelope.
 */

import type { ApiResponse } from "./types";
import { TokenStorage } from "./tokenStorage";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
}

/**
 * Core fetch wrapper.
 * - Always sends/expects JSON.
 * - Attaches Bearer token from TokenStorage or options if provided.
 * - On network failure returns a synthetic ApiResponse so callers never
 *   need to try/catch.
 */
export async function apiRequest<T = null>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeToken =
    token ?? (typeof window !== "undefined" ? TokenStorage.getAccess() : null);
  if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    return json as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message:
        "Unable to reach the server. Please check your connection and try again.",
      code: "NETWORK_ERROR",
      data: null,
    };
  }
}
