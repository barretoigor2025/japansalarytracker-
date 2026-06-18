import { useState } from "react";
import { YEN } from "../utils/calc.js";

const PREFECTURES_JP = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const GKEY = "jst_gensen";

function loadGensen() {
  try {
    const raw = JSON.parse(localStorage.getItem(GKEY) || "null");
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [{ ...raw, id: "g_legacy" }];
  } catch { return []; }
}

function saveGensen(list) {
  localStorage.setItem(GKEY, JSON.stringify(list));
}

function GensenModal({ initial, onSave, onClose }) {
  const thisYear = new Date().getFullYear();
  const blank = {
    nenBun: thisYear - 1, empresa: "", todochifu: "", shiku: "",
    shiharaiGaku: "", kyuyoShotokuGo: "", shotokuKojo: "",
    gensenZei: "", shakaiHoken: "", seimeiHoken: "", jishinHoken: "", jutakuKariire: "",
  };
  const [d, setD] = useState(initial ? { ...blank, ...initial } : blank);
  const f = (k, v) => setD((prev) => ({ ...prev, [k]: v }));
  const canSave = Number(d.shiharaiGaku) > 0 && Number(d.shakaiHoken) > 0;

  function handleSave() {
    if (!canSave) return;
    const n = (v) => Number(v) || 0;
    onSave({
      ...d,
      id: d.id || "g" + Date.now(),
      shiharaiGaku: n(d.shiharaiGaku),
      kyuyoShotokuGo: n(d.kyuyoShotokuGo),
      shotokuKojo: n(d.shotokuKojo),
      gensenZei: n(d.gensenZei),
      shakaiHoken: n(d.shakaiHoken),
      seimeiHoken: n(d.seimeiHoken),
      jishinHoken: n(d.jishinHoken),
      jutakuKariire: n(d.jutakuKariire),
    });
  }

  const iCls = "w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500";
  const lCls = "text-xs text-zinc-400 mb-1 block";
  const sCls = "text-xs text-zinc-600 mt-0.5";
  const secCls = "text-xs font-semibold text-zinc-500 uppercase tracking-widest pt-3 pb-1 border-t border-zinc-800";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.78)" }}>
      <div className="bg-zinc-950 rounded-t-3xl border-t border-zinc-800 px-4 pt-5 pb-8 space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">源泉徴収票 · Gensen</h3>
            <p className="text-xs text-zinc-600">Comprovante anual de rendimentos</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-zinc-500 hover:text-zinc-300 px-1">×</button>
        </div>

        <div className={secCls.replace("pt-3 pb-1 border-t border-zinc-800", "pb-1")}>Identificação</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lCls}>年分 · Ano fiscal</label>
            <select value={d.nenBun} onChange={(e) => f("nenBun", Number(e.target.value))} className={iCls}>
              {Array.from({ length: 7 }, (_, i) => thisYear - 1 - i).map((y) => (
                <option key={y} value={y}>{y}年 · {y >= 2019 ? `令和${y - 2018}年` : `平成${y - 1988}年`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lCls}>支払者名 · Empresa</label>
            <input value={d.empresa || ""} onChange={(e) => f("empresa", e.target.value)} className={iCls} placeholder="ex: 株式会社 ○○" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lCls}>都道府県 · Prefeitura</label>
            <select value={d.todochifu || ""} onChange={(e) => f("todochifu", e.target.value)} className={iCls}>
              <option value="">— selecione —</option>
              {PREFECTURES_JP.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={lCls}>市区町村 · Município</label>
            <input value={d.shiku || ""} onChange={(e) => f("shiku", e.target.value)} className={iCls} placeholder="ex: 豊田市" />
          </div>
        </div>

        <div className={secCls}>Valores principais</div>
        <div>
          <label className={lCls}>支払金額 · Renda bruta anual (¥) <span className="text-amber-500">*</span></label>
          <input type="number" inputMode="numeric" value={d.shiharaiGaku || ""} onChange={(e) => f("shiharaiGaku", e.target.value)} className={iCls} placeholder="ex: 5923386" />
          <div className={sCls}>Total dos salários recebidos no ano, antes de qualquer desconto</div>
        </div>
        <div>
          <label className={lCls}>給与所得控除後の金額 · Renda após dedução empregatória (¥) <span className="text-zinc-600">opcional</span></label>
          <input type="number" inputMode="numeric" value={d.kyuyoShotokuGo || ""} onChange={(e) => f("kyuyoShotokuGo", e.target.value)} className={iCls} placeholder="ex: 4296000" />
          <div className={sCls}>Segundo campo do Gensen — melhora a precisão do cálculo</div>
        </div>
        <div>
          <label className={lCls}>所得控除の額の合計額 · Total de deduções (¥) <span className="text-zinc-600">opcional</span></label>
          <input type="number" inputMode="numeric" value={d.shotokuKojo || ""} onChange={(e) => f("shotokuKojo", e.target.value)} className={iCls} placeholder="ex: 380000" />
        </div>
        <div>
          <label className={lCls}>源泉徴収税額 · IR retido na fonte (¥) <span className="text-zinc-600">opcional</span></label>
          <input type="number" inputMode="numeric" value={d.gensenZei || ""} onChange={(e) => f("gensenZei", e.target.value)} className={iCls} placeholder="ex: 776951" />
          <div className={sCls}>IR final após 年末調整 — preencha para calcular restituição</div>
        </div>
        <div>
          <label className={lCls}>社会保険料等の金額 · Previdência social anual (¥) <span className="text-amber-500">*</span></label>
          <input type="number" inputMode="numeric" value={d.shakaiHoken || ""} onChange={(e) => f("shakaiHoken", e.target.value)} className={iCls} placeholder="ex: 680000" />
          <div className={sCls}>Saúde + Pensão + Desemprego acumulados no ano</div>
        </div>

        <div className={secCls}>Deduções adicionais (opcional)</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lCls}>生命保険料控除 · Seg. de vida (¥)</label>
            <input type="number" inputMode="numeric" value={d.seimeiHoken || ""} onChange={(e) => f("seimeiHoken", e.target.value)} className={iCls} placeholder="0" />
          </div>
          <div>
            <label className={lCls}>地震保険料控除 · Seg. sismo (¥)</label>
            <input type="number" inputMode="numeric" value={d.jishinHoken || ""} onChange={(e) => f("jishinHoken", e.target.value)} className={iCls} placeholder="0" />
          </div>
        </div>
        <div>
          <label className={lCls}>住宅借入金等特別控除 · Financiamento imóvel (¥)</label>
          <input type="number" inputMode="numeric" value={d.jutakuKariire || ""} onChange={(e) => f("jutakuKariire", e.target.value)} className={iCls} placeholder="0" />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!canSave} className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-sm font-semibold disabled:opacity-40">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export function GensenScreen({ settings }) {
  const [gensenList, setGensenList] = useState(loadGensen);
  const [modal, setModal] = useState(null);

  function handleSave(g) {
    const isUpdate = gensenList.some((x) => x.id === g.id);
    const next = isUpdate ? gensenList.map((x) => (x.id === g.id ? g : x)) : [...gensenList, g];
    setGensenList(next);
    saveGensen(next);
    setModal(null);
  }

  function remove(id) {
    if (!confirm("Remover este Gensen?")) return;
    const next = gensenList.filter((x) => x.id !== id);
    setGensenList(next);
    saveGensen(next);
  }

  const sorted = [...gensenList].sort((a, b) => b.nenBun - a.nenBun);

  return (
    <div className="space-y-3 pb-24 sm:pb-28">
      <div className="pt-1 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">Fiscal</div>
          <h2 className="text-lg font-bold text-zinc-100">Gensen · 源泉徴収票</h2>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold"
        >
          + Adicionar
        </button>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-2">
          <div className="text-3xl">📄</div>
          <div className="text-sm text-zinc-400">Nenhum Gensen cadastrado</div>
          <div className="text-xs text-zinc-600">Adicione o comprovante anual (recebido em jan/fev) para calcular 住民税 com precisão</div>
          <button onClick={() => setModal({})} className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold">
            Cadastrar Gensen
          </button>
        </div>
      )}

      {sorted.map((g) => (
        <div key={g.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-zinc-100">
                {g.nenBun}年 · {g.nenBun >= 2019 ? `令和${g.nenBun - 2018}年` : `平成${g.nenBun - 1988}年`}
              </div>
              {g.empresa && <div className="text-xs text-zinc-500">{g.empresa}</div>}
              {(g.todochifu || g.shiku) && (
                <div className="text-xs text-zinc-600">{g.todochifu} {g.shiku}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(g)} className="text-xs px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-600">Editar</button>
              <button onClick={() => remove(g.id)} className="text-xs px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-800">Excluir</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-0.5">支払金額 · Renda bruta</div>
              <div className="text-base font-bold font-mono text-green-400">{YEN(g.shiharaiGaku)}</div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-0.5">社会保険料 · Previdência</div>
              <div className="text-base font-bold font-mono text-blue-400">{YEN(g.shakaiHoken)}</div>
            </div>
          </div>

          {g.gensenZei > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {g.kyuyoShotokuGo > 0 && (
                <div className="bg-zinc-800/40 rounded-xl p-2.5">
                  <div className="text-xs text-zinc-600">Renda após ded. emprego</div>
                  <div className="text-sm font-mono text-zinc-300">{YEN(g.kyuyoShotokuGo)}</div>
                </div>
              )}
              <div className="bg-zinc-800/40 rounded-xl p-2.5">
                <div className="text-xs text-zinc-600">IR retido 源泉徴収税額</div>
                <div className="text-sm font-mono text-orange-300">{YEN(g.gensenZei)}</div>
              </div>
            </div>
          )}

          {(g.seimeiHoken > 0 || g.jishinHoken > 0 || g.jutakuKariire > 0) && (
            <div className="text-xs text-zinc-600 space-y-0.5 border-t border-zinc-800 pt-2">
              {g.seimeiHoken > 0 && <div className="flex justify-between"><span>生命保険料控除</span><span className="font-mono">{YEN(g.seimeiHoken)}</span></div>}
              {g.jishinHoken > 0 && <div className="flex justify-between"><span>地震保険料控除</span><span className="font-mono">{YEN(g.jishinHoken)}</span></div>}
              {g.jutakuKariire > 0 && <div className="flex justify-between"><span>住宅借入金等特別控除</span><span className="font-mono">{YEN(g.jutakuKariire)}</span></div>}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-4 text-xs text-zinc-600 space-y-1">
        <div className="text-zinc-500 font-semibold mb-1">O que é o Gensen?</div>
        <div>• 源泉徴収票 é o comprovante anual de rendimentos e IR retido na fonte</div>
        <div>• Entregue pelo empregador em janeiro/fevereiro do ano seguinte</div>
        <div>• Usado para calcular 住民税 (imposto municipal) com precisão real</div>
        <div>• Necessário para declaração voluntária 確定申告 (até 15/Mar)</div>
      </div>

      {modal !== null && (
        <GensenModal
          initial={modal.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
