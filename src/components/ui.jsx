import { useState } from "react";

// ── Badge ─────────────────────────────────────────────────────────────────────
// color: "green" | "red" | "yellow" | "blue" | "gray" | "purple" | "orange"
function Badge({ color = "gray", children }) {
  const map = {
    green:  { bg: "rgba(34,197,94,0.12)",  text: "var(--positive)",  border: "rgba(34,197,94,0.25)" },
    red:    { bg: "rgba(239,68,68,0.12)",  text: "var(--negative)",  border: "rgba(239,68,68,0.25)" },
    yellow: { bg: "rgba(234,179,8,0.12)",  text: "#ca8a04",          border: "rgba(234,179,8,0.25)" },
    blue:   { bg: "rgba(96,165,250,0.12)", text: "var(--info)",      border: "rgba(96,165,250,0.25)" },
    gray:   { bg: "var(--bg-elevated)",    text: "var(--text-sub)",  border: "var(--border-mid)" },
    purple: { bg: "rgba(168,85,247,0.12)", text: "var(--night)",     border: "rgba(168,85,247,0.25)" },
    orange: { bg: "rgba(251,146,60,0.12)", text: "#f97316",          border: "rgba(251,146,60,0.25)" },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
      {children}
    </span>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Input({ label, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}>{label}</label>
      )}
      <input
        className="input-base"
        style={{ background: "var(--bg-input)", borderColor: "var(--border-mid)", color: "var(--text)" }}
        {...props}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function Select({ label, options, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}>{label}</label>
      )}
      <select
        className="input-base"
        style={{ background: "var(--bg-input)", borderColor: "var(--border-mid)", color: "var(--text)" }}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange, note }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors shrink-0"
        style={{ background: checked ? "var(--positive)" : "var(--border-strong)" }}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</div>
        {note && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{note}</div>}
      </div>
    </label>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl p-3 ${className}`}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

// ── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, accent }) {
  return (
    <Card className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 mb-0.5" style={{ color: "var(--text-muted)" }}>
        <span className="text-sm">{icon}</span>
        <span className="text-xs uppercase tracking-widest font-semibold">{label}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${accent || ""}`}
        style={!accent ? { color: "var(--text)" } : {}}>
        {value}
      </div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </Card>
  );
}

// ── MonthPicker ───────────────────────────────────────────────────────────────
function MonthPicker({ value, onChange }) {
  function shift(delta) {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  const label = new Date(value + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const labelFmt = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => shift(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}>
        ‹
      </button>
      <div className="flex-1 text-center py-1.5 rounded-lg text-sm font-semibold"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text)", minWidth: "140px" }}>
        {labelFmt}
      </div>
      <button onClick={() => shift(1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}>
        ›
      </button>
    </div>
  );
}

export { Badge, Input, Select, Toggle, Card, SummaryCard, MonthPicker };
