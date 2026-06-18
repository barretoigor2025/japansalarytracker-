import { useState, useMemo } from "react";
import { calcDay, estimateDeductions, YEN, formatMinutes } from "../utils/calc.js";
import { getYukyuEntitlement } from "../utils/yukyu.js";
import { MonthPicker, SummaryCard, Card, Badge } from "../components/ui.jsx";
import { ExampleCalc } from "../components/ExampleCalc.jsx";
import { EntryForm } from "../components/EntryForm.jsx";
import { YukyuModal } from "../components/YukyuModal.jsx";

// ── DashboardScreen ─────────────────────────────────────────────────────

function DashboardScreen({ entries, settings, onAddEntry }) {
  const [showForm, setShowForm] = useState(false);
  const [showYukyu, setShowYukyu] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const thisMonth = month;
  const monthEntries = entries.filter((e) => e.date.startsWith(thisMonth));

  let accOT = 0;
  const calcs = monthEntries.map((e) => {
    const c = calcDay(e, settings, accOT);
    accOT += c.overtimeHours;
    return c;
  });

  const totals = calcs.reduce(
    (a, c) => ({
      totalHours: a.totalHours + c.totalHours,
      overtimeHours: a.overtimeHours + c.overtimeHours,
      nightHours: a.nightHours + c.nightHours,
      grossPay: a.grossPay + c.grossPay,
    }),
    { totalHours: 0, overtimeHours: 0, nightHours: 0, grossPay: 0 }
  );

  const deductionInfo = estimateDeductions(totals.grossPay, settings);

  // Última entrada
  const lastEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastCalc = lastEntry ? calcDay(lastEntry, settings) : null;

  // Dias trabalhados este mês
  const diasMes = monthEntries.length;

  const monthLabel = new Date(thisMonth + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      {/* Header boas-vindas */}
      <div className="pt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest">日本給与管理</div>
          <h2 className="text-2xl font-bold text-zinc-100 mt-1">
            {settings.name ? `Olá, ${settings.name.split(" ")[0]}` : "Japan Salary Tracker"}
          </h2>
        </div>
        <div className="mt-1 shrink-0">
          <MonthPicker value={month} onChange={setMonth} />
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-2">
        {(() => {
          const totalTeate = (settings.teate || []).filter(t => t.active).reduce((a, t) => a + (t.amount||0), 0);
          return (
            <>
              <SummaryCard icon="💴" label="Bruto Mês" value={YEN(totals.grossPay + totalTeate)} sub={totalTeate > 0 ? `inclui ${YEN(totalTeate)} teate` : "estimativa"} accent="text-green-400" />
              <SummaryCard icon="💰" label="Líquido Mês" value={YEN(deductionInfo.netPay + totalTeate)} sub="após descontos" accent="text-amber-400" />
            </>
          );
        })()}
        <SummaryCard icon="⏱️" label="Horas Totais" value={`${totals.totalHours.toFixed(1)}h`} sub={`${diasMes} dias`} />
        <SummaryCard icon="⚡" label="Horas Extras" value={`${totals.overtimeHours.toFixed(1)}h`}
          sub={totals.overtimeHours > 60 ? "⚠️ acima de 60h" : "este mês"}
          accent={totals.overtimeHours > 60 ? "text-red-400" : "text-amber-400"}
        />
      </div>

      {/* Barra de progresso horas extras */}
      {totals.overtimeHours > 0 && (
        <Card>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-zinc-400">Horas Extras (limite 60h/mês)</span>
            <span className={`font-mono font-bold ${totals.overtimeHours > 60 ? "text-red-400" : "text-amber-400"}`}>
              {totals.overtimeHours.toFixed(1)}h / 60h
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${totals.overtimeHours > 60 ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, (totals.overtimeHours / 60) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* 有給 Mini Cards */}
      {(() => {
        const entitlement = getYukyuEntitlement(settings.hireDate);
        const usedDays = entries.filter(e => e.dayType === "yukyu").length;
        const availableDays = entitlement?.daysTotal || 0;
        const remainingDays = Math.max(0, availableDays - usedDays);
        const hasAlert = entitlement?.expiringAlerts?.length > 0;
        return (
          <div className="flex gap-2">
            {/* Card: disponíveis */}
            <div className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-1">
                <span>🌿</span>
                <span className="uppercase tracking-widest font-medium text-xs">有給 disponível</span>
              </div>
              <div className="text-xl font-bold text-green-400">{remainingDays} <span className="text-sm font-normal text-zinc-500">dias</span></div>
              <div className="text-xs text-zinc-600 mt-0.5">Folga Remunerada (Yuukyuu)</div>
              {hasAlert && <div className="text-xs text-red-400 mt-0.5">⚠️ vencendo em breve</div>}
              {!settings.hireDate && <div className="text-xs text-zinc-600 mt-0.5">configure contratação</div>}
            </div>
            {/* Card: utilizados — clicável */}
            <button
              onClick={() => setShowYukyu(true)}
              className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-left hover:border-green-800/60 transition-all"
            >
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-1">
                <span>📋</span>
                <span className="uppercase tracking-widest font-medium text-xs">有給 usadas</span>
              </div>
              <div className="text-xl font-bold text-amber-400">{usedDays} <span className="text-sm font-normal text-zinc-500">dias</span></div>
              <div className="text-xs text-zinc-600 mt-0.5">Folga Remunerada (Yuukyuu)</div>
              <div className="text-xs text-zinc-600">toque para ver histórico</div>
            </button>
          </div>
        );
      })()}

      {/* Último lançamento */}
      {lastEntry && lastCalc && (
        <Card>
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Último Lançamento</div>
            <Badge color="gray">{new Date(lastEntry.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-zinc-300">{lastEntry.start} → {lastEntry.end}</div>
              <div className="text-xs text-zinc-600">break {lastEntry.breakMinutes}min · {formatMinutes(lastCalc.totalMin)} trabalhadas</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-green-400">{YEN(lastCalc.grossPay)}</div>
              {lastCalc.overtimeHours > 0 && <div className="text-xs text-amber-400">HE: {formatMinutes(lastCalc.overtimeDailyMin)}</div>}
            </div>
          </div>
        </Card>
      )}

      {/* Cenário de teste obrigatório */}
      <Card className="border-amber-800/30">
        <div className="text-xs text-amber-500 uppercase tracking-widest mb-2">🧪 Exemplo de Cálculo (22/02/2026)</div>
        <ExampleCalc settings={settings} />
      </Card>

      {/* Botão rápido */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
      >
        + Lançar Dia de Trabalho
      </button>

      {showForm && (
        <EntryForm
          settings={settings}
          entries={entries}
          onSave={(entry) => { onAddEntry(entry); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
      {showYukyu && (
        <YukyuModal
          entries={entries}
          settings={settings}
          onAddEntry={(entry) => { onAddEntry(entry); setShowYukyu(false); }}
          onClose={() => setShowYukyu(false)}
        />
      )}
    </div>
  );
}

export { DashboardScreen };
