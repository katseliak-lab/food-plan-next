"use client";
import { useCallback, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken, type ApiUser } from "@/lib/api";

export interface ApiAuth {
  ready: boolean;
  user: ApiUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/** Auth state for the recipe-ai-api backend (separate from Firebase sync). */
export function useApiAuth(): ApiAuth {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [ready, setReady] = useState(false);

  // Validate any stored token on mount.
  useEffect(() => {
    const t = getToken();
    if (!t) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((me) => setUser({ id: me.userId, email: me.email }))
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api.register(email, password);
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return { ready, user, login, register, logout };
}
