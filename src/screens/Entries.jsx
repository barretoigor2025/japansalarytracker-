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
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition-colors whitespace-nowrap"
        >
          + Lançar
        </button>
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-zinc-400 text-sm">Nenhum lançamento neste mês</div>
          <div className="text-zinc-600 text-xs mt-1">Clique em "+ Lançar" para começar</div>
        </Card>
      )}

      {filtered.map((entry) => {
        const calc = calcDay(entry, settings);
        const dayLabel = DAY_TYPES.find((d) => d.value === entry.dayType)?.label || entry.dayType;
        return (
          <Card key={entry.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-100">
                  {new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {entry.dayType === "yukyu"
                    ? "有給休暇 · 8h remuneradas"
                    : `${entry.start} → ${entry.end} · break ${entry.breakMinutes}min`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono text-green-400">{YEN(calc.grossPay)}</div>
                <div className="text-xs text-zinc-500">
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

            {entry.note && <div className="text-xs text-zinc-600 italic">{entry.note}</div>}

            <div className="flex gap-2 pt-1 border-t border-zinc-800">
              <button
                onClick={() => setDetailEntry(entry)}
                className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
              >
                Ver cálculo
              </button>
              <button
                onClick={() => { setEditEntry(entry); setIsDuplicate(false); setShowForm(true); }}
                className="text-xs text-zinc-500 hover:text-blue-400 transition-colors ml-2"
              >
                Editar
              </button>
              <button
                onClick={() => { setEditEntry({...entry, id: Date.now().toString()}); setIsDuplicate(true); setShowForm(true); }}
                className="text-xs text-zinc-500 hover:text-green-400 transition-colors"
              >
                Duplicar
              </button>
              <button
                onClick={() => setConfirmDelete(entry.id)}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors ml-auto"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{background:"rgba(0,0,0,0.8)"}}>
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
