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
          <button
            onClick={() => setShowAddFinanc(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >+ Adicionar</button>
        </Card>
        {showAddFinanc && (
          <div className="fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4" style={{background:"rgba(0,0,0,0.85)"}}>
            <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
                <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>Novo Veículo</h3>
                <button onClick={() => setShowAddFinanc(false)} className="text-xl" style={{color:"var(--text-muted)"}}>x</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Nome</label>
                  <input value={newFinanc.nome} onChange={e => setNewFinanc(f => ({...f, nome: e.target.value}))}
                    className="rounded-xl px-4 py-2.5 text-sm border focus:outline-none"
                    style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} placeholder="Ex: Outlander 2025" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Valor total</label>
                  <input type="number" inputMode="numeric" value={newFinanc.valorTotal}
                    onChange={e => setNewFinanc(f => ({...f, valorTotal: parseInt(e.target.value)||0}))}
                    className="rounded-xl px-4 py-3 text-xl font-bold font-mono text-right border focus:outline-none"
                    style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />
                </div>
              </div>
              <div className="flex gap-3 px-4 pb-4">
                <button onClick={() => setShowAddFinanc(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{borderColor:"var(--border-mid)", color:"var(--text-muted)"}}>Cancelar</button>
                <button onClick={addFinanciamento} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: "var(--text)", color: "var(--bg)" }}>Criar</button>
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
        <button
          onClick={() => setEditMode(!editMode)}
          className="text-xs px-2.5 py-1.5 rounded-lg border transition-all"
          style={editMode
            ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
            : { background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }
          }
        >
          {editMode ? "Pronto" : "Editar"}
        </button>
      </div>

      {carro.financiamentos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {carro.financiamentos.map(f => (
            <button
              key={f.id}
              onClick={() => setSelId(f.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap"
              style={selId === f.id
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }
              }
            >
              {f.nome}
            </button>
          ))}
        </div>
      )}

      <Card>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Progresso</div>
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
          <div className="text-3xl font-bold" style={{ color: progressoPct >= 100 ? "var(--positive)" : progressoPct >= 50 ? "var(--warning)" : "var(--text-sub)" }}>
            {progressoPct}%
          </div>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-elevated)" }}>
          <div className="h-3 rounded-full transition-all" style={{width: progressoPct + "%", background: progressoPct >= 100 ? "var(--positive)" : "var(--warning)"}} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl p-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="text-xs mb-0.5" style={{ color: "var(--positive)" }}>Pago</div>
            <div className="text-sm font-bold font-mono" style={{ color: "var(--positive)" }}>{YEN(totalPago)}</div>
          </div>
          <div className="rounded-xl p-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="text-xs mb-0.5" style={{ color: "var(--negative)" }}>Restante</div>
            <div className="text-sm font-bold font-mono" style={{ color: "var(--negative)" }}>{YEN(totalRestante)}</div>
          </div>
          <div className="rounded-xl p-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="text-xs mb-0.5" style={{color:"var(--text-muted)"}}>Parcelas</div>
            <div className="text-sm font-bold font-mono" style={{color:"var(--text)"}}>{parcelasPagas}/{financ.parcelas.length}</div>
          </div>
        </div>
        {proximaParcela && (
          <div className="mt-3 flex justify-between items-center rounded-xl px-3 py-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)" }}>
            <div>
              <div className="text-xs font-semibold" style={{ color: "var(--warning)" }}>Proxima parcela</div>
              <div className="text-xs" style={{color:"var(--text-muted)"}}>#{proximaParcela.numero}</div>
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: "var(--warning)" }}>{YEN(proximaParcela.valor)}</div>
          </div>
        )}
        {progressoPct >= 100 && <div className="mt-3 text-center text-sm font-bold" style={{ color: "var(--positive)" }}>Financiamento quitado!</div>}
      </Card>

      {financ.entradas.length > 0 && (
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Entrada Inicial</div>
          {financ.entradas.map(e => (
            <div key={e.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{borderColor:"var(--border)"}}>
              <button onClick={() => toggleEntrada(e.id)}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ background: e.pago ? "var(--positive)" : "transparent", borderColor: e.pago ? "var(--positive)" : "var(--border-strong)" }}>
                {e.pago && <span className="text-white text-xs font-bold">v</span>}
              </button>
              <span className={"flex-1 text-sm " + (e.pago ? "line-through" : "")} style={{color: e.pago ? "var(--text-muted)" : "var(--text)"}}>{e.descricao}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: e.pago ? "var(--positive)" : "var(--warning)" }}>{YEN(e.valor)}</span>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Parcelas</div>
          <span className="text-xs" style={{color:"var(--text-muted)"}}>{parcelasPagas}/{financ.parcelas.length} pagas</span>
        </div>
        {financ.parcelas.map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{borderColor:"var(--border)"}}>
            <button onClick={() => toggleParcela(p.id)}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ background: p.pago ? "var(--positive)" : "transparent", borderColor: p.pago ? "var(--positive)" : "var(--border-strong)" }}>
              {p.pago && <span className="text-white text-xs font-bold">v</span>}
            </button>
            <span className="text-xs w-5 text-center shrink-0" style={{color:"var(--text-muted)"}}>{p.numero}</span>
            <span className="flex-1 text-xs" style={{color: p.pago ? "var(--text-muted)" : "var(--text-sub)"}}>
              {p.mesRef ? new Date(p.mesRef + "-01").toLocaleDateString("pt-BR", {month:"short", year:"2-digit"}) : ""}
            </span>
            <span className="font-mono text-sm font-semibold" style={{
              color: p.pago ? "var(--positive)" : p.id === proximaParcela?.id ? "var(--warning)" : "var(--text)",
              textDecoration: p.pago ? "line-through" : "none"
            }}>
              {YEN(p.valor)}
            </span>
            {editMode && <button onClick={() => removeParcela(p.id)} className="text-xs ml-1" style={{ color: "var(--negative)" }}>x</button>}
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
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4" style={{background:"rgba(0,0,0,0.85)"}}>
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
                  className="rounded-xl px-4 py-3 text-xl font-bold font-mono text-right border focus:outline-none"
                  style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Mes de referencia</label>
                <input type="month" value={newParcela.mesRef}
                  onChange={e => setNewParcela(p => ({...p, mesRef: e.target.value}))}
                  className="rounded-xl px-4 py-3 text-sm border focus:outline-none"
                  style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />
              </div>
            </div>
            <div className="flex gap-3 px-4 pb-4">
              <button onClick={() => setShowAddParcela(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{borderColor:"var(--border-mid)", color:"var(--text-muted)"}}>Cancelar</button>
              <button onClick={addParcela} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: "var(--text)", color: "var(--bg)" }}>Adicionar</button>
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
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4" style={{background:"rgba(0,0,0,0.85)"}}>
          <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
              <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>Novo Veiculo</h3>
              <button onClick={() => setShowAddFinanc(false)} className="text-xl" style={{color:"var(--text-muted)"}}>x</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Nome</label>
                <input value={newFinanc.nome} onChange={e => setNewFinanc(f => ({...f, nome: e.target.value}))}
                  className="rounded-xl px-4 py-2.5 text-sm border focus:outline-none"
                  style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} placeholder="Ex: Outlander 2025" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Valor total</label>
                <input type="number" inputMode="numeric" value={newFinanc.valorTotal}
                  onChange={e => setNewFinanc(f => ({...f, valorTotal: parseInt(e.target.value)||0}))}
                  className="rounded-xl px-4 py-3 text-xl font-bold font-mono text-right border focus:outline-none"
                  style={{background:"var(--bg-elevated)", borderColor:"var(--border-mid)", color:"var(--text)"}} />
              </div>
            </div>
            <div className="flex gap-3 px-4 pb-4">
              <button onClick={() => setShowAddFinanc(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{borderColor:"var(--border-mid)", color:"var(--text-muted)"}}>Cancelar</button>
              <button onClick={addFinanciamento} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: "var(--text)", color: "var(--bg)" }}>Criar</button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowAddFinanc(false)} />
        </div>
      )}
    </div>
  );
}

export { CarroScreen };
