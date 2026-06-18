import { useState } from "react";
import {
  YEN, calcDay, calcJidoushaZei, estimateJuuminZei,
  estimateJuuminZeiFromGensen, calcShotokuZeiEstimado,
} from "../utils/calc.js";

const VKEY = "jst_tax_vehicles";
const GKEY = "jst_gensen";

function loadVehicles() {
  try { return JSON.parse(localStorage.getItem(VKEY) || "[]"); } catch { return []; }
}
function saveVehicles(list) { localStorage.setItem(VKEY, JSON.stringify(list)); }
function loadGensen() {
  try {
    const raw = JSON.parse(localStorage.getItem(GKEY) || "null");
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [{ ...raw, id: "g_legacy" }];
  } catch { return []; }
}

function VehicleForm({ initial, onSave, onCancel }) {
  const blank = { name: "", type: "normal", displacement: 1500, registrationYear: new Date().getFullYear(), weight: "", fuel: "gasoline", shakenExpiry: "" };
  const [v, setV] = useState(initial || blank);
  const f = (k, val) => setV((prev) => ({ ...prev, [k]: val }));
  const iCls = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500";
  const lCls = "text-xs text-zinc-400 mb-1 block";
  return (
    <div className="space-y-3 p-3 bg-zinc-800/60 rounded-xl border border-zinc-700">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={lCls}>Nome do veículo</label>
          <input className={iCls} value={v.name} onChange={(e) => f("name", e.target.value)} placeholder="ex: Honda Fit" />
        </div>
        <div>
          <label className={lCls}>Tipo</label>
          <select className={iCls} value={v.type} onChange={(e) => f("type", e.target.value)}>
            <option value="normal">普通車 / 小型車</option>
            <option value="kei">軽自動車 (Kei)</option>
          </select>
        </div>
        <div>
          <label className={lCls}>Combustível</label>
          <select className={iCls} value={v.fuel} onChange={(e) => f("fuel", e.target.value)}>
            <option value="gasoline">Gasolina / GLP</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Híbrido</option>
            <option value="electric">Elétrico (EV)</option>
          </select>
        </div>
        {v.type === "normal" && (
          <div>
            <label className={lCls}>Cilindrada (排気量)</label>
            <select className={iCls} value={v.displacement} onChange={(e) => f("displacement", Number(e.target.value))}>
              <option value={1000}>até 1.000cc</option>
              <option value={1500}>1.001 – 1.500cc</option>
              <option value={2000}>1.501 – 2.000cc</option>
              <option value={2500}>2.001 – 2.500cc</option>
              <option value={3000}>2.501 – 3.000cc</option>
              <option value={3500}>3.001 – 3.500cc</option>
              <option value={4000}>3.501 – 4.000cc</option>
              <option value={4500}>4.001 – 4.500cc</option>
              <option value={6000}>4.501 – 6.000cc</option>
              <option value={6001}>acima de 6.000cc</option>
            </select>
          </div>
        )}
        {v.type === "normal" && (
          <div>
            <label className={lCls}>Peso (kg) — opcional</label>
            <input type="number" className={iCls} value={v.weight || ""} onChange={(e) => f("weight", e.target.value)} placeholder="1300" />
          </div>
        )}
        <div>
          <label className={lCls}>Ano de registro (初度登録)</label>
          <input type="number" className={iCls} value={v.registrationYear} onChange={(e) => f("registrationYear", Number(e.target.value))} placeholder="2018" />
        </div>
        <div>
          <label className={lCls}>車検 validade (ano/mês)</label>
          <input type="month" className={iCls} value={v.shakenExpiry || ""} onChange={(e) => f("shakenExpiry", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(v)} className="flex-1 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold">Salvar</button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl bg-zinc-700 text-zinc-200 text-sm">Cancelar</button>
      </div>
    </div>
  );
}

export function ImpostosScreen({ entries, settings, onTabSwitch }) {
  const [vehicles, setVehicles] = useState(loadVehicles);
  const [showVForm, setShowVForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);

  const gensenList = loadGensen();
  const latestGensen = gensenList.length > 0 ? [...gensenList].sort((a, b) => b.nenBun - a.nenBun)[0] : null;

  // Monthly gross from entries
  const thisMonth = new Date().toISOString().slice(0, 7);
  const mEntries = entries.filter((e) => e.date.startsWith(thisMonth));
  let accOT = 0;
  const mCalcs = mEntries.map((e) => { const c = calcDay(e, settings, accOT); accOT += c.overtimeHours; return c; });
  const grossHours = mCalcs.reduce((a, c) => a + c.grossPay, 0);
  const taxTeate = (settings.teate || []).filter((t) => t.active && t.taxable !== false && t.amount > 0).reduce((a, t) => a + t.amount, 0);

  const jz =
    latestGensen?.shiharaiGaku > 0 && latestGensen?.shakaiHoken > 0
      ? estimateJuuminZeiFromGensen(latestGensen.shiharaiGaku, latestGensen.shakaiHoken, settings)
      : grossHours > 0
      ? estimateJuuminZei(grossHours + taxTeate, settings)
      : null;

  const vData = vehicles.map((v) => ({ ...v, calc: calcJidoushaZei(v) }));
  const totalJidousha = vData.reduce((a, v) => a + v.calc.annualTax, 0);
  const totalAnual = (jz?.total || 0) + totalJidousha;

  const restituicao =
    latestGensen?.shiharaiGaku > 0 && latestGensen?.shakaiHoken > 0 && latestGensen?.gensenZei > 0
      ? (() => {
          const est = calcShotokuZeiEstimado(latestGensen.shiharaiGaku, latestGensen.shakaiHoken, settings);
          return { estimated: est.total, paid: latestGensen.gensenZei, refund: est.total - latestGensen.gensenZei };
        })()
      : null;

  const shakenAlerts = vData
    .filter((v) => v.shakenExpiry)
    .map((v) => {
      const exp = new Date(v.shakenExpiry + "-01");
      const now = new Date();
      const months = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
      return { ...v, months };
    })
    .filter((v) => v.months <= 6)
    .sort((a, b) => a.months - b.months);

  function saveVehicle(v) {
    const isUpdate = vehicles.some((x) => x.id === v.id);
    const updated = isUpdate ? vehicles.map((x) => (x.id === v.id ? v : x)) : [...vehicles, { ...v, id: "v" + Date.now() }];
    setVehicles(updated);
    saveVehicles(updated);
    setShowVForm(false);
    setEditVehicle(null);
  }

  function removeVehicle(id) {
    if (!confirm("Remover este veículo?")) return;
    const updated = vehicles.filter((x) => x.id !== id);
    setVehicles(updated);
    saveVehicles(updated);
  }

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <div className="pt-1">
        <div className="text-xs uppercase tracking-widest text-zinc-500">Fiscal</div>
        <h2 className="text-lg font-bold text-zinc-100">Impostos · Painel</h2>
      </div>

      {/* Total anual */}
      {(jz || vData.length > 0) && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">Total anual estimado</div>
              <div className="text-2xl font-bold font-mono text-red-400">{YEN(totalAnual)}</div>
            </div>
            <div className="text-right space-y-1">
              {jz && <div className="text-xs text-zinc-500">住民税 <span className="font-mono text-orange-400">{YEN(jz.total)}</span></div>}
              {vData.length > 0 && <div className="text-xs text-zinc-500">自動車税 <span className="font-mono text-blue-400">{YEN(totalJidousha)}</span></div>}
            </div>
          </div>
        </div>
      )}

      {/* 住民税 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest">住民税 · Imposto Municipal</h3>
            <div className="text-xs text-zinc-500 mt-0.5">普通徴収 · 4 boletos (Jun · Ago · Out · Jan)</div>
          </div>
          {jz ? (
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-orange-400">{YEN(jz.total)}</div>
              <div className="text-xs text-zinc-500">por ano</div>
            </div>
          ) : (
            <div className="text-xs text-zinc-600">Cadastre um Gensen ou lance jornada</div>
          )}
        </div>
        {jz && (
          <>
            <div className="mb-3">
              {jz.fromGensen ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800/40">
                  Gensen {latestGensen.nenBun}年{latestGensen.empresa ? ` · ${latestGensen.empresa}` : ""} · dado real
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">Projeção mensal × 12</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {["Jun", "Ago", "Out", "Jan"].map((m) => (
                <div key={m} className="bg-zinc-800/60 rounded-xl p-2 text-center">
                  <div className="text-xs text-zinc-500">{m}</div>
                  <div className="text-sm font-bold font-mono text-orange-300">{YEN(jz.installment)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs border-t border-zinc-800 pt-2">
              <div className="flex justify-between"><span className="text-zinc-500">所得割 · 10%</span><span className="font-mono text-zinc-300">{YEN(jz.shotokuWari)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">均等割 + 森林環境税</span><span className="font-mono text-zinc-300">{YEN(jz.kintouWari)}</span></div>
              {jz.numDependents > 0 && <div className="text-zinc-600">{jz.numDependents} dependente(s) · -¥{(jz.numDependents * 33).toFixed(0)}万 da base</div>}
            </div>
          </>
        )}
        <div className="mt-3 pt-2 border-t border-zinc-800 text-xs text-zinc-600">
          Gerencie Gensens na aba{" "}
          <button onClick={() => onTabSwitch?.("gensen")} className="text-amber-500 underline">Gensen</button>
        </div>
      </div>

      {/* Restituição */}
      {restituicao && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Restituição · 年末調整</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-1">IR estimado pelo app</div>
              <div className="text-base font-bold font-mono text-zinc-300">{YEN(restituicao.estimated)}</div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-1">源泉徴収税額 · IR retido</div>
              <div className="text-base font-bold font-mono text-zinc-300">{YEN(restituicao.paid)}</div>
            </div>
          </div>
          {restituicao.refund > 0 ? (
            <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-3 mb-3">
              <div className="text-xs text-zinc-400 mb-1">Crédito estimado via 年末調整</div>
              <div className="text-2xl font-bold font-mono text-green-400">+{YEN(restituicao.refund)}</div>
              <div className="text-xs text-zinc-500 mt-1.5">Restituído no salário de dezembro pelo empregador</div>
            </div>
          ) : (
            <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-3">
              <div className="text-xs text-zinc-500">IR retido ≤ estimado — deduções adicionais do empregador já aplicadas</div>
            </div>
          )}
          <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-2">
            確定申告 · prazo <span className="text-zinc-400">16/Fev – 15/Mar</span> — deduções: 医療費, ふるさと納税
          </div>
        </div>
      )}

      {/* 自動車税 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest">自動車税 · Imposto Veicular</h3>
            <div className="text-xs text-zinc-500 mt-0.5">Vencimento em maio</div>
          </div>
          {vData.length > 0 && <div className="text-xl font-bold font-mono text-blue-400">{YEN(totalJidousha)}</div>}
        </div>

        {(showVForm || editVehicle) && (
          <div className="mb-3">
            <VehicleForm
              initial={editVehicle}
              onSave={saveVehicle}
              onCancel={() => { setShowVForm(false); setEditVehicle(null); }}
            />
          </div>
        )}

        {vData.length > 0 && (
          <div className="space-y-2 mb-3">
            {vData.map((v) => (
              <div key={v.id} className="bg-zinc-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm text-zinc-200 font-medium">{v.name || "Veículo"}</span>
                    <span className="text-xs text-zinc-500 ml-2">{v.type === "kei" ? "軽自動車" : `${v.displacement}cc`} · {v.registrationYear}</span>
                    {v.calc.isJuka && <span className="text-xs text-orange-500 ml-1">+15% (13+ anos)</span>}
                  </div>
                  <div className="text-sm font-bold font-mono text-blue-300">{YEN(v.calc.annualTax)}/ano</div>
                </div>
                {v.calc.juryoZei2yr && (
                  <div className="text-xs text-zinc-600">重量税 2 anos: {YEN(v.calc.juryoZei2yr)}</div>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  {v.shakenExpiry && (
                    <div className="text-xs text-zinc-500">車検: <span className="text-zinc-300">{v.shakenExpiry}</span></div>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => { setEditVehicle(v); setShowVForm(false); }} className="text-xs text-zinc-500 hover:text-amber-400">Editar</button>
                    <button onClick={() => removeVehicle(v.id)} className="text-xs text-zinc-600 hover:text-red-400">Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showVForm && !editVehicle && (
          <button
            onClick={() => setShowVForm(true)}
            className="w-full py-2 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-amber-600 hover:text-amber-400 text-sm transition-colors"
          >
            + Adicionar veículo
          </button>
        )}
      </div>

      {/* 車検 alertas */}
      {shakenAlerts.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">車検 · Vistorias próximas</h3>
          <div className="space-y-2">
            {shakenAlerts.map((v) => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  v.months < 0 ? "bg-red-900/20 border-red-800/40" : v.months < 3 ? "bg-yellow-900/20 border-yellow-800/40" : "bg-zinc-800/40 border-zinc-700/40"
                }`}
              >
                <span className="text-xs text-zinc-300">{v.name || "Veículo"}</span>
                <span className={`text-xs font-semibold ${v.months < 0 ? "text-red-400" : v.months < 3 ? "text-yellow-400" : "text-zinc-400"}`}>
                  {v.months < 0 ? "VENCIDA!" : `${v.shakenExpiry} · em ${v.months} mês(es)`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!jz && vData.length === 0 && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-6 text-center space-y-2">
          <div className="text-3xl">🏛️</div>
          <div className="text-sm text-zinc-400">Nenhum dado fiscal cadastrado</div>
          <div className="text-xs text-zinc-600 space-y-1">
            <div>Acesse <button onClick={() => onTabSwitch?.("gensen")} className="text-amber-500">Gensen</button> para cadastrar o comprovante anual (住民税)</div>
            <div>e adicione seus veículos abaixo para calcular 自動車税</div>
          </div>
        </div>
      )}
    </div>
  );
}
