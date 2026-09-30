import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

/** Central API client: base URL, auth header injection, token refresh queue. */

export interface ApiError {
  code: string;
  message: string;
}

const STORAGE = {
  access: "lf_access_token",
  refresh: "lf_refresh_token",
};

const apiRoot = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const apiBaseUrl = apiRoot ? `${apiRoot}/api` : "/api";

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(STORAGE.access);
  },
  getRefresh(): string | null {
    return localStorage.getItem(STORAGE.refresh);
  },
  set(access: string, refresh: string): void {
    localStorage.setItem(STORAGE.access, access);
    localStorage.setItem(STORAGE.refresh, refresh);
  },
  clear(): void {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ---------------- Refresh queue: single-flight on 401 ----------------- */

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const res = await axios.post<{ success: boolean; data: { access_token: string; refresh_token: string } }>(
      `${apiBaseUrl}/auth/refresh`,
      { refresh_token: refresh },
      { timeout: 10_000 }
    );
    const { access_token, refresh_token } = res.data.data;
    tokenStore.set(access_token, refresh_token);
    return access_token;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: ApiError }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      // Session fully expired — broadcast so the app can redirect to login.
      window.dispatchEvent(new CustomEvent("lf:session-expired"));
    }

    return Promise.reject(error);
  }
);

/** Extracts a friendly message from an API error response. */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error?.message;
    if (msg) return msg;
    if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
    if (!err.response) return "Cannot reach the server. Check your connection.";
  }
  return fallback;
}
