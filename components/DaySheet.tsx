"use client";
import { useEffect, useState } from "react";
import { MEALS, MONTHS_GEN, WD, mondayIndex } from "@/lib/foodData";
import type { DayMeals, MealKey } from "@/lib/types";
import Icon from "./Icon";
import Sheet from "./Sheet";

const PLACEHOLDER: Record<MealKey, string> = {
  breakfast: "вівсянка з ягодами",
  lunch: "курка з рисом",
  dinner: "салат і риба",
  snack: "горіхи, яблуко",
};

interface DaySheetProps {
  open: boolean;
  dayKey: string | null;
  initial: DayMeals;
  onSave: (key: string, meals: DayMeals) => void;
  onClear: (key: string) => void;
  onClose: () => void;
}

export default function DaySheet({ open, dayKey, initial, onSave, onClear, onClose }: DaySheetProps) {
  const [meals, setMeals] = useState<DayMeals>(initial);

  useEffect(() => { setMeals(initial); }, [initial, dayKey]);

  if (!dayKey) return null;
  const [Y, M, D] = dayKey.split("-").map(Number);
  const dt = new Date(Y, M - 1, D);
  const title = `${D} ${MONTHS_GEN[M - 1]}, ${WD[mondayIndex(dt.getDay())]}`;

  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <div className="meal-fields">
        {MEALS.map((mm) => (
          <div key={mm.key} className={"meal " + mm.key}>
            <label>
              <Icon name={mm.ic} /> {mm.label}
            </label>
            <textarea
              rows={1}
              value={meals[mm.key] || ""}
              placeholder={"напр. " + PLACEHOLDER[mm.key]}
              onChange={(e) => setMeals((prev) => ({ ...prev, [mm.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={() => { onClear(dayKey); onClose(); }}>
          Очистити день
        </button>
        <button className="btn btn-primary" onClick={() => { onSave(dayKey, meals); onClose(); }}>
          Зберегти
        </button>
      </div>
    </Sheet>
  );
}
