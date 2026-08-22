"use client";
import { MEALS, todayKey } from "@/lib/foodData";
import { dayKcal, dishKcalByName, kcalTarget, longDate } from "@/lib/derive";
import { portionFactor } from "@/lib/plan";
import type { MealKey, Store } from "@/lib/types";
import DishPhoto from "@/components/DishPhoto";

interface Props {
  store: Store;
  view: Date;
  onSwap: (dayKey: string, meal: MealKey) => void;
  onSettings: () => void;
}

export default function TodayScreen({ store, view, onSwap, onSettings }: Props) {
  const key = todayKey();
  const pf = portionFactor(store, view);
  const target = kcalTarget(store);
  const total = dayKcal(store, key, pf);
  const pct = Math.min(100, Math.round((total / target) * 100));
  const day = store.meals[key] || {};
  const servings = Math.max(1, Number(store.profile.servings) || 2);

  return (
    <div className="screen">
      <div className="scr-head">
        <div className="row">
          <div>
            <div className="kick">Сьогодні</div>
            <h1 style={{ marginTop: 2, textTransform: "capitalize" }}>{longDate(key)}</h1>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onSettings}>Профіль</button>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
          <span style={{ font: "800 30px 'Archivo',sans-serif", lineHeight: 1 }}>{total}</span>
          <span className="mono muted">/ {target} ккал · {servings} порції</span>
        </div>
        <div className="bar"><i style={{ width: pct + "%" }} /></div>
      </div>

      <div>
        {MEALS.map((m) => {
          const name = (day[m.key] || "").trim();
          const kcal = name ? dishKcalByName(store, name, pf) : 0;
          const items = name ? (store.ingredients[name.toLowerCase()] || store.ingredients[name] || []) : [];
          return (
            <div className="meal-card" key={m.key}>
              <DishPhoto name={name} size={220} style={{ height: 80 }} />
              <div className="mc-body">
                <div className="kick">{m.label}</div>
                {name ? <div className="mc-name">{name}</div> : <div className="mc-empty">— не заплановано</div>}
                <div className="mono muted">
                  {name ? `${kcal ? kcal + " ккал" : "—"}${items.length ? " · " + items.slice(0, 3).join(", ") : ""}` : "додати страву"}
                </div>
                <div className="mc-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => onSwap(key, m.key)}>
                    {name ? "Замінити" : "Додати"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
