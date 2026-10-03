/**
 * Token helpers - localStorage-based JWT storage.
 * All token read/write happens here, not scattered across components.
 */

const ACCESS_KEY = "unibot_access_token";
const REFRESH_KEY = "unibot_refresh_token";

export const TokenStorage = {
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  hasToken(): boolean {
    return !!localStorage.getItem(ACCESS_KEY);
  },
};
