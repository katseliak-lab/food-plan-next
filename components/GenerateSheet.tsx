"use client";
import { useCallback, useEffect, useState } from "react";
import type { ApiAuth } from "@/hooks/useApiAuth";
import { api, ApiError, type Preferences } from "@/lib/api";
import { MONTHS } from "@/lib/foodData";
import { buildPrompt, daysInMonth, extractJson, monthPrefixOf } from "@/lib/plan";
import Icon from "./Icon";
import Sheet from "./Sheet";

const DIETS: { value: string; label: string }[] = [
  { value: "none", label: "Без обмежень" },
  { value: "vegetarian", label: "Вегетаріанство" },
  { value: "vegan", label: "Веганство" },
  { value: "pescatarian", label: "Пескетаріанство" },
  { value: "keto", label: "Кето" },
  { value: "halal", label: "Халяль" },
];

interface GenerateSheetProps {
  open: boolean;
  view: Date;
  auth: ApiAuth;
  onClose: () => void;
  onCopyPrompt: (text: string) => void;
  onImport: (parsed: unknown, merge: boolean) => { added: number; ingCount: number } | null;
  onToast: (msg: string) => void;
}

const asList = (s: string): string[] =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export default function GenerateSheet({
  open, view, auth, onClose, onCopyPrompt, onImport, onToast,
}: GenerateSheetProps) {
  const monthLabel = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;

  return (
    <Sheet open={open} title="Меню від Claude" onClose={onClose}>
      {!auth.ready ? (
        <p className="hint">Завантаження…</p>
      ) : auth.user ? (
        <SignedIn view={view} monthLabel={monthLabel} auth={auth} onImport={onImport} onToast={onToast} onClose={onClose} />
      ) : (
        <AuthForm auth={auth} />
      )}

      <ManualImport view={view} onCopyPrompt={onCopyPrompt} onImport={onImport} onToast={onToast} onClose={onClose} />
    </Sheet>
  );
}

// ---------- Signed in: preferences + generate ----------
function SignedIn({
  view, monthLabel, auth, onImport, onToast, onClose,
}: {
  view: Date; monthLabel: string; auth: ApiAuth;
  onImport: GenerateSheetProps["onImport"]; onToast: (m: string) => void; onClose: () => void;
}) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [diet, setDiet] = useState("none");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [calories, setCalories] = useState("");
  const [servings, setServings] = useState("2");
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getPreferences()
      .then((p) => {
        setPrefs(p);
        setDiet(p.diet);
        setLikes(p.likes.join(", "));
        setDislikes(p.dislikes.join(", "));
        setAllergies(p.allergies.join(", "));
        setCalories(p.caloriesTarget ? String(p.caloriesTarget) : "");
        setServings(String(p.servings));
      })
      .catch(() => setStatus({ msg: "Не вдалося завантажити вподобання", cls: "err" }));
  }, []);

  const savePrefs = useCallback(async () => {
    setStatus({ msg: "Збереження…", cls: "" });
    try {
      const p = await api.updatePreferences({
        diet,
        likes: asList(likes),
        dislikes: asList(dislikes),
        allergies: asList(allergies),
        caloriesTarget: calories ? Number(calories) : null,
        servings: Number(servings) || 2,
      });
      setPrefs(p);
      setStatus({ msg: "Вподобання збережено ✓", cls: "ok" });
    } catch (e) {
      setStatus({ msg: (e as ApiError).message, cls: "err" });
    }
  }, [diet, likes, dislikes, allergies, calories, servings]);

  const generate = useCallback(async () => {
    setBusy(true);
    setStatus({ msg: "Claude готує меню… це може зайняти кілька секунд", cls: "" });
    try {
      await savePrefs();
      const rec = await api.generateMenu(monthPrefixOf(view), daysInMonth(view));
      const res = onImport(rec.data, false);
      setStatus({ msg: res ? `Готово: ${res.added} днів` : "Порожня відповідь", cls: res ? "ok" : "err" });
      if (res) {
        onToast(`Згенеровано ${res.added} дн.`);
        setTimeout(onClose, 700);
      }
    } catch (e) {
      setStatus({ msg: (e as ApiError).message, cls: "err" });
    } finally {
      setBusy(false);
    }
  }, [savePrefs, view, onImport, onToast, onClose]);

  return (
    <>
      <div className="acct-row">
        <span className="hint">Вподобання для <b>{auth.user!.email}</b></span>
        <button className="linkish" onClick={auth.logout}>Вийти</button>
      </div>

      <label className="nf-select">Тип харчування
        <select value={diet} onChange={(e) => setDiet(e.target.value)}>
          {DIETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>
      <label className="fld">Люблю <span className="sub">(через кому)</span>
        <input value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="курка, рис, авокадо" />
      </label>
      <label className="fld">Не люблю
        <input value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="гриби, печінка" />
      </label>
      <label className="fld">Алергії <span className="sub">(суворо виключити)</span>
        <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="арахіс, молоко" />
      </label>
      <div className="nf-grid">
        <label>Ккал/день<input type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2000" /></label>
        <label>Осіб<input type="number" inputMode="numeric" min={1} max={12} value={servings} onChange={(e) => setServings(e.target.value)} /></label>
      </div>

      <p className={"import-status " + status.cls}>{status.msg}</p>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={savePrefs} disabled={busy}>Зберегти вподобання</button>
        <button className="btn btn-primary" onClick={generate} disabled={busy}>
          {busy ? "Генерую…" : `Згенерувати на ${monthLabel}`}
        </button>
      </div>
      <p className="hint" style={{ marginTop: 4 }}>Меню генерується на сервері з урахуванням твоїх вподобань. {prefs ? "" : ""}</p>
    </>
  );
}

// ---------- Not signed in ----------
function AuthForm({ auth }: { auth: ApiAuth }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });

  const run = async (mode: "login" | "register") => {
    setStatus({ msg: mode === "login" ? "Вхід…" : "Реєстрація…", cls: "" });
    try {
      await (mode === "login" ? auth.login(email, pass) : auth.register(email, pass));
    } catch (e) {
      setStatus({ msg: (e as ApiError).message, cls: "err" });
    }
  };

  return (
    <>
      <p className="hint">Увійди, щоб генерувати меню з урахуванням твоїх уподобань (дієта, алергії, калорії). Ключ Claude лишається на сервері.</p>
      <input className="auth-input" type="email" inputMode="email" autoComplete="email" placeholder="Пошта" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="auth-input" type="password" placeholder="Пароль (мін. 6 символів)" value={pass} onChange={(e) => setPass(e.target.value)} />
      <p className={"import-status " + status.cls}>{status.msg}</p>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={() => run("register")}>Реєстрація</button>
        <button className="btn btn-primary" onClick={() => run("login")}>Увійти</button>
      </div>
    </>
  );
}

// ---------- Manual paste fallback (collapsible) ----------
function ManualImport({
  view, onCopyPrompt, onImport, onToast, onClose,
}: {
  view: Date; onCopyPrompt: (t: string) => void;
  onImport: GenerateSheetProps["onImport"]; onToast: (m: string) => void; onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });

  const apply = () => {
    const raw = text.trim();
    if (!raw) { setStatus({ msg: "Порожньо — встав JSON.", cls: "err" }); return; }
    let parsed: unknown;
    try { parsed = JSON.parse(extractJson(raw)); }
    catch (e) { setStatus({ msg: "Не вдалося прочитати JSON: " + (e as Error).message, cls: "err" }); return; }
    const res = onImport(parsed, true);
    if (!res) { setStatus({ msg: "Не знайдено жодного дня.", cls: "err" }); return; }
    onToast(`Імпортовано ${res.added} дн.`);
    setTimeout(onClose, 600);
  };

  return (
    <details className="manual" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>Або вставити JSON вручну</summary>
      <button className="btn btn-ghost full" onClick={() => onCopyPrompt(buildPrompt(view))}>
        <Icon name="copy" /> Скопіювати промпт для Claude
      </button>
      <textarea className="code-area" placeholder="Встав сюди JSON…" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
      <p className={"import-status " + status.cls}>{status.msg}</p>
      <div className="sheet-actions">
        <button className="btn btn-primary" onClick={apply}>Застосувати</button>
      </div>
    </details>
  );
}
