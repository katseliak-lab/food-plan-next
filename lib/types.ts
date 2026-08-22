// Domain types for the food plan.

export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

export type DayMeals = Partial<Record<MealKey, string>>;

export type Sex = "female" | "male";
export type Activity = "sed" | "light" | "mod" | "high" | "vhigh";
export type Goal = "lose" | "keep" | "gain";

export interface Profile {
  sex?: Sex;
  age?: string;
  height?: string;
  weight?: string;
  servings?: string;
  activity?: Activity;
  goal?: Goal;
}

export interface Store {
  /** "YYYY-MM-DD" -> meals for that day */
  meals: Record<string, DayMeals>;
  /** dish name -> list of ingredient names */
  ingredients: Record<string, string[]>;
  /** "YYYY-MM" -> { shopping-item key: grams/pieces already bought } */
  bought: Record<string, Record<string, number>>;
  profile: Profile;
}

/** A shopping-list line before purchase tracking. */
export interface BuyItem {
  key: string;
  name: string;
  u: Unit;
  qty: number;
}

export interface BuySection {
  title: string;
  items: BuyItem[];
}

/** A unique dish within a month, with how many days it appears and its ingredients. */
export interface Dish {
  name: string;
  count: number;
  items: string[];
}

export type Unit = "г" | "мл" | "шт";
export type StorageCat = "pantry" | "freeze" | "fresh";

export interface FoodInfo {
  g: number;
  u: Unit;
  kcal: number;
  cat: StorageCat;
}
