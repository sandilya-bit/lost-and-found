import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, tokenStore, getApiErrorMessage } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((data: { user?: User; access_token: string; refresh_token: string }) => {
    tokenStore.set(data.access_token, data.refresh_token);
    if (data.user) setUser(data.user);
  }, []);

  // Restore session on first load.
  useEffect(() => {
    const restore = async () => {
      if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser({
          ...(res.data.data.user as User),
          email: res.data.data.user.email,
        });
      } catch {
        // Access token may be expired; try refreshing once.
        const refreshed = await refreshOnce();
        if (refreshed) {
          try {
            const res = await api.get("/auth/me");
            setUser(res.data.data.user as User);
          } catch {
            tokenStore.clear();
          }
        } else {
          tokenStore.clear();
        }
      } finally {
        setLoading(false);
      }
    };
    void restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global session-expiry event from the axios interceptor.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("lf:session-expired", onExpired);
    return () => window.removeEventListener("lf:session-expired", onExpired);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post("/auth/login", { email, password });
      persistSession(res.data.data);
    },
    [persistSession]
  );

  const register = useCallback(
    async (data: { name: string; email: string; phone?: string; password: string }) => {
      const res = await api.post("/auth/register", data);
      persistSession(res.data.data);
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", { refresh_token: tokenStore.getRefresh() });
    } catch {
      // Best-effort; clear locally regardless.
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function refreshOnce(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const res = await api.post("/auth/refresh", { refresh_token: refresh });
    tokenStore.set(res.data.data.access_token, res.data.data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { getApiErrorMessage };
