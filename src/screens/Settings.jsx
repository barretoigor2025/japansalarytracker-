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
        <h3 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-widest">Trabalhador</h3>
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
                <div className="bg-zinc-800/40 rounded-xl p-3">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Tempo de empresa</div>
                  <div className="text-base font-semibold text-zinc-100">
                    {yrs > 0 ? `${yrs} ano${yrs > 1 ? "s" : ""}` : ""}{yrs > 0 && mos > 0 ? " e " : ""}{mos > 0 ? `${mos} ${mos === 1 ? "mês" : "meses"}` : ""}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">desde {new Date(s.hireDate + "T12:00:00").toLocaleDateString("pt-BR", {day:"2-digit", month:"long", year:"numeric"})}</div>
                </div>

                {ent.eligible ? (
                  <>
                    {/* ── Lotes de 有給 ── */}
                    <div className="space-y-2">
                      <div className="text-xs text-zinc-500 uppercase tracking-widest">Lotes de 有給休暇</div>
                      {ent.availableGrants.map((g, i) => {
                        const daysLeft = Math.ceil((new Date(g.expiry) - new Date()) / 86400000);
                        const urgency = daysLeft <= 90 ? "red" : daysLeft <= 180 ? "yellow" : "green";
                        const colors = {
                          red: { bar: "bg-red-500", text: "text-red-400", bg: "bg-red-900/20 border-red-800/40" },
                          yellow: { bar: "bg-yellow-500", text: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800/40" },
                          green: { bar: "bg-green-500", text: "text-green-400", bg: "bg-green-900/20 border-green-800/40" },
                        }[urgency];
                        return (
                          <div key={i} className={`border rounded-xl p-3 ${colors.bg}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-sm font-semibold text-zinc-200">{g.days} dias</div>
                                <div className="text-xs text-zinc-500">concedidos em {new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR", {month:"long", year:"numeric"})}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xs font-semibold ${colors.text}`}>
                                  {daysLeft <= 0 ? "Vencido" : daysLeft <= 90 ? `⚠️ Vence em ${daysLeft} dias` : `Válido por ${Math.floor(daysLeft/30)} meses`}
                                </div>
                                <div className="text-xs text-zinc-600">{new Date(g.expiry + "T12:00:00").toLocaleDateString("pt-BR", {day:"2-digit", month:"short", year:"numeric"})}</div>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                              <div className={`h-1.5 rounded-full ${colors.bar}`} style={{width: `${Math.max(5, Math.min(100, (daysLeft / 730) * 100))}%`}} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Saldo total ── */}
                    <div className="flex items-center justify-between bg-zinc-800/40 rounded-xl px-3 py-2.5">
                      <div>
                        <div className="text-xs text-zinc-500">Saldo disponível</div>
                        <div className="text-xs text-zinc-600">todos os lotes ativos</div>
                      </div>
                      <div className="text-2xl font-bold text-green-400">{ent.daysTotal} <span className="text-sm font-normal text-zinc-500">dias</span></div>
                    </div>

                    {/* ── Próxima concessão ── */}
                    <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-3">
                      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Próxima concessão</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold text-zinc-100">Você receberá <span className="text-amber-400">+{ent.nextGrantDays} dias</span></div>
                          <div className="text-xs text-zinc-500 mt-0.5">em {new Date(ent.nextGrantDate + "T12:00:00").toLocaleDateString("pt-BR", {day:"2-digit", month:"long", year:"numeric"})}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-400">{ent.daysToNext}</div>
                          <div className="text-xs text-zinc-500">dias</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-zinc-800/40 rounded-xl p-3">
                    <div className="text-sm text-zinc-300">Ainda não elegível para 有給</div>
                    <div className="text-xs text-zinc-500 mt-1">Faltam <span className="text-amber-400 font-semibold">{ent.monthsToFirst} {ent.monthsToFirst === 1 ? "mês" : "meses"}</span> para receber os primeiros 10 dias</div>
                    <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
                      <div className="h-1.5 bg-amber-500 rounded-full" style={{width: `${Math.round(((6 - ent.monthsToFirst) / 6) * 100)}%`}} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-widest">Modo de Cálculo</h3>
        <div className="flex gap-3">
          {[{ value: "japan", label: "🇯🇵 Padrão Japão" }, { value: "custom", label: "⚙️ Personalizado" }].map((m) => (
            <button
              key={m.value}
              onClick={() => set("mode", m.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                s.mode === m.value
                  ? "bg-amber-500 text-black border-amber-500"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {s.mode === "japan" && (
          <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-500 space-y-1">
            <div>• Jornada: 8h/dia, 40h/semana</div>
            <div>• Hora extra: +25% | Noturno (22h–05h): +25%</div>
            <div>• Feriado legal: +35% | HE acima de 60h/mês: +50%</div>
          </div>
        )}
      </Card>

      {s.mode === "custom" && (
        <Card>
          <h3 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-widest">Regras Personalizadas</h3>
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
        <h3 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-widest">Descontos & Seguros</h3>
        <div className="space-y-2">
          <Toggle label="Kousei Nenkin (厚生年金)" note="aprox. 9.15%" checked={s.pension} onChange={(v) => set("pension", v)} />
          <Toggle label="Seguro Saúde (健康保険)" note="aprox. 5%" checked={s.healthInsurance} onChange={(v) => set("healthInsurance", v)} />
          <Toggle label="Seguro Desemprego (雇用保険)" note="aprox. 0.6%" checked={s.employmentInsurance} onChange={(v) => set("employmentInsurance", v)} />
          <Toggle label="Imposto Municipal (住民税)" note="aprox. 10%/ano via holerite" checked={s.municipalTax} onChange={(v) => set("municipalTax", v)} />
        </div>
        {s.age >= 40 && (
          <div className="mt-3 p-2 bg-zinc-800/50 rounded-lg text-xs text-zinc-500">
            ℹ️ Kaigo Hoken (介護保険) aplicado automaticamente — você tem {s.age} anos
          </div>
        )}
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/30 rounded-xl space-y-1.5">
          <div className="text-xs font-semibold text-blue-400">🏥 Cooperativa de Saúde</div>
          <div className="text-xs font-medium text-zinc-300">愛知県トラック事業健康保険組合</div>
          <div className="text-xs text-zinc-500">Setor de Caminhões — Aichi-ken · Toyota-shi</div>
          <div className="mt-1.5 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">健康保険</span><span className="font-mono text-zinc-400">10.5% total · 5.25% emp.</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">介護保険 (40+)</span><span className="font-mono text-zinc-400">1.64% total · 0.82% emp.</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">厚生年金</span><span className="font-mono text-zinc-400">18.3% total · 9.15% emp.</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">雇用保険</span><span className="font-mono text-zinc-400">0.6% emp.</span></div>
          </div>
          <div className="text-xs text-zinc-600 mt-1">* Cálculo sobre 標準報酬月額 — taxas do holerite real</div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-widest">Padrões de Jornada</h3>
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
        <h3 className="text-sm font-semibold text-amber-400 mb-1 uppercase tracking-widest">手当 — Benefícios Fixos</h3>
        <p className="text-xs text-zinc-500 mb-4">Valores do seu holerite. Aparecem no resumo mensal separado do salário.</p>
        <TeateSection
          teate={s.teate || []}
          onChange={(t) => set("teate", t)}
        />
      </Card>

      {/* ── Auditoria de Acertividade ── */}
      <Card>
        <h3 className="text-sm font-semibold text-amber-400 mb-1 uppercase tracking-widest">🎯 Auditoria de Acertividade</h3>
        <p className="text-xs mb-3" style={{color:"var(--text-muted)"}}>Compare o cálculo do app com seu holerite real e acompanhe a precisão mês a mês.</p>

        <div className="space-y-2">
          <input type="month" value={auditMonth} onChange={e => setAuditMonth(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 border transition-all"
            style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />

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
              <div className="bg-zinc-800/40 rounded-xl p-3 space-y-1.5">
                <div className="text-xs font-semibold mb-2" style={{color:"var(--text-sub)"}}>App calculou para {auditMonth}:</div>
                <div className="flex justify-between text-xs">
                  <span style={{color:"var(--text-muted)"}}>Bruto estimado</span>
                  <span className="font-mono text-green-400">{YEN(appBrutoTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{color:"var(--text-muted)"}}>Líquido estimado</span>
                  <span className="font-mono text-amber-400">{YEN(appLiquido)}</span>
                </div>
                {mEntries.length === 0 && <div className="text-xs text-zinc-600">Sem lançamentos neste mês</div>}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Bruto real (holerite)</label>
              <input type="number" placeholder="¥0" value={auditBruto}
                onChange={e => setAuditBruto(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-amber-500 font-mono"
                style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Líquido real (holerite)</label>
              <input type="number" placeholder="¥0" value={auditLiquido}
                onChange={e => setAuditLiquido(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-amber-500 font-mono"
                style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />
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
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
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
                  <div className="bg-zinc-800/40 rounded-xl p-2.5 text-center">
                    <div className="text-xs" style={{color:"var(--text-muted)"}}>Média Bruto</div>
                    <div className={`text-xl font-bold ${avgBruto >= 95 ? "text-green-400" : avgBruto >= 85 ? "text-amber-400" : "text-red-400"}`}>{avgBruto}%</div>
                  </div>
                  <div className="bg-zinc-800/40 rounded-xl p-2.5 text-center">
                    <div className="text-xs" style={{color:"var(--text-muted)"}}>Média Líquido</div>
                    <div className={`text-xl font-bold ${avgLiquido >= 95 ? "text-green-400" : avgLiquido >= 85 ? "text-amber-400" : "text-red-400"}`}>{avgLiquido}%</div>
                  </div>
                </div>
              );
            })()}
            {auditHistory.map((a, i) => (
              <div key={a.month} className="rounded-xl p-3 border" style={{borderColor:"var(--border)", background:"var(--bg-card)"}}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{color:"var(--text)"}}>
                    {new Date(a.month + "-01").toLocaleDateString("pt-BR", {month:"long", year:"numeric"})}
                  </span>
                  <div className="flex gap-2">
                    {a.brutoAcc !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.brutoAcc >= 95 ? "bg-green-900/40 text-green-400" : a.brutoAcc >= 85 ? "bg-amber-900/40 text-amber-400" : "bg-red-900/40 text-red-400"}`}>
                        B: {a.brutoAcc}%
                      </span>
                    )}
                    {a.liquidoAcc !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.liquidoAcc >= 95 ? "bg-green-900/40 text-green-400" : a.liquidoAcc >= 85 ? "bg-amber-900/40 text-amber-400" : "bg-red-900/40 text-red-400"}`}>
                        L: {a.liquidoAcc}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-xs" style={{color:"var(--text-muted)"}}>
                  <div>App bruto: <span className="font-mono text-green-400">{YEN(a.appBruto)}</span></div>
                  <div>Real: <span className="font-mono" style={{color:"var(--text)"}}>{YEN(a.realBruto)}</span></div>
                  <div>App líquido: <span className="font-mono text-amber-400">{YEN(a.appLiquido)}</span></div>
                  <div>Real: <span className="font-mono" style={{color:"var(--text)"}}>{YEN(a.realLiquido)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>



      <button
        onClick={() => onSave(s)}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
      >
        Salvar Configurações
      </button>
    </div>
  );
}

export { SettingsScreen };
