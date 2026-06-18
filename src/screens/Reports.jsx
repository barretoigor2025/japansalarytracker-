import { useState, useMemo } from "react";
import { calcDay, estimateDeductions, YEN } from "../utils/calc.js";
import { MonthPicker, Card } from "../components/ui.jsx";

// ── ReportsScreen ─────────────────────────────────────────────────────

function ReportsScreen({ entries, settings }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showDetails, setShowDetails] = useState(false);

  const monthEntries = entries.filter((e) => e.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));

  let accOTHours = 0;
  const calcs = monthEntries.map((entry) => {
    const c = calcDay(entry, settings, accOTHours);
    accOTHours += c.overtimeHours;
    return c;
  });

  const totals = calcs.reduce(
    (acc, c) => ({
      totalHours: acc.totalHours + c.totalHours,
      normalHours: acc.normalHours + c.normalHours,
      overtimeHours: acc.overtimeHours + c.overtimeHours,
      nightHours: acc.nightHours + c.nightHours,
      grossPay: acc.grossPay + c.grossPay,
    }),
    { totalHours: 0, normalHours: 0, overtimeHours: 0, nightHours: 0, grossPay: 0 }
  );

  const teate = settings.teate || [];
  const activeTeate = teate.filter(t => t.active && t.amount > 0);
  const totalTeate = activeTeate.reduce((a, t) => a + t.amount, 0);
  const totalNonTax = activeTeate.filter(t => !t.taxable).reduce((a, t) => a + t.amount, 0);
  const grossWithTeate = totals.grossPay + totalTeate;
  const deductionInfo = estimateDeductions(grossWithTeate, settings);
  const netPay = deductionInfo.netPay;

  const yukyuEntries = monthEntries.filter(e => e.dayType === "yukyu");

  function exportCSV() {
    const header = "Data,Entrada,Saída,Break,Horas Total,Horas Normais,HE,Horas Noturnas,Bruto\n";
    const rows = monthEntries.map((e, i) => {
      const c = calcs[i];
      return `${e.date},${e.start},${e.end},${e.breakMinutes},${c.totalHours},${c.normalHours},${c.overtimeHours},${c.nightHours},${c.grossPay}`;
    });
    const csv = header + rows.join("\n");
    const uri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const a = document.createElement("a"); a.href = uri; a.download = `jornada-${month}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const monthLabel = new Date(month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Weekly summary
  const weekMap = {};
  monthEntries.forEach((entry, i) => {
    const d = new Date(entry.date + "T12:00:00");
    const weekNum = Math.ceil(d.getDate() / 7);
    if (!weekMap[weekNum]) weekMap[weekNum] = { entries: [], calcs: [] };
    weekMap[weekNum].entries.push(entry);
    weekMap[weekNum].calcs.push(calcs[i]);
  });

  if (monthEntries.length === 0) {
    return (
      <div className="space-y-3 pb-24 sm:pb-28">
        <div className="flex items-center gap-3 pt-1">
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <Card className="text-center py-12">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm" style={{color:"var(--text-muted)"}}>Sem dados para {monthLabel}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      {/* Month selector + CSV */}
      <div className="flex items-center gap-3 pt-1">
        <MonthPicker value={month} onChange={setMonth} />
        <button onClick={exportCSV}
          className="text-xs px-3 py-2 border rounded-lg transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>↓ CSV</button>
      </div>

      {/* ── RESULTADO FINANCEIRO — destaque principal ── */}
      <Card>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3 capitalize" style={{ color: "var(--text-muted)" }}>{monthLabel}</div>

        {/* Linha principal: Bruto → Descontos → Líquido */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>Bruto total</div>
            <div className="text-lg font-bold font-mono" style={{ color: "var(--positive)" }}>{YEN(grossWithTeate)}</div>
            {totalTeate > 0 && <div className="text-xs" style={{color:"var(--text-muted)"}}>incl. {YEN(totalTeate)} teate</div>}
          </div>
          <div className="text-xl" style={{color:"var(--text-muted)"}}>→</div>
          <div className="text-center">
            <div className="text-xs mb-1" style={{ color: "var(--negative)" }}>Descontos</div>
            <div className="text-lg font-bold font-mono" style={{ color: "var(--negative)" }}>−{YEN(deductionInfo.totalDeductions)}</div>
            <div className="text-xs" style={{ color: "var(--negative)" }}>{(deductionInfo.totalRate * 100).toFixed(1)}%</div>
          </div>
          <div className="text-xl" style={{color:"var(--text-muted)"}}>→</div>
          <div className="text-center">
            <div className="text-xs mb-1" style={{ color: "var(--warning)" }}>💰 Líquido</div>
            <div className="text-2xl font-bold font-mono" style={{ color: "var(--warning)" }}>{YEN(netPay)}</div>
            <div className="text-xs" style={{color:"var(--text-muted)"}}>{(100 - deductionInfo.totalRate * 100).toFixed(1)}% do bruto</div>
          </div>
        </div>

        {/* Barra visual bruto → líquido */}
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <div className="h-3 rounded-full transition-all"
            style={{ width: `${(netPay / grossWithTeate) * 100}%`, background: "var(--warning)" }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{color:"var(--text-muted)"}}>
          <span>¥0</span>
          <span>{YEN(netPay)} em mãos</span>
          <span>{YEN(grossWithTeate)}</span>
        </div>
      </Card>

      {/* ── HORAS — resumo compacto ── */}
      <Card>
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Horas Trabalhadas</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs mb-0.5" style={{color:"var(--text-muted)"}}>Total</div>
            <div className="text-base font-bold font-mono" style={{color:"var(--text)"}}>{totals.totalHours.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{color:"var(--text-muted)"}}>Normais</div>
            <div className="text-base font-bold font-mono" style={{color:"var(--text)"}}>{totals.normalHours.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{color:"var(--text-muted)"}}>Extras</div>
            <div className="text-base font-bold font-mono" style={{ color: totals.overtimeHours > 60 ? "var(--negative)" : "var(--warning)" }}>{totals.overtimeHours.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{color:"var(--text-muted)"}}>Noturnas</div>
            <div className="text-base font-bold font-mono" style={{ color: "var(--night)" }}>{totals.nightHours.toFixed(1)}h</div>
          </div>
        </div>
        {totals.overtimeHours > 60 && (
          <div className="mt-2 text-xs text-center" style={{ color: "var(--negative)" }}>⚠️ {totals.overtimeHours.toFixed(1)}h extras — acima de 60h, adicional +50% aplicado</div>
        )}
        {yukyuEntries.length > 0 && (
          <div className="mt-2 text-xs text-center" style={{ color: "var(--positive)" }}>🌿 {yukyuEntries.length} dia(s) de 有給休暇 neste mês</div>
        )}
      </Card>

      {/* ── DESCONTOS — expandível ── */}
      <Card>
        <button className="w-full flex items-center justify-between"
          onClick={() => setShowDetails(!showDetails)}>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Detalhamento de Descontos</div>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{showDetails ? "▲" : "▼"}</span>
        </button>
        {showDetails && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between py-1.5 border-b" style={{borderColor:"var(--border)"}}>
              <span className="text-sm font-semibold" style={{color:"var(--text)"}}>Bruto (salário)</span>
              <span className="font-mono" style={{ color: "var(--positive)" }}>{YEN(totals.grossPay)}</span>
            </div>
            {totalTeate > 0 && (
              <div className="flex justify-between py-1.5 border-b" style={{borderColor:"var(--border)"}}>
                <span className="text-xs" style={{color:"var(--text-muted)"}}>+ Benefícios (手当)</span>
                <span className="font-mono text-xs" style={{ color: "var(--positive)" }}>+{YEN(totalTeate)}</span>
              </div>
            )}
            {deductionInfo.deductions.map((d, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{borderColor:"var(--border)"}}>
                <div>
                  <div className="text-xs" style={{color:"var(--text)"}}>{d.name}</div>
                  <div className="text-xs" style={{color:"var(--text-muted)"}}>{(d.rate * 100).toFixed(2)}%</div>
                </div>
                <span className="font-mono text-xs" style={{ color: "var(--negative)" }}>−{YEN(d.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 mt-1 border-t-2" style={{borderColor:"var(--border)"}}>
              <span className="text-sm font-bold" style={{color:"var(--text)"}}>💰 Líquido estimado</span>
              <span className="font-mono font-bold text-lg" style={{ color: "var(--warning)" }}>{YEN(netPay)}</span>
            </div>
            <div className="p-2 rounded-lg text-xs" style={{background:"var(--bg-elevated)", color:"var(--text-muted)"}}>
              📋 Taxas baseadas no holerite real — Aichi-ken, Toyota-shi · Imposto de renda estimado
            </div>
          </div>
        )}
      </Card>

      {/* ── DETALHE DIÁRIO ── */}
      <Card className="overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Detalhe Diário</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
                <th className="text-left py-1.5 pr-2">Data</th>
                <th className="text-right py-1.5 pr-2">Horas</th>
                <th className="text-right py-1.5 pr-2">HE</th>
                <th className="text-right py-1.5 pr-2">🌙</th>
                <th className="text-right py-1.5">Bruto</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map((e, i) => {
                const c = calcs[i];
                return (
                  <tr key={e.id} className="border-b last:border-0" style={{borderColor:"var(--border)"}}>
                    <td className="py-1.5 pr-2" style={{color:"var(--text)"}}>
                      {new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      {e.dayType === "yukyu" && <span className="ml-1" style={{ color: "var(--positive)" }}>🌿</span>}
                    </td>
                    <td className="text-right py-1.5 pr-2 font-mono" style={{color:"var(--text-muted)"}}>{c.totalHours.toFixed(1)}h</td>
                    <td className="text-right py-1.5 pr-2 font-mono" style={{ color: "var(--warning)" }}>{c.overtimeHours > 0 ? c.overtimeHours.toFixed(1) + "h" : "—"}</td>
                    <td className="text-right py-1.5 pr-2 font-mono" style={{ color: "var(--night)" }}>{c.nightHours > 0 ? c.nightHours.toFixed(1) + "h" : "—"}</td>
                    <td className="text-right py-1.5 font-mono font-bold" style={{ color: "var(--positive)" }}>{YEN(c.grossPay)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2" style={{borderColor:"var(--border)"}}>
                <td className="py-1.5 pr-2 font-bold" style={{color:"var(--text)"}}>Total</td>
                <td className="text-right py-1.5 pr-2 font-mono font-bold" style={{color:"var(--text)"}}>{totals.totalHours.toFixed(1)}h</td>
                <td className="text-right py-1.5 pr-2 font-mono font-bold" style={{ color: "var(--warning)" }}>{totals.overtimeHours.toFixed(1)}h</td>
                <td className="text-right py-1.5 pr-2 font-mono font-bold" style={{ color: "var(--night)" }}>{totals.nightHours.toFixed(1)}h</td>
                <td className="text-right py-1.5 font-mono font-bold" style={{ color: "var(--positive)" }}>{YEN(totals.grossPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export { ReportsScreen };
