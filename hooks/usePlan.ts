"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MEALS } from "@/lib/foodData";
import { applyImport as applyImportPure, monthPrefixOf } from "@/lib/plan";
import { loadStore, normalize, persistStore } from "@/lib/store";
import type { DayMeals, Profile, Store } from "@/lib/types";

const startOfMonth = (d: Date): Date => {
  const n = new Date(d);
  n.setDate(1);
  n.setHours(0, 0, 0, 0);
  return n;
};

export interface Plan {
  store: Store;
  view: Date;
  ready: boolean;
  /** true while applying a change that came from the cloud (suppresses re-push) */
  applyingRemote: React.MutableRefObject<boolean>;
  setView: (updater: (prev: Date) => Date) => void;
  goToMonth: (year: number, monthIndex0: number) => void;
  saveDay: (key: string, meals: DayMeals) => void;
  clearDay: (key: string) => void;
  clearMonth: () => number;
  importMenu: (parsed: unknown, merge: boolean) => { added: number; ingCount: number } | null;
  patchProfile: (patch: Partial<Profile>) => void;
  setBought: (monthPrefix: string, itemKey: string, grams: number) => void;
  applyRemote: (remote: Store) => void;
}

export function usePlan(): Plan {
  const [store, setStore] = useState<Store>(() => normalize(null));
  const [view, setViewState] = useState<Date>(() => startOfMonth(new Date()));
  const [ready, setReady] = useState(false);
  const applyingRemote = useRef(false);

  // Hydrate from localStorage after mount (avoids SSR/client mismatch).
  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  // Persist on every change once hydrated.
  useEffect(() => {
    if (ready) persistStore(store);
  }, [store, ready]);

  const setView = useCallback((updater: (prev: Date) => Date) => {
    setViewState((prev) => updater(prev));
  }, []);

  const goToMonth = useCallback((year: number, monthIndex0: number) => {
    setViewState(startOfMonth(new Date(year, monthIndex0, 1)));
  }, []);

  const saveDay = useCallback((key: string, meals: DayMeals) => {
    setStore((prev) => {
      const next = { ...prev, meals: { ...prev.meals } };
      const clean: DayMeals = {};
      MEALS.forEach((mm) => {
        const v = (meals[mm.key] || "").trim();
        if (v) clean[mm.key] = v;
      });
      if (Object.keys(clean).length) next.meals[key] = clean;
      else delete next.meals[key];
      return next;
    });
  }, []);

  const clearDay = useCallback((key: string) => {
    setStore((prev) => {
      const meals = { ...prev.meals };
      delete meals[key];
      return { ...prev, meals };
    });
  }, []);

  const clearMonth = useCallback((): number => {
    const pref = monthPrefixOf(view);
    const keys = Object.keys(store.meals).filter((k) => k.startsWith(pref));
    if (keys.length) {
      setStore((prev) => {
        const meals = { ...prev.meals };
        keys.forEach((k) => delete meals[k]);
        return { ...prev, meals };
      });
    }
    return keys.length;
  }, [store.meals, view]);

  const importMenu = useCallback((parsed: unknown, merge: boolean) => {
    const res = applyImportPure(store, parsed, merge);
    if (!res) return null;
    setStore(res.store);
    const [iy, im] = res.monthPrefix.split("-").map(Number);
    setViewState(startOfMonth(new Date(iy, im - 1, 1)));
    return { added: res.added, ingCount: res.ingCount };
  }, [store]);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setStore((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const setBought = useCallback((monthPrefix: string, itemKey: string, grams: number) => {
    setStore((prev) => {
      const bought = { ...prev.bought };
      const month = { ...(bought[monthPrefix] || {}) };
      if (grams > 0) month[itemKey] = Math.round(grams);
      else delete month[itemKey];
      bought[monthPrefix] = month;
      return { ...prev, bought };
    });
  }, []);

  const applyRemote = useCallback((remote: Store) => {
    applyingRemote.current = true;
    setStore(normalize(remote));
    // release the flag after the resulting persist effect has run
    setTimeout(() => { applyingRemote.current = false; }, 0);
  }, []);

  return {
    store, view, ready, applyingRemote,
    setView, goToMonth, saveDay, clearDay, clearMonth,
    importMenu, patchProfile, setBought, applyRemote,
  };
}
