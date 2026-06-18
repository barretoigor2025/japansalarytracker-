import { useState } from "react";
import { Card } from "./ui.jsx";
import { calcDay, YEN, formatMinutes } from "../utils/calc.js";

function ExampleCalc({ settings }) {
  const exampleEntry = { date: "2026-02-22", start: "17:00", end: "03:45", breakMinutes: 60, dayType: "normal", note: "Exemplo" };
  const calc = calcDay(exampleEntry, settings);

  return (
    <div className="space-y-2 text-xs">
      <div style={{ color: "var(--text-muted)" }}>Entrada: 17:00 · Saída: 03:45 · Break: 1h</div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="rounded-lg p-2" style={{ background: "var(--bg-elevated)" }}>
          <div style={{ color: "var(--text-muted)" }}>Total líquido</div>
          <div className="font-mono font-bold" style={{ color: "var(--text)" }}>{formatMinutes(calc.totalMin)}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--bg-elevated)" }}>
          <div style={{ color: "var(--text-muted)" }}>Horas extras</div>
          <div className="font-mono font-bold" style={{ color: "var(--warning)" }}>{formatMinutes(calc.overtimeDailyMin)}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--bg-elevated)" }}>
          <div style={{ color: "var(--text-muted)" }}>Horas noturnas</div>
          <div className="font-mono font-bold" style={{ color: "var(--night)" }}>{formatMinutes(calc.nightMin)}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--bg-elevated)" }}>
          <div style={{ color: "var(--text-muted)" }}>Bruto (¥{settings.hourlyRate}/h)</div>
          <div className="font-mono font-bold" style={{ color: "var(--positive)" }}>{YEN(calc.grossPay)}</div>
        </div>
      </div>
      <div className="mt-1" style={{ color: "var(--text-muted)" }}>
        • 17:00–22:00: 5h normais · 22:00–03:45: {formatMinutes(calc.nightMin)} noturno
        · HE = {formatMinutes(calc.overtimeDailyMin)} (acima de 8h)
      </div>
    </div>
  );
}

export { ExampleCalc };
