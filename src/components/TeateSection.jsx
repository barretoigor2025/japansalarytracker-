import { useState } from "react";
import { Card, Toggle, Input } from "./ui.jsx";
import { YEN } from "../utils/calc.js";

// ── TeateSection ──────────────────────────────────────────────────────────────

function TeateSection({ teate = [], onChange }) {
  function update(id, field, value) {
    onChange(teate.map(t => t.id === id ? { ...t, [field]: value } : t));
  }
  function add() {
    const newT = {
      id: "t" + Date.now(),
      name: "新手当",
      label: "Novo benefício",
      amount: 0,
      taxable: true,
      active: true,
    };
    onChange([...teate, newT]);
  }
  function remove(id) {
    onChange(teate.filter(t => t.id !== id));
  }

  const totalActive = teate.filter(t => t.active).reduce((a, t) => a + (t.amount || 0), 0);
  const totalNonTaxable = teate.filter(t => t.active && !t.taxable).reduce((a, t) => a + (t.amount || 0), 0);
  const totalTaxable = teate.filter(t => t.active && t.taxable).reduce((a, t) => a + (t.amount || 0), 0);

  return (
    <div className="space-y-2">
      {teate.map(t => (
        <div key={t.id} className={`border rounded-xl p-3 space-y-2 transition-all ${t.active ? "border-zinc-700 bg-zinc-900/50" : "border-zinc-800 bg-zinc-900/20 opacity-50"}`}>
          <div className="flex items-center gap-2">
            <div
              onClick={() => update(t.id, "active", !t.active)}
              className={`w-8 h-4 rounded-full transition-colors cursor-pointer shrink-0 ${t.active ? "bg-amber-500" : "bg-zinc-700"}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full m-0.5 transition-transform ${t.active ? "translate-x-4" : ""}`} />
            </div>
            <input
              value={t.label}
              onChange={e => update(t.id, "label", e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-zinc-200 focus:outline-none"
              placeholder="Nome do benefício"
            />
            <button onClick={() => remove(t.id)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">✕</button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              value={t.name}
              onChange={e => update(t.id, "name", e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-amber-500 transition-all"
              placeholder="Nome em japonês (opcional)"
            />
            <div className="relative flex items-center">
              <span className="absolute left-2 text-xs text-zinc-500">¥</span>
              <input
                type="number"
                min="0"
                value={t.amount}
                onChange={e => update(t.id, "amount", parseInt(e.target.value)||0)}
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg pl-5 pr-2 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <button
              onClick={() => update(t.id, "taxable", !t.taxable)}
              className={`text-xs px-2 py-1.5 rounded-lg border transition-all whitespace-nowrap ${t.taxable ? "border-orange-700/50 text-orange-400 bg-orange-900/20" : "border-blue-700/50 text-blue-400 bg-blue-900/20"}`}
            >
              {t.taxable ? "tributável" : "não trib."}
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full py-2 rounded-xl border border-dashed border-zinc-700 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all"
      >
        + Adicionar benefício
      </button>

      {teate.some(t => t.active) && (
        <div className="bg-zinc-800/50 rounded-xl p-2.5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Tributáveis</span>
            <span className="font-mono text-orange-400">{YEN(totalTaxable)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Não tributáveis</span>
            <span className="font-mono text-blue-400">{YEN(totalNonTaxable)}</span>
          </div>
          <div className="flex justify-between text-xs border-t border-zinc-700 pt-1.5">
            <span className="text-zinc-300 font-medium">Total 手当</span>
            <span className="font-mono font-bold text-amber-400">{YEN(totalActive)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { TeateSection };
