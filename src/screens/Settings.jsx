import { useState } from "react";
import { calcDay, estimateDeductions, YEN } from "../utils/calc.js";
import { getYukyuEntitlement } from "../utils/yukyu.js";
import { Input, Card, Toggle } from "../components/ui.jsx";
import { TeateSection } from "../components/TeateSection.jsx";

// ── SettingsScreen ─────────────────────────────────────────────────────

function SettingsScreen({ settings, onSave, entries = [], auditHistory = [], onSaveAudit }) {
  const [s, setS] = useState({ ...settings });
  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }));
  const [auditMonth, setAuditMonth] = useState(new Date().toISOString().slice(0, 7));
  const [auditBruto, setAuditBruto] = useState("");
  const [auditLiquido, setAuditLiquido] = useState("");
  const [auditSaved, setAuditSaved] = useState(false);

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <Card>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Trabalhador</h3>
        <div className="grid grid-cols-1 gap-3">
          <Input label="Nome" value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="Seu nome" />
          <Input label="Salário por hora (¥)" type="number" value={s.hourlyRate} onChange={(e) => set("hourlyRate", Number(e.target.value))} />
          <Input label="Idade" type="number" value={s.age} onChange={(e) => set("age", Number(e.target.value))} />
          <Input label="Prefeitura (para seguro saúde)" value={s.prefecture || ""} onChange={(e) => set("prefecture", e.target.value)} placeholder="Ex: Tokyo" />
          <div className="col-span-1">
            <Input label="Data de Contratação" type="date" value={s.hireDate || ""} onChange={(e) => set("hireDate", e.target.value)} />
          </div>
          {s.hireDate && (() => {
            const ent = getYukyuEntitlement(s.hireDate);
            if (!ent) return null;
            const yrs = ent.yearsService;
            const mos = ent.monthsRemainder;
            return (
              <div className="col-span-2 space-y-3">

                {/* ── Tempo de empresa ── */}
                <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Tempo de empresa</div>
                  <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
                    {yrs > 0 ? `${yrs} ano${yrs > 1 ? "s" : ""}` : ""}{yrs > 0 && mos > 0 ? " e " : ""}{mos > 0 ? `${mos} ${mos === 1 ? "mês" : "meses"}` : ""}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>desde {new Date(s.hireDate + "T12:00:00").toLocaleDateString("pt-BR", {day:"2-digit", month:"long", year:"numeric"})}</div>
                </div>

                {ent.eligible ? (
                  <>
                    {/* ── Lotes de 有給 ── */}
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Lotes de 有給休暇</div>
                      {ent.availableGrants.map((g, i) => {
                        const daysLeft = Math.ceil((new Date(g.expiry) - new Date()) / 86400000);
                        const urgency = daysLeft <= 90 ? "red" : daysLeft <= 180 ? "yellow" : "green";
                        const colors = {
                          red: { barColor: "var(--negative)", textColor: "var(--negative)", bgStyle: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" } },
                          yellow: { barColor: "var(--warning)", textColor: "var(--warning)", bgStyle: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" } },
                          green: { barColor: "var(--positive)", textColor: "var(--positive)", bgStyle: { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" } },
                        }[urgency];
                        return (
                          <div key={i} className="rounded-xl p-3" style={colors.bgStyle}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{g.days} dias</div>
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>concedidos em {new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR", {month:"long", year:"numeric"})}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold" style={{ color: colors.textColor }}>
                                  {daysLeft <= 0 ? "Vencido" : daysLeft <= 90 ? `⚠️ Vence em ${daysLeft} dias` : `Válido por ${Math.floor(daysLeft/30)} meses`}
                                </div>
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(g.expiry + "T12:00:00").toLocaleDateString("pt-BR", {day:"2-digit", month:"short", year:"numeric"})}</div>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                              <div className="h-1.5 rounded-full" style={{ width: `${Math.max(5, Math.min(100, (daysLeft / 730) * 100))}%`, background: colors.barColor }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Saldo total ── */}
                    <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                      <div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>Saldo disponível</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>todos os lotes ativos</div>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: "var(--positive)" }}>{ent.daysTotal} <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>dias</span></div>
                    </div>

                    {/* ── Próxima concessão ── */}
                    <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)" }}>
                      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Próxima concessão</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Você receberá <span style={{ color: "var(--warning)" }}>+{ent.nextGrantDays} dias</span></div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>em {new Date(ent.nextGrantDate + "T12:00:00").toLocaleDateString("pt-BR", {day:"2-digit", month:"long", year:"numeric"})}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: "var(--warning)" }}>{ent.daysToNext}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>dias</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-sm" style={{ color: "var(--text)" }}>Ainda não elegível para 有給</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Faltam <span className="font-semibold" style={{ color: "var(--warning)" }}>{ent.monthsToFirst} {ent.monthsToFirst === 1 ? "mês" : "meses"}</span> para receber os primeiros 10 dias</div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--bg-card)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.round(((6 - ent.monthsToFirst) / 6) * 100)}%`, background: "var(--warning)" }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Modo de Cálculo</h3>
        <div className="flex gap-3">
          {[{ value: "japan", label: "🇯🇵 Padrão Japão" }, { value: "custom", label: "⚙️ Personalizado" }].map((m) => (
            <button
              key={m.value}
              onClick={() => set("mode", m.value)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={s.mode === m.value
                ? { background: "var(--text)", color: "var(--bg)", border: "1px solid var(--text)" }
                : { background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        {s.mode === "japan" && (
          <div className="mt-3 p-3 rounded-lg text-xs space-y-1" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            <div>• Jornada: 8h/dia, 40h/semana</div>
            <div>• Hora extra: +25% | Noturno (22h–05h): +25%</div>
            <div>• Feriado legal: +35% | HE acima de 60h/mês: +50%</div>
          </div>
        )}
      </Card>

      {s.mode === "custom" && (
        <Card>
          <h3 className="text-sm font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Regras Personalizadas</h3>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Horas normais/dia"
              type="number"
              value={s.customRules?.dailyHours || 8}
              onChange={(e) => set("customRules", { ...s.customRules, dailyHours: Number(e.target.value) })}
            />
            <Input
              label="Horas normais/sem"
              type="number"
              value={s.customRules?.weeklyHours || 40}
              onChange={(e) => set("customRules", { ...s.customRules, weeklyHours: Number(e.target.value) })}
            />
            <Input
              label="Adicional HE (%)"
              type="number"
              value={((s.customRules?.overtimeRate || 0.25) * 100).toFixed(0)}
              onChange={(e) => set("customRules", { ...s.customRules, overtimeRate: Number(e.target.value) / 100 })}
            />
            <Input
              label="Adicional Noturno (%)"
              type="number"
              value={((s.customRules?.nightRate || 0.25) * 100).toFixed(0)}
              onChange={(e) => set("customRules", { ...s.customRules, nightRate: Number(e.target.value) / 100 })}
            />
            <Input
              label="Adicional Sábado (%)"
              type="number"
              value={((s.saturdayRate || 0) * 100).toFixed(0)}
              onChange={(e) => set("saturdayRate", Number(e.target.value) / 100)}
            />
            <Input
              label="Adicional Domingo (%)"
              type="number"
              value={((s.sundayRate || 0) * 100).toFixed(0)}
              onChange={(e) => set("sundayRate", Number(e.target.value) / 100)}
            />
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Descontos & Seguros</h3>
        <div className="space-y-2">
          <Toggle label="Kousei Nenkin (厚生年金)" note="aprox. 9.15%" checked={s.pension} onChange={(v) => set("pension", v)} />
          <Toggle label="Seguro Saúde (健康保険)" note="aprox. 5%" checked={s.healthInsurance} onChange={(v) => set("healthInsurance", v)} />
          <Toggle label="Seguro Desemprego (雇用保険)" note="aprox. 0.6%" checked={s.employmentInsurance} onChange={(v) => set("employmentInsurance", v)} />
          <Toggle label="Imposto Municipal (住民税)" note="aprox. 10%/ano via holerite" checked={s.municipalTax} onChange={(v) => set("municipalTax", v)} />
        </div>
        {s.age >= 40 && (
          <div className="mt-3 p-2 rounded-lg text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            ℹ️ Kaigo Hoken (介護保険) aplicado automaticamente — você tem {s.age} anos
          </div>
        )}
        <div className="mt-3 p-3 rounded-xl space-y-1.5" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
          <div className="text-xs font-semibold" style={{ color: "var(--info)" }}>🏥 Cooperativa de Saúde</div>
          <div className="text-xs font-medium" style={{ color: "var(--text)" }}>愛知県トラック事業健康保険組合</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Setor de Caminhões — Aichi-ken · Toyota-shi</div>
          <div className="mt-1.5 space-y-1 text-xs">
            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>健康保険</span><span className="font-mono" style={{ color: "var(--text-sub)" }}>10.5% total · 5.25% emp.</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>介護保険 (40+)</span><span className="font-mono" style={{ color: "var(--text-sub)" }}>1.64% total · 0.82% emp.</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>厚生年金</span><span className="font-mono" style={{ color: "var(--text-sub)" }}>18.3% total · 9.15% emp.</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>雇用保険</span><span className="font-mono" style={{ color: "var(--text-sub)" }}>0.6% emp.</span></div>
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>* Cálculo sobre 標準報酬月額 — taxas do holerite real</div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Padrões de Jornada</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Break padrão (min)"
            type="number"
            value={s.defaultBreak}
            onChange={(e) => set("defaultBreak", Number(e.target.value))}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-1 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>手当 — Benefícios Fixos</h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Valores do seu holerite. Aparecem no resumo mensal separado do salário.</p>
        <TeateSection
          teate={s.teate || []}
          onChange={(t) => set("teate", t)}
        />
      </Card>

      {/* ── Auditoria de Acertividade ── */}
      <Card>
        <h3 className="text-sm font-semibold mb-1 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>🎯 Auditoria de Acertividade</h3>
        <p className="text-xs mb-3" style={{color:"var(--text-muted)"}}>Compare o cálculo do app com seu holerite real e acompanhe a precisão mês a mês.</p>

        <div className="space-y-2">
          <input type="month" value={auditMonth} onChange={e => setAuditMonth(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border transition-all"
            style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />

          {(() => {
            // Calculate what app predicted for this month
            const mEntries = entries.filter(e => e.date.startsWith(auditMonth));
            let accOT = 0;
            const calcs = mEntries.map(e => { const c = calcDay(e, s, accOT); accOT += c.overtimeHours; return c; });
            const appBruto = calcs.reduce((a,c) => a + c.grossPay, 0);
            const totalTeate = (s.teate||[]).filter(t=>t.active).reduce((a,t)=>a+(t.amount||0),0);
            const appBrutoTotal = appBruto + totalTeate;
            const { netPay: appLiquido } = estimateDeductions(appBrutoTotal, s);

            return (
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="text-xs font-semibold mb-2" style={{color:"var(--text-sub)"}}>App calculou para {auditMonth}:</div>
                <div className="flex justify-between text-xs">
                  <span style={{color:"var(--text-muted)"}}>Bruto estimado</span>
                  <span className="font-mono" style={{ color: "var(--positive)" }}>{YEN(appBrutoTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{color:"var(--text-muted)"}}>Líquido estimado</span>
                  <span className="font-mono" style={{ color: "var(--warning)" }}>{YEN(appLiquido)}</span>
                </div>
                {mEntries.length === 0 && <div className="text-xs" style={{ color: "var(--text-muted)" }}>Sem lançamentos neste mês</div>}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Bruto real (holerite)</label>
              <input type="number" placeholder="¥0" value={auditBruto}
                onChange={e => setAuditBruto(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Líquido real (holerite)</label>
              <input type="number" placeholder="¥0" value={auditLiquido}
                onChange={e => setAuditLiquido(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border focus:outline-none font-mono"
                style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />
            </div>
          </div>

          <button
            onClick={() => {
              if (!auditBruto && !auditLiquido) return;
              const mEntries = entries.filter(e => e.date.startsWith(auditMonth));
              let accOT = 0;
              const calcs = mEntries.map(e => { const c = calcDay(e, s, accOT); accOT += c.overtimeHours; return c; });
              const appBruto = calcs.reduce((a,c) => a + c.grossPay, 0);
              const totalTeate = (s.teate||[]).filter(t=>t.active).reduce((a,t)=>a+(t.amount||0),0);
              const appBrutoTotal = appBruto + totalTeate;
              const { netPay: appLiquido } = estimateDeductions(appBrutoTotal, s);
              const realBruto = parseInt(auditBruto) || 0;
              const realLiquido = parseInt(auditLiquido) || 0;
              const brutoAcc = realBruto > 0 ? Math.round((1 - Math.abs(appBrutoTotal - realBruto) / realBruto) * 100) : null;
              const liquidoAcc = realLiquido > 0 ? Math.round((1 - Math.abs(appLiquido - realLiquido) / realLiquido) * 100) : null;
              const entry = { month: auditMonth, appBruto: appBrutoTotal, appLiquido, realBruto, realLiquido, brutoAcc, liquidoAcc, savedAt: new Date().toISOString() };
              const updated = [...auditHistory.filter(a => a.month !== auditMonth), entry].sort((a,b) => b.month.localeCompare(a.month));
              onSaveAudit(updated);
              setAuditBruto(""); setAuditLiquido(""); setAuditSaved(true);
              setTimeout(() => setAuditSaved(false), 2500);
            }}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            {auditSaved ? "✓ Salvo!" : "Registrar Holerite Real"}
          </button>
        </div>

        {/* Histórico de auditoria */}
        {auditHistory.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{color:"var(--text-muted)"}}>Histórico de Acertividade</div>
            {(() => {
              const avgBruto = Math.round(auditHistory.filter(a => a.brutoAcc !== null).reduce((s,a) => s + a.brutoAcc, 0) / auditHistory.filter(a => a.brutoAcc !== null).length);
              const avgLiquido = Math.round(auditHistory.filter(a => a.liquidoAcc !== null).reduce((s,a) => s + a.liquidoAcc, 0) / auditHistory.filter(a => a.liquidoAcc !== null).length);
              return (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs" style={{color:"var(--text-muted)"}}>Média Bruto</div>
                    <div className="text-xl font-bold" style={{ color: avgBruto >= 95 ? "var(--positive)" : avgBruto >= 85 ? "var(--warning)" : "var(--negative)" }}>{avgBruto}%</div>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs" style={{color:"var(--text-muted)"}}>Média Líquido</div>
                    <div className="text-xl font-bold" style={{ color: avgLiquido >= 95 ? "var(--positive)" : avgLiquido >= 85 ? "var(--warning)" : "var(--negative)" }}>{avgLiquido}%</div>
                  </div>
                </div>
              );
            })()}
            {auditHistory.map((a, i) => (
              <div key={a.month} className="rounded-xl p-3 border" style={{borderColor:"var(--border)", background:"var(--bg-elevated)"}}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{color:"var(--text)"}}>
                    {new Date(a.month + "-01").toLocaleDateString("pt-BR", {month:"long", year:"numeric"})}
                  </span>
                  <div className="flex gap-2">
                    {a.brutoAcc !== null && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                        background: a.brutoAcc >= 95 ? "rgba(34,197,94,0.15)" : a.brutoAcc >= 85 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                        color: a.brutoAcc >= 95 ? "var(--positive)" : a.brutoAcc >= 85 ? "var(--warning)" : "var(--negative)"
                      }}>
                        B: {a.brutoAcc}%
                      </span>
                    )}
                    {a.liquidoAcc !== null && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                        background: a.liquidoAcc >= 95 ? "rgba(34,197,94,0.15)" : a.liquidoAcc >= 85 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                        color: a.liquidoAcc >= 95 ? "var(--positive)" : a.liquidoAcc >= 85 ? "var(--warning)" : "var(--negative)"
                      }}>
                        L: {a.liquidoAcc}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-xs" style={{color:"var(--text-muted)"}}>
                  <div>App bruto: <span className="font-mono" style={{ color: "var(--positive)" }}>{YEN(a.appBruto)}</span></div>
                  <div>Real: <span className="font-mono" style={{color:"var(--text)"}}>{YEN(a.realBruto)}</span></div>
                  <div>App líquido: <span className="font-mono" style={{ color: "var(--warning)" }}>{YEN(a.appLiquido)}</span></div>
                  <div>Real: <span className="font-mono" style={{color:"var(--text)"}}>{YEN(a.realLiquido)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>



      <button
        onClick={() => onSave(s)}
        className="w-full py-3 rounded-xl font-bold text-sm transition-colors"
        style={{ background: "var(--text)", color: "var(--bg)" }}
      >
        Salvar Configurações
      </button>
    </div>
  );
}

export { SettingsScreen };
