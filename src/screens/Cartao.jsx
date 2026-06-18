import { useState, useEffect } from "react";
import { YEN } from "../utils/calc.js";
import { MonthPicker, Card } from "../components/ui.jsx";

const CATS = [
  { id: "mercado_jp",   label: "Supermercado",  icon: "🛒" },
  { id: "konbini",      label: "Konbini",        icon: "🏪" },
  { id: "restaurante",  label: "Restaurante",    icon: "🍜" },
  { id: "posto",        label: "Combustível",    icon: "⛽" },
  { id: "online",       label: "Online/Amazon",  icon: "💻" },
  { id: "homecenter",   label: "Home Center",    icon: "🔨" },
  { id: "mercado_br",   label: "Brasil",         icon: "🇧🇷" },
  { id: "outro",        label: "Outro",          icon: "📦" },
];

const CAT_MAP = Object.fromEntries(CATS.map(c => [c.id, c]));

function getCat(id) {
  return CAT_MAP[id] || { label: id || "Outro", icon: "📦" };
}

const DEFAULT_CARTAO = {
  setup: { name: "", closingDay: 15, dueDay: 11, limit: 0 },
  lancamentos: [],
  parcelas: [],
  conferencias: [],
};

// ── Item Modal ────────────────────────────────────────────────────────────────

function ItemModal({ initial, onSave, onDelete, onClose }) {
  const todayDate = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.date || todayDate);
  const [cat, setCat] = useState(initial?.cat || "mercado_jp");
  const [desc, setDesc] = useState(initial?.desc || "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    const v = parseInt(String(amount).replace(/[^0-9]/g, "")) || 0;
    if (v <= 0) return;
    onSave({
      id: initial?.id || (Date.now() + "_0"),
      date,
      cat,
      desc: desc.trim(),
      customCat: initial?.customCat || "",
      amount: v,
    });
  }

  const iCls = "w-full rounded-xl px-4 py-2.5 text-sm border border-zinc-700 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-purple-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.82)" }}>
      <div className="bg-zinc-950 rounded-t-3xl border-t border-zinc-800 px-4 pt-5 pb-8 space-y-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100">
            💳 {initial?.id ? "Editar lançamento" : "Novo lançamento"}
          </h3>
          <button onClick={onClose} className="text-2xl leading-none text-zinc-500">×</button>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={iCls}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Categoria</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CATS.map(c => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-all text-left ${
                  cat === c.id
                    ? "bg-purple-600/30 border-purple-500 text-purple-200"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <span>{c.icon}</span>
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Descrição (opcional)</label>
          <input
            className={iCls}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Ex: Costco, Amazon, Ramen..."
          />
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide font-medium text-zinc-500">Valor (¥)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-500">¥</span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-3 text-2xl font-bold font-mono text-right border border-zinc-700 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[500, 1000, 3000, 5000].map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  String(v) === amount
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
          {initial?.id && onDelete && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="px-4 py-3 rounded-xl border border-red-900/60 text-red-500 text-sm transition-colors hover:bg-red-950/30"
            >
              🗑
            </button>
          )}
          {confirmingDelete && (
            <button
              onClick={() => onDelete(initial.id)}
              className="px-4 py-3 rounded-xl bg-red-700 text-white text-sm font-bold"
            >
              Confirmar
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-400">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!(parseInt(amount) > 0)}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm disabled:opacity-40"
          >
            {initial?.id ? "Salvar" : "Adicionar"} ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CartaoScreen ──────────────────────────────────────────────────────────────

export function CartaoScreen({ cartao, onSave }) {
  const today = new Date().toISOString().slice(0, 7);
  const data = cartao || DEFAULT_CARTAO;

  const [month, setMonth] = useState(() => {
    const months = [...new Set((data.lancamentos || []).map(l => l.date.slice(0, 7)))].sort();
    const past = months.filter(m => m <= today);
    return past.length ? past[past.length - 1] : today;
  });
  const [modal, setModal] = useState(null);

  // Sync when cartao prop changes from outside (e.g. backup restore)
  useEffect(() => {
    if (!cartao?.lancamentos?.length) return;
    const months = [...new Set(cartao.lancamentos.map(l => l.date.slice(0, 7)))].sort();
    const past = months.filter(m => m <= today);
    if (past.length) setMonth(past[past.length - 1]);
  }, [cartao]);

  const lancamentos = data.lancamentos || [];
  const monthItems = lancamentos
    .filter(l => l.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = monthItems.reduce((s, l) => s + (l.amount || 0), 0);

  // Category breakdown sorted by total desc
  const catSums = {};
  monthItems.forEach(l => { catSums[l.cat] = (catSums[l.cat] || 0) + l.amount; });
  const catBreakdown = CATS
    .filter(c => catSums[c.id])
    .map(c => ({ ...c, sum: catSums[c.id] }))
    .sort((a, b) => b.sum - a.sum);

  function save(updated) { onSave(updated); }

  function addItem(item) {
    save({ ...data, lancamentos: [item, ...lancamentos] });
    setModal(null);
    setMonth(item.date.slice(0, 7));
  }

  function updateItem(item) {
    save({ ...data, lancamentos: lancamentos.map(l => l.id === item.id ? item : l) });
    setModal(null);
  }

  function deleteItem(id) {
    save({ ...data, lancamentos: lancamentos.filter(l => l.id !== id) });
    setModal(null);
  }

  const { name: cardName, closingDay, dueDay, limit } = data.setup || {};
  const conferencias = data.conferencias || [];
  const monthConf = conferencias.find(c => c.ym === month);

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">Controle</div>
          <h2 className="text-lg font-bold text-zinc-100">💳 Cartão de Crédito</h2>
          {cardName && (
            <div className="text-xs text-zinc-500 mt-0.5">
              {cardName} · Fecha dia {closingDay} · Vence dia {dueDay}
            </div>
          )}
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
        >
          + Lançamento
        </button>
      </div>

      <MonthPicker value={month} onChange={setMonth} />

      {/* Summary card */}
      <Card className="border-purple-800/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Total do mês</div>
            <div className="text-xs text-zinc-600 mt-0.5">
              {monthItems.length} lançamento{monthItems.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{YEN(total)}</div>
        </div>

        {catBreakdown.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {catBreakdown.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-32 shrink-0">
                  <span className="text-xs">{cat.icon}</span>
                  <span className="text-xs text-zinc-500 truncate">{cat.label}</span>
                </div>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-purple-500/70"
                    style={{ width: total > 0 ? `${(cat.sum / total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-400 shrink-0 w-20 text-right">{YEN(cat.sum)}</span>
              </div>
            ))}
          </div>
        )}

        {limit > 0 && (
          <div className="mt-3 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs text-zinc-600 mb-1">
              <span>Uso do limite</span>
              <span className="font-mono">{Math.round((total / limit) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-purple-500/50"
                style={{ width: `${Math.min(100, (total / limit) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-700 mt-1">
              <span>{YEN(total)}</span>
              <span>Limite: {YEN(limit)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Conferencia badge */}
      {monthConf && (
        <div className={`rounded-xl border p-3 flex items-center justify-between ${
          monthConf.pago
            ? "border-green-800/40 bg-green-950/20"
            : "border-yellow-800/40 bg-yellow-950/20"
        }`}>
          <div>
            <div className={`text-xs font-semibold ${monthConf.pago ? "text-green-400" : "text-yellow-400"}`}>
              {monthConf.pago ? "✓ Fatura paga" : "⏳ Fatura em aberto"}
            </div>
            <div className="text-xs text-zinc-600 mt-0.5">
              Boletado: {YEN(monthConf.boletado)}
            </div>
          </div>
          <span className={`text-sm font-bold font-mono ${monthConf.pago ? "text-green-400" : "text-yellow-400"}`}>
            {YEN(monthConf.boletado)}
          </span>
        </div>
      )}

      {/* Items list */}
      {monthItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-2">
          <div className="text-3xl">💳</div>
          <div className="text-sm text-zinc-400">Nenhum lançamento em {month}</div>
          <button
            onClick={() => setModal({})}
            className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
          >
            Adicionar lançamento
          </button>
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">Lançamentos</span>
            <span className="text-xs text-zinc-600">{monthItems.length} itens</span>
          </div>
          {monthItems.map(item => {
            const cat = getCat(item.cat);
            const label = item.desc || cat.label;
            const dayStr = item.date.slice(5).replace("-", "/");
            return (
              <button
                key={item.id}
                onClick={() => setModal(item)}
                className="w-full flex items-center gap-2 py-2.5 border-b last:border-0 text-left transition-colors hover:bg-zinc-800/30 active:bg-zinc-700/30 -mx-1 px-1 rounded"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-base shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-100 truncate">{label}</div>
                  <div className="text-[10px] text-zinc-600">
                    {dayStr}{item.desc ? ` · ${cat.label}` : ""}
                  </div>
                </div>
                <span className="text-sm font-mono font-semibold text-purple-400 shrink-0">{YEN(item.amount)}</span>
              </button>
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
          onSave={modal.id ? updateItem : addItem}
          onDelete={modal.id ? deleteItem : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
