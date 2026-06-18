import { useState } from "react";
import { calcDay, DAY_TYPES, YEN, formatMinutes, checkConflict } from "../utils/calc.js";
import { MonthPicker, Card, Badge } from "../components/ui.jsx";
import { EntryForm, CalcDetailModal } from "../components/EntryForm.jsx";

// Accent color per day type (top strip on card)
const DAY_ACCENT = {
  normal:           "#3b82f6",
  saturday:         "#eab308",
  holiday:          "#ef4444",
  yukyu:            "#22c55e",
  overtime_special: "#f97316",
};

function ActionBtn({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
        danger
          ? "text-zinc-600 hover:text-red-400 hover:bg-red-950/30"
          : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/40"
      }`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

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
  const workDays = filtered.filter(e => e.dayType !== "yukyu").length;

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <div className="flex items-center gap-2">
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

      {/* Month summary strip */}
      {filtered.length > 0 && (
        <div className="flex gap-2 text-xs px-1">
          <span style={{ color: "var(--text-muted)" }}>{workDays} dia{workDays !== 1 ? "s" : ""}</span>
          <span style={{ color: "var(--text-muted)" }}>·</span>
          <span className="font-mono font-semibold text-green-400">{YEN(monthTotal)}</span>
          <span style={{ color: "var(--text-muted)" }}>estimado</span>
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum lançamento neste mês</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Toque em "+ Lançar" para começar</div>
        </Card>
      )}

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

        return (
          <div
            key={entry.id}
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {/* Colored top strip */}
            <div style={{ height: 3, background: accent }} />

            <div className="p-3 space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
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
              {(() => {
                const badges = [];
                if (entry.dayType === "yukyu") badges.push(<Badge key="yukyu" color="green">🌿 有給休暇</Badge>);
                if (entry.dayType === "holiday") badges.push(<Badge key="hol" color="red">📅 Feriado</Badge>);
                if (entry.dayType === "saturday") badges.push(<Badge key="sat" color="yellow">土 Sábado</Badge>);
                if (!["normal","yukyu","holiday","saturday"].includes(entry.dayType)) {
                  const label = DAY_TYPES.find(d => d.value === entry.dayType)?.label || entry.dayType;
                  badges.push(<Badge key="dt" color="blue">{label}</Badge>);
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
                return badges.length > 0 ? (
                  <div className="flex flex-wrap gap-1">{badges}</div>
                ) : null;
              })()}

              {entry.note && (
                <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>{entry.note}</div>
              )}

              {/* Action row */}
              <div className="flex items-center gap-0.5 pt-1.5 border-t" style={{ borderColor: "var(--border)" }}>
                <ActionBtn icon="🧮" label="Cálculo" onClick={() => setDetailEntry(entry)} />
                <ActionBtn icon="✏️" label="Editar" onClick={() => { setEditEntry(entry); setIsDuplicate(false); setShowForm(true); }} />
                <ActionBtn icon="📋" label="Copiar" onClick={() => { setEditEntry({ ...entry, id: Date.now().toString() }); setIsDuplicate(true); setShowForm(true); }} />
                <div className="flex-1" />
                <ActionBtn icon="🗑" label="Excluir" onClick={() => setConfirmDelete(entry.id)} danger />
              </div>
            </div>
          </div>
        );
      })}

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
            if (isDuplicate || !editEntry) {
              onAdd(entry);
            } else {
              onEdit(entry);
            }
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
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { EntriesScreen };
