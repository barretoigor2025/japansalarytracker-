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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{background:"rgba(0,0,0,0.85)"}}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>有給休暇 — Folgas Remuneradas</h2>
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 shrink-0">
          <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--positive)" }}>Disponíveis</div>
            <div className="text-2xl font-bold" style={{ color: "var(--positive)" }}>{remainingDays}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>dias restantes</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--warning)" }}>Utilizados</div>
            <div className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{usedDays}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>dias tirados</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Total direito</div>
            <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{availableDays}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>dias totais</div>
          </div>
        </div>

        {/* Lotes ativos com validade */}
        {entitlement?.eligible && entitlement.availableGrants.length > 0 && (
          <div className="mx-4 mb-3 space-y-2 shrink-0">
            {entitlement.availableGrants.map((g, i) => {
              const daysLeft = Math.ceil((new Date(g.expiry) - new Date()) / 86400000);
              const urgency = daysLeft <= 90 ? "red" : daysLeft <= 180 ? "yellow" : "green";
              const colors = {
                red: { barColor: "var(--negative)", textColor: "var(--negative)", bgStyle: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" } },
                yellow: { barColor: "var(--warning)", textColor: "var(--warning)", bgStyle: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" } },
                green: { barColor: "var(--positive)", textColor: "var(--positive)", bgStyle: { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" } },
              }[urgency];
              return (
                <div key={i} className="rounded-xl p-3" style={colors.bgStyle}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{g.days} dias</span>
                      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>desde {new Date(g.date+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}</span>
                    </div>
                    <div className="text-xs font-semibold" style={{ color: colors.textColor }}>
                      {daysLeft <= 90 ? `⚠️ Vence em ${daysLeft} dias` : `Válido por ${Math.floor(daysLeft/30)} meses`}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                    <span>Validade</span>
                    <span>{new Date(g.expiry+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    <div className="h-1.5 rounded-full" style={{ width:`${Math.max(5,Math.min(100,(daysLeft/730)*100))}%`, background: colors.barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Próxima concessão */}
        {entitlement?.eligible && (
          <div className="mx-4 mb-3 rounded-xl px-3 py-2.5 shrink-0" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)" }}>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Próxima concessão</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Você receberá <span style={{ color: "var(--warning)" }}>+{entitlement.nextGrantDays} dias</span></div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>em {new Date(entitlement.nextGrantDate+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: "var(--warning)" }}>{entitlement.daysToNext}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>dias</div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de utilizados */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {yukyuEntries.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma 有給 utilizada ainda</div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Histórico de uso</div>
              {yukyuEntries.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "var(--positive)" }}>🌿</span>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}
                      </div>
                      {e.note && <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>{e.note}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: "var(--positive)" }}>{YEN(8 * settings.hourlyRate)}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>8h base</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão lançar */}
        <div className="p-4 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
          {!settings.hireDate && (
            <div className="text-xs text-center mb-2" style={{ color: "var(--text-muted)" }}>Configure a data de contratação em ⚙️ Config para ver seu saldo correto</div>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={settings.hireDate && remainingDays <= 0}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--positive)", color: "#fff" }}
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
