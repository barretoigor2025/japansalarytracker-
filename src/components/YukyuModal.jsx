import { useState } from "react";
import { Card } from "./ui.jsx";
import { getYukyuEntitlement, getYukyuUsed } from "../utils/yukyu.js";
import { YEN } from "../utils/calc.js";
import { EntryForm } from "./EntryForm.jsx";

// ── YukyuModal ────────────────────────────────────────────────────────────────

function YukyuModal({ entries, settings, onAddEntry, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [showYukyu, setShowYukyu] = useState(false);
  const yukyuEntries = entries.filter(e => e.dayType === "yukyu").sort((a,b) => b.date.localeCompare(a.date));
  const entitlement = getYukyuEntitlement(settings.hireDate);
  const usedDays = yukyuEntries.length;
  const availableDays = entitlement?.daysTotal || 0;
  const remainingDays = Math.max(0, availableDays - usedDays);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{background:"rgba(0,0,0,0.8)"}}>
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h2 className="text-sm font-semibold text-zinc-100">有給休暇 — Folgas Remuneradas</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-xl">×</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 shrink-0">
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-2.5 text-center">
            <div className="text-xs text-green-500 mb-1">Disponíveis</div>
            <div className="text-2xl font-bold text-green-400">{remainingDays}</div>
            <div className="text-xs text-zinc-500 mt-0.5">dias restantes</div>
          </div>
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-2.5 text-center">
            <div className="text-xs text-amber-500 mb-1">Utilizados</div>
            <div className="text-2xl font-bold text-amber-400">{usedDays}</div>
            <div className="text-xs text-zinc-500 mt-0.5">dias tirados</div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-2.5 text-center">
            <div className="text-xs text-zinc-400 mb-1">Total direito</div>
            <div className="text-2xl font-bold text-zinc-200">{availableDays}</div>
            <div className="text-xs text-zinc-500 mt-0.5">dias totais</div>
          </div>
        </div>

        {/* Lotes ativos com validade */}
        {entitlement?.eligible && entitlement.availableGrants.length > 0 && (
          <div className="mx-4 mb-3 space-y-2 shrink-0">
            {entitlement.availableGrants.map((g, i) => {
              const daysLeft = Math.ceil((new Date(g.expiry) - new Date()) / 86400000);
              const urgency = daysLeft <= 90 ? "red" : daysLeft <= 180 ? "yellow" : "green";
              const colors = {
                red: { bar:"bg-red-500", text:"text-red-400", bg:"bg-red-900/20 border-red-800/40" },
                yellow: { bar:"bg-yellow-500", text:"text-yellow-400", bg:"bg-yellow-900/20 border-yellow-800/40" },
                green: { bar:"bg-green-500", text:"text-green-400", bg:"bg-green-900/20 border-green-800/40" },
              }[urgency];
              return (
                <div key={i} className={`border rounded-xl p-3 ${colors.bg}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="text-sm font-bold text-zinc-100">{g.days} dias</span>
                      <span className="text-xs text-zinc-500 ml-2">desde {new Date(g.date+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}</span>
                    </div>
                    <div className={`text-xs font-semibold ${colors.text}`}>
                      {daysLeft <= 90 ? `⚠️ Vence em ${daysLeft} dias` : `Válido por ${Math.floor(daysLeft/30)} meses`}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 mb-1">
                    <span>Validade</span>
                    <span>{new Date(g.expiry+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
                    <div className={`h-1.5 rounded-full ${colors.bar}`} style={{width:`${Math.max(5,Math.min(100,(daysLeft/730)*100))}%`}} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Próxima concessão */}
        {entitlement?.eligible && (
          <div className="mx-4 mb-3 bg-amber-900/10 border border-amber-800/30 rounded-xl px-3 py-2.5 shrink-0">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Próxima concessão</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-zinc-100">Você receberá <span className="text-amber-400">+{entitlement.nextGrantDays} dias</span></div>
                <div className="text-xs text-zinc-500 mt-0.5">em {new Date(entitlement.nextGrantDate+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-amber-400">{entitlement.daysToNext}</div>
                <div className="text-xs text-zinc-500">dias</div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de utilizados */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {yukyuEntries.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-sm">Nenhuma 有給 utilizada ainda</div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Histórico de uso</div>
              {yukyuEntries.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-sm">🌿</span>
                    <div>
                      <div className="text-sm text-zinc-200 font-medium">
                        {new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}
                      </div>
                      {e.note && <div className="text-xs text-zinc-600 italic">{e.note}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-green-400">{YEN(8 * settings.hourlyRate)}</div>
                    <div className="text-xs text-zinc-600">8h base</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão lançar */}
        <div className="p-4 border-t border-zinc-800 shrink-0">
          {!settings.hireDate && (
            <div className="text-xs text-zinc-500 text-center mb-2">Configure a data de contratação em ⚙️ Config para ver seu saldo correto</div>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={settings.hireDate && remainingDays <= 0}
            className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            🌿 Lançar 有給休暇
          </button>
        </div>
      </div>

      {showForm && (
        <EntryForm
          initial={{ date: new Date().toISOString().slice(0,10), start:"09:00", end:"18:00", breakMinutes:0, dayType:"yukyu", note:"" }}
          settings={settings}
          onSave={(entry) => { onAddEntry(entry); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export { YukyuModal };
