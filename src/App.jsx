import { useState, useEffect } from "react";

import { DashboardScreen } from "./screens/Dashboard.jsx";
import { EntriesScreen }   from "./screens/Entries.jsx";
import { ReportsScreen }   from "./screens/Reports.jsx";
import { CompareScreen }   from "./screens/Compare.jsx";
import { GastosScreen }    from "./screens/Gastos.jsx";
import { CarroScreen }     from "./screens/Carro.jsx";
import { SettingsScreen }  from "./screens/Settings.jsx";
import { BackupModal }     from "./components/BackupModal.jsx";

import { loadData, saveData, STORAGE_KEYS } from "./utils/storage.js";
import { defaultSettings, defaultGastos, defaultCarro } from "./utils/calc.js";

const TABS = [
  { id: "dashboard", label: "Início",    icon: "🏠" },
  { id: "entries",   label: "Jornada",   icon: "📋" },
  { id: "reports",   label: "Relatórios",icon: "📊" },
  { id: "compare",   label: "Comparar",  icon: "📈" },
  { id: "gastos",    label: "Gastos",    icon: "💸" },
  { id: "carro",     label: "Carro",     icon: "🚗" },
  { id: "settings",  label: "Config",    icon: "⚙️" },
];

export default function App() {
  // ── PWA install prompt ──────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall]     = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => { setInstallPrompt(null); setShowInstall(false); });
  }

  // ── State ───────────────────────────────────────────────────────
  const [tab,  setTab]  = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("jst_theme") || "dark");

  const [entries,      setEntries]      = useState(() => loadData(STORAGE_KEYS.entries, []));
  const [gastos,       setGastos]       = useState(() => loadData(STORAGE_KEYS.gastos, defaultGastos));
  const [auditHistory, setAuditHistory] = useState(() => loadData(STORAGE_KEYS.payslipAudit, []));
  const [carro, setCarro] = useState(() => {
    const saved = loadData(STORAGE_KEYS.carro, defaultCarro);
    if (saved?.financiamentos?.[0]?.id === "f1" && saved.financiamentos[0].valorTotal !== 570000) return defaultCarro;
    if (saved?.financiamentos?.[0]?.id === "f1" && saved.financiamentos[0].parcelas.length > 8)   return defaultCarro;
    return saved;
  });
  const [settings, setSettings] = useState(() => {
    const saved = loadData(STORAGE_KEYS.settings, defaultSettings);
    if (!saved.teate?.length) saved.teate = defaultSettings.teate;
    return saved;
  });

  const [toast,          setToast]          = useState(null);
  const [showBackup,     setShowBackup]     = useState(false);
  const [backupReminder, setBackupReminder] = useState(false);

  // ── Persistence ─────────────────────────────────────────────────
  useEffect(() => { saveData(STORAGE_KEYS.entries, entries); },        [entries]);
  useEffect(() => { saveData(STORAGE_KEYS.settings, settings); },      [settings]);
  useEffect(() => { saveData(STORAGE_KEYS.gastos, gastos); },          [gastos]);
  useEffect(() => { saveData(STORAGE_KEYS.payslipAudit, auditHistory); }, [auditHistory]);
  useEffect(() => { saveData(STORAGE_KEYS.carro, carro); },            [carro]);
  useEffect(() => { localStorage.setItem("jst_theme", theme); },       [theme]);

  useEffect(() => {
    const last = localStorage.getItem("jst_last_backup");
    if (!last) { setBackupReminder(true); return; }
    if ((Date.now() - new Date(last).getTime()) / 86400000 > 7) setBackupReminder(true);
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.style.background = theme === "dark" ? "#0a0a0a" : "#f5f5f5";
    document.body.style.color      = theme === "dark" ? "#f0f0f0" : "#0f0f0f";
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ── Helpers ─────────────────────────────────────────────────────
  function showToast(msg, color = "green") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  }

  function saveSettings(s) { setSettings(s); showToast("Configurações salvas!"); }

  function handleRestore(data) {
    setEntries(data.entries);
    if (data.settings)     setSettings(data.settings);
    if (data.gastos)       setGastos(data.gastos);
    if (data.carro)        setCarro(data.carro);
    if (data.auditHistory) setAuditHistory(data.auditHistory);
    showToast("Backup restaurado!", "blue");
  }

  // ── Render ──────────────────────────────────────────────────────
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen theme-${theme}`}
      style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Plus Jakarta Sans','Noto Sans JP',sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40"
        style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⛩️</span>
            <span className="text-sm font-bold tracking-wide" style={{ color: "var(--text)" }}>給与管理</span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-mid)" }}>
              {settings.mode === "japan" ? "JP" : "Custom"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {showInstall && (
              <button onClick={handleInstall}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                style={{ background: "var(--text)", color: "var(--bg)" }}>
                ⬇ Instalar
              </button>
            )}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)" }}
              title={isDark ? "Modo claro" : "Modo escuro"}>
              <span className="text-sm">{isDark ? "☀️" : "🌙"}</span>
            </button>
            <button
              onClick={() => setShowBackup(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-sub)" }}
              title="Backup">
              <span className="text-sm">💾</span>
              <span className="text-xs font-medium">Backup</span>
              {backupReminder && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--negative)" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-xl"
          style={{
            background: toast.color === "blue" ? "var(--info)" : toast.color === "red" ? "var(--negative)" : "var(--positive)",
            color: "#fff",
          }}>
          {toast.msg}
        </div>
      )}

      {/* ── Screen content ──────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-28">
        {tab === "dashboard" && (
          <DashboardScreen entries={entries} settings={settings}
            onAddEntry={(e) => setEntries(prev => [...prev, e])} />
        )}
        {tab === "entries" && (
          <EntriesScreen entries={entries} settings={settings}
            onAdd={(e) => setEntries(prev => [...prev, e])}
            onEdit={(u) => setEntries(prev => prev.map(e => e.id === u.id ? u : e))}
            onDelete={(id) => setEntries(prev => prev.filter(e => e.id !== id))} />
        )}
        {tab === "reports"  && <ReportsScreen entries={entries} settings={settings} />}
        {tab === "compare"  && <CompareScreen entries={entries} settings={settings} />}
        {tab === "gastos"   && <GastosScreen gastos={gastos} onSave={setGastos} />}
        {tab === "carro"    && <CarroScreen carro={carro} onSave={setCarro} />}
        {tab === "settings" && (
          <SettingsScreen settings={settings} onSave={saveSettings}
            entries={entries} auditHistory={auditHistory} onSaveAudit={setAuditHistory} />
        )}
      </div>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40"
        style={{ background: "var(--nav-bg)", borderTop: "1px solid var(--border)", backdropFilter: "blur(8px)",
                 paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center py-2 transition-all relative"
                style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "var(--nav-active)" }} />
                )}
                <span className="text-xl">{t.icon}</span>
                <span className={`text-xs mt-0.5 ${active ? "font-bold" : "font-medium"}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showBackup && (
        <BackupModal entries={entries} settings={settings} gastos={gastos}
          carro={carro} auditHistory={auditHistory}
          onRestore={handleRestore} onClose={() => setShowBackup(false)} />
      )}
    </div>
  );
}
