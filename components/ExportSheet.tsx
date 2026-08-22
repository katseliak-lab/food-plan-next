"use client";
import { useState } from "react";
import { buildExport } from "@/lib/plan";
import type { Store } from "@/lib/types";
import Icon from "./Icon";
import Sheet from "./Sheet";

interface ExportSheetProps {
  open: boolean;
  store: Store;
  view: Date;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export default function ExportSheet({ open, store, view, onClose, onCopy }: ExportSheetProps) {
  const [scope, setScope] = useState<"month" | "all">("month");
  const json = JSON.stringify(buildExport(store, view, scope), null, 2);

  return (
    <Sheet open={open} title="Експорт меню" onClose={onClose}>
      <p className="hint">Скопіюй цей JSON, щоб зберегти план або надіслати Claude на редагування.</p>
      <div className="seg">
        <button className={"seg-btn" + (scope === "month" ? " active" : "")} onClick={() => setScope("month")}>
          Цей місяць
        </button>
        <button className={"seg-btn" + (scope === "all" ? " active" : "")} onClick={() => setScope("all")}>
          Усе
        </button>
      </div>
      <textarea className="code-area" readOnly spellCheck={false} value={json} />
      <div className="sheet-actions">
        <button className="btn btn-primary full" onClick={() => onCopy(json)}>
          <Icon name="copy" /> Скопіювати
        </button>
      </div>
    </Sheet>
  );
}
