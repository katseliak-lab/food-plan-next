"use client";
import { useState } from "react";
import { calcTarget, dbEntry, dishKcal, fmtQty } from "@/lib/foodData";
import {
  buyList, mealTargets, menuBaseDaily, monthDishes, monthPrefixOf, portionFactor,
} from "@/lib/plan";
import type { Activity, BuyItem, Goal, Profile, Sex, Store, Unit } from "@/lib/types";
import Icon from "./Icon";
import Sheet from "./Sheet";

type Tab = "norma" | "dishes" | "buy";

interface ProductsSheetProps {
  open: boolean;
  store: Store;
  view: Date;
  onClose: () => void;
  onPatchProfile: (patch: Partial<Profile>) => void;
  onSetBought: (monthPrefix: string, itemKey: string, grams: number) => void;
  onCopy: (text: string) => void;
}

export default function ProductsSheet(props: ProductsSheetProps) {
  const { open, store, view, onClose } = props;
  const [tab, setTab] = useState<Tab>("dishes");

  return (
    <Sheet open={open} title="Продукти" onClose={onClose}>
      <div className="seg">
        <button className={"seg-btn" + (tab === "norma" ? " active" : "")} onClick={() => setTab("norma")}>Норма</button>
        <button className={"seg-btn" + (tab === "dishes" ? " active" : "")} onClick={() => setTab("dishes")}>Страви</button>
        <button className={"seg-btn" + (tab === "buy" ? " active" : "")} onClick={() => setTab("buy")}>Купити</button>
      </div>

      {tab === "norma" && <NormaPane store={store} view={view} onPatch={props.onPatchProfile} />}
      {tab === "dishes" && <DishesPane store={store} view={view} />}
      {tab === "buy" && <BuyPane store={store} view={view} onSetBought={props.onSetBought} onCopy={props.onCopy} />}
    </Sheet>
  );
}

// ---------- Норма ----------
function NormaPane({ store, view, onPatch }: { store: Store; view: Date; onPatch: (p: Partial<Profile>) => void }) {
  const p = store.profile;
  const target = calcTarget(p);
  const base = Math.round(menuBaseDaily(store, view));
  const pf = portionFactor(store, view);

  return (
    <div className="prod-pane">
      <p className="hint">
        Порахуй денну норму калорій — застосунок підбере розмір порцій і кількість продуктів на закупівлю.
      </p>
      <div className="seg">
        <button className={"seg-btn" + ((p.sex || "female") === "female" ? " active" : "")} onClick={() => onPatch({ sex: "female" })}>Жінка</button>
        <button className={"seg-btn" + (p.sex === "male" ? " active" : "")} onClick={() => onPatch({ sex: "male" })}>Чоловік</button>
      </div>
      <div className="nf-grid">
        <label>Вік<input type="number" inputMode="numeric" min={10} max={100} placeholder="30" value={p.age ?? ""} onChange={(e) => onPatch({ age: e.target.value })} /></label>
        <label>Зріст, см<input type="number" inputMode="numeric" min={120} max={230} placeholder="170" value={p.height ?? ""} onChange={(e) => onPatch({ height: e.target.value })} /></label>
        <label>Вага, кг<input type="number" inputMode="numeric" min={30} max={250} placeholder="65" value={p.weight ?? ""} onChange={(e) => onPatch({ weight: e.target.value })} /></label>
        <label>Осіб (закупівлі)<input type="number" inputMode="numeric" min={1} max={10} placeholder="2" value={p.servings ?? ""} onChange={(e) => onPatch({ servings: e.target.value })} /></label>
      </div>
      <label className="nf-select">Активність
        <select value={p.activity || "mod"} onChange={(e) => onPatch({ activity: e.target.value as Activity })}>
          <option value="sed">Сидячий спосіб життя</option>
          <option value="light">Легка (1–3 трен./тижд.)</option>
          <option value="mod">Помірна (3–5 трен./тижд.)</option>
          <option value="high">Висока (6–7 трен./тижд.)</option>
          <option value="vhigh">Дуже висока (фіз. праця)</option>
        </select>
      </label>
      <label className="nf-select">Ціль
        <select value={p.goal || "keep"} onChange={(e) => onPatch({ goal: e.target.value as Goal })}>
          <option value="lose">Схуднення</option>
          <option value="keep">Підтримка ваги</option>
          <option value="gain">Набір</option>
        </select>
      </label>

      <div className="norma-result">
        {!target ? (
          <p className="hint">Заповни вік, зріст і вагу — і побачиш свою денну норму.</p>
        ) : (
          <>
            <div className="norma-big">{target} <span>ккал/день</span></div>
            <p className="norma-meals">{mealTargets(target)} ккал</p>
            {base ? (
              <p className="hint">
                Меню зараз: ~{base} ккал/день → порції <b>×{Math.round(pf * 100)}%</b>. Порції та кількість продуктів підлаштовано під тебе.
              </p>
            ) : (
              <p className="hint">Додай меню — і порції автоматично підлаштуються під норму.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Страви ----------
function DishesPane({ store, view }: { store: Store; view: Date }) {
  const dishes = monthDishes(store, view);
  const pf = portionFactor(store, view);
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!dishes.length) {
    return (
      <div className="prod-pane">
        <p className="empty">У цьому місяці ще немає страв.<br />Додай меню через «Від Claude».</p>
      </div>
    );
  }

  return (
    <div className="prod-pane">
      {dishes.map((d) => {
        const kcal = Math.round(dishKcal(d.items) * pf);
        const isOpen = openKey === d.name;
        return (
          <div key={d.name} className={"dish" + (isOpen ? " open" : "")}>
            <button className="dish-head" onClick={() => setOpenKey(isOpen ? null : d.name)}>
              <span className="dish-name">{d.name}</span>
              <span className="dish-meta">
                {d.count > 1 ? "×" + d.count + " · " : ""}
                {d.items.length ? "~" + kcal + " ккал" : "—"}
              </span>
              <Icon name="chevronDown" className="ico chev" />
            </button>
            <div className="dish-items" hidden={!isOpen}>
              {d.items.length ? (
                d.items.map((n, i) => {
                  const e = dbEntry(n);
                  return (
                    <span key={n + i} className="ing">
                      {n}<b>{fmtQty(e.g * pf, e.u)}</b>
                    </span>
                  );
                })
              ) : (
                <span className="ing muted">немає продуктів</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Купити ----------
function BuyPane({
  store, view, onSetBought, onCopy,
}: {
  store: Store; view: Date;
  onSetBought: (monthPrefix: string, itemKey: string, grams: number) => void;
  onCopy: (text: string) => void;
}) {
  const pref = monthPrefixOf(view);
  const bought = store.bought[pref] || {};
  const sections = buyList(store, view);

  if (!sections.length) {
    return (
      <div className="prod-pane">
        <p className="empty">Ще немає продуктів.<br />Згенеруй меню через «Від Claude».</p>
      </div>
    );
  }

  const allItems = sections.flatMap((s) => s.items);
  const done = allItems.filter((it) => (bought[it.key] || 0) >= it.qty - 0.5).length;

  const copyText = sections
    .map((sec) => [sec.title, ...sec.items.map((it) => `• ${it.name} — ${fmtQty(it.qty, it.u)}`)].join("\n"))
    .join("\n\n");

  return (
    <div className="prod-pane">
      <div className="buy-bar">
        <span>{done} / {allItems.length} готово</span>
        <button className="buy-copy" onClick={() => onCopy(copyText)}>Скопіювати</button>
      </div>
      {sections.map((sec) => (
        <div key={sec.title}>
          <div className="buy-sec">{sec.title}</div>
          <div className="buy-list">
            {sec.items.map((it) => (
              <BuyRow
                key={it.key}
                item={it}
                got={bought[it.key] || 0}
                onChange={(g) => onSetBought(pref, it.key, g)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function displayUnit(needed: number, u: Unit): { unit: string; f: number; step: number } {
  if (u === "шт") return { unit: "шт", f: 1, step: 1 };
  if (u === "мл") return needed >= 1000 ? { unit: "л", f: 1000, step: 0.1 } : { unit: "мл", f: 1, step: 50 };
  return needed >= 1000 ? { unit: "кг", f: 1000, step: 0.1 } : { unit: "г", f: 1, step: 50 };
}

function BuyRow({ item, got, onChange }: { item: BuyItem; got: number; onChange: (grams: number) => void }) {
  const needed = item.qty;
  const disp = displayUnit(needed, item.u);
  const done = got >= needed - 0.5;

  return (
    <label className={"buy-item" + (done ? " done" : "")}>
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => onChange(e.target.checked ? needed : 0)}
      />
      <div className="buy-main">
        <div className="buy-top">
          <span className="buy-name">{item.name}</span>
          <b className="qty">{fmtQty(needed, item.u)}</b>
        </div>
        <div className="buy-ctr">
          <input
            type="number"
            className="got-input"
            min={0}
            step={disp.step}
            inputMode="decimal"
            value={got ? Number((got / disp.f).toFixed(2)) : ""}
            onChange={(e) => onChange(Math.max(0, (parseFloat(e.target.value) || 0) * disp.f))}
          />
          <span className="got-unit">{disp.unit}</span>
          <span className={"buy-rem" + (done ? " ok" : "")}>
            {done ? "✓ вистачає" : "ще " + fmtQty(Math.max(0, needed - got), item.u)}
          </span>
        </div>
      </div>
    </label>
  );
}
