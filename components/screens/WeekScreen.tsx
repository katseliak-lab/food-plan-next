"use client";
import { MEALS } from "@/lib/foodData";
import { dayKcal, weekOf } from "@/lib/derive";
import { portionFactor } from "@/lib/plan";
import type { MealKey, Store } from "@/lib/types";

interface Props {
  store: Store;
  view: Date;
  onSwap: (dayKey: string, meal: MealKey) => void;
  onGenerate: () => void;
}

export default function WeekScreen({ store, view, onSwap, onGenerate }: Props) {
  const pf = portionFactor(store, view);
  const days = weekOf(new Date());
  const range = `${days[0].dateLabel} – ${days[6].dateLabel}`;

  return (
    <div className="screen">
      <div className="scr-head">
        <div className="row">
          <div><div className="kick">Тиждень</div><h2 style={{ marginTop: 2 }}>{range}</h2></div>
          <button className="btn btn-primary btn-sm" onClick={onGenerate}>Запропонувати</button>
        </div>
      </div>

      <div>
        {days.map((d) => {
          const kc = dayKcal(store, d.key, pf);
          const day = store.meals[d.key] || {};
          return (
            <div className="wk-day" key={d.key} style={d.isToday ? { background: "color-mix(in srgb,var(--accent) 6%,transparent)" } : undefined}>
              <div className="wk-top">
                <span className="wd" style={d.isToday ? { color: "var(--accent)" } : undefined}>{d.wd}</span>
                <span className="mono muted">{d.dateLabel}</span>
                <span className="mono muted" style={{ marginLeft: "auto" }}>{kc ? kc + " ккал" : "порожньо"}</span>
              </div>
              <div className="wk-grid">
                {MEALS.map((m) => {
                  const name = (day[m.key] || "").trim();
                  return (
                    <button key={m.key} className={"chip" + (name ? " set" : "")} onClick={() => onSwap(d.key, m.key)}>
                      <span className="kick">{m.label}</span>
                      <span className="cn">{name || "+ додати"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
