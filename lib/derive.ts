// View-model helpers shared by the redesigned screens.
import {
  MEALS, MONTHS_GEN, WD, calcTarget, dateKey, dishKcal, mondayIndex, normDish, todayKey,
} from "./foodData";
import { portionFactor } from "./plan";
import type { MealKey, Store } from "./types";

/** Ingredient list for a dish name (normalized), or []. */
function itemsFor(store: Store, name: string): string[] {
  return store.ingredients[normDish(name)] || store.ingredients[name] || [];
}

/** Calories of a dish by name, scaled by the plan's portion factor. 0 if unknown. */
export function dishKcalByName(store: Store, name: string, pf: number): number {
  return Math.round(dishKcal(itemsFor(store, name)) * pf);
}

export function dayKcal(store: Store, key: string, pf: number): number {
  const day = store.meals[key];
  if (!day) return 0;
  return MEALS.reduce((s, m) => s + dishKcalByName(store, (day[m.key] || "").trim(), pf), 0);
}

/** Daily calorie target from the profile, or a sensible default. */
export function kcalTarget(store: Store): number {
  return calcTarget(store.profile) ?? 2200;
}

export interface WeekDay {
  key: string;      // YYYY-MM-DD
  wd: string;       // Пн…
  dateLabel: string; // "17 сер"
  isToday: boolean;
}

const SHORT_MONTH = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];

/** The Mon–Sun week containing `ref`. */
export function weekOf(ref: Date): WeekDay[] {
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - mondayIndex(ref.getDay()));
  monday.setHours(0, 0, 0, 0);
  const tk = todayKey();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    return { key, wd: WD[i], dateLabel: `${d.getDate()} ${SHORT_MONTH[d.getMonth()]}`, isToday: key === tk };
  });
}

const DAY_NAMES = ["понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота", "неділя"];

/** Human label for a date key: "субота, 22 серпня". */
export function longDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAY_NAMES[mondayIndex(dt.getDay())]}, ${d} ${MONTHS_GEN[m - 1]}`;
}

/** Distinct dish names already used anywhere in the plan for a given meal slot. */
export function alternativesFor(store: Store, mealKey: MealKey, exclude: string): string[] {
  const seen = new Map<string, string>();
  for (const day of Object.values(store.meals)) {
    const name = (day[mealKey] || "").trim();
    if (name && normDish(name) !== normDish(exclude)) seen.set(normDish(name), name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "uk"));
}

export const pf = portionFactor;
