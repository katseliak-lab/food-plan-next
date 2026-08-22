// Client for recipe-ai-api (Nest backend). The JWT lives in localStorage; the
// Claude key never touches the browser — generation happens on the server.
import type { Store } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "recipeApi.token";

export interface ApiUser {
  id: string;
  email: string;
}
export interface AuthResult {
  accessToken: string;
  user: ApiUser;
}
export interface Preferences {
  diet: string;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  caloriesTarget: number | null;
  servings: number;
}
export interface GeneratedMenu {
  month: string;
  days: Record<string, Record<string, string>>;
  ingredients: Record<string, string[]>;
}
export interface MenuRecord {
  id: string;
  month: string;
  data: GeneratedMenu;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

async function req<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message;
    throw new ApiError(
      Array.isArray(msg) ? msg.join(", ") : msg || res.statusText,
      res.status,
    );
  }
  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    req<AuthResult>("/auth/register", { method: "POST", body: { email, password } }),
  login: (email: string, password: string) =>
    req<AuthResult>("/auth/login", { method: "POST", body: { email, password } }),
  me: () => req<{ userId: string; email: string }>("/auth/me", { auth: true }),
  getPreferences: () => req<Preferences>("/preferences", { auth: true }),
  updatePreferences: (patch: Partial<Preferences>) =>
    req<Preferences>("/preferences", { method: "PUT", body: patch, auth: true }),
  generateMenu: (month: string, days?: number) =>
    req<MenuRecord>("/menu/generate", { method: "POST", body: { month, days }, auth: true }),
};

// The generated menu's `data` is import-compatible with the app's store shape.
export type { Store };
