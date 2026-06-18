import { useState, useMemo } from "react";
import { calcDay, estimateDeductions, YEN } from "../utils/calc.js";
import { Card } from "../components/ui.jsx";

// ── CompareScreen ─────────────────────────────────────────────────────

function CompareScreen({ entries, settings }) {
  const monthMap = {};
  entries.forEach(e => {
    const m = e.date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = [];
    monthMap[m].push(e);
  });
  const months = Object.keys(monthMap).sort();

  if (months.length === 0) {
    return (
      <div className="pb-24 space-y-3">
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">📈</div>
          <div className="text-sm" style={{color:"var(--text-muted)"}}>Nenhum dado para comparar</div>
        </Card>
      </div>
    );
  }

  const monthlyData = months.map(month => {
    const mEntries = monthMap[month].sort((a,b) => a.date.localeCompare(b.date));
    let accOT = 0;
    const calcs = mEntries.map(e => { const c = calcDay(e, settings, accOT); accOT += c.overtimeHours; return c; });
    const totalHours = calcs.reduce((a,c) => a + c.totalHours, 0);
    const overtimeHours = calcs.reduce((a,c) => a + c.overtimeHours, 0);
    const grossPay = calcs.reduce((a,c) => a + c.grossPay, 0);
    const totalTeate = (settings.teate||[]).filter(t=>t.active).reduce((a,t)=>a+(t.amount||0),0);
    const grossWithTeate = grossPay + totalTeate;
    const { totalDeductions, netPay, deductions } = estimateDeductions(grossWithTeate, settings);
    const yukyuDays = mEntries.filter(e => e.dayType === "yukyu").length;
    const workedDays = mEntries.filter(e => e.dayType !== "yukyu").length;
    const label = new Date(month + "-01").toLocaleDateString("pt-BR", { month:"short", year:"2-digit" });
    return { month, label, totalHours, overtimeHours, grossPay, grossWithTeate, totalDeductions, netPay, deductions, yukyuDays, workedDays };
  });

  const maxGross = Math.max(...monthlyData.map(d => d.grossWithTeate));
  const avgGross = Math.round(monthlyData.reduce((a,d) => a + d.grossWithTeate, 0) / monthlyData.length);
  const avgNet = Math.round(monthlyData.reduce((a,d) => a + d.netPay, 0) / monthlyData.length);
  const avgOT = (monthlyData.reduce((a,d) => a + d.overtimeHours, 0) / monthlyData.length).toFixed(1);
  const bestMonth = monthlyData.reduce((a,b) => a.grossWithTeate > b.grossWithTeate ? a : b);

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <div className="pt-1">
        <div className="text-xs uppercase tracking-widest" style={{color:"var(--text-muted)"}}>Comparativo</div>
        <h2 className="text-lg font-bold" style={{color:"var(--text)"}}>Evolução Mensal</h2>
        <div className="text-xs" style={{color:"var(--text-muted)"}}>{months.length} meses de histórico</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Card><div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>Média bruto/mês</div><div className="text-lg font-bold font-mono" style={{ color: "var(--positive)" }}>{YEN(avgGross)}</div></Card>
        <Card><div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>Média líquido/mês</div><div className="text-lg font-bold font-mono" style={{ color: "var(--warning)" }}>{YEN(avgNet)}</div></Card>
        <Card><div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>Média HE/mês</div><div className="text-lg font-bold" style={{color:"var(--text)"}}>{avgOT}h</div></Card>
        <Card><div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>Melhor mês</div><div className="text-sm font-bold" style={{ color: "var(--warning)" }}>{bestMonth.label}</div><div className="text-xs font-mono" style={{color:"var(--text-muted)"}}>{YEN(bestMonth.grossWithTeate)}</div></Card>
      </div>
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Bruto vs Líquido</h3>
        <div className="space-y-3">
          {monthlyData.map((d, i) => (
            <div key={d.month}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium w-12" style={{color:"var(--text)"}}>{d.label}</span>
                <div className="flex gap-3 text-xs font-mono">
                  <span style={{ color: "var(--positive)" }}>{YEN(d.grossWithTeate)}</span>
                  <span style={{color:"var(--text-muted)"}}>→</span>
                  <span style={{ color: "var(--warning)" }}>{YEN(d.netPay)}</span>
                </div>
              </div>
              <div className="relative h-5 rounded-lg overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                <div className="absolute top-0 left-0 h-full rounded-lg" style={{ width:`${maxGross>0?(d.grossWithTeate/maxGross)*100:0}%`, background: "rgba(34,197,94,0.3)" }} />
                <div className="absolute top-0 left-0 h-full rounded-lg" style={{ width:`${maxGross>0?(d.netPay/maxGross)*100:0}%`, background: "rgba(245,158,11,0.6)" }} />
                <div className="absolute right-2 top-0 h-full flex items-center">
                  <span className="text-xs font-mono" style={{ color: "var(--negative)" }}>-{YEN(d.totalDeductions)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs" style={{color:"var(--text-muted)"}}>
          <span><span className="inline-block w-3 h-2 rounded mr-1" style={{ background: "rgba(34,197,94,0.3)" }}></span>Bruto</span>
          <span><span className="inline-block w-3 h-2 rounded mr-1" style={{ background: "rgba(245,158,11,0.6)" }}></span>Líquido</span>
          <span><span className="inline-block w-3 h-2 rounded mr-1" style={{ background: "rgba(239,68,68,0.6)" }}></span>Descontos</span>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Tabela Detalhada</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
                <th className="text-left py-2 pr-2">Mês</th>
                <th className="text-right py-2 pr-2">Horas</th>
                <th className="text-right py-2 pr-2">Bruto</th>
                <th className="text-right py-2 pr-2">Desc.</th>
                <th className="text-right py-2">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((d, i) => {
                const prevNet = i > 0 ? monthlyData[i-1].netPay : null;
                const diff = prevNet ? d.netPay - prevNet : null;
                return (
                  <tr key={d.month} className="border-b last:border-0" style={{borderColor:"var(--border)"}}>
                    <td className="py-2 pr-2"><div className="font-medium" style={{color:"var(--text)"}}>{d.label}</div><div style={{color:"var(--text-muted)"}}>{d.workedDays}d{d.yukyuDays>0?` +${d.yukyuDays}有給`:""}</div></td>
                    <td className="text-right py-2 pr-2 font-mono" style={{color:"var(--text-muted)"}}>{d.totalHours.toFixed(0)}h</td>
                    <td className="text-right py-2 pr-2 font-mono" style={{ color: "var(--positive)" }}>{YEN(d.grossWithTeate)}</td>
                    <td className="text-right py-2 pr-2 font-mono" style={{ color: "var(--negative)" }}>-{YEN(d.totalDeductions)}</td>
                    <td className="text-right py-2"><div className="font-mono font-bold" style={{ color: "var(--warning)" }}>{YEN(d.netPay)}</div>{diff!==null&&<div className="text-xs font-mono" style={{ color: diff >= 0 ? "var(--positive)" : "var(--negative)" }}>{diff>=0?"▲":"▼"}{YEN(Math.abs(diff))}</div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export { CompareScreen };
