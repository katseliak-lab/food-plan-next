"use client";
import { useEffect, useState } from "react";
import { MEALS } from "@/lib/foodData";
import { alternativesFor, dishKcalByName } from "@/lib/derive";
import { portionFactor } from "@/lib/plan";
import type { MealKey, Store } from "@/lib/types";
import DishPhoto from "@/components/DishPhoto";

export interface SwapTarget { day: string; meal: MealKey }

interface Props {
  target: SwapTarget | null;
  store: Store;
  view: Date;
  onSet: (day: string, meal: MealKey, name: string) => void;
  onClose: () => void;
}

export default function SwapSheet({ target, store, view, onSet, onClose }: Props) {
  const [custom, setCustom] = useState("");
  useEffect(() => { setCustom(""); }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;
  const pf = portionFactor(store, view);
  const mealLabel = MEALS.find((m) => m.key === target.meal)?.label ?? "";
  const current = (store.meals[target.day]?.[target.meal] || "").trim();
  const options = alternativesFor(store, target.meal, current);
  const [, mm, dd] = target.day.split("-");
  const set = (name: string) => { onSet(target.day, target.meal, name); onClose(); };

  return (
    <div className="bd" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="kick">{mealLabel} · {Number(dd)}.{mm}</div>
        <h4>{current ? "Замінити страву" : "Додати страву"}</h4>

        <div className="field" style={{ margin: "0 0 12px" }}>
          <label>Своя назва</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="input" value={custom} placeholder="напр. курка з рисом"
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && custom.trim()) set(custom.trim()); }} />
            <button className="btn btn-primary btn-sm" disabled={!custom.trim()} onClick={() => set(custom.trim())}>Обрати</button>
          </div>
        </div>

        {options.length > 0 && <div className="kick" style={{ margin: "4px 0" }}>З твого плану</div>}
        {options.map((name) => {
          const kcal = dishKcalByName(store, name, pf);
          return (
            <div className="swap-opt" key={name}>
              <DishPhoto name={name} size={120} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "800 14px/1.15 'Archivo',sans-serif" }}>{name}</div>
                {kcal ? <div className="mono muted">{kcal} ккал</div> : null}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => set(name)}>Обрати</button>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {current && <button className="btn btn-secondary btn-block" style={{ marginTop: 0 }} onClick={() => set("")}>Прибрати</button>}
          <button className="btn btn-secondary btn-block" style={{ marginTop: 0 }} onClick={onClose}>Скасувати</button>
        </div>
      </div>
    </div>
  );
}
