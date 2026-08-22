"use client";
import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { localHasExtra, mergeStores } from "@/lib/store";
import type { Store } from "@/lib/types";

const ERR: Record<string, string> = {
  "auth/invalid-email": "Некоректна пошта.",
  "auth/missing-password": "Введи пароль.",
  "auth/weak-password": "Пароль закороткий (мінімум 6 символів).",
  "auth/email-already-in-use": "Ця пошта вже зареєстрована — натисни «Увійти».",
  "auth/invalid-credential": "Невірна пошта або пароль.",
  "auth/user-not-found": "Такого користувача немає — натисни «Реєстрація».",
  "auth/wrong-password": "Невірний пароль.",
  "auth/network-request-failed": "Немає звʼязку з мережею.",
  "auth/too-many-requests": "Забагато спроб. Спробуй трохи згодом.",
};
const humanErr = (e: unknown): string => {
  const err = e as { code?: string; message?: string };
  return ERR[err?.code ?? ""] || (err?.message || "Помилка").replace("Firebase: ", "");
};

export interface Sync {
  configured: boolean;
  user: User | null;
  authStatus: { msg: string; cls: string };
  accountStatus: { msg: string; cls: string };
  signIn: (email: string, pass: string) => void;
  signUp: (email: string, pass: string) => void;
  signOut: () => void;
}

/**
 * Cloud sync via Firebase Auth + Firestore. localStorage is always primary;
 * the cloud is layered on top when signed in. `storeRef` gives the push
 * handler the latest store without re-subscribing.
 */
export function useSync(
  store: Store,
  storeRef: React.MutableRefObject<Store>,
  applyingRemote: React.MutableRefObject<boolean>,
  onRemote: (merged: Store) => void,
): Sync {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState({ msg: "", cls: "" });
  const [accountStatus, setAccountStatus] = useState({ msg: "", cls: "ok" });
  const uidRef = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteRef = useRef(onRemote);
  onRemoteRef.current = onRemote;

  const push = useRef((): void => {
    const fb = getFirebase();
    const uid = uidRef.current;
    if (!fb || !uid) return;
    setAccountStatus({ msg: "Синхронізація…", cls: "" });
    setDoc(doc(fb.db, "plans", uid), { data: storeRef.current, updatedAt: Date.now() })
      .then(() => setAccountStatus({ msg: "Синхронізовано ✓", cls: "ok" }))
      .catch((e) => setAccountStatus({ msg: "Помилка: " + humanErr(e), cls: "err" }));
  });

  // Subscribe to auth + the user's plan document.
  useEffect(() => {
    const fb = getFirebase();
    if (!fb) return;
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(fb.auth, (u) => {
      if (unsubDoc) { unsubDoc(); unsubDoc = null; }
      setUser(u);
      if (u) {
        uidRef.current = u.uid;
        setAccountStatus({ msg: "Підключення…", cls: "" });
        unsubDoc = onSnapshot(
          doc(fb.db, "plans", u.uid),
          (snap) => {
            if (snap.metadata.hasPendingWrites) return; // our own write
            const local = storeRef.current;
            if (snap.exists()) {
              const remote = ((snap.data() as { data?: Store })?.data ?? {}) as Store;
              const merged = mergeStores(local, remote);
              onRemoteRef.current(merged);
              if (localHasExtra(local, remote)) push.current();
              setAccountStatus({ msg: "Синхронізовано ✓", cls: "ok" });
            } else {
              push.current(); // empty cloud — upload local
            }
          },
          (err) => setAccountStatus({ msg: "Помилка: " + humanErr(err), cls: "err" }),
        );
      } else {
        uidRef.current = null;
        setAuthStatus({ msg: "", cls: "" });
      }
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, [storeRef]);

  // Debounced push on local changes.
  useEffect(() => {
    if (!user || applyingRemote.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => push.current(), 600);
  }, [store, user, applyingRemote]);

  return {
    configured,
    user,
    authStatus,
    accountStatus,
    signIn: (email, pass) => {
      const fb = getFirebase();
      if (!fb) return;
      setAuthStatus({ msg: "Вхід…", cls: "" });
      signInWithEmailAndPassword(fb.auth, email.trim(), pass).catch((e) =>
        setAuthStatus({ msg: humanErr(e), cls: "err" }),
      );
    },
    signUp: (email, pass) => {
      const fb = getFirebase();
      if (!fb) return;
      setAuthStatus({ msg: "Реєстрація…", cls: "" });
      createUserWithEmailAndPassword(fb.auth, email.trim(), pass).catch((e) =>
        setAuthStatus({ msg: humanErr(e), cls: "err" }),
      );
    },
    signOut: () => {
      const fb = getFirebase();
      if (fb) fbSignOut(fb.auth);
    },
  };
}
