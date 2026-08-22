"use client";

export type Tab = "today" | "week" | "month" | "shopping";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Сьогодні" },
  { id: "week", label: "Тиждень" },
  { id: "month", label: "Місяць" },
  { id: "shopping", label: "Покупки" },
];

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Розділи">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? "on" : undefined}
          aria-current={active === t.id ? "page" : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="kick">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
