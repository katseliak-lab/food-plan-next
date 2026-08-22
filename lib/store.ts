import type { Store } from "./types";

export const STORE_KEY = "foodPlan.v1";

/** Guarantee the shape of a store loaded from anywhere (localStorage, cloud, import). */
export function normalize(input: unknown): Store {
  const s = (input && typeof input === "object" ? input : {}) as Partial<Store>;
  return {
    meals: s.meals ?? {},
    ingredients: s.ingredients ?? {},
    bought: s.bought ?? {},
    profile: s.profile ?? {},
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return normalize(null);
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  } catch {
    parsed = null;
  }
  return normalize(parsed);
}

export function persistStore(store: Store): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

/**
 * Merge a remote (cloud) store into the local one without losing data:
 * on a key clash the cloud wins, but local-only keys are kept — so an empty
 * device never wipes a filled cloud, and vice-versa.
 */
export function mergeStores(local: Store, remote: Store): Store {
  const bought: Store["bought"] = {};
  const months = new Set([...Object.keys(local.bought), ...Object.keys(remote.bought)]);
  months.forEach((m) => {
    bought[m] = { ...(local.bought[m] || {}), ...(remote.bought[m] || {}) };
  });
  return {
    meals: { ...local.meals, ...remote.meals },
    ingredients: { ...local.ingredients, ...remote.ingredients },
    bought,
    profile: { ...local.profile, ...remote.profile }, // cloud wins
  };
}

/** Does local hold keys the remote lacks (=> we should push local up)? */
export function localHasExtra(local: Store, remote: Store): boolean {
  const extra = (a: Record<string, unknown>, b: Record<string, unknown>) =>
    Object.keys(a).some((k) => !(k in b));
  return (
    extra(local.meals, remote.meals) ||
    extra(local.ingredients, remote.ingredients) ||
    extra(local.bought, remote.bought) ||
    Object.keys(local.bought).some((m) => extra(local.bought[m], remote.bought[m] || {}))
  );
}
