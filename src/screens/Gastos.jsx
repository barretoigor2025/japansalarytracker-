import { useState, useCallback, useEffect } from "react";
import { YEN } from "../utils/calc.js";
import { MonthPicker, Card } from "../components/ui.jsx";

// ── GastosScreen ─────────────────────────────────────────────────────

function GastosScreen({ gastos, onSave }) {
  const today = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(today);
  const [editMode, setEditMode] = useState(false);
  const [localGastos, setLocalGastos] = useState(gastos);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");

  // Sync when gastos prop changes
  useEffect(() => setLocalGastos(gastos), [gastos]);

  const overrides = localGastos.overrides?.[month] || {};

  // Get effective value: override for this month or default
  function getVal(item) {
    return overrides[item.id] !== undefined ? overrides[item.id] : item.amount;
  }

  function setOverride(id, val) {
    const newOverrides = {
      ...localGastos.overrides,
      [month]: { ...(localGastos.overrides?.[month] || {}), [id]: val },
    };
    const updated = { ...localGastos, overrides: newOverrides };
    setLocalGastos(updated);
    onSave(updated);
  }

  function toggleActive(type, id) {
    const updated = {
      ...localGastos,
      [type]: localGastos[type].map(i => i.id === id ? { ...i, active: !i.active } : i),
    };
    setLocalGastos(updated);
    onSave(updated);
  }

  function updateDefault(type, id, field, val) {
    const updated = {
      ...localGastos,
      [type]: localGastos[type].map(i => i.id === id ? { ...i, [field]: val } : i),
    };
    setLocalGastos(updated);
    onSave(updated);
  }

  function addItem(tipo) {
    // Permanent: adds to all months
    const newItem = { id: "d" + Date.now(), name: "Nova despesa", amount: 0, tipo, active: true };
    const updated = { ...localGastos, despesas: [...localGastos.despesas, newItem] };
    setLocalGastos(updated);
    onSave(updated);
    setTimeout(() => setEditingItem({ item: newItem, type: "despesas", tempVal: "0", tempName: "Nova despesa" }), 50);
  }

  function addItemThisMonth(tipo) {
    // Temporary: only exists for current month
    const newItem = { id: "m" + Date.now(), name: "Nova despesa", amount: 0, tipo };
    const mi = { ...(localGastos.monthItems || {}) };
    mi[month] = [...(mi[month] || []), newItem];
    const updated = { ...localGastos, monthItems: mi };
    setLocalGastos(updated);
    onSave(updated);
    setTimeout(() => setEditingItem({ item: newItem, type: "monthItems", tempVal: "0", tempName: "Nova despesa" }), 50);
  }

  function removeMonthItem(id) {
    // Deletes item only from current month (for month-only items)
    const mi = { ...(localGastos.monthItems || {}) };
    mi[month] = (mi[month] || []).filter(i => i.id !== id);
    const updated = { ...localGastos, monthItems: mi };
    setLocalGastos(updated);
    onSave(updated);
  }

  function addRendaThisMonth() {
    const newItem = { id: "m" + Date.now(), name: "Nova renda", amount: 0 };
    const mi = { ...(localGastos.monthItems || {}) };
    mi[month] = [...(mi[month] || []), { ...newItem, tipo: "renda" }];
    const updated = { ...localGastos, monthItems: mi };
    setLocalGastos(updated);
    onSave(updated);
    setTimeout(() => setEditingItem({ item: newItem, type: "monthItems", tempVal: "0", tempName: "Nova renda" }), 50);
  }


  function addRenda() {
    const newItem = { id: "r" + Date.now(), name: "Nova renda", amount: 0, active: true };
    const updated = { ...localGastos, rendas: [...localGastos.rendas, newItem] };
    setLocalGastos(updated);
    onSave(updated);
    setTimeout(() => setEditingItem({ item: newItem, type: "rendas", tempVal: "0", tempName: "Nova renda" }), 50);
  }

  function removeItem(type, id) {
    // Permanently removes item from all months — use with caution
    const updated = { ...localGastos, [type]: localGastos[type].filter(i => i.id !== id) };
    setLocalGastos(updated);
    onSave(updated);
  }

  function hideForMonth(id) {
    // Hides item only for current month — does NOT affect other months
    const monthHidden = { ...(localGastos.monthHidden || {}) };
    const current = monthHidden[month] ? [...monthHidden[month]] : [];
    if (!current.includes(id)) current.push(id);
    monthHidden[month] = current;
    const updated = { ...localGastos, monthHidden };
    setLocalGastos(updated);
    onSave(updated);
  }

  function showForMonth(id) {
    // Restores item visibility for current month
    const monthHidden = { ...(localGastos.monthHidden || {}) };
    const current = (monthHidden[month] || []).filter(x => x !== id);
    monthHidden[month] = current;
    const updated = { ...localGastos, monthHidden };
    setLocalGastos(updated);
    onSave(updated);
  }

  const hiddenThisMonth = (localGastos.monthHidden || {})[month] || [];
  const monthItemsList = ((localGastos.monthItems || {})[month] || []);
  const miDebito = monthItemsList.filter(i => i.tipo === "debito").reduce((a, i) => a + i.amount, 0);
  const miHagaki = monthItemsList.filter(i => i.tipo === "hagaki").reduce((a, i) => a + i.amount, 0);
  const miRenda  = monthItemsList.filter(i => i.tipo === "renda").reduce((a, i) => a + i.amount, 0);

  function clearOverride(id) {
    const monthOvr = { ...(localGastos.overrides?.[month] || {}) };
    delete monthOvr[id];
    const updated = { ...localGastos, overrides: { ...localGastos.overrides, [month]: monthOvr } };
    setLocalGastos(updated);
    onSave(updated);
  }

  // Calculations
  const activeRendas = localGastos.rendas.filter(r => r.active && !hiddenThisMonth.includes(r.id));
  const totalRenda = activeRendas.reduce((a, r) => a + getVal(r), 0) + miRenda;

  const activeDebito = localGastos.despesas.filter(d => d.active && d.tipo === "debito");
  const activeHagaki = localGastos.despesas.filter(d => d.active && d.tipo === "hagaki");
  const totalDebito = activeDebito.filter(d => !hiddenThisMonth.includes(d.id)).reduce((a, d) => a + getVal(d), 0) + miDebito;
  const totalHagaki = activeHagaki.filter(d => !hiddenThisMonth.includes(d.id)).reduce((a, d) => a + getVal(d), 0) + miHagaki;
  const totalDespesas = totalDebito + totalHagaki;
  const saldo = totalRenda - totalDespesas;

  // Modal de edição de valor
  const [editingItem, setEditingItem] = useState(null); // { item, type, tempVal, tempName }

  function openEdit(item, type) {
    setEditingItem({ item, type, tempVal: String(getVal(item)), tempName: item.name });
  }

  function confirmEdit() {
    if (!editingItem) return;
    const { item, type, tempVal, tempName } = editingItem;
    const v = parseInt(tempVal) || 0;

    if (type === "monthItems") {
      // Month-only item: update name and value in monthItems[month]
      const mi = { ...(localGastos.monthItems || {}) };
      mi[month] = (mi[month] || []).map(i => i.id === item.id ? { ...i, name: tempName, amount: v } : i);
      const updated = { ...localGastos, monthItems: mi };
      setLocalGastos(updated);
      onSave(updated);
      setEditingItem(null);
      return;
    }

    // Permanent item: update name + default amount
    const listKey = (type === "renda" || type === "rendas") ? "rendas" : "despesas";
    const updatedList = localGastos[listKey].map(i =>
      i.id === item.id ? { ...i, name: tempName, amount: v } : i
    );
    const monthOvr = { ...(localGastos.overrides?.[month] || {}) };
    delete monthOvr[item.id];
    const updated = {
      ...localGastos,
      [listKey]: updatedList,
      overrides: { ...localGastos.overrides, [month]: monthOvr },
    };
    setLocalGastos(updated);
    onSave(updated);
    setEditingItem(null);
  }

  function DespesaRow({ item, type, tipoDesp }) {
    const val = getVal(item);
    const hasOverride = overrides[item.id] !== undefined;
    // Toggle color per section type
    const toggleActive_color = tipoDesp === "renda"
      ? (item.active ? "bg-green-500" : "bg-zinc-700")
      : tipoDesp === "hagaki"
        ? (item.active ? "bg-blue-500" : "bg-zinc-700")
        : (item.active ? "bg-amber-500" : "bg-zinc-700"); // debito = amber
    return (
      <div className={`flex items-center gap-2 py-2 border-b last:border-0 transition-opacity ${!item.active ? "opacity-40" : ""}`}
        style={{ borderColor: "var(--border)" }}>
        {/* Toggle */}
        <div onClick={() => toggleActive(type, item.id)}
          className={`w-7 h-3.5 rounded-full shrink-0 cursor-pointer transition-colors ${toggleActive_color}`}>
          <div className={`w-2.5 h-2.5 bg-white rounded-full m-0.5 transition-transform ${item.active ? "translate-x-3.5" : ""}`} />
        </div>
        {/* Name */}
        <span className="flex-1 text-xs" style={{ color: "var(--text)" }}>{item.name}</span>
        {/* Override indicator */}
        {hasOverride && (
          <button onClick={() => clearOverride(item.id)} className="text-xs text-amber-500 shrink-0" title="Resetar">↺</button>
        )}
        {/* Value — tap to edit */}
        <button
          onClick={() => openEdit(item, type)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 transition-colors hover:bg-zinc-800/60 active:bg-zinc-700/60"
        >
          <span className="text-xs font-mono font-semibold" style={{ color: hasOverride ? "#f59e0b" : "var(--text)" }}>
            {YEN(val)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>✏️</span>
        </button>
        {editMode && (
          <button
            onClick={() => hideForMonth(item.id)}
            title="Ocultar neste mês (não apaga histórico)"
            className="text-zinc-500 hover:text-orange-400 text-xs shrink-0 ml-1 transition-colors">
            ✕
          </button>
        )}
      </div>
    );
  }

  const [confirmReset, setConfirmReset] = useState(null); // { title, tipoDesp }
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, name }

  function doReset(tipoDesp) {
    // Zero overrides only for items of this specific tipo (debito or hagaki) in current month
    const sectionItems = tipoDesp === "renda"
      ? localGastos.rendas
      : localGastos.despesas.filter(d => d.tipo === tipoDesp);
    const monthOvr = { ...(localGastos.overrides?.[month] || {}) };
    sectionItems.forEach(item => { monthOvr[item.id] = 0; });
    const upd = { ...localGastos, overrides: { ...localGastos.overrides, [month]: monthOvr } };
    setLocalGastos(upd);
    onSave(upd);
    setConfirmReset(null);
  }

  function Section({ title, icon, color, items, tipoDesp, total, onAdd, onAddMonth, badge }) {
    const allSectionItems = tipoDesp === "renda"
      ? localGastos.rendas
      : localGastos.despesas.filter(d => d.tipo === tipoDesp);
    const visibleItems = allSectionItems.filter(item => !hiddenThisMonth.includes(item.id));
    const hiddenItems  = allSectionItems.filter(item =>  hiddenThisMonth.includes(item.id));
    const hasValues = visibleItems.some(item => getVal(item) > 0);

    return (
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span>{icon}</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{color}}>{title}</span>
            {badge && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{badge}</span>}
          </div>
          <div className="flex items-center gap-2">
            {tipoDesp !== "renda" && hasValues && (
              <button
                onClick={() => setConfirmReset({ title, tipoDesp })}
                title={"Zerar " + title + " em " + month}
                className="w-6 h-6 flex items-center justify-center rounded-lg border border-zinc-700 hover:border-red-600 text-zinc-500 hover:text-red-400 transition-colors text-xs"
              >
                ↺
              </button>
            )}
            <span className="text-sm font-bold font-mono" style={{color}}>{YEN(total)}</span>
          </div>
        </div>
        {visibleItems.map(item => <DespesaRow key={item.id} item={item} type={tipoDesp === "renda" ? "rendas" : "despesas"} tipoDesp={tipoDesp} />)}
        {/* Month-only items */}
        {((localGastos.monthItems || {})[month] || []).filter(i => i.tipo === tipoDesp || (tipoDesp === "renda" && i.tipo === "renda")).map(item => (
          <div key={item.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{borderColor:"var(--border)"}}>
            <span className="text-xs px-1 py-0.5 rounded text-blue-400 border border-blue-800/50 shrink-0" style={{fontSize:"9px"}}>MÊS</span>
            <span className="flex-1 text-xs" style={{color:"var(--text)"}}>{item.name}</span>
            <button onClick={() => setEditingItem({ item, type: "monthItems", tempVal: String(item.amount), tempName: item.name })}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold shrink-0"
              style={{color:"var(--text)"}}>
              {YEN(item.amount)} <span style={{color:"var(--text-muted)"}}>✏️</span>
            </button>
            {editMode && (
              <button onClick={() => removeMonthItem(item.id)} className="text-red-400 text-xs shrink-0 ml-1" title="Remover deste mês">✕</button>
            )}
          </div>
        ))}
        {hiddenItems.length > 0 && (
          <div className="mt-1 pt-1 border-t" style={{borderColor:"var(--border)"}}>
            <div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>Ocultos neste mês:</div>
            {hiddenItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 opacity-40">
                <span className="flex-1 text-xs line-through" style={{color:"var(--text-muted)"}}>{item.name}</span>
                <button onClick={() => showForMonth(item.id)}
                  title="Mostrar neste mês"
                  className="text-xs text-blue-400 hover:text-blue-300 shrink-0">👁</button>
                {editMode && (
                  <button
                    onClick={() => setConfirmDelete({ type: tipoDesp === "renda" ? "rendas" : "despesas", id: item.id, name: item.name })}
                    title="Apagar permanentemente"
                    className="text-xs text-red-600 hover:text-red-400 shrink-0">🗑</button>
                )}
              </div>
            ))}
          </div>
        )}
        {editMode && (
          <div className="flex gap-2 mt-2">
            <button onClick={onAdd}
              className="flex-1 py-1.5 rounded-lg border border-dashed text-xs transition-colors hover:border-amber-600 hover:text-amber-400"
              style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
              + Fixo (todos os meses)
            </button>
            <button onClick={onAddMonth}
              className="flex-1 py-1.5 rounded-lg border border-dashed text-xs transition-colors hover:border-blue-600 hover:text-blue-400"
              style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
              + Só este mês
            </button>
          </div>
        )}
      </Card>
    );
  }

    // Edit modal — rendered as function call to avoid IIFE JSX parse issues
  function renderEditModal() {
    if (!editingItem) return null;
    const { item, type, tempVal, tempName } = editingItem;
    const hasOvr = overrides[item.id] !== undefined;
    return (
      <div className={`fixed inset-0 z-50 flex flex-col justify-start pt-8 px-4`} style={{background:"rgba(0,0,0,0.82)"}}>
        <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border"
          style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
            <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>✏️ {tempName || "Editar"}</h3>
            <button onClick={() => setEditingItem(null)} className="text-2xl leading-none" style={{color:"var(--text-muted)"}}>×</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide font-medium" style={{color:"var(--text-muted)"}}>Nome</label>
              <input
                value={tempName}
                onChange={e => setEditingItem(prev => ({...prev, tempName: e.target.value}))}
                className="rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 transition-all"
                style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}}
                placeholder="Nome da despesa"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide font-medium" style={{color:"var(--text-muted)"}}>Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{color:"var(--text-muted)"}}>¥</span>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tempVal}
                  onChange={e => setEditingItem(prev => ({...prev, tempVal: e.target.value}))}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-2xl font-bold font-mono text-right border focus:outline-none focus:border-amber-500 transition-all"
                  style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)"}}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 5000, 10000, 50000].map(v => (
                <button key={v}
                  onClick={() => setEditingItem(prev => ({...prev, tempVal: String(v)}))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${String(v) === tempVal ? "bg-amber-500 border-amber-500 text-black" : ""}`}
                  style={String(v) !== tempVal ? {borderColor:"var(--border)", color:"var(--text-sub)", background:"var(--bg-card)"} : {}}>
                  {v === 0 ? "Zero" : YEN(v)}
                </button>
              ))}
            </div>
            {hasOvr && (
              <button onClick={() => { clearOverride(item.id); setEditingItem(null); }}
                className="w-full py-2 rounded-xl border text-xs"
                style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
                ↺ Restaurar padrão ({YEN(item.amount)})
              </button>
            )}
          </div>
          <div className="flex gap-3 px-4 pb-4">
            <button onClick={() => setEditingItem(null)}
              className="flex-1 py-3 rounded-xl border text-sm font-medium"
              style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
              Cancelar
            </button>
            <button onClick={confirmEdit}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">
              Confirmar ✓
            </button>
          </div>
        </div>
        <div className="flex-1" onClick={() => setEditingItem(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-xs uppercase tracking-widest" style={{color:"var(--text-muted)"}}>Controle de Gastos</div>
          <h2 className="text-lg font-bold" style={{color:"var(--text)"}}>Ganhos & Despesas</h2>
        </div>
        <div className="flex items-center gap-2">

          <button onClick={() => setEditMode(!editMode)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${editMode ? "bg-amber-500 border-amber-500 text-black font-semibold" : "border-zinc-700 text-zinc-400"}`}>
            {editMode ? "✓ Pronto" : "✏️ Editar"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {/* Botão copiar relatório WhatsApp */}
        <button
          onClick={() => {
            const monthLabel = new Date(month + "-01").toLocaleDateString("pt-BR", {month:"long", year:"numeric"});
            const fmt = (v) => new Intl.NumberFormat("ja-JP", {style:"currency", currency:"JPY"}).format(v);

            let ls = [];
            ls.push("📊 *Resumo Financeiro*");
            ls.push("🗓 " + monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
            ls.push("");
            ls.push("💴 *RENDA*");
            localGastos.rendas.filter(r => r.active).forEach(r => {
              ls.push(r.name + ": " + fmt(getVal(r)));
            });
            ls.push("*Total Renda: " + fmt(totalRenda) + "*");
            ls.push("");
            const debAtivos = localGastos.despesas.filter(d => d.active && d.tipo === "debito");
            if (debAtivos.length > 0) {
              ls.push("🏦 *DÉBITO AUTOMÁTICO*");
              debAtivos.forEach(d => ls.push(d.name + ": " + fmt(getVal(d))));
              ls.push("*Subtotal: " + fmt(totalDebito) + "*");
              ls.push("");
            }
            const hagAtivos = localGastos.despesas.filter(d => d.active && d.tipo === "hagaki");
            if (hagAtivos.length > 0) {
              ls.push("📮 *HAGAKI (Boleto)*");
              hagAtivos.forEach(d => ls.push(d.name + ": " + fmt(getVal(d))));
              ls.push("*Subtotal: " + fmt(totalHagaki) + "*");
              ls.push("");
            }
            ls.push("─────────────────");
            ls.push("💴 Renda: " + fmt(totalRenda));
            ls.push("🏦 Débito Auto: " + fmt(totalDebito));
            ls.push("📮 Hagaki (sacar): " + fmt(totalHagaki));
            ls.push("💸 Total Despesas: " + fmt(totalDespesas));
            ls.push("✅ *Saldo Final: " + fmt(saldo) + "*");
            if (totalHagaki > 0) {
              ls.push("");
              ls.push("💵 *Precisa sacar em mãos: " + fmt(totalHagaki) + "*");
            }
            setReportText(ls.join("\n"));
            setShowReport(true);
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all shrink-0 ${copied ? "bg-green-600 border-green-600" : "border-zinc-700 hover:border-amber-600"}`}
          title="Copiar resumo para WhatsApp"
        >
          {copied ? "✓" : "📋"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>💴 Renda</div>
          <div className="text-xl font-bold text-green-400 font-mono">{YEN(totalRenda)}</div>
        </Card>
        <Card>
          <div className="text-xs mb-1" style={{color:"var(--text-muted)"}}>💸 Despesas</div>
          <div className="text-xl font-bold text-red-400 font-mono">{YEN(totalDespesas)}</div>
        </Card>
      </div>

      <Card className={`border-2 ${saldo >= 0 ? "border-green-700/50" : "border-red-700/50"}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold" style={{color:"var(--text-muted)"}}>Saldo Final</div>
            <div className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>
              Débito: <span className="font-mono text-blue-400">{YEN(totalDebito)}</span> · Hagaki: <span className="font-mono text-orange-400">{YEN(totalHagaki)}</span>
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
            {saldo < 0 ? "-" : ""}{YEN(Math.abs(saldo))}
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-2 rounded-full transition-all"
            style={{width: totalRenda > 0 ? `${Math.min(100,(totalDespesas/totalRenda)*100)}%` : "0%",
                    background: saldo >= 0 ? "#22c55e" : "#ef4444"}} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{color:"var(--text-muted)"}}>
          <span>0%</span>
          <span>{totalRenda > 0 ? Math.round((totalDespesas/totalRenda)*100) : 0}% comprometida</span>
        </div>
      </Card>

      {totalHagaki > 0 && (
        <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-3 flex justify-between items-center">
          <div>
            <div className="text-xs font-semibold text-orange-400">💴 Precisa sacar em mãos</div>
            <div className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>Para {activeHagaki.length} boleto(s) Hagaki</div>
          </div>
          <div className="text-lg font-bold font-mono text-orange-400">{YEN(totalHagaki)}</div>
        </div>
      )}

      <Section title="Renda" icon="💴" color="#22c55e" items={localGastos.rendas}
        tipoDesp="renda" total={totalRenda} onAdd={addRenda} onAddMonth={addRendaThisMonth} />
      <Section title="Débito Automático" icon="🏦" color="#60a5fa"
        items={localGastos.despesas.filter(d => d.tipo === "debito")}
        tipoDesp="debito" total={totalDebito} onAdd={() => addItem("debito")} onAddMonth={() => addItemThisMonth("debito")}
        badge={`${activeDebito.length} ativos`} />
      <Section title="Hagaki (Boleto)" icon="📮" color="#fb923c"
        items={localGastos.despesas.filter(d => d.tipo === "hagaki")}
        tipoDesp="hagaki" total={totalHagaki} onAdd={() => addItem("hagaki")} onAddMonth={() => addItemThisMonth("hagaki")}
        badge={`${activeHagaki.length} ativos`} />

      {renderEditModal()}

      {/* Modal confirmação DELETE permanente */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{background:"rgba(0,0,0,0.85)"}}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
            <div className="p-5 text-center">
              <div className="text-3xl mb-3">🗑</div>
              <div className="text-sm font-semibold mb-1" style={{color:"var(--text)"}}>Apagar permanentemente?</div>
              <div className="text-xs" style={{color:"var(--text-muted)"}}>
                <span className="font-semibold text-red-400">{confirmDelete.name}</span> será removido de <span className="font-semibold text-red-400">todos os meses</span> e o histórico será perdido.
              </div>
              <div className="mt-2 text-xs text-zinc-600">Para ocultar só este mês, use ✕ em vez de 🗑</div>
            </div>
            <div className="flex border-t" style={{borderColor:"var(--border)"}}>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 text-sm font-medium border-r" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
                Cancelar
              </button>
              <button onClick={() => { removeItem(confirmDelete.type, confirmDelete.id); setConfirmDelete(null); }}
                className="flex-1 py-3 text-sm font-bold text-red-400">
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação reset */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{background:"rgba(0,0,0,0.8)"}}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border shadow-2xl" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
            <div className="p-5 text-center">
              <div className="text-3xl mb-3">↺</div>
              <div className="text-sm font-semibold mb-1" style={{color:"var(--text)"}}>Resetar {confirmReset.title}?</div>
              <div className="text-xs" style={{color:"var(--text-muted)"}}>
                Os valores de <span className="font-semibold text-amber-400">{month}</span> serão zerados.<br/>
                Meses anteriores não serão afetados.
              </div>
            </div>
            <div className="flex border-t" style={{borderColor:"var(--border)"}}>
              <button onClick={() => setConfirmReset(null)}
                className="flex-1 py-3 text-sm font-medium border-r" style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
                Cancelar
              </button>
              <button onClick={() => doReset(confirmReset.tipoDesp)}
                className="flex-1 py-3 text-sm font-bold text-red-400">
                Sim, zerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de relatório WhatsApp */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-6 px-4" style={{background:"rgba(0,0,0,0.85)"}}>
          <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"var(--border)"}}>
              <div>
                <h3 className="text-sm font-semibold" style={{color:"var(--text)"}}>📋 Relatório para WhatsApp</h3>
                <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>Selecione tudo e copie</p>
              </div>
              <button onClick={() => setShowReport(false)} className="text-2xl leading-none" style={{color:"var(--text-muted)"}}>×</button>
            </div>
            <div className="p-4">
              <textarea
                readOnly
                value={reportText}
                rows={14}
                onClick={e => e.target.select()}
                className="w-full rounded-xl p-3 text-xs font-mono border focus:outline-none resize-none"
                style={{background:"var(--bg-card)", borderColor:"var(--border)", color:"var(--text)", lineHeight:"1.6"}}
              />
              <p className="text-xs text-center mt-2" style={{color:"var(--text-muted)"}}>
                Toque na caixa para selecionar → segure e escolha <strong>Copiar tudo</strong>
              </p>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(reportText).then(() => {
                      setCopied(true);
                      setTimeout(() => { setCopied(false); setShowReport(false); }, 1500);
                    });
                  } catch(e) {}
                }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                style={{borderColor:"var(--border)", color:"var(--text-muted)"}}>
                {copied ? "✓ Copiado!" : "📋 Copiar"}
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">
                Fechar
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowReport(false)} />
        </div>
      )}
    </div>
  );
}

export { GastosScreen };
