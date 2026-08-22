"use client";
import { useCallback, useEffect, useState } from "react";
import type { ApiAuth } from "@/hooks/useApiAuth";
import { api, ApiError, type Preferences } from "@/lib/api";
import { MONTHS } from "@/lib/foodData";
import { daysInMonth, monthPrefixOf } from "@/lib/plan";

const DIETS: { value: string; label: string }[] = [
  { value: "none", label: "Без обмежень" },
  { value: "vegetarian", label: "Вегетаріанство" },
  { value: "vegan", label: "Веганство" },
  { value: "pescatarian", label: "Пескетаріанство" },
  { value: "keto", label: "Кето" },
  { value: "halal", label: "Халяль" },
];

interface Props {
  open: boolean;
  view: Date;
  auth: ApiAuth;
  onClose: () => void;
  onImport: (parsed: unknown, merge: boolean) => { added: number; ingCount: number } | null;
  onToast: (msg: string) => void;
}

const asList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function GenerateSheet({ open, view, auth, onClose, onImport, onToast }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const monthLabel = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;

  return (
    <div className="bd" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="kick">Меню від Claude</div>
        {!auth.ready ? (
          <p className="mono muted" style={{ marginTop: 8 }}>Завантаження…</p>
        ) : auth.user ? (
          <SignedIn view={view} monthLabel={monthLabel} auth={auth} onImport={onImport} onToast={onToast} onClose={onClose} />
        ) : (
          <AuthForm auth={auth} />
        )}
      </div>
    </div>
  );
}

function SignedIn({ view, monthLabel, auth, onImport, onToast, onClose }: {
  view: Date; monthLabel: string; auth: ApiAuth;
  onImport: Props["onImport"]; onToast: (m: string) => void; onClose: () => void;
}) {
  const [diet, setDiet] = useState("none");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [calories, setCalories] = useState("");
  const [servings, setServings] = useState("2");
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getPreferences().then((p: Preferences) => {
      setDiet(p.diet); setLikes(p.likes.join(", ")); setDislikes(p.dislikes.join(", "));
      setAllergies(p.allergies.join(", ")); setCalories(p.caloriesTarget ? String(p.caloriesTarget) : "");
      setServings(String(p.servings));
    }).catch(() => setStatus({ msg: "Не вдалося завантажити вподобання", cls: "err" }));
  }, []);

  const savePrefs = useCallback(async () => {
    return api.updatePreferences({
      diet, likes: asList(likes), dislikes: asList(dislikes), allergies: asList(allergies),
      caloriesTarget: calories ? Number(calories) : null, servings: Number(servings) || 2,
    });
  }, [diet, likes, dislikes, allergies, calories, servings]);

  const generate = useCallback(async () => {
    setBusy(true);
    setStatus({ msg: "Claude готує меню… кілька секунд", cls: "" });
    try {
      await savePrefs();
      const rec = await api.generateMenu(monthPrefixOf(view), daysInMonth(view));
      const res = onImport(rec.data, false);
      if (res) { onToast(`Згенеровано ${res.added} дн.`); setTimeout(onClose, 600); }
      else setStatus({ msg: "Порожня відповідь", cls: "err" });
    } catch (e) {
      setStatus({ msg: (e as ApiError).message, cls: "err" });
    } finally { setBusy(false); }
  }, [savePrefs, view, onImport, onToast, onClose]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "6px 0 10px" }}>
        <h4 style={{ margin: 0 }}>Меню на {monthLabel}</h4>
        <button className="btn btn-ghost btn-sm" onClick={auth.logout}>Вийти</button>
      </div>
      <p className="mono muted" style={{ margin: "0 0 10px" }}>{auth.user!.email} · ключ Claude на сервері</p>

      <label className="field"><span>Тип харчування</span>
        <select className="input" value={diet} onChange={(e) => setDiet(e.target.value)}>
          {DIETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>
      <label className="field"><span>Люблю (через кому)</span><input className="input" value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="курка, рис, авокадо" /></label>
      <label className="field"><span>Не люблю</span><input className="input" value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="гриби, печінка" /></label>
      <label className="field"><span>Алергії (суворо виключити)</span><input className="input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="арахіс, молоко" /></label>
      <div className="nf-grid">
        <label className="field"><span>Ккал/день</span><input className="input" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2000" /></label>
        <label className="field"><span>Осіб</span><input className="input" type="number" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} /></label>
      </div>

      <p className={"status " + status.cls}>{status.msg}</p>
      <button className="btn btn-primary btn-block" disabled={busy} onClick={generate}>
        {busy ? "Генерую…" : `Згенерувати на ${monthLabel}`}
      </button>
      <button className="btn btn-secondary btn-block" onClick={onClose}>Закрити</button>
    </>
  );
}

function AuthForm({ auth }: { auth: ApiAuth }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });

  const run = async (mode: "login" | "register") => {
    setStatus({ msg: mode === "login" ? "Вхід…" : "Реєстрація…", cls: "" });
    try { await (mode === "login" ? auth.login(email, pass) : auth.register(email, pass)); }
    catch (e) { setStatus({ msg: (e as ApiError).message, cls: "err" }); }
  };

  return (
    <>
      <h4 style={{ margin: "6px 0 8px" }}>Увійди для генерації</h4>
      <p className="mono muted" style={{ margin: "0 0 12px" }}>Меню генерується на сервері з урахуванням твоїх уподобань.</p>
      <label className="field"><span>Пошта</span><input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="field"><span>Пароль (мін. 6)</span><input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
      <p className={"status " + status.cls}>{status.msg}</p>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-secondary btn-block" style={{ marginTop: 0 }} onClick={() => run("register")}>Реєстрація</button>
        <button className="btn btn-primary btn-block" style={{ marginTop: 0 }} onClick={() => run("login")}>Увійти</button>
      </div>
    </>
  );
}
