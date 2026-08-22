"use client";
import { useState } from "react";
import type { Sync } from "@/hooks/useSync";
import Sheet from "./Sheet";

export default function AccountSheet({ open, sync, onClose }: { open: boolean; sync: Sync; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <Sheet open={open} title="Синхронізація" onClose={onClose}>
      {!sync.configured && (
        <p className="hint">
          Хмарну синхронізацію ще не налаштовано. Додай свій Firebase-конфіг у <code>.env.local</code>{" "}
          (див. <code>README.md</code>). Поки що план зберігається лише на цьому пристрої.
        </p>
      )}

      {sync.configured && !sync.user && (
        <>
          <p className="hint">Увійди, щоб бачити свій план на всіх пристроях. Зміни синхронізуються автоматично.</p>
          <input className="auth-input" type="email" inputMode="email" autoComplete="email" placeholder="Пошта"
            spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="auth-input" type="password" autoComplete="current-password"
            placeholder="Пароль (мін. 6 символів)" value={pass} onChange={(e) => setPass(e.target.value)} />
          <p className={"import-status " + sync.authStatus.cls}>{sync.authStatus.msg}</p>
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => sync.signUp(email, pass)}>Реєстрація</button>
            <button className="btn btn-primary" onClick={() => sync.signIn(email, pass)}>Увійти</button>
          </div>
        </>
      )}

      {sync.configured && sync.user && (
        <>
          <p className="hint">
            Ти увійшов як <b>{sync.user.email}</b>. План синхронізується між пристроями автоматично.
          </p>
          <p className={"import-status " + sync.accountStatus.cls}>{sync.accountStatus.msg}</p>
          <div className="sheet-actions">
            <button className="btn btn-ghost full" onClick={sync.signOut}>Вийти</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
