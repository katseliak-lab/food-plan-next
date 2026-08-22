"use client";
import { MEALS, MONTHS, WD, dateKey, mondayIndex, todayKey } from "@/lib/foodData";
import type { Store } from "@/lib/types";

interface CalendarProps {
  store: Store;
  view: Date;
  onOpenDay: (key: string) => void;
}

interface Cell { y: number; m: number; d: number; out: boolean; }

function buildCells(view: Date): Cell[] {
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1);
  const lead = mondayIndex(first.getDay());
  const dim = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const cells: Cell[] = [];

  for (let i = lead - 1; i >= 0; i--) cells.push({ y, m: m - 1, d: prevDays - i, out: true });
  for (let d = 1; d <= dim; d++) cells.push({ y, m, d, out: false });
  const total = lead + dim;
  const trail = (7 - (total % 7)) % 7;
  for (let d = 1; d <= trail; d++) cells.push({ y, m: m + 1, d, out: true });
  return cells;
}

export default function Calendar({ store, view, onOpenDay }: CalendarProps) {
  const tKey = todayKey();
  const cells = buildCells(view);

  return (
    <>
      <div className="weekdays">
        {WD.map((w, i) => (
          <div key={w} className={i >= 5 ? "we" : undefined}>{w}</div>
        ))}
      </div>

      <main className="calendar">
        {cells.map(({ y, m, d, out }) => {
          const norm = new Date(y, m, d);
          const key = dateKey(norm.getFullYear(), norm.getMonth(), norm.getDate());
          const data = store.meals[key];
          const filled = Boolean(data && MEALS.some((mm) => (data[mm.key] || "").trim()));
          const preview = filled
            ? MEALS.map((mm) => (data![mm.key] || "").trim()).filter(Boolean).join(" · ")
            : "";

          const cls = ["day", out && "out", filled && "filled", key === tKey && "today"]
            .filter(Boolean)
            .join(" ");

          return (
            <button key={key + (out ? "-o" : "")} className={cls} onClick={() => onOpenDay(key)}>
              <div className="num">{d}</div>
              <div className="dots">
                {MEALS.map((mm) => (
                  <span
                    key={mm.key}
                    className={"dot " + mm.key + (data && (data[mm.key] || "").trim() ? " on" : "")}
                  />
                ))}
              </div>
              {filled && <div className="preview">{preview}</div>}
            </button>
          );
        })}
      </main>

      <span className="sr-only">{`${MONTHS[view.getMonth()]} ${view.getFullYear()}`}</span>
    </>
  );
}
