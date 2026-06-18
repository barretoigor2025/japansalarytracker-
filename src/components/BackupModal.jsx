import { useState } from "react";
import { Card } from "./ui.jsx";
import { exportBackup, parseBackup, STORAGE_KEYS } from "../utils/storage.js";

// ── BackupModal ───────────────────────────────────────────────────────────────

function BackupModal({ entries, settings, gastos, carro, auditHistory, onRestore, onClose }) {
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
    const json = exportBackup(entries, settings, gastos, carro, auditHistory);
    localStorage.setItem(lastBackupKey, new Date().toISOString());
    setBackupJson(json);
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>💾 Backup & Restauração</h2>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {[{ id: "export", label: "⬇ Exportar" }, { id: "import", label: "⬆ Importar" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={tab === t.id
                ? { color: "var(--warning)", borderBottom: "2px solid var(--warning)" }
                : { color: "var(--text-muted)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "export" && (
            <div className="space-y-2">
              <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-sub)" }}>Lançamentos</span>
                  <span className="font-mono font-bold" style={{ color: "var(--text)" }}>{entries.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-sub)" }}>Último backup</span>
                  <span className="font-mono text-sm" style={{ color: daysSinceBackup === null ? "var(--negative)" : daysSinceBackup > 7 ? "var(--warning)" : "var(--positive)" }}>
                    {daysSinceBackup === null ? "nunca feito ⚠️" : daysSinceBackup === 0 ? "hoje ✓" : `há ${daysSinceBackup} dias`}
                  </span>
                </div>
              </div>

              {daysSinceBackup === null && (
                <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--negative)" }}>
                  ⚠️ Você ainda não fez backup! Se o browser limpar os dados, você perde tudo. Faça agora.
                </div>
              )}
              {daysSinceBackup !== null && daysSinceBackup > 7 && (
                <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--warning)" }}>
                  ⚠️ Seu último backup foi há {daysSinceBackup} dias. Recomendamos backup semanal.
                </div>
              )}

              <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                <div>• Gera um arquivo <code style={{ color: "var(--text-sub)" }}>.json</code> com todos os lançamentos e configurações</div>
                <div>• Salve no seu celular, envie por WhatsApp pra você mesmo</div>
                <div>• Para restaurar depois: use a aba "Importar"</div>
              </div>

              <button
                onClick={doExport}
                className="w-full py-3 rounded-xl font-bold text-sm transition-colors"
                style={{ background: "var(--text)", color: "var(--bg)" }}
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
                    className="w-full py-3 rounded-xl font-bold text-sm transition-colors"
                    style={{ background: "var(--info)", color: "#fff" }}
                  >
                    📋 Copiar JSON (alternativa)
                  </button>
                  <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Cole o texto copiado num bloco de notas e salve como <span className="font-mono" style={{ color: "var(--warning)" }}>backup.json</span>
                  </div>
                </div>
              )}

              {backupJson && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold" style={{ color: "var(--positive)" }}>✓ Backup gerado! Se o download não abriu automaticamente, copie o texto abaixo e salve como .json:</div>
                  <div className="relative">
                    <textarea
                      id="backup-textarea"
                      readOnly
                      value={backupJson}
                      rows={5}
                      className="w-full rounded-lg p-2 text-xs font-mono resize-none focus:outline-none"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}
                      onClick={(e) => { e.target.select(); e.target.setSelectionRange(0, 99999); }}
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(backupJson); }}
                      className="absolute top-2 right-2 px-2 py-1 rounded text-xs transition-colors"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Cole no bloco de notas, salve como <code style={{ color: "var(--text-sub)" }}>backup.json</code> e guarde em lugar seguro.</div>
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
                className="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
                style={dragOver
                  ? { borderColor: "var(--warning)", background: "rgba(245,158,11,0.08)" }
                  : { borderColor: "var(--border-mid)" }
                }
                onClick={() => document.getElementById("backup-file-input").click()}
              >
                <div className="text-3xl mb-2">📂</div>
                <div className="text-sm" style={{ color: "var(--text-sub)" }}>Arraste o arquivo aqui ou clique para escolher</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Aceita: jst-backup-XXXX-XX-XX.json</div>
                <input
                  id="backup-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {error && (
                <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--negative)" }}>{error}</div>
              )}

              {preview && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-elevated)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--positive)" }}>✓ Arquivo válido — Preview do backup:</div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-sub)" }}>Lançamentos</span>
                    <span className="font-mono font-bold" style={{ color: "var(--text)" }}>{preview.entries.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-sub)" }}>Data do backup</span>
                    <span className="font-mono text-xs" style={{ color: "var(--text-sub)" }}>{new Date(preview.exportedAt).toLocaleString("pt-BR")}</span>
                  </div>
                  {preview.settings?.name && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-sub)" }}>Trabalhador</span>
                      <span style={{ color: "var(--text)" }}>{preview.settings.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-sub)" }}>Dados atuais serão substituídos</span>
                    <span className="font-mono" style={{ color: "var(--negative)" }}>{entries.length} → {preview.entries.length}</span>
                  </div>
                </div>
              )}

              <button
                onClick={confirmRestore}
                disabled={!preview}
                className="w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--info)", color: "#fff" }}
              >
                ⬆ Restaurar este Backup
              </button>

              {showRestoreConfirm && (
                <div className="rounded-xl p-4 text-center space-y-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--negative)" }}>Tem certeza? Isso substitui todos os dados atuais ({entries.length} lançamentos).</div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRestoreConfirm(false)} className="flex-1 py-2 rounded-lg text-xs transition-colors" style={{ border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}>Cancelar</button>
                    <button onClick={doRestore} className="flex-1 py-2 rounded-lg font-bold text-xs" style={{ background: "var(--negative)", color: "#fff" }}>Sim, restaurar</button>
                  </div>
                </div>
              )}

              <div className="rounded-xl p-3 text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
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
