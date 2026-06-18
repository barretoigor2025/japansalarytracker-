import { useState, useCallback, useMemo } from "react";
import { Card, Input, Select, Toggle, Badge } from "./ui.jsx";
import { calcDay, DAY_TYPES, YEN, formatMinutes, checkConflict } from "../utils/calc.js";

// ── EntryForm + CalcDetailModal ───────────────────────────────────────────────

function EntryForm({ initial, settings, onSave, onClose, entries = [] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(
    initial || {
      date: today,
      start: "09:00",
      end: "18:00",
      breakMinutes: 0,
      dayType: "normal",
      note: "",
    }
  );

  const calc = useMemo(() => {
    try {
      return calcDay(form, settings);
    } catch {
      return null;
    }
  }, [form, settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            {initial ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button onClick={onClose} className="text-xl transition-colors" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Data" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          {form.dayType !== "yukyu" && <Input label="Entrada" type="time" value={form.start} onChange={(e) => set("start", e.target.value)} />}
          {form.dayType !== "yukyu" && <Input label="Saída" type="time" value={form.end} onChange={(e) => set("end", e.target.value)} />}
          {/* Break */}
          {form.dayType !== "yukyu" && <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-medium tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Intervalo / Break</label>
            <div className="flex gap-2">
              {[{l:"Sem intervalo",v:0},{l:"30min",v:30},{l:"45min",v:45},{l:"1h",v:60}].map((p) => (
                <button key={p.v} onClick={() => set("breakMinutes", p.v)}
                  className="flex-1 py-1 rounded-lg text-xs font-medium transition-all"
                  style={form.breakMinutes === p.v
                    ? { background: "var(--text)", color: "var(--bg)", border: "1px solid var(--text)" }
                    : { background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }
                  }>
                  {p.l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="480" value={form.breakMinutes}
                onChange={(e) => set("breakMinutes", e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value,10)||0))}
                className="w-24 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>min {form.breakMinutes === 0 && <span className="font-semibold" style={{ color: "var(--warning)" }}>· sem intervalo ✓</span>}</span>
            </div>
          </div>}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Tipo de Dia</label>
            <div className="flex items-center gap-2">
              <select
                value={form.dayType}
                onChange={(e) => set("dayType", e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text)" }}>
                {DAY_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <button
                onClick={() => setForm(f => ({ ...f, dayType: "normal", start: "05:45", end: "17:00", breakMinutes: 60 }))}
                className="shrink-0 px-2.5 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                style={{
                  background: form.start === "05:45" && form.end === "17:00" ? "var(--warning)" : "transparent",
                  borderColor: "var(--warning)",
                  color: form.start === "05:45" && form.end === "17:00" ? "var(--bg)" : "var(--warning)"
                }}>
                ☀️ 昼勤
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, dayType: "normal", start: "17:00", end: "03:45", breakMinutes: 60 }))}
                className="shrink-0 px-2.5 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                style={{
                  background: form.start === "17:00" && form.end === "03:45" ? "var(--night)" : "transparent",
                  borderColor: "var(--night)",
                  color: form.start === "17:00" && form.end === "03:45" ? "#fff" : "var(--night)"
                }}>
                🌙 夜勤
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <Input label="Observação" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="opcional" />
          </div>
        </div>

        {/* Conflict warning */}
        {form.dayType !== "yukyu" && (() => {
          const conflict = checkConflict(form, entries || [], initial?.id);
          if (!conflict) return null;
          return (
            <div className="px-4 pb-2">
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <span className="text-base shrink-0" style={{ color: "var(--negative)" }}>⚠️</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--negative)" }}>Conflito de horário detectado</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--negative)" }}>{conflict.message}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Verifique os horários antes de salvar.</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Preview yukyu */}
        {form.dayType === "yukyu" && (
          <div className="px-4 pb-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="text-lg mb-1">🌿</div>
              <div className="text-sm font-semibold" style={{ color: "var(--positive)" }}>有給休暇</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>8h remuneradas · sem hora extra · sem noturno</div>
              <div className="font-mono font-bold mt-2" style={{ color: "var(--positive)" }}>{YEN(8 * settings.hourlyRate)}</div>
            </div>
          </div>
        )}

        {/* Preview rápido */}
        {form.dayType !== "yukyu" && calc && calc.totalHours > 0 && (
          <div className="px-4 pb-3">
            <div className="rounded-xl p-3 grid grid-cols-3 gap-3 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Total</div>
                <div className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{formatMinutes(calc.totalMin)}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>HE</div>
                <div className="text-sm font-mono font-bold" style={{ color: "var(--warning)" }}>{formatMinutes(calc.overtimeDailyMin)}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Bruto</div>
                <div className="text-sm font-mono font-bold" style={{ color: "var(--positive)" }}>{YEN(calc.grossPay)}</div>
              </div>
            </div>
            {(calc.nightHours > 0 || calc.isHoliday) && (
              <div className="flex gap-2 mt-2">
                {calc.nightHours > 0 && <Badge color="purple">🌙 {formatMinutes(calc.nightMin)} noturno</Badge>}
                {calc.isHoliday && <Badge color="red">📅 Feriado Legal</Badge>}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 px-4 pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
            style={{ border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ ...form, id: initial?.id || Date.now().toString() })}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function CalcDetailModal({ entry, settings, onClose }) {
  const calc = calcDay(entry, settings);

  const rows = [
    calc.breakdown?.isYukyu
      ? { label: "有給休暇", value: "8h remuneradas", note: "folga remunerada — salário base × 8h, sem hora extra ou noturno" }
      : { label: "Horas trabalhadas (líquido)", value: formatMinutes(calc.totalMin), note: `entrada ${entry.start} → saída ${entry.end}, break ${entry.breakMinutes}min` },
    { label: "Horas normais", value: calc.breakdown.jpSaturdayIsAllOT ? "0h (sábado)" : formatMinutes(calc.normalMin), note: calc.breakdown.jpSaturdayIsAllOT ? "sábado JP: todas as horas são hora extra" : `até ${settings.mode === "japan" ? "8h" : settings.customRules?.dailyHours + "h"} diárias` },
    { label: "Horas extras", value: formatMinutes(Math.round(calc.breakdown.overtimeNormal * 60 + calc.breakdown.overtimeHigh * 60)), note: calc.breakdown.jpSaturdayIsAllOT ? "6º dia → +25% em todas as horas (LSA Art.37)" : "acima do limite diário" },
    { label: "Horas noturnas (22h–05h)", value: formatMinutes(calc.nightMin), note: "+25% adicional noturno" },
    calc.isHoliday && { label: "Horas em feriado", value: formatMinutes(calc.totalMin), note: "+35% adicional feriado" },
    { label: "—", value: "", note: "" },
    { label: "Pagamento base", value: YEN(calc.normalPay), note: `${calc.normalHours}h × ¥${settings.hourlyRate}` },
    { label: "Pagamento hora extra", value: YEN(calc.overtimePay), note: `+${(calc.breakdown.rates.overtimeRate * 100).toFixed(0)}%` },
    { label: "Adicional noturno", value: YEN(calc.nightPay), note: `+${(calc.breakdown.rates.nightRate * 100).toFixed(0)}%` },
    calc.holidayPay > 0 && { label: "Adicional feriado", value: YEN(calc.holidayPay), note: `+${(calc.breakdown.rates.holidayRate * 100).toFixed(0)}%` },
    calc.satSunPay > 0 && { label: "Adicional sáb/dom", value: YEN(calc.satSunPay), note: "" },
    { label: "—", value: "", note: "" },
    { label: "BRUTO DO DIA", value: YEN(calc.grossPay), note: "", bold: true },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Detalhamento do Cálculo</h2>
          <button onClick={onClose} className="text-xl transition-colors" style={{ color: "var(--text-muted)" }}>×</button>
        </div>
        <div className="p-4 space-y-0.5 max-h-80 overflow-y-auto">
          {rows.map((r, i) =>
            r.label === "—" ? (
              <div key={i} className="border-t my-2" style={{ borderColor: "var(--border)" }} />
            ) : (
              <div key={i} className="flex justify-between items-start py-1.5">
                <div>
                  <div className="text-sm" style={{ color: r.bold ? "var(--warning)" : "var(--text-sub)" }}>{r.label}</div>
                  {r.note && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{r.note}</div>}
                </div>
                <div className="font-mono text-sm" style={{ color: r.bold ? "var(--warning)" : "var(--text)", fontWeight: r.bold ? "bold" : "normal" }}>{r.value}</div>
              </div>
            )
          )}
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export { EntryForm, CalcDetailModal };
