import type {
  Activity,
  FoodInfo,
  Goal,
  MealKey,
  Sex,
  Unit,
} from "./types";

// ---------- Meals / calendar labels ----------
export const MEALS: { key: MealKey; label: string; ic: string }[] = [
  { key: "breakfast", label: "Сніданок", ic: "sunrise" },
  { key: "lunch", label: "Обід", ic: "sun" },
  { key: "dinner", label: "Вечеря", ic: "moon" },
  { key: "snack", label: "Перекус", ic: "apple" },
];

export const MONTHS = [
  "січень", "лютий", "березень", "квітень", "травень", "червень",
  "липень", "серпень", "вересень", "жовтень", "листопад", "грудень",
];
export const MONTHS_GEN = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];
export const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// ---------- Food database (per-portion grams, kcal, storage category) ----------
// g — amount per single portion (grams, or pieces when u='шт'); kcal — portion calories;
// cat: 'pantry' = buy monthly (keeps long), 'freeze' = buy monthly + freeze, 'fresh' = buy fresh.
export const FOOD_DB: Record<string, FoodInfo> = {
  // крупи / паста / випічка
  "вівсяні пластівці": { g: 50, u: "г", kcal: 190, cat: "pantry" }, "гранола": { g: 50, u: "г", kcal: 220, cat: "pantry" },
  "борошно": { g: 40, u: "г", kcal: 145, cat: "pantry" }, "гречка": { g: 60, u: "г", kcal: 200, cat: "pantry" },
  "рис": { g: 60, u: "г", kcal: 210, cat: "pantry" }, "рис арборіо": { g: 70, u: "г", kcal: 250, cat: "pantry" },
  "булгур": { g: 60, u: "г", kcal: 200, cat: "pantry" }, "кіноа": { g: 60, u: "г", kcal: 220, cat: "pantry" },
  "спагеті": { g: 80, u: "г", kcal: 280, cat: "pantry" }, "локшина": { g: 60, u: "г", kcal: 210, cat: "pantry" },
  "локшина рамен": { g: 70, u: "г", kcal: 250, cat: "pantry" }, "фунчоза": { g: 50, u: "г", kcal: 170, cat: "pantry" },
  "птітім": { g: 70, u: "г", kcal: 250, cat: "pantry" }, "панірувальні сухарі": { g: 15, u: "г", kcal: 55, cat: "pantry" },
  "цукор": { g: 10, u: "г", kcal: 40, cat: "pantry" }, "мед": { g: 15, u: "г", kcal: 45, cat: "pantry" },
  "хліб цільнозерновий": { g: 60, u: "г", kcal: 150, cat: "freeze" },
  // білок (мʼясо/риба — 'freeze': купити на місяць і заморозити)
  "куряче філе": { g: 150, u: "г", kcal: 165, cat: "freeze" }, "курячі стегна": { g: 150, u: "г", kcal: 210, cat: "freeze" },
  "курка": { g: 200, u: "г", kcal: 280, cat: "freeze" }, "філе індички": { g: 150, u: "г", kcal: 160, cat: "freeze" },
  "фарш": { g: 150, u: "г", kcal: 250, cat: "freeze" }, "яловичий стейк": { g: 180, u: "г", kcal: 300, cat: "freeze" },
  "риба": { g: 150, u: "г", kcal: 180, cat: "freeze" }, "лосось": { g: 150, u: "г", kcal: 280, cat: "freeze" },
  "тунець консервований": { g: 80, u: "г", kcal: 90, cat: "pantry" }, "яйця": { g: 2, u: "шт", kcal: 140, cat: "pantry" },
  // молочні
  "молоко": { g: 150, u: "мл", kcal: 65, cat: "fresh" }, "йогурт": { g: 150, u: "г", kcal: 90, cat: "fresh" },
  "сметана": { g: 30, u: "г", kcal: 60, cat: "fresh" }, "вершки": { g: 30, u: "мл", kcal: 60, cat: "fresh" },
  "сир кисломолочний": { g: 100, u: "г", kcal: 100, cat: "fresh" }, "твердий сир": { g: 30, u: "г", kcal: 110, cat: "fresh" },
  "сир фета": { g: 40, u: "г", kcal: 100, cat: "fresh" }, "масло": { g: 10, u: "г", kcal: 75, cat: "fresh" },
  // овочі, що добре лежать
  "картопля": { g: 150, u: "г", kcal: 110, cat: "pantry" }, "цибуля": { g: 40, u: "г", kcal: 15, cat: "pantry" },
  "морква": { g: 50, u: "г", kcal: 20, cat: "pantry" }, "часник": { g: 5, u: "г", kcal: 7, cat: "pantry" },
  "капуста": { g: 150, u: "г", kcal: 35, cat: "pantry" }, "гарбуз": { g: 150, u: "г", kcal: 40, cat: "pantry" },
  // свіжі овочі
  "помідори": { g: 100, u: "г", kcal: 20, cat: "fresh" }, "огірок": { g: 80, u: "г", kcal: 12, cat: "fresh" },
  "огірки": { g: 80, u: "г", kcal: 12, cat: "fresh" }, "перець": { g: 60, u: "г", kcal: 20, cat: "fresh" },
  "кабачок": { g: 100, u: "г", kcal: 20, cat: "fresh" }, "цукіні": { g: 100, u: "г", kcal: 20, cat: "fresh" },
  "броколі": { g: 100, u: "г", kcal: 35, cat: "fresh" }, "спаржа": { g: 80, u: "г", kcal: 16, cat: "fresh" },
  "гриби": { g: 100, u: "г", kcal: 22, cat: "fresh" }, "салат": { g: 40, u: "г", kcal: 6, cat: "fresh" },
  "зелень": { g: 10, u: "г", kcal: 3, cat: "fresh" }, "зелена цибуля": { g: 15, u: "г", kcal: 5, cat: "fresh" },
  "овочі": { g: 150, u: "г", kcal: 35, cat: "fresh" },
  // консерви / банки
  "маслини": { g: 20, u: "г", kcal: 30, cat: "pantry" }, "кукурудза": { g: 50, u: "г", kcal: 45, cat: "pantry" },
  "квасоля": { g: 80, u: "г", kcal: 90, cat: "pantry" }, "горошок": { g: 50, u: "г", kcal: 40, cat: "pantry" },
  "хумус": { g: 40, u: "г", kcal: 70, cat: "pantry" }, "томатна паста": { g: 30, u: "г", kcal: 25, cat: "pantry" },
  // фрукти
  "банан": { g: 1, u: "шт", kcal: 100, cat: "fresh" }, "яблуко": { g: 1, u: "шт", kcal: 80, cat: "fresh" },
  "груша": { g: 1, u: "шт", kcal: 85, cat: "fresh" }, "ягоди": { g: 80, u: "г", kcal: 45, cat: "fresh" },
  "лимон": { g: 20, u: "г", kcal: 6, cat: "pantry" }, "авокадо": { g: 80, u: "г", kcal: 130, cat: "fresh" },
  // горіхи / олії / спеції
  "волоські горіхи": { g: 20, u: "г", kcal: 130, cat: "pantry" }, "мигдаль": { g: 20, u: "г", kcal: 115, cat: "pantry" },
  "горіхи": { g: 20, u: "г", kcal: 125, cat: "pantry" }, "арахісова паста": { g: 20, u: "г", kcal: 120, cat: "pantry" },
  "олія": { g: 10, u: "мл", kcal: 90, cat: "pantry" }, "олія оливкова": { g: 10, u: "мл", kcal: 90, cat: "pantry" },
  "сіль": { g: 2, u: "г", kcal: 0, cat: "pantry" }, "розмарин": { g: 1, u: "г", kcal: 0, cat: "pantry" },
  "спеції": { g: 2, u: "г", kcal: 0, cat: "pantry" }, "соєвий соус": { g: 10, u: "мл", kcal: 8, cat: "pantry" },
  "бульйон": { g: 200, u: "мл", kcal: 15, cat: "pantry" },
};

// ---------- Calorie norm coefficients ----------
export const MEAL_SPLIT: Record<MealKey, number> = {
  breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1,
};
export const ACTIVITY: Record<Activity, number> = {
  sed: 1.2, light: 1.375, mod: 1.55, high: 1.725, vhigh: 1.9,
};
export const GOAL_ADJ: Record<Goal, number> = { lose: 0.85, keep: 1, gain: 1.15 };

// ---------- Pure helpers ----------
export const normDish = (s: string): string => s.toString().trim().toLowerCase();

export const dbEntry = (name: string): FoodInfo =>
  FOOD_DB[normDish(name)] || { g: 60, u: "г", kcal: 50, cat: "fresh" };

export const dishKcal = (items: string[] | undefined): number =>
  (items || []).reduce((sum, n) => sum + dbEntry(n).kcal, 0);

export function calcTarget(p: {
  age?: string; height?: string; weight?: string; sex?: Sex; activity?: Activity; goal?: Goal;
}): number | null {
  const age = Number(p.age), h = Number(p.height), w = Number(p.weight);
  if (!age || !h || !w) return null;
  const bmr = 10 * w + 6.25 * h - 5 * age + (p.sex === "male" ? 5 : -161);
  const tdee = bmr * (ACTIVITY[p.activity ?? "mod"] || 1.55) * (GOAL_ADJ[p.goal ?? "keep"] || 1);
  return Math.round(tdee / 10) * 10;
}

// ---------- Date utils ----------
export const pad = (n: number): string => String(n).padStart(2, "0");
export const dateKey = (y: number, m: number, d: number): string => `${y}-${pad(m + 1)}-${pad(d)}`; // m: 0-based
export function todayKey(): string {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}
export const mondayIndex = (jsDay: number): number => (jsDay + 6) % 7; // Sun=0 -> 6

// ---------- Quantity formatting ----------
export function fmtQty(total: number, u: Unit): string {
  if (u === "шт") return `${Math.max(1, Math.ceil(total))} шт`;
  if (u === "мл") return total >= 1000 ? `${(total / 1000).toFixed(1)} л` : `${Math.round(total)} мл`;
  return total >= 1000 ? `${(total / 1000).toFixed(total % 1000 ? 1 : 0)} кг` : `${Math.round(total)} г`;
}
