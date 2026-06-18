import { useState } from "react";
import { YEN } from "../utils/calc.js";
import { MonthPicker, Card } from "../components/ui.jsx";

const CATEGORIAS = [
  { id: "mercado",    label: "Mercado",       icon: "🛒" },
  { id: "refeicao",  label: "Refeição",       icon: "🍽️" },
  { id: "transporte",label: "Transporte",     icon: "🚃" },
  { id: "compras",   label: "Compras",        icon: "🛍️" },
  { id: "online",    label: "Online/Amazon",  icon: "📦" },
  { id: "servicos",  label: "Serviços/Apps",  icon: "📱" },
  { id: "saude",     label: "Saúde",          icon: "🏥" },
  { id: "lazer",     label: "Lazer",          icon: "🎮" },
  { id: "contas",    label: "Contas/Tarifas", icon: "💡" },
  { id: "outros",    label: "Outros",         icon: "📝" },
];

function getCat(id) {
  return CATEGORIAS.find(c => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1];
}

function ItemModal({ initial, onSave, onClose }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [categoria, setCategoria] = useState(initial?.categoria || "outros");
  const [valor, setValor] = useState(initial?.valor ? String(initial.valor) : "");

  function handleSave() {
    const v = parseFloat(String(valor).replace(/[^0-9.]/g, "")) || 0;
    if (!nome.trim() || v <= 0) return;
    onSave({ nome: nome.trim(), categoria, valor: v });
  }

  const iCls = "w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-purple-500 transition-all bg-zinc-900 border-zinc-700 text-zinc-100";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.82)" }}>
      <div className="bg-zinc-950 rounded-t-3xl border-t border-zinc-800 px-4 pt-5 pb-8 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100">
            💳 {initial?.id ? "Editar lançamento" : "Novo lançamento"}
          </h3>
          <button onClick={onClose} className="text-2xl leading-none text-zinc-500">×</button>
        </div>

        {/* Descrição */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Descrição</label>
          <input
            autoFocus
            className={iCls}
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Supermercado, Amazon, Restaurante..."
          />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Categoria</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIAS.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-all text-left ${
                  categoria === c.id
                    ? "bg-purple-600/30 border-purple-500 text-purple-200"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Valor (¥)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-500">¥</span>
            <input
              type="number"
              inputMode="numeric"
              value={valor}
              onChange={e => setValor(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-3 text-2xl font-bold font-mono text-right border border-zinc-700 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[500, 1000, 3000, 5000].map(v => (
              <button
                key={v}
                onClick={() => setValor(String(v))}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  String(v) === valor
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-zinc-700 text-zinc-400"
                }`}
              >
                {YEN(v)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-400">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nome.trim() || !(parseFloat(valor) > 0)}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm disabled:opacity-40"
          >
            {initial?.id ? "Salvar" : "Adicionar"} ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartaoScreen({ gastos, onSave }) {
  const today = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(today);
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [diagResult, setDiagResult] = useState(null);

  const items = (gastos.cartao?.[month] || []);
  const total = items.reduce((a, c) => a + (c.valor || 0), 0);

  function runRecovery() {
    const cartao = { ...(gastos.cartao || {}) };
    let found = [];
    let merged = false;

    const sources = [];
    try {
      const profiles = JSON.parse(localStorage.getItem("jst_profiles") || "null");
      if (Array.isArray(profiles)) {
        profiles.forEach(({ id: pid }) => {
          const raw = localStorage.getItem(`jst_p_${pid}_gastos`);
          if (raw) { sources.push({ key: `jst_p_${pid}_gastos`, data: JSON.parse(raw) }); }
        });
      }
    } catch {}

    // Also scan all jst_* keys for any gastos-looking data
    Object.keys(localStorage).forEach(k => {
      if (k.includes("gastos") && !sources.find(s => s.key === k)) {
        try { sources.push({ key: k, data: JSON.parse(localStorage.getItem(k)) }); } catch {}
      }
    });

    sources.forEach(({ key, data }) => {
      if (!data) return;
      // Format a: cartao[month] array
      if (data.cartao && typeof data.cartao === "object") {
        Object.entries(data.cartao).forEach(([m, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            found.push(`${key}: cartao[${m}] = ${items.length} item(s)`);
            if (!cartao[m] || cartao[m].length === 0) { cartao[m] = items; merged = true; }
          }
        });
      }
      // Format b: d9 override
      if (data.overrides && typeof data.overrides === "object") {
        Object.entries(data.overrides).forEach(([m, ovr]) => {
          const d9 = ovr?.["d9"];
          if (d9 > 0) {
            found.push(`${key}: overrides[${m}].d9 = ¥${d9}`);
            if (!cartao[m] || cartao[m].length === 0) {
              cartao[m] = [{ id: "cc_v1_" + m.replace("-",""), nome: "Cartão de Crédito", valor: d9 }];
              merged = true;
            }
          }
        });
      }
    });

    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("jst"));

    if (merged) {
      localStorage.setItem("jst_v1_cartao_migrated", "2");
      onSave({ ...gastos, cartao });
      setDiagResult({ ok: true, found, keys: allKeys });
    } else {
      setDiagResult({ ok: false, found, keys: allKeys });
    }
  }

  // Group by category for summary
  const byCategory = CATEGORIAS
    .map(cat => ({
      ...cat,
      items: items.filter(i => (i.categoria || "outros") === cat.id),
      subtotal: items.filter(i => (i.categoria || "outros") === cat.id).reduce((a, i) => a + (i.valor || 0), 0),
    }))
    .filter(cat => cat.items.length > 0);

  function handleSave({ nome, categoria, valor }) {
    const cartao = { ...(gastos.cartao || {}) };
    if (!cartao[month]) cartao[month] = [];
    if (modal?.id) {
      cartao[month] = cartao[month].map(c =>
        c.id === modal.id ? { ...c, nome, categoria, valor } : c
      );
    } else {
      cartao[month] = [...cartao[month], { id: "cc" + Date.now(), nome, categoria, valor }];
    }
    onSave({ ...gastos, cartao });
    setModal(null);
  }

  function handleDelete(id) {
    const cartao = { ...(gastos.cartao || {}) };
    cartao[month] = (cartao[month] || []).filter(c => c.id !== id);
    onSave({ ...gastos, cartao });
    setConfirmDel(null);
  }

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">Controle</div>
          <h2 className="text-lg font-bold text-zinc-100">💳 Cartão de Crédito</h2>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
        >
          + Lançamento
        </button>
      </div>

      <MonthPicker value={month} onChange={setMonth} />

      {/* Total card */}
      <Card className="border-purple-800/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Total do mês</div>
            <div className="text-xs text-zinc-600 mt-0.5">{items.length} lançamento{items.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{YEN(total)}</div>
        </div>
        {total > 0 && (
          <div className="mt-3 space-y-1.5">
            {byCategory.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-32 shrink-0">
                  <span className="text-xs">{cat.icon}</span>
                  <span className="text-xs text-zinc-500 truncate">{cat.label}</span>
                </div>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-purple-500/70"
                    style={{ width: total > 0 ? `${(cat.subtotal / total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-400 shrink-0 w-20 text-right">{YEN(cat.subtotal)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-2">
          <div className="text-3xl">💳</div>
          <div className="text-sm text-zinc-400">Nenhum lançamento em {month}</div>
          <button
            onClick={() => setModal({})}
            className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold"
          >
            Adicionar lançamento
          </button>
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">Lançamentos</span>
            <span className="text-xs text-zinc-600">{items.length} itens</span>
          </div>
          {items.map(item => {
            const cat = getCat(item.categoria || "outros");
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 py-2.5 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-base shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-100 truncate">{item.nome}</div>
                  <div className="text-[10px] text-zinc-600">{cat.label}</div>
                </div>
                <span className="text-sm font-mono font-semibold text-purple-400 shrink-0">{YEN(item.valor)}</span>
                <button
                  onClick={() => setModal(item)}
                  className="text-xs px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500 hover:text-amber-400 hover:border-amber-600 transition-colors shrink-0"
                >✏️</button>
                <button
                  onClick={() => setConfirmDel(item)}
                  className="text-xs px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-800 transition-colors shrink-0"
                >✕</button>
              </div>
            );
          })}
          <button
            onClick={() => setModal({})}
            className="w-full mt-2 py-1.5 rounded-xl border border-dashed text-xs transition-colors hover:border-purple-600 hover:text-purple-400 border-zinc-700 text-zinc-500"
          >
            + Adicionar lançamento
          </button>
        </Card>
      )}

      {modal !== null && (
        <ItemModal
          initial={modal.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Recovery / diagnostic */}
      <button
        onClick={runRecovery}
        className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 text-xs text-zinc-500 hover:border-purple-700 hover:text-purple-400 transition-colors"
      >
        🔍 Recuperar dados do app anterior
      </button>

      {diagResult && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="bg-zinc-950 rounded-t-3xl border-t border-zinc-800 px-4 pt-5 pb-8 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                {diagResult.ok ? "✅ Dados recuperados!" : "🔍 Diagnóstico"}
              </h3>
              <button onClick={() => setDiagResult(null)} className="text-2xl leading-none text-zinc-500">×</button>
            </div>
            {diagResult.ok ? (
              <p className="text-xs text-green-400">Lançamentos encontrados e importados. Navegue pelos meses para ver.</p>
            ) : (
              <p className="text-xs text-zinc-400">Nenhum dado de cartão encontrado no armazenamento local.</p>
            )}
            {diagResult.found.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">O que foi encontrado:</p>
                {diagResult.found.map((f, i) => (
                  <div key={i} className="text-xs font-mono text-green-300 bg-zinc-900 rounded px-2 py-1">{f}</div>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Chaves no localStorage ({diagResult.keys.length}):</p>
              <div className="text-xs font-mono text-zinc-500 bg-zinc-900 rounded px-2 py-2 space-y-0.5 max-h-40 overflow-y-auto">
                {diagResult.keys.map(k => <div key={k}>{k}</div>)}
              </div>
            </div>
            <button onClick={() => setDiagResult(null)} className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm">Fechar</button>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="p-5 text-center">
              <div className="text-3xl mb-3">🗑</div>
              <div className="text-sm font-semibold text-zinc-100 mb-1">Remover lançamento?</div>
              <div className="text-xs text-zinc-500">
                <span className="text-red-400 font-semibold">{confirmDel.nome}</span> — {YEN(confirmDel.valor)}
              </div>
            </div>
            <div className="flex border-t border-zinc-800">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 py-3 text-sm font-medium border-r border-zinc-800 text-zinc-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDel.id)}
                className="flex-1 py-3 text-sm font-bold text-red-400"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
