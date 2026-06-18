import { useState, useCallback } from "react";
import { calcDay, DAY_TYPES, YEN, formatMinutes, checkConflict } from "../utils/calc.js";
import { MonthPicker, Card, Badge } from "../components/ui.jsx";
import { EntryForm, CalcDetailModal } from "../components/EntryForm.jsx";

// ── EntriesScreen ─────────────────────────────────────────────────────

function EntriesScreen({ entries, settings, onAdd, onEdit, onDelete, onDuplicate }) {
  const [showForm, setShowForm] = useState(false);
  const [showYukyu, setShowYukyu] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = entries
    .filter((e) => e.date.startsWith(filterMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <div className="flex items-center gap-3">
<MonthPicker value={filterMonth} onChange={setFilterMonth} />
        <button
          onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-xl transition-colors whitespace-nowrap"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          + Lançar
        </button>
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm" style={{ color: "var(--text-sub)" }}>Nenhum lançamento neste mês</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Clique em "+ Lançar" para começar</div>
        </Card>
      )}

      {filtered.map((entry) => {
        const calc = calcDay(entry, settings);
        const dayLabel = DAY_TYPES.find((d) => d.value === entry.dayType)?.label || entry.dayType;
        return (
          <Card key={entry.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {entry.dayType === "yukyu"
                    ? "有給休暇 · 8h remuneradas"
                    : `${entry.start} → ${entry.end} · break ${entry.breakMinutes}min`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono" style={{ color: "var(--positive)" }}>{YEN(calc.grossPay)}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {calc.breakdown?.jpSaturdayIsAllOT
                    ? `${formatMinutes(calc.totalMin)} · 100% HE`
                    : `${formatMinutes(calc.totalMin)} trabalhadas`}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {entry.dayType === "yukyu" && <Badge color="green">🌿 有給休暇</Badge>}
              {entry.dayType === "holiday" && <Badge color="red">📅 Feriado Legal</Badge>}
              {entry.dayType === "saturday" && <Badge color="yellow">土 Sábado</Badge>}
              {entry.dayType !== "normal" && entry.dayType !== "yukyu" && entry.dayType !== "holiday" && entry.dayType !== "saturday" && (
                <Badge color="blue">{dayLabel}</Badge>
              )}
              {calc.overtimeHours > 0 && (
                <Badge color="yellow">
                  HE {formatMinutes(calc.breakdown?.jpSaturdayIsAllOT ? calc.totalMin : calc.overtimeDailyMin)}
                  {calc.breakdown?.jpSaturdayIsAllOT && <span className="ml-1 opacity-60 text-xs">100%</span>}
                </Badge>
              )}
              {calc.nightHours > 0 && <Badge color="purple">🌙 {formatMinutes(calc.nightMin)}</Badge>}
            </div>

            {entry.note && <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>{entry.note}</div>}

            <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setDetailEntry(entry)}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => e.currentTarget.style.color = "var(--warning)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                Ver cálculo
              </button>
              <button
                onClick={() => { setEditEntry(entry); setIsDuplicate(false); setShowForm(true); }}
                className="text-xs transition-colors ml-2"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => e.currentTarget.style.color = "var(--text)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                Editar
              </button>
              <button
                onClick={() => { setEditEntry({...entry, id: Date.now().toString()}); setIsDuplicate(true); setShowForm(true); }}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => e.currentTarget.style.color = "var(--positive)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                Duplicar
              </button>
              <button
                onClick={() => setConfirmDelete(entry.id)}
                className="text-xs transition-colors ml-auto"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => e.currentTarget.style.color = "var(--negative)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                Excluir
              </button>
            </div>
          </Card>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="text-3xl mb-3">🗑️</div>
            <div className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>Excluir lançamento?</div>
            <div className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Esta ação não pode ser desfeita.</div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                style={{ border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: "var(--negative)", color: "#fff" }}
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
