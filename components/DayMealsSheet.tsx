"use client";
import { useEffect } from "react";
import { MEALS } from "@/lib/foodData";
import { dishKcalByName, longDate } from "@/lib/derive";
import { portionFactor } from "@/lib/plan";
import type { MealKey, Store } from "@/lib/types";

interface Props {
  dayKey: string | null;
  store: Store;
  view: Date;
  onSwap: (day: string, meal: MealKey) => void;
  onClearDay: (day: string) => void;
  onClose: () => void;
}

export default function DayMealsSheet({ dayKey, store, view, onSwap, onClearDay, onClose }: Props) {
  useEffect(() => {
    if (!dayKey) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dayKey, onClose]);

  if (!dayKey) return null;
  const pf = portionFactor(store, view);
  const day = store.meals[dayKey] || {};

  return (
    <div className="bd" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="kick">День</div>
        <h4 style={{ textTransform: "capitalize" }}>{longDate(dayKey)}</h4>
        {MEALS.map((m) => {
          const name = (day[m.key] || "").trim();
          const kcal = name ? dishKcalByName(store, name, pf) : 0;
          return (
            <button
              key={m.key}
              className="buy-item"
              style={{ alignItems: "flex-start", flexDirection: "column", gap: 2 }}
              onClick={() => onSwap(dayKey, m.key)}
            >
              <span className="kick">{m.label}</span>
              <span style={{ display: "flex", width: "100%", alignItems: "baseline", gap: 8 }}>
                <span className="buy-name" style={{ color: name ? "var(--text)" : "var(--faint)" }}>{name || "+ додати"}</span>
                {kcal ? <span className="mono muted" style={{ marginLeft: "auto" }}>{kcal} ккал</span> : null}
              </span>
            </button>
          );
        })}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          <button className="btn btn-secondary btn-block" style={{ marginTop: 0 }} onClick={() => { onClearDay(dayKey); onClose(); }}>Очистити день</button>
          <button className="btn btn-primary btn-block" style={{ marginTop: 0 }} onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  );
}
