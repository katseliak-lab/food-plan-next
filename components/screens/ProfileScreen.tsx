"use client";
import { useState } from "react";
import type { ApiAuth } from "@/hooks/useApiAuth";
import { ApiError } from "@/lib/api";
import { calcTarget } from "@/lib/foodData";
import type { Activity, Goal, Profile, Sex, Store } from "@/lib/types";

interface Props {
  store: Store;
  auth: ApiAuth;
  syncStatus: string;
  onPatch: (patch: Partial<Profile>) => void;
}

export default function ProfileScreen({ store, auth, syncStatus, onPatch }: Props) {
  return (
    <div className="screen">
      <div className="scr-head">
        <div className="kick">Профіль</div>
        <h2 style={{ marginTop: 2 }}>Акаунт і норма</h2>
      </div>

      <div style={{ margin: "12px 14px" }} className="prof-card">
        <div className="kick" style={{ marginBottom: 10 }}>Акаунт</div>
        {!auth.ready ? (
          <p className="mono muted">Завантаження…</p>
        ) : auth.user ? (
          <AccountInfo auth={auth} syncStatus={syncStatus} />
        ) : (
          <AuthForm auth={auth} />
        )}
      </div>

      <div style={{ margin: "12px 14px" }} className="prof-card">
        <div className="kick" style={{ marginBottom: 10 }}>Норма й порції</div>
        <Settings store={store} onPatch={onPatch} />
      </div>
    </div>
  );
}

function AccountInfo({ auth, syncStatus }: { auth: ApiAuth; syncStatus: string }) {
  return (
    <>
      <p style={{ margin: "0 0 4px", fontWeight: 800 }}>{auth.user!.email}</p>
      <p className="mono muted" style={{ margin: "0 0 12px" }}>
        {syncStatus === "synced" ? "Синхронізовано ✓" : syncStatus === "syncing" ? "Синхронізація…" : "План зберігається в акаунті"}
      </p>
      <button className="btn btn-secondary btn-block" style={{ marginTop: 0 }} onClick={auth.logout}>Вийти</button>
    </>
  );
}

function AuthForm({ auth }: { auth: ApiAuth }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });
  const [busy, setBusy] = useState(false);

  const run = async (mode: "login" | "register") => {
    setBusy(true);
    setStatus({ msg: (mode === "login" ? "Вхід" : "Реєстрація") + "… (сервер може прокидатись ~30с)", cls: "" });
    try {
      await (mode === "login" ? auth.login(email, pass) : auth.register(email, pass));
    } catch (e) {
      const err = e as ApiError;
      const msg = /fetch|network|Failed/i.test(err.message)
        ? "Сервер ще прокидається — зачекай кілька секунд і спробуй ще раз."
        : err.message;
      setStatus({ msg, cls: "err" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="mono muted" style={{ margin: "0 0 12px" }}>Увійди, щоб зберігати план в акаунті й синхронізувати між пристроями.</p>
      <label className="field"><span>Пошта</span><input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="field"><span>Пароль (мін. 6)</span><input className="input" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
      <p className={"status " + status.cls}>{status.msg}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-block" style={{ marginTop: 0 }} disabled={busy} onClick={() => run("register")}>Реєстрація</button>
        <button className="btn btn-primary btn-block" style={{ marginTop: 0 }} disabled={busy} onClick={() => run("login")}>Увійти</button>
      </div>
    </>
  );
}

function Settings({ store, onPatch }: { store: Store; onPatch: (p: Partial<Profile>) => void }) {
  const p = store.profile;
  const target = calcTarget(p);
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <button className={"btn btn-sm " + ((p.sex || "female") === "female" ? "btn-primary" : "btn-secondary")} onClick={() => onPatch({ sex: "female" as Sex })}>Жінка</button>
        <button className={"btn btn-sm " + (p.sex === "male" ? "btn-primary" : "btn-secondary")} onClick={() => onPatch({ sex: "male" as Sex })}>Чоловік</button>
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
      <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)", marginTop: 6 }}>
        {target
          ? <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ font: "800 26px 'Archivo',sans-serif" }}>{target}</span><span className="mono muted">ккал/день</span></div>
          : <div className="mono muted">Заповни вік, зріст і вагу — і побачиш норму.</div>}
      </div>
    </>
  );
}
