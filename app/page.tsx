"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import TabBar, { type Tab } from "@/components/TabBar";
import TodayScreen from "@/components/screens/TodayScreen";
import WeekScreen from "@/components/screens/WeekScreen";
import MonthScreen from "@/components/screens/MonthScreen";
import ShoppingScreen from "@/components/screens/ShoppingScreen";
import SwapSheet, { type SwapTarget } from "@/components/SwapSheet";
import DayMealsSheet from "@/components/DayMealsSheet";
import SettingsSheet from "@/components/SettingsSheet";
import GenerateSheet from "@/components/GenerateSheet";
import Toast from "@/components/Toast";
import { usePlan } from "@/hooks/usePlan";
import { useApiAuth } from "@/hooks/useApiAuth";
import { useBackendSync } from "@/hooks/useBackendSync";
import type { MealKey, Store } from "@/lib/types";

const TABS: Tab[] = ["today", "week", "month", "shopping"];

export default function Home() {
  const plan = usePlan();
  const apiAuth = useApiAuth();
  const storeRef = useRef<Store>(plan.store);
  useEffect(() => { storeRef.current = plan.store; }, [plan.store]);
  useBackendSync(plan.store, storeRef, plan.applyingRemote, plan.applyRemote, apiAuth.user);

  const [tab, setTab] = useState<Tab>("today");
  const [swap, setSwap] = useState<SwapTarget | null>(null);
  const [daySheet, setDaySheet] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [generate, setGenerate] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deep-link the tab in the URL hash (shareable, back-button friendly).
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as Tab;
    if (TABS.includes(fromHash)) setTab(fromHash);
    const onHash = () => {
      const h = window.location.hash.replace("#", "") as Tab;
      if (TABS.includes(h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const goTab = useCallback((t: Tab) => { setTab(t); if (window.location.hash !== "#" + t) window.location.hash = t; }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);

  const setMeal = useCallback((day: string, meal: MealKey, name: string) => {
    const cur = plan.store.meals[day] || {};
    plan.saveDay(day, { ...cur, [meal]: name });
  }, [plan]);

  return (
    <div className="app">
      {tab === "today" && (
        <TodayScreen store={plan.store} view={plan.view} onSwap={(d, m) => setSwap({ day: d, meal: m })} onSettings={() => setSettings(true)} />
      )}
      {tab === "week" && (
        <WeekScreen store={plan.store} view={plan.view} onSwap={(d, m) => setSwap({ day: d, meal: m })} onGenerate={() => setGenerate(true)} />
      )}
      {tab === "month" && (
        <MonthScreen
          store={plan.store}
          view={plan.view}
          onPrev={() => plan.setView((v) => { const n = new Date(v); n.setMonth(n.getMonth() - 1); return n; })}
          onNext={() => plan.setView((v) => { const n = new Date(v); n.setMonth(n.getMonth() + 1); return n; })}
          onOpenDay={(k) => setDaySheet(k)}
          onGenerate={() => setGenerate(true)}
        />
      )}
      {tab === "shopping" && (
        <ShoppingScreen store={plan.store} view={plan.view} onSetBought={plan.setBought} />
      )}

      <TabBar active={tab} onChange={goTab} />

      <SwapSheet target={swap} store={plan.store} view={plan.view} onSet={setMeal} onClose={() => setSwap(null)} />
      <DayMealsSheet dayKey={daySheet} store={plan.store} view={plan.view} onSwap={(d, m) => setSwap({ day: d, meal: m })} onClearDay={plan.clearDay} onClose={() => setDaySheet(null)} />
      <SettingsSheet open={settings} store={plan.store} onPatch={plan.patchProfile} onClose={() => setSettings(false)} />
      <GenerateSheet
        open={generate}
        view={plan.view}
        auth={apiAuth}
        onClose={() => setGenerate(false)}
        onImport={(parsed, merge) => plan.importMenu(parsed, merge)}
        onToast={showToast}
      />
      <Toast message={toast} />
    </div>
  );
}
