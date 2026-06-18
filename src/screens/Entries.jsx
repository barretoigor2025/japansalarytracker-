import { useState } from "react";
import { calcDay, DAY_TYPES, YEN, formatMinutes, checkConflict } from "../utils/calc.js";
import { MonthPicker, Badge } from "../components/ui.jsx";
import { EntryForm, CalcDetailModal } from "../components/EntryForm.jsx";

// Left-border accent color per day type
const DAY_ACCENT = {
  normal:           "#3b82f6",   // azul
  saturday:         "#eab308",   // amarelo
  holiday:          "#ef4444",   // vermelho
  yukyu:            "#22c55e",   // verde
  overtime_special: "#f97316",   // laranja
};

// ── EntriesScreen ─────────────────────────────────────────────────────

function EntriesScreen({ entries, settings, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = entries
    .filter((e) => e.date.startsWith(filterMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Month summary
  const monthTotal = filtered.reduce((s, e) => s + (calcDay(e, settings).grossPay || 0), 0);

  return (
    <div className="space-y-2 pb-24 sm:pb-28">
      {/* Controls */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1">
          <MonthPicker value={filterMonth} onChange={setFilterMonth} />
        </div>
        <button
          onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
        >
          + Lançar
        </button>
      </div>

      {/* Month summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.filter(e => e.dayType !== "yukyu").length} dias trabalhados
          </span>
          <span className="text-sm font-bold font-mono text-green-400">{YEN(monthTotal)}</span>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum lançamento neste mês</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Toque em "+ Lançar" para começar</div>
        </div>
      )}

      {/* Entry cards */}
      {filtered.map((entry) => {
        const calc = calcDay(entry, settings);
        const accent = DAY_ACCENT[entry.dayType] || "#8b5cf6";

        const dateLabel = new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", {
          weekday: "short", day: "2-digit", month: "short",
        });

        const timeInfo = entry.dayType === "yukyu"
          ? "有給休暇 · 8h remuneradas"
          : `${entry.start} → ${entry.end} · ${entry.breakMinutes}min intervalo`;

        const hoursLabel = calc.breakdown?.jpSaturdayIsAllOT
          ? `${formatMinutes(calc.totalMin)} · 100% HE`
          : formatMinutes(calc.totalMin);

        // Build badge list
        const badges = [];
        if (entry.dayType === "yukyu")   badges.push(<Badge key="yukyu" color="green">🌿 有給休暇</Badge>);
        if (entry.dayType === "holiday") badges.push(<Badge key="hol" color="red">📅 Feriado</Badge>);
        if (entry.dayType === "saturday") badges.push(<Badge key="sat" color="yellow">土 Sábado</Badge>);
        if (!["normal","yukyu","holiday","saturday"].includes(entry.dayType)) {
          const lbl = DAY_TYPES.find(d => d.value === entry.dayType)?.label || entry.dayType;
          badges.push(<Badge key="dt" color="blue">{lbl}</Badge>);
        }
        if (calc.overtimeHours > 0) {
          const otMin = calc.breakdown?.jpSaturdayIsAllOT ? calc.totalMin : calc.overtimeDailyMin;
          badges.push(
            <Badge key="he" color="yellow">
              HE {formatMinutes(otMin)}
              {calc.breakdown?.jpSaturdayIsAllOT && <span className="ml-1 opacity-60 text-xs">100%</span>}
            </Badge>
          );
        }
        if (calc.nightHours > 0) badges.push(<Badge key="night" color="purple">🌙 {formatMinutes(calc.nightMin)}</Badge>);

        return (
          <div
            key={entry.id}
            className="rounded-xl border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              borderLeftColor: accent,
              borderLeftWidth: "4px",
            }}
          >
            <div className="p-3">
              {/* Header: date + pay */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{dateLabel}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{timeInfo}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold font-mono text-green-400">{YEN(calc.grossPay)}</div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{hoursLabel}</div>
                </div>
              </div>

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">{badges}</div>
              )}

              {/* Note */}
              {entry.note && (
                <div className="text-xs italic mt-1.5" style={{ color: "var(--text-muted)" }}>{entry.note}</div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-0 mt-2.5 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={() => setDetailEntry(entry)}
                  className="text-xs px-1 py-0.5 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f59e0b"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >Ver cálculo</button>
                <span className="text-xs mx-1.5" style={{ color: "var(--text-muted)" }}>·</span>
                <button
                  onClick={() => { setEditEntry(entry); setIsDuplicate(false); setShowForm(true); }}
                  className="text-xs px-1 py-0.5 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#60a5fa"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >Editar</button>
                <span className="text-xs mx-1.5" style={{ color: "var(--text-muted)" }}>·</span>
                <button
                  onClick={() => { setEditEntry({ ...entry, id: Date.now().toString() }); setIsDuplicate(true); setShowForm(true); }}
                  className="text-xs px-1 py-0.5 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#4ade80"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >Duplicar</button>
                <button
                  onClick={() => setConfirmDelete(entry.id)}
                  className="ml-auto text-xs px-1 py-0.5 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >Excluir</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Forms & modals */}
      {showForm && (
        <EntryForm
          initial={editEntry}
          entries={entries}
          settings={settings}
          onSave={(entry) => {
            const conflict = checkConflict(entry, entries, isDuplicate ? null : editEntry?.id);
            if (conflict) {
              alert("Conflito de horário: " + conflict.message);
              return;
            }
            if (isDuplicate || !editEntry) onAdd(entry);
            else onEdit(entry);
            setShowForm(false);
            setEditEntry(null);
            setIsDuplicate(false);
          }}
          onClose={() => { setShowForm(false); setEditEntry(null); setIsDuplicate(false); }}
        />
      )}

      {detailEntry && (
        <CalcDetailModal entry={detailEntry} settings={settings} onClose={() => setDetailEntry(null)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center">
            <div className="text-3xl mb-3">🗑️</div>
            <div className="text-base font-semibold text-zinc-100 mb-1">Excluir lançamento?</div>
            <div className="text-sm text-zinc-500 mb-6">Esta ação não pode ser desfeita.</div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400"
              >Cancelar</button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm"
              >Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { EntriesScreen };
