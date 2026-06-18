import { useState } from "react";
import { Card } from "./ui.jsx";
import { calcDay, YEN, formatMinutes } from "../utils/calc.js";

function ExampleCalc({ settings }) {
  const exampleEntry = { date: "2026-02-22", start: "17:00", end: "03:45", breakMinutes: 60, dayType: "normal", note: "Exemplo" };
  const calc = calcDay(exampleEntry, settings);

  return (
    <div className="space-y-2 text-xs">
      <div className="text-zinc-400">Entrada: 17:00 · Saída: 03:45 · Break: 1h</div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-zinc-500">Total líquido</div>
          <div className="font-mono font-bold text-zinc-200">{formatMinutes(calc.totalMin)}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-zinc-500">Horas extras</div>
          <div className="font-mono font-bold text-amber-400">{formatMinutes(calc.overtimeDailyMin)}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-zinc-500">Horas noturnas</div>
          <div className="font-mono font-bold text-purple-400">{formatMinutes(calc.nightMin)}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-zinc-500">Bruto (¥{settings.hourlyRate}/h)</div>
          <div className="font-mono font-bold text-green-400">{YEN(calc.grossPay)}</div>
        </div>
      </div>
      <div className="text-zinc-600 mt-1">
        • 17:00–22:00: 5h normais · 22:00–03:45: {formatMinutes(calc.nightMin)} noturno
        · HE = {formatMinutes(calc.overtimeDailyMin)} (acima de 8h)
      </div>
    </div>
  );
}

export { ExampleCalc };
