import { useState } from "react";
import { Card } from "./ui.jsx";
import { exportBackup, parseBackup, STORAGE_KEYS } from "../utils/storage.js";

// ── BackupModal ───────────────────────────────────────────────────────────────

function BackupModal({ entries, settings, gastos, carro, auditHistory, cartao, onRestore, onClose }) {
  const [tab, setTab] = useState("export");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = parseBackup(e.target.result);
        setPreview(data);
        setError(null);
      } catch {
        setError("Arquivo inválido. Use um backup gerado por este app.");
        setPreview(null);
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  function confirmRestore() {
    if (!preview) return;
    setShowRestoreConfirm(true);
  }

  function doRestore() {
    onRestore(preview);
    onClose();
  }

  const lastBackupKey = "jst_last_backup";
  const lastBackup = localStorage.getItem(lastBackupKey);
  const daysSinceBackup = lastBackup
    ? Math.floor((Date.now() - new Date(lastBackup)) / 86400000)
    : null;

  const [backupJson, setBackupJson] = useState(null);

  function doExport() {
    const json = exportBackup(entries, settings, gastos, carro, auditHistory, cartao);
    localStorage.setItem(lastBackupKey, new Date().toISOString());
    setBackupJson(json);
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">💾 Backup & Restauração</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {[{ id: "export", label: "⬇ Exportar" }, { id: "import", label: "⬆ Importar" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? "text-amber-400 border-b-2 border-amber-500" : "text-zinc-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "export" && (
            <div className="space-y-2">
              <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Lançamentos</span>
                  <span className="font-mono font-bold text-zinc-200">{entries.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Último backup</span>
                  <span className={`font-mono text-sm ${daysSinceBackup === null ? "text-red-400" : daysSinceBackup > 7 ? "text-yellow-400" : "text-green-400"}`}>
                    {daysSinceBackup === null ? "nunca feito ⚠️" : daysSinceBackup === 0 ? "hoje ✓" : `há ${daysSinceBackup} dias`}
                  </span>
                </div>
              </div>

              {daysSinceBackup === null && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-xs text-red-300">
                  ⚠️ Você ainda não fez backup! Se o browser limpar os dados, você perde tudo. Faça agora.
                </div>
              )}
              {daysSinceBackup !== null && daysSinceBackup > 7 && (
                <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3 text-xs text-yellow-300">
                  ⚠️ Seu último backup foi há {daysSinceBackup} dias. Recomendamos backup semanal.
                </div>
              )}

              <div className="bg-zinc-900/50 rounded-xl p-3 text-xs text-zinc-500 space-y-1">
                <div>• Gera um arquivo <code className="text-zinc-400">.json</code> com todos os lançamentos e configurações</div>
                <div>• Salve no seu celular, envie por WhatsApp pra você mesmo</div>
                <div>• Para restaurar depois: use a aba "Importar"</div>
              </div>

              <button
                onClick={doExport}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
              >
                ⬇ Baixar Backup Agora
              </button>

              {backupJson && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(backupJson)
                        .then(() => alert("✅ JSON copiado! Cole num arquivo .txt e salve como .json"))
                        .catch(() => {
                          const ta = document.getElementById('backup-textarea');
                          if (ta) { ta.select(); ta.setSelectionRange(0, 99999); }
                        });
                    }}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
                  >
                    📋 Copiar JSON (alternativa)
                  </button>
                  <div className="text-xs text-zinc-500 text-center">
                    Cole o texto copiado num bloco de notas e salve como <span className="text-amber-400 font-mono">backup.json</span>
                  </div>
                </div>
              )}

              {backupJson && (
                <div className="space-y-2">
                  <div className="text-xs text-green-400 font-semibold">✓ Backup gerado! Se o download não abriu automaticamente, copie o texto abaixo e salve como .json:</div>
                  <div className="relative">
                    <textarea
                      id="backup-textarea"
                      readOnly
                      value={backupJson}
                      rows={5}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300 font-mono resize-none focus:outline-none"
                      onClick={(e) => { e.target.select(); e.target.setSelectionRange(0, 99999); }}
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(backupJson); }}
                      className="absolute top-2 right-2 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-300 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="text-xs text-zinc-500">Cole no bloco de notas, salve como <code className="text-zinc-400">backup.json</code> e guarde em lugar seguro.</div>
                </div>
              )}
            </div>
          )}

          {tab === "import" && (
            <div className="space-y-2">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragOver ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 hover:border-zinc-600"
                }`}
                onClick={() => document.getElementById("backup-file-input").click()}
              >
                <div className="text-3xl mb-2">📂</div>
                <div className="text-sm text-zinc-400">Arraste o arquivo aqui ou clique para escolher</div>
                <div className="text-xs text-zinc-600 mt-1">Aceita: jst-backup-XXXX-XX-XX.json</div>
                <input
                  id="backup-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-xs text-red-300">{error}</div>
              )}

              {preview && (
                <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-green-400 font-semibold mb-2">✓ Arquivo válido — Preview do backup:</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Lançamentos</span>
                    <span className="font-mono font-bold text-zinc-200">{preview.entries.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Data do backup</span>
                    <span className="font-mono text-zinc-300 text-xs">{new Date(preview.exportedAt).toLocaleString("pt-BR")}</span>
                  </div>
                  {preview.settings?.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Trabalhador</span>
                      <span className="text-zinc-300">{preview.settings.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Dados atuais serão substituídos</span>
                    <span className="text-red-400 font-mono">{entries.length} → {preview.entries.length}</span>
                  </div>
                </div>
              )}

              <button
                onClick={confirmRestore}
                disabled={!preview}
                className="w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white"
              >
                ⬆ Restaurar este Backup
              </button>

              {showRestoreConfirm && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-center space-y-3">
                  <div className="text-sm font-semibold text-red-300">Tem certeza? Isso substitui todos os dados atuais ({entries.length} lançamentos).</div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRestoreConfirm(false)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200">Cancelar</button>
                    <button onClick={doRestore} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs">Sim, restaurar</button>
                  </div>
                </div>
              )}

              <div className="bg-zinc-900/50 rounded-xl p-3 text-xs text-zinc-500">
                ⚠️ A restauração substitui todos os dados atuais. Faça um export antes se quiser preservar o que tem.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { BackupModal };
