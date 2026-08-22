// Per-dish photos from TheMealDB (free, no key): a large open recipe database
// with real, well-shot meal images on a fast CDN. We map each Ukrainian dish to
// a TheMealDB category, fetch that category's meals once (cached), then pick one
// deterministically by dish name so the same dish always shows the same photo.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// TheMealDB categories: Beef, Breakfast, Chicken, Dessert, Lamb, Miscellaneous,
// Pasta, Pork, Seafood, Side, Starter, Vegan, Vegetarian.
const RULES: [RegExp, string][] = [
  [/лосос|форел|риб|тунец|креветк|палтус|скумбр|морськ|устр|краб|кальмар/i, "Seafood"],
  [/куряч|курк|індич|курча/i, "Chicken"],
  [/свинин|шинк|бекон|ковбас/i, "Pork"],
  [/котлет|фарш|стейк|яловичин|мʼяс|м'яс|бургер|голубц|тефтел/i, "Beef"],
  [/паст|спагет|локшин|равіол|лазан|макарон/i, "Pasta"],
  [/суп|борщ|бульйон|крем-?суп|розсольник/i, "Starter"],
  [/салат/i, "Vegetarian"],
  [/каш|гречк|рис|булгур|кіноа|перлов|пюре|гарнір|картопл/i, "Side"],
  [/яйц|омлет|яєчн|сирник|млинц|панкейк|тост|вівсян|гранол|бутерброд/i, "Breakfast"],
  [/десерт|торт|печив|солодк|чізкейк|мус|запіканк/i, "Dessert"],
  [/йогурт|фрукт|банан|яблук|груш|апельсин|ягод|горіх|мигдал|смузі|перекус|снек/i, "Dessert"],
  [/овоч|рагу|броколі|кабач|цукін|тушков|веган/i, "Vegetarian"],
];

export function dishCategory(name: string): string {
  for (const [re, cat] of RULES) if (re.test(name)) return cat;
  return "Miscellaneous";
}

interface Meal { strMealThumb: string }
const cache = new Map<string, Promise<string[]>>();

function thumbs(category: string): Promise<string[]> {
  if (!cache.has(category)) {
    cache.set(
      category,
      fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`)
        .then((r) => r.json())
        .then((d: { meals: Meal[] | null }) => (d.meals || []).map((m) => m.strMealThumb))
        .catch(() => []),
    );
  }
  return cache.get(category)!;
}

/** Resolve a real photo URL for a dish (async — fetches + caches the category). */
export async function resolveDishImage(name: string, size = 240): Promise<string> {
  const list = await thumbs(dishCategory(name));
  if (!list.length) return "";
  const url = list[hash(name.toLowerCase()) % list.length];
  return url + (size <= 300 ? "/small" : "/medium"); // TheMealDB CDN size suffix
}
