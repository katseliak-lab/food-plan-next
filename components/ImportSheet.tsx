"use client";
import { useState } from "react";
import { buildPrompt, extractJson } from "@/lib/plan";
import Icon from "./Icon";
import Sheet from "./Sheet";

interface ImportSheetProps {
  open: boolean;
  view: Date;
  onClose: () => void;
  onCopyPrompt: (text: string) => void;
  onImport: (parsed: unknown, merge: boolean) => { added: number; ingCount: number } | null;
}

export default function ImportSheet({ open, view, onClose, onCopyPrompt, onImport }: ImportSheetProps) {
  const [text, setText] = useState("");
  const [merge, setMerge] = useState(true);
  const [status, setStatus] = useState<{ msg: string; cls: string }>({ msg: "", cls: "" });

  const apply = () => {
    const raw = text.trim();
    if (!raw) { setStatus({ msg: "Порожньо — встав JSON.", cls: "err" }); return; }
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch (e) {
      setStatus({ msg: "Не вдалося прочитати JSON: " + (e as Error).message, cls: "err" });
      return;
    }
    const res = onImport(parsed, merge);
    if (!res) { setStatus({ msg: "Не знайдено жодного дня у знайомому форматі.", cls: "err" }); return; }
    const ingMsg = res.ingCount ? `, продуктів для ${res.ingCount} страв` : "";
    setStatus({ msg: `Готово: додано ${res.added} дн.${ingMsg}`, cls: "ok" });
    setTimeout(onClose, 700);
  };

  return (
    <Sheet open={open} title="Меню від Claude" onClose={onClose}>
      <p className="hint">
        1. Скопіюй промпт нижче і встав у чат із Claude. 2. Він поверне JSON — встав його сюди і
        натисни «Застосувати».
      </p>
      <button className="btn btn-ghost full" onClick={() => onCopyPrompt(buildPrompt(view))}>
        <Icon name="copy" /> Скопіювати промпт для Claude
      </button>
      <textarea
        className="code-area"
        placeholder="Встав сюди JSON, який згенерував Claude…"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className={"import-status " + status.cls}>{status.msg}</p>
      <div className="sheet-actions">
        <label className="merge-opt">
          <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} />
          Доповнити (не стирати наявне)
        </label>
        <button className="btn btn-primary" onClick={apply}>Застосувати</button>
      </div>
    </Sheet>
  );
}
