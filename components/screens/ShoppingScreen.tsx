"use client";
import { fmtQty } from "@/lib/foodData";
import { buyList, monthPrefixOf } from "@/lib/plan";
import type { Store } from "@/lib/types";

interface Props {
  store: Store;
  view: Date;
  onSetBought: (monthPrefix: string, itemKey: string, grams: number) => void;
}

export default function ShoppingScreen({ store, view, onSetBought }: Props) {
  const prefix = monthPrefixOf(view);
  const bought = store.bought[prefix] || {};
  const sections = buyList(store, view);
  const all = sections.flatMap((s) => s.items);
  const done = all.filter((it) => (bought[it.key] || 0) >= it.qty - 0.5).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <div className="screen">
      <div className="scr-head">
        <div className="kick">Список покупок</div>
        <h2 style={{ marginTop: 2 }}>{done} з {all.length} куплено</h2>
        <div className="bar"><i style={{ width: pct + "%" }} /></div>
      </div>

      {sections.length === 0 ? (
        <div style={{ padding: 16, color: "var(--muted)", fontSize: 14 }}>
          Ще немає продуктів. Згенеруй меню на вкладці «Місяць» або «Тиждень».
        </div>
      ) : (
        sections.map((s) => (
          <div key={s.title}>
            <div className="buy-sec"><span className="kick">{s.title}</span></div>
            {s.items.map((it) => {
              const on = (bought[it.key] || 0) >= it.qty - 0.5;
              return (
                <button
                  key={it.key}
                  className={"buy-item" + (on ? " on" : "")}
                  onClick={() => onSetBought(prefix, it.key, on ? 0 : it.qty)}
                >
                  <span className="buy-box" />
                  <span className="buy-name">{it.name}</span>
                  <span className="mono muted" style={{ marginLeft: "auto" }}>{fmtQty(it.qty, it.u)}</span>
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
