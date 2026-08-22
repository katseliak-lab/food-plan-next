"use client";
import { useEffect } from "react";
import { calcTarget } from "@/lib/foodData";
import type { Activity, Goal, Profile, Sex, Store } from "@/lib/types";

interface Props {
  open: boolean;
  store: Store;
  onPatch: (patch: Partial<Profile>) => void;
  onClose: () => void;
}

export default function SettingsSheet({ open, store, onPatch, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const p = store.profile;
  const target = calcTarget(p);

  return (
    <div className="bd" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="kick">Профіль</div>
        <h4>Норма й порції</h4>

        <div className="seg" style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <button className={"btn " + ((p.sex || "female") === "female" ? "btn-primary" : "btn-secondary") + " btn-sm"} onClick={() => onPatch({ sex: "female" as Sex })}>Жінка</button>
          <button className={"btn " + (p.sex === "male" ? "btn-primary" : "btn-secondary") + " btn-sm"} onClick={() => onPatch({ sex: "male" as Sex })}>Чоловік</button>
        </div>

        <div className="nf-grid">
          <label className="field"><span>Вік</span><input className="input" type="number" inputMode="numeric" value={p.age ?? ""} onChange={(e) => onPatch({ age: e.target.value })} placeholder="30" /></label>
          <label className="field"><span>Зріст, см</span><input className="input" type="number" inputMode="numeric" value={p.height ?? ""} onChange={(e) => onPatch({ height: e.target.value })} placeholder="170" /></label>
          <label className="field"><span>Вага, кг</span><input className="input" type="number" inputMode="numeric" value={p.weight ?? ""} onChange={(e) => onPatch({ weight: e.target.value })} placeholder="65" /></label>
          <label className="field"><span>Порцій (осіб)</span><input className="input" type="number" inputMode="numeric" value={p.servings ?? ""} onChange={(e) => onPatch({ servings: e.target.value })} placeholder="2" /></label>
        </div>

        <label className="field"><span>Активність</span>
          <select className="input" value={p.activity || "mod"} onChange={(e) => onPatch({ activity: e.target.value as Activity })}>
            <option value="sed">Сидячий спосіб життя</option>
            <option value="light">Легка (1–3 трен./тижд.)</option>
            <option value="mod">Помірна (3–5 трен./тижд.)</option>
            <option value="high">Висока (6–7 трен./тижд.)</option>
            <option value="vhigh">Дуже висока (фіз. праця)</option>
          </select>
        </label>
        <label className="field"><span>Ціль</span>
          <select className="input" value={p.goal || "keep"} onChange={(e) => onPatch({ goal: e.target.value as Goal })}>
            <option value="lose">Схуднення</option>
            <option value="keep">Підтримка ваги</option>
            <option value="gain">Набір</option>
          </select>
        </label>

        <div style={{ padding: "12px 0", borderTop: "2px solid var(--divider)", marginTop: 8 }}>
          {target
            ? <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ font: "800 26px 'Archivo',sans-serif" }}>{target}</span><span className="mono muted">ккал/день</span></div>
            : <div className="mono muted">Заповни вік, зріст і вагу — і побачиш норму.</div>}
        </div>

        <button className="btn btn-primary btn-block" onClick={onClose}>Готово</button>
      </div>
    </div>
  );
}
