"use client";
import { MEALS, MONTHS, WD, dateKey, mondayIndex, todayKey } from "@/lib/foodData";
import { monthDishes, monthPrefixOf } from "@/lib/plan";
import type { Store } from "@/lib/types";
import DishPhoto from "@/components/DishPhoto";

interface Props {
  store: Store;
  view: Date;
  onPrev: () => void;
  onNext: () => void;
  onOpenDay: (key: string) => void;
  onGenerate: () => void;
}

interface Cell { key: string; num: number; out: boolean }

function cells(view: Date): Cell[] {
  const y = view.getFullYear(), m = view.getMonth();
  const lead = mondayIndex(new Date(y, m, 1).getDay());
  const dim = new Date(y, m + 1, 0).getDate();
  const prev = new Date(y, m, 0).getDate();
  const out: Cell[] = [];
  for (let i = lead - 1; i >= 0; i--) { const d = new Date(y, m - 1, prev - i); out.push({ key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()), num: prev - i, out: true }); }
  for (let d = 1; d <= dim; d++) out.push({ key: dateKey(y, m, d), num: d, out: false });
  const trail = (7 - ((lead + dim) % 7)) % 7;
  for (let d = 1; d <= trail; d++) { const dt = new Date(y, m + 1, d); out.push({ key: dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate()), num: d, out: true }); }
  return out;
}

export default function MonthScreen({ store, view, onPrev, onNext, onOpenDay, onGenerate }: Props) {
  const tk = todayKey();
  const dishes = monthDishes(store, view);
  const planned = Object.keys(store.meals).filter((k) => k.startsWith(monthPrefixOf(view))).length;

  return (
    <div className="screen">
      <div className="scr-head">
        <div className="row">
          <div>
            <div className="kick">Місяць</div>
            <h2 style={{ marginTop: 2 }}>{MONTHS[view.getMonth()]} {view.getFullYear()}</h2>
            <div className="mono muted" style={{ marginTop: 3 }}>{planned ? `${planned} днів заплановано` : "порожньо"}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-secondary btn-sm" aria-label="Попередній місяць" onClick={onPrev}>‹</button>
            <button className="btn btn-secondary btn-sm" aria-label="Наступний місяць" onClick={onNext}>›</button>
          </div>
        </div>
      </div>

      <div className="mgrid-head">
        {WD.map((w) => <div className="kick" key={w} style={{ textAlign: "center" }}>{w}</div>)}
      </div>
      <div className="mgrid">
        {cells(view).map((c) => {
          const day = store.meals[c.key];
          const filled = Boolean(day && MEALS.some((m) => (day[m.key] || "").trim()));
          const dinner = (day?.dinner || "").trim();
          const isToday = c.key === tk;
          return (
            <button
              key={c.key + (c.out ? "o" : "")}
              className={"mcell" + (c.out ? " out" : "") + (isToday ? " today" : "")}
              onClick={() => !c.out && onOpenDay(c.key)}
              disabled={c.out}
            >
              <div className="mnum" style={!filled && !c.out ? { color: "var(--faint)" } : undefined}>{c.num}</div>
              {!c.out && (
                <div className="mdots" style={{ opacity: filled ? 1 : 0.25 }}>
                  {MEALS.map((m) => (
                    <span key={m.key} className={m.key === "dinner" ? "a" : ""} style={day && (day[m.key] || "").trim() ? undefined : { opacity: 0.3 }} />
                  ))}
                </div>
              )}
              {dinner && <div className="mdinner">{dinner}</div>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "12px 16px 8px", borderTop: "2px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="kick">Страви місяця</span>
        <button className="btn btn-primary btn-sm" onClick={onGenerate}>Догенерувати</button>
      </div>
      {dishes.length ? (
        dishes.map((d) => (
          <div className="dish-row" key={d.name}>
            <DishPhoto name={d.name} size={120} />
            <span className="dn">{d.name}</span>
            <span className="mono muted" style={{ marginLeft: "auto" }}>{d.count}×</span>
          </div>
        ))
      ) : (
        <div style={{ padding: "16px", color: "var(--muted)", fontSize: 14 }}>Ще немає страв. Натисни «Догенерувати».</div>
      )}
    </div>
  );
}
