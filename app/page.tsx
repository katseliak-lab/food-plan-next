"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Calendar from "@/components/Calendar";
import DaySheet from "@/components/DaySheet";
import ImportSheet from "@/components/ImportSheet";
import ExportSheet from "@/components/ExportSheet";
import ProductsSheet from "@/components/ProductsSheet";
import AccountSheet from "@/components/AccountSheet";
import Toast from "@/components/Toast";
import Icon from "@/components/Icon";
import { usePlan } from "@/hooks/usePlan";
import { useSync } from "@/hooks/useSync";
import { MONTHS } from "@/lib/foodData";
import type { Store } from "@/lib/types";

type SheetName = "day" | "import" | "export" | "products" | "account" | null;

export default function Home() {
  const plan = usePlan();
  const [sheet, setSheet] = useState<SheetName>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep a ref of the latest store for the sync push handler
  const storeRef = useRef<Store>(plan.store);
  useEffect(() => { storeRef.current = plan.store; }, [plan.store]);

  const sync = useSync(plan.store, storeRef, plan.applyingRemote, plan.applyRemote);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);

  const copy = useCallback(async (text: string, okMsg = "Скопійовано") => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(okMsg);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showToast(okMsg); } catch { /* ignore */ }
      ta.remove();
    }
  }, [showToast]);

  const close = () => setSheet(null);

  const onClearMonth = () => {
    const monthName = MONTHS[plan.view.getMonth()];
    const prefix = `${plan.view.getFullYear()}-${String(plan.view.getMonth() + 1).padStart(2, "0")}`;
    const count = Object.keys(plan.store.meals).filter((k) => k.startsWith(prefix)).length;
    if (!count) { showToast("Місяць уже порожній"); return; }
    if (window.confirm(`Видалити меню за ${monthName} (${count} дн.)?`)) {
      plan.clearMonth();
      showToast("Місяць очищено");
    }
  };

  const monthLabel = plan.ready ? `${MONTHS[plan.view.getMonth()]} ${plan.view.getFullYear()}` : "—";

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" aria-label="Попередній місяць"
          onClick={() => plan.setView((v) => { const n = new Date(v); n.setMonth(n.getMonth() - 1); return n; })}>
          <Icon name="chevronLeft" />
        </button>
        <div className="month-title">
          <h1>{monthLabel}</h1>
          <button className="today-btn" onClick={() => plan.goToMonth(new Date().getFullYear(), new Date().getMonth())}>
            Сьогодні
          </button>
        </div>
        <button className="icon-btn" aria-label="Наступний місяць"
          onClick={() => plan.setView((v) => { const n = new Date(v); n.setMonth(n.getMonth() + 1); return n; })}>
          <Icon name="chevronRight" />
        </button>
      </header>

      <Calendar store={plan.store} view={plan.view} onOpenDay={(k) => { setDayKey(k); setSheet("day"); }} />

      <nav className="toolbar">
        <button className="tool" onClick={() => setSheet("import")}><Icon name="sparkles" /><span>Від Claude</span></button>
        <button className="tool" onClick={() => setSheet("products")}><Icon name="cart" /><span>Продукти</span></button>
        <button className="tool" onClick={() => setSheet("export")}><Icon name="upload" /><span>Експорт</span></button>
        <button className="tool" onClick={onClearMonth}><Icon name="eraser" /><span>Очистити</span></button>
        <button className={"tool" + (sync.user ? " synced" : "")} onClick={() => setSheet("account")}>
          <Icon name="user" /><span>Акаунт</span>
        </button>
      </nav>

      <DaySheet
        open={sheet === "day"}
        dayKey={dayKey}
        initial={(dayKey && plan.store.meals[dayKey]) || {}}
        onSave={(k, m) => { plan.saveDay(k, m); showToast("Збережено"); }}
        onClear={(k) => { plan.clearDay(k); showToast("День очищено"); }}
        onClose={close}
      />

      <ImportSheet
        open={sheet === "import"}
        view={plan.view}
        onClose={close}
        onCopyPrompt={(t) => copy(t, "Промпт скопійовано")}
        onImport={(parsed, merge) => {
          const res = plan.importMenu(parsed, merge);
          if (res) showToast(`Імпортовано ${res.added} дн.`);
          return res;
        }}
      />

      <ExportSheet open={sheet === "export"} store={plan.store} view={plan.view} onClose={close} onCopy={(t) => copy(t, "JSON скопійовано")} />

      <ProductsSheet
        open={sheet === "products"}
        store={plan.store}
        view={plan.view}
        onClose={close}
        onPatchProfile={plan.patchProfile}
        onSetBought={plan.setBought}
        onCopy={(t) => copy(t, "Список скопійовано")}
      />

      <AccountSheet open={sheet === "account"} sync={sync} onClose={close} />

      <Toast message={toast} />
    </>
  );
}
