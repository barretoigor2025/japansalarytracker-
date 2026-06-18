import { useState } from "react";
import { YEN } from "../utils/calc.js";
import { Card } from "../components/ui.jsx";

// ── CarroScreen ─────────────────────────────────────────────────────

function CarroScreen({ carro, onSave }) {
  const [selId, setSelId] = useState(carro.financiamentos[0]?.id || null);
  const [editMode, setEditMode] = useState(false);
  const [showAddFinanc, setShowAddFinanc] = useState(false);
  const [showAddParcela, setShowAddParcela] = useState(false);
  const [newFinanc, setNewFinanc] = useState({ nome: "", valorTotal: 0 });
  const [newParcela, setNewParcela] = useState({ valor: 50000, mesRef: "" });

  const financ = carro.financiamentos.find(f => f.id === selId);

  function save(updated) {
    onSave({ ...carro, financiamentos: carro.financiamentos.map(f => f.id === updated.id ? updated : f) });
  }

  function toggleParcela(pid) {
    if (!financ) return;
    save({ ...financ, parcelas: financ.parcelas.map(p => p.id === pid ? { ...p, pago: !p.pago } : p) });
  }

  function toggleEntrada(eid) {
    if (!financ) return;
    save({ ...financ, entradas: financ.entradas.map(e => e.id === eid ? { ...e, pago: !e.pago } : e) });
  }

  function addParcela() {
    if (!financ) return;
    const np = { id: "p" + Date.now(), numero: financ.parcelas.length + 1, valor: newParcela.valor, mesRef: newParcela.mesRef, pago: false };
    save({ ...financ, parcelas: [...financ.parcelas, np] });
    setShowAddParcela(false);
    setNewParcela({ valor: 50000, mesRef: "" });
  }

  function removeParcela(pid) {
    if (!financ) return;
    save({ ...financ, parcelas: financ.parcelas.filter(p => p.id !== pid) });
  }

  function addFinanciamento() {
    if (!newFinanc.nome) return;
    const nf = { id: "f" + Date.now(), nome: newFinanc.nome, valorTotal: newFinanc.valorTotal, entradas: [], parcelas: [] };
    onSave({ ...carro, financiamentos: [...carro.financiamentos, nf] });
    setSelId(nf.id);
    setShowAddFinanc(false);
    setNewFinanc({ nome: "", valorTotal: 0 });
  }

  if (!financ) {
    return (
      <div className="space-y-3 pb-24 sm:pb-28 pt-2">
        <Card className="text-center py-12">
          <div className="text-5xl mb-3">🚗</div>
          <div className="text-sm font-semibold" style={{color:"var(--text)"}}>Nenhum financiamento</div>
          <button onClick={() => setShowAddFinanc(true)} className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold">+ Adicionar</button>
        </Card>
        {showAddFinanc && (
          <div className="fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4" style={{background:"rgba(0,0,0,0.82)"}}>
            <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
                <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>Novo Veículo</h3>
                <button onClick={() => setShowAddFinanc(false)} className="text-xl" style={{color:"var(--text-muted)"}}>x</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Nome</label>
                  <input value={newFinanc.nome} onChange={e => setNewFinanc(f => ({...f, nome: e.target.value}))}
                    className="rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500"
                    style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} placeholder="Ex: Outlander 2025" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Valor total</label>
                  <input type="number" inputMode="numeric" value={newFinanc.valorTotal}
                    onChange={e => setNewFinanc(f => ({...f, valorTotal: parseInt(e.target.value)||0}))}
                    className="rounded-xl px-4 py-3 text-xl font-bold font-mono text-right border focus:outline-none focus:border-amber-500"
                    style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />
                </div>
              </div>
              <div className="flex gap-3 px-4 pb-4">
                <button onClick={() => setShowAddFinanc(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>Cancelar</button>
                <button onClick={addFinanciamento} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm">Criar</button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setShowAddFinanc(false)} />
          </div>
        )}
      </div>
    );
  }

  const totalPago = financ.entradas.filter(e => e.pago).reduce((a, e) => a + e.valor, 0)
    + financ.parcelas.filter(p => p.pago).reduce((a, p) => a + p.valor, 0);
  const totalRestante = Math.max(0, financ.valorTotal - totalPago);
  const parcelasPagas = financ.parcelas.filter(p => p.pago).length;
  const proximaParcela = financ.parcelas.find(p => !p.pago);
  const progressoPct = financ.valorTotal > 0 ? Math.min(100, Math.round((totalPago / financ.valorTotal) * 100)) : 0;

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-xs uppercase tracking-widest" style={{color:"var(--text-muted)"}}>Financiamento</div>
          {editMode ? (
            <input value={financ.nome} onChange={e => save({...financ, nome: e.target.value})}
              className="text-lg font-bold bg-transparent border-b focus:outline-none"
              style={{color:"var(--text)", borderColor:"var(--border)"}} />
          ) : (
            <h2 className="text-lg font-bold" style={{color:"var(--text)"}}>{financ.nome}</h2>
          )}
        </div>
        <button onClick={() => setEditMode(!editMode)}
          className={"text-xs px-2.5 py-1.5 rounded-lg border transition-all " + (editMode ? "bg-amber-500 border-amber-500 text-black font-semibold" : "border-zinc-700 text-zinc-400")}>
          {editMode ? "Pronto" : "Editar"}
        </button>
      </div>

      {carro.financiamentos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {carro.financiamentos.map(f => (
            <button key={f.id} onClick={() => setSelId(f.id)}
              className={"px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap " + (selId === f.id ? "bg-amber-500 border-amber-500 text-black" : "border-zinc-700 text-zinc-400")}>
              {f.nome}
            </button>
          ))}
        </div>
      )}

      <Card>
        <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Progresso</div>
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-xs" style={{color:"var(--text-muted)"}}>Valor Total</div>
            {editMode ? (
              <input type="number" inputMode="numeric" value={financ.valorTotal}
                onChange={e => save({...financ, valorTotal: parseInt(e.target.value)||0})}
                className="text-xl font-bold font-mono bg-transparent border-b focus:outline-none w-36"
                style={{color:"var(--text)", borderColor:"var(--border)"}} />
            ) : (
              <div className="text-xl font-bold font-mono" style={{color:"var(--text)"}}>{YEN(financ.valorTotal)}</div>
            )}
          </div>
          <div className={"text-3xl font-bold " + (progressoPct >= 100 ? "text-green-400" : progressoPct >= 50 ? "text-amber-400" : "text-zinc-400")}>
            {progressoPct}%
          </div>
        </div>
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div className="h-3 rounded-full transition-all" style={{width: progressoPct + "%", background: progressoPct >= 100 ? "#22c55e" : "#f59e0b"}} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-2">
            <div className="text-xs text-green-500 mb-0.5">Pago</div>
            <div className="text-sm font-bold font-mono text-green-400">{YEN(totalPago)}</div>
          </div>
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-2">
            <div className="text-xs text-red-400 mb-0.5">Restante</div>
            <div className="text-sm font-bold font-mono text-red-400">{YEN(totalRestante)}</div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-2">
            <div className="text-xs mb-0.5" style={{color:"var(--text-muted)"}}>Parcelas</div>
            <div className="text-sm font-bold font-mono" style={{color:"var(--text)"}}>{parcelasPagas}/{financ.parcelas.length}</div>
          </div>
        </div>
        {proximaParcela && (
          <div className="mt-3 flex justify-between items-center bg-amber-900/10 border border-amber-800/30 rounded-xl px-3 py-2">
            <div>
              <div className="text-xs text-amber-400 font-semibold">Proxima parcela</div>
              <div className="text-xs" style={{color:"var(--text-muted)"}}>#{proximaParcela.numero}</div>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">{YEN(proximaParcela.valor)}</div>
          </div>
        )}
        {progressoPct >= 100 && <div className="mt-3 text-center text-sm font-bold text-green-400">Financiamento quitado!</div>}
      </Card>

      {financ.entradas.length > 0 && (
        <Card>
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Entrada Inicial</div>
          {financ.entradas.map(e => (
            <div key={e.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{borderColor:"var(--border)"}}>
              <button onClick={() => toggleEntrada(e.id)}
                className={"w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 " + (e.pago ? "bg-green-500 border-green-500" : "border-zinc-600")}>
                {e.pago && <span className="text-white text-xs font-bold">v</span>}
              </button>
              <span className={"flex-1 text-sm " + (e.pago ? "line-through" : "")} style={{color: e.pago ? "var(--text-muted)" : "var(--text)"}}>{e.descricao}</span>
              <span className={"font-mono text-sm font-semibold " + (e.pago ? "text-green-400" : "text-amber-400")}>{YEN(e.valor)}</span>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Parcelas</div>
          <span className="text-xs" style={{color:"var(--text-muted)"}}>{parcelasPagas}/{financ.parcelas.length} pagas</span>
        </div>
        {financ.parcelas.map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{borderColor:"var(--border)"}}>
            <button onClick={() => toggleParcela(p.id)}
              className={"w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 " + (p.pago ? "bg-green-500 border-green-500" : "border-zinc-600 hover:border-amber-500")}>
              {p.pago && <span className="text-white text-xs font-bold">v</span>}
            </button>
            <span className="text-xs w-5 text-center shrink-0" style={{color:"var(--text-muted)"}}>{p.numero}</span>
            <span className="flex-1 text-xs" style={{color: p.pago ? "var(--text-muted)" : "var(--text-sub)"}}>
              {p.mesRef ? new Date(p.mesRef + "-01").toLocaleDateString("pt-BR", {month:"short", year:"2-digit"}) : ""}
            </span>
            <span className={"font-mono text-sm font-semibold " + (p.pago ? "text-green-400 line-through" : p.id === proximaParcela?.id ? "text-amber-400" : "")}
              style={!p.pago && p.id !== proximaParcela?.id ? {color:"var(--text)"} : {}}>
              {YEN(p.valor)}
            </span>
            {editMode && <button onClick={() => removeParcela(p.id)} className="text-red-400 text-xs ml-1">x</button>}
          </div>
        ))}
        {editMode && (
          <button onClick={() => setShowAddParcela(true)}
            className="w-full mt-2 py-1.5 rounded-lg border border-dashed text-xs"
            style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
            + Adicionar Parcela
          </button>
        )}
      </Card>

      {showAddParcela && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4" style={{background:"rgba(0,0,0,0.82)"}}>
          <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
              <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>Nova Parcela</h3>
              <button onClick={() => setShowAddParcela(false)} className="text-xl" style={{color:"var(--text-muted)"}}>x</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Valor</label>
                <input type="number" inputMode="numeric" value={newParcela.valor}
                  onChange={e => setNewParcela(p => ({...p, valor: parseInt(e.target.value)||0}))}
                  className="rounded-xl px-4 py-3 text-xl font-bold font-mono text-right border focus:outline-none focus:border-amber-500"
                  style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Mes de referencia</label>
                <input type="month" value={newParcela.mesRef}
                  onChange={e => setNewParcela(p => ({...p, mesRef: e.target.value}))}
                  className="rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-amber-500"
                  style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />
              </div>
            </div>
            <div className="flex gap-3 px-4 pb-4">
              <button onClick={() => setShowAddParcela(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>Cancelar</button>
              <button onClick={addParcela} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm">Adicionar</button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowAddParcela(false)} />
        </div>
      )}

      <button onClick={() => setShowAddFinanc(true)}
        className="w-full py-2.5 rounded-xl border border-dashed text-sm" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
        + Adicionar outro veículo
      </button>

      {showAddFinanc && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4" style={{background:"rgba(0,0,0,0.82)"}}>
          <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
              <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>Novo Veiculo</h3>
              <button onClick={() => setShowAddFinanc(false)} className="text-xl" style={{color:"var(--text-muted)"}}>x</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Nome</label>
                <input value={newFinanc.nome} onChange={e => setNewFinanc(f => ({...f, nome: e.target.value}))}
                  className="rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500"
                  style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} placeholder="Ex: Outlander 2025" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Valor total</label>
                <input type="number" inputMode="numeric" value={newFinanc.valorTotal}
                  onChange={e => setNewFinanc(f => ({...f, valorTotal: parseInt(e.target.value)||0}))}
                  className="rounded-xl px-4 py-3 text-xl font-bold font-mono text-right border focus:outline-none focus:border-amber-500"
                  style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}} />
              </div>
            </div>
            <div className="flex gap-3 px-4 pb-4">
              <button onClick={() => setShowAddFinanc(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>Cancelar</button>
              <button onClick={addFinanciamento} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm">Criar</button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowAddFinanc(false)} />
        </div>
      )}
    </div>
  );
}

export { CarroScreen };
