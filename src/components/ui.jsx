import { useState } from "react";

// ── Shared UI Components ──────────────────────────────────────────────────────

function Badge({ color, children }) {
  const colors = {
    red: "bg-red-900/40 text-red-300 border-red-800/50",
    yellow: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
    blue: "bg-blue-900/40 text-blue-300 border-blue-800/50",
    green: "bg-green-900/40 text-green-300 border-green-800/50",
    gray: "bg-zinc-800 text-zinc-400 border-zinc-700",
    purple: "bg-purple-900/40 text-purple-300 border-purple-800/50",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{label}</label>}
      <input
        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-zinc-600"
        {...props}
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{label}</label>}
      <select
        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange, note }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-amber-500" : "bg-zinc-700"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      <div>
        <div className="text-sm text-zinc-200">{label}</div>
        {note && <div className="text-xs text-zinc-500">{note}</div>}
      </div>
    </label>
  );
}

function Card({ children, className = "", light = false }) {
  return (
    <div className={`rounded-xl p-3 border ${className}`}
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      {children}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, accent }) {
  return (
    <Card className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-0.5">
        <span>{icon}</span>
        <span className="uppercase tracking-widest font-medium">{label}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${accent || "text-zinc-100"}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </Card>
  );
}

function MonthPicker({ value, onChange }) {
  function shift(delta) {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, "0");
    onChange(ny + "-" + nm);
  }
  const label = new Date(value + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const labelFmt = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => shift(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:border-amber-500 hover:text-amber-400"
        style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
        ‹
      </button>
      <div className="flex-1 text-center px-2 py-1.5 rounded-lg border text-sm font-medium"
        style={{borderColor:"var(--border)", color:"var(--text)", background:"var(--bg-card)", minWidth:"140px"}}>
        {labelFmt}
      </div>
      <button onClick={() => shift(1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:border-amber-500 hover:text-amber-400"
        style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
        ›
      </button>
    </div>
  );
}

export { Badge, Input, Select, Toggle, Card, SummaryCard, MonthPicker };
