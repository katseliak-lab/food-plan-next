// Pure derivations over a Store for a given month/view. No React, no DOM.
import {
  FOOD_DB, MEALS, MEAL_SPLIT, MONTHS,
  calcTarget, dbEntry, dishKcal, normDish, pad,
} from "./foodData";
import type { BuySection, Dish, Store, StorageCat } from "./types";

export const monthPrefixOf = (view: Date): string =>
  `${view.getFullYear()}-${pad(view.getMonth() + 1)}`;

export const daysInMonth = (view: Date): number =>
  new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

/** dish name (normalized) -> ingredient list */
function ingredientIndex(store: Store): Record<string, string[]> {
  const idx: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(store.ingredients || {})) {
    if (Array.isArray(v) && v.length) idx[normDish(k)] = v;
  }
  return idx;
}

/** Unique dishes used in the given month. */
export function monthDishes(store: Store, view: Date): Dish[] {
  const pref = monthPrefixOf(view);
  const idx = ingredientIndex(store);
  const map = new Map<string, Dish>();
  Object.keys(store.meals)
    .filter((k) => k.startsWith(pref))
    .forEach((k) => {
      const day = store.meals[k];
      MEALS.forEach((mm) => {
        const name = (day[mm.key] || "").trim();
        if (!name) return;
        const nk = normDish(name);
        const found = map.get(nk);
        if (found) found.count++;
        else map.set(nk, { name, count: 1, items: idx[nk] || [] });
      });
    });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

/** Average menu calories per filled day this month. */
export function menuBaseDaily(store: Store, view: Date): number {
  const pref = monthPrefixOf(view);
  const idx = ingredientIndex(store);
  let sum = 0, n = 0;
  Object.keys(store.meals)
    .filter((k) => k.startsWith(pref))
    .forEach((k) => {
      const day = store.meals[k];
      let dk = 0, has = false;
      MEALS.forEach((mm) => {
        const nm = (day[mm.key] || "").trim();
        if (nm) { dk += dishKcal(idx[normDish(nm)] || []); has = true; }
      });
      if (has) { sum += dk; n++; }
    });
  return n ? sum / n : 0;
}

export const servingsOf = (store: Store): number =>
  Math.max(1, Number(store.profile.servings) || 2);

/** Portion scaling factor: target norm / menu base, clamped to 0.5..2. */
export function portionFactor(store: Store, view: Date): number {
  const t = calcTarget(store.profile);
  const base = menuBaseDaily(store, view);
  if (!t || !base) return 1;
  return Math.min(2, Math.max(0.5, t / base));
}

/** Meal-by-meal calorie targets, e.g. "Сніданок ~450 · Обід ~630 …". */
export function mealTargets(target: number): string {
  return MEALS.map((mm) => `${mm.label} ~${Math.round(target * MEAL_SPLIT[mm.key])}`).join(" · ");
}

/** Monthly aggregate quantities for one storage category. */
export function monthlyByCat(store: Store, view: Date, cat: StorageCat): BuySection["items"] {
  const pf = portionFactor(store, view);
  const sv = servingsOf(store);
  const agg = new Map<string, BuySection["items"][number]>();
  monthDishes(store, view).forEach((d) =>
    d.items.forEach((n) => {
      const e = dbEntry(n);
      if (e.cat !== cat) return;
      const nk = normDish(n);
      const cur = agg.get(nk) || { key: cat[0] + ":" + nk, name: n.trim(), u: e.u, qty: 0 };
      cur.qty += e.g * pf * sv * d.count;
      agg.set(nk, cur);
    }),
  );
  return [...agg.values()].sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

/** Fresh produce split into weeks (days 1–7 = week 1, etc.). */
export function freshWeeks(store: Store, view: Date): BuySection[] {
  const pref = monthPrefixOf(view);
  const idx = ingredientIndex(store);
  const pf = portionFactor(store, view);
  const sv = servingsOf(store);
  const weeks = new Map<number, Map<string, BuySection["items"][number]>>();
  Object.keys(store.meals)
    .filter((k) => k.startsWith(pref))
    .forEach((k) => {
      const dayNum = Number(k.slice(-2));
      const wk = Math.floor((dayNum - 1) / 7);
      const day = store.meals[k];
      MEALS.forEach((mm) => {
        const nm = (day[mm.key] || "").trim();
        if (!nm) return;
        (idx[normDish(nm)] || []).forEach((n) => {
          const e = dbEntry(n);
          if (e.cat !== "fresh") return;
          if (!weeks.has(wk)) weeks.set(wk, new Map());
          const m = weeks.get(wk)!;
          const nk = normDish(n);
          const cur = m.get(nk) || { key: "w" + wk + ":" + nk, name: n.trim(), u: e.u, qty: 0 };
          cur.qty += e.g * pf * sv;
          m.set(nk, cur);
        });
      });
    });
  const dim = daysInMonth(view);
  return [...weeks.keys()]
    .sort((a, b) => a - b)
    .map((wk) => {
      const start = wk * 7 + 1, end = Math.min(dim, wk * 7 + 7);
      return {
        title: `🥬 Свіже — тиждень ${wk + 1} (${start}–${end})`,
        items: [...weeks.get(wk)!.values()].sort((a, b) => a.name.localeCompare(b.name, "uk")),
      };
    });
}

/** Full categorized shopping list for the month. */
export function buyList(store: Store, view: Date): BuySection[] {
  return [
    { title: "🗄️ Комора — купити на місяць", items: monthlyByCat(store, view, "pantry") },
    { title: "❄️ У морозилку — на місяць (мʼясо, риба, хліб)", items: monthlyByCat(store, view, "freeze") },
    ...freshWeeks(store, view),
  ].filter((s) => s.items.length);
}

// ---------- Claude import/export ----------
export function buildPrompt(view: Date): string {
  const y = view.getFullYear(), m = view.getMonth();
  const dim = daysInMonth(view);
  const pref = monthPrefixOf(view);
  return `Склади збалансоване меню на ${MONTHS[m]} ${y} (${dim} днів).
Поверни ЛИШЕ валідний JSON без пояснень, у форматі:
{
  "month": "${pref}",
  "days": {
    "1": { "breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..." },
    "2": { "breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..." }
  },
  "ingredients": {
    "<точна назва страви>": ["продукт1", "продукт2", "продукт3"]
  }
}
Заповни всі дні від 1 до ${dim}. Страви — українською, коротко (2–5 слів).
У "ingredients" додай продукти для КОЖНОЇ унікальної страви з днів. Ключ — точна назва страви (як у днях). Продукти — коротко, без кількостей.`;
}

/** Pull a JSON object out of arbitrary text (handles ```json fences and surrounding prose). */
export function extractJson(s: string): string {
  s = s.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  return a !== -1 && b !== -1 ? s.slice(a, b + 1) : s;
}

export interface ImportResult { store: Store; added: number; ingCount: number; monthPrefix: string; }

/** Apply a parsed Claude menu onto a store, returning a new store + stats. */
export function applyImport(base: Store, parsedRaw: unknown, merge: boolean): ImportResult | null {
  const parsed = parsedRaw as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object") return null;
  const store: Store = {
    meals: { ...base.meals },
    ingredients: { ...base.ingredients },
    bought: base.bought,
    profile: base.profile,
  };
  const monthPrefix =
    typeof parsed.month === "string" && /^\d{4}-\d{2}$/.test(parsed.month)
      ? parsed.month
      : monthPrefixOf(new Date());
  const days = (parsed.days || parsed) as Record<string, unknown>;

  let added = 0;
  for (const [k, v] of Object.entries(days)) {
    if (!v || typeof v !== "object") continue;
    let key: string;
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) key = k;
    else if (/^\d{1,2}$/.test(k)) key = `${monthPrefix}-${pad(Number(k))}`;
    else continue;

    const src = v as Record<string, unknown>;
    const obj: Record<string, string> = {};
    MEALS.forEach((mm) => {
      const val = (src[mm.key] ?? "").toString().trim();
      if (val) obj[mm.key] = val;
    });
    if (!Object.keys(obj).length) continue;

    if (merge && store.meals[key]) store.meals[key] = { ...store.meals[key], ...obj };
    else store.meals[key] = obj;
    added++;
  }

  let ingCount = 0;
  const ingredients = parsed.ingredients;
  if (ingredients && typeof ingredients === "object") {
    for (const [dish, list] of Object.entries(ingredients as Record<string, unknown>)) {
      const name = (dish || "").toString().trim();
      const items = (Array.isArray(list) ? list : []).map((x) => x.toString().trim()).filter(Boolean);
      if (name && items.length) { store.ingredients[name] = items; ingCount++; }
    }
  }

  if (!added && !ingCount) return null;
  return { store, added, ingCount, monthPrefix };
}

/** Build the export payload for the current month or the whole store. */
export function buildExport(store: Store, view: Date, scope: "month" | "all"): unknown {
  if (scope === "month") {
    const pref = monthPrefixOf(view);
    const days: Record<string, unknown> = {};
    Object.keys(store.meals)
      .filter((k) => k.startsWith(pref))
      .sort()
      .forEach((k) => { days[String(Number(k.slice(-2)))] = store.meals[k]; });
    const ingredients: Record<string, string[]> = {};
    monthDishes(store, view).forEach((d) => { if (d.items.length) ingredients[d.name] = d.items; });
    return { month: pref, days, ingredients };
  }
  return { meals: store.meals, ingredients: store.ingredients };
}

// Re-export for convenience
export { FOOD_DB, dbEntry, dishKcal };
