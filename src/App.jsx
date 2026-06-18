import { useState, useEffect } from "react";

// Screens
import { DashboardScreen } from "./screens/Dashboard.jsx";
import { EntriesScreen } from "./screens/Entries.jsx";
import { ReportsScreen } from "./screens/Reports.jsx";
import { CompareScreen } from "./screens/Compare.jsx";
import { GastosScreen } from "./screens/Gastos.jsx";
import { CarroScreen } from "./screens/Carro.jsx";
import { CartaoScreen } from "./screens/Cartao.jsx";
import { GensenScreen } from "./screens/Gensen.jsx";
import { ImpostosScreen } from "./screens/Impostos.jsx";
import { SettingsScreen } from "./screens/Settings.jsx";

// Components
import { BackupModal } from "./components/BackupModal.jsx";

// Utils
import { loadData, saveData, STORAGE_KEYS } from "./utils/storage.js";
import { defaultSettings, defaultGastos, defaultCarro } from "./utils/calc.js";

// ── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Início",     icon: "🏠" },
  { id: "entries",   label: "Jornada",    icon: "📋" },
  { id: "reports",   label: "Relatórios", icon: "📊" },
  { id: "compare",   label: "Comparar",   icon: "📈" },
  { id: "gastos",    label: "Gastos",     icon: "💸" },
  { id: "cartao",    label: "Cartão",     icon: "💳" },
  { id: "carro",     label: "Carro",      icon: "🚗" },
  { id: "gensen",    label: "Gensen",     icon: "📄" },
  { id: "impostos",  label: "Impostos",   icon: "🏛️" },
  { id: "settings",  label: "Config",     icon: "⚙️" },
];

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null);
      setShowInstall(false);
    });
  }

  const [tab, setTab] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("jst_theme") || "dark");
  const [entries, setEntries] = useState(() => loadData(STORAGE_KEYS.entries, []));
  const [gastos, setGastos] = useState(() => loadData(STORAGE_KEYS.gastos, defaultGastos));
  const [auditHistory, setAuditHistory] = useState(() => loadData(STORAGE_KEYS.payslipAudit, []));
  const [carro, setCarro] = useState(() => {
    const saved = loadData(STORAGE_KEYS.carro, defaultCarro);
    if (saved?.financiamentos?.[0]?.id === "f1" && saved.financiamentos[0].valorTotal !== 570000) return defaultCarro;
    if (saved?.financiamentos?.[0]?.id === "f1" && saved.financiamentos[0].parcelas.length > 8) return defaultCarro;
    return saved;
  });
  const [settings, setSettings] = useState(() => {
    const saved = loadData(STORAGE_KEYS.settings, defaultSettings);
    if (!saved.teate || saved.teate.length === 0) saved.teate = defaultSettings.teate;
    return saved;
  });
  const [toast, setToast] = useState(null);
  const [showBackup, setShowBackup] = useState(false);
  const [backupReminder, setBackupReminder] = useState(false);

  const showToast = (msg, color = "green") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => { saveData(STORAGE_KEYS.entries, entries); }, [entries]);
  useEffect(() => { saveData(STORAGE_KEYS.settings, settings); }, [settings]);
  useEffect(() => { saveData(STORAGE_KEYS.gastos, gastos); }, [gastos]);
  useEffect(() => { saveData(STORAGE_KEYS.payslipAudit, auditHistory); }, [auditHistory]);
  useEffect(() => { saveData(STORAGE_KEYS.carro, carro); }, [carro]);
  useEffect(() => { localStorage.setItem("jst_theme", theme); }, [theme]);

  useEffect(() => {
    const last = localStorage.getItem("jst_last_backup");
    if (!last) { setBackupReminder(true); return; }
    const days = (Date.now() - new Date(last).getTime()) / 86400000;
    if (days > 7) setBackupReminder(true);
  }, []);

  function saveSettings(s) {
    setSettings(s);
    showToast("Configurações salvas!", "green");
  }

  const handleRestore = (data) => {
    setEntries(data.entries);
    if (data.settings) setSettings(data.settings);
    if (data.gastos) setGastos(data.gastos);
    if (data.carro) setCarro(data.carro);
    if (data.auditHistory) setAuditHistory(data.auditHistory);
    showToast("Backup restaurado com sucesso!", "blue");
  };

  const bodyBg = theme === "dark" ? "#09090b" : "#f4f4f5";
  const rootCls = `min-h-screen font-sans theme-${theme} ` + (theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900");

  const staticCss = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { height: 100%; height: -webkit-fill-available; }
        body {
          margin: 0;
          background: ${bodyBg};
          transition: background 0.3s;
          font-family: 'DM Sans', 'Noto Sans JP', sans-serif;
          -webkit-font-smoothing: antialiased;
          overscroll-behavior: none;
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
        .font-mono { font-family: 'DM Mono', 'Noto Sans JP', monospace; }
        .safe-top    { padding-top:    max(12px, env(safe-area-inset-top)); }
        .safe-bottom { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        button:active { opacity: 0.75; transform: scale(0.97); }
        input[type="time"], input[type="date"], input[type="month"] {
          -webkit-appearance: none;
          color-scheme: dark;
        }
        input, select, textarea { font-size: 16px; }
        .theme-light { --bg: #f4f4f5; --bg-card: #ffffff; --border: #e4e4e7; --text: #18181b; --text-sub: #71717a; --text-muted: #a1a1aa; }
        .theme-dark  { --bg: #09090b; --bg-card: rgba(24,24,27,0.8); --border: #27272a; --text: #f4f4f5; --text-sub: #a1a1aa; --text-muted: #52525b; }
        @media (min-width: 640px) { body { font-size: 15px; } }
        @media (min-width: 1024px) {
          .main-scroll { padding-bottom: 80px; }
          .bottom-nav-inner { padding: 0 2rem; }
        }
      `;

  return (
    <div className={rootCls} style={{ fontFamily: "'DM Sans', 'Noto Sans JP', sans-serif" }}>
      <style>{staticCss}</style>

      {/* Top bar */}
      <div className={`sticky top-0 z-40 backdrop-blur border-b px-4 py-2 ${theme === "dark" ? "bg-zinc-950/90 border-zinc-800/50" : "bg-white/90 border-zinc-200"}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⛩️</span>
            <span className="text-sm font-semibold text-zinc-200 tracking-wide">給与管理</span>
            <span className="text-xs text-zinc-600">· {settings.mode === "japan" ? "JP Padrão" : "Personalizado"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 hover:border-amber-600 transition-colors"
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            {showInstall && (
              <button onClick={handleInstall}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
                title="Instalar app">
                ⬇ App
              </button>
            )}
            <button
              onClick={() => setShowBackup(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-700 hover:border-amber-600 transition-colors group"
              title="Backup"
            >
              <span className="text-sm">💾</span>
              <span className="text-xs text-zinc-400 group-hover:text-amber-400 transition-colors">Backup</span>
              {backupReminder && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all ${
          toast.color === "blue" ? "bg-blue-600 text-white" :
          toast.color === "red" ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        {tab === "dashboard" && (
          <DashboardScreen entries={entries} settings={settings} onAddEntry={(e) => setEntries((prev) => [...prev, e])} />
        )}
        {tab === "entries" && (
          <EntriesScreen
            entries={entries}
            settings={settings}
            onAdd={(e) => setEntries((prev) => [...prev, e])}
            onEdit={(updated) => setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
            onDelete={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
          />
        )}
        {tab === "reports" && <ReportsScreen entries={entries} settings={settings} />}
        {tab === "compare" && <CompareScreen entries={entries} settings={settings} />}
        {tab === "gastos" && (
          <GastosScreen gastos={gastos} onSave={setGastos} />
        )}
        {tab === "cartao" && (
          <CartaoScreen gastos={gastos} onSave={setGastos} />
        )}
        {tab === "carro" && (
          <CarroScreen carro={carro} onSave={setCarro} />
        )}
        {tab === "gensen" && (
          <GensenScreen settings={settings} />
        )}
        {tab === "impostos" && (
          <ImpostosScreen entries={entries} settings={settings} onTabSwitch={setTab} />
        )}
        {tab === "settings" && (
          <SettingsScreen settings={settings} onSave={saveSettings} entries={entries}
            auditHistory={auditHistory} onSaveAudit={setAuditHistory} />
        )}
      </div>

      {/* Bottom nav — scrollable for 9 tabs */}
      <div className={`fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t ${theme === "dark" ? "bg-zinc-950/95 border-zinc-800/50" : "bg-white/95 border-zinc-200"}`}
        style={{paddingBottom: "env(safe-area-inset-bottom, 0px)"}}>
        <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-none">
          <div className="flex min-w-max mx-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center py-2 px-3 transition-colors min-w-[56px] ${
                  tab === t.id
                    ? "text-amber-400"
                    : theme === "dark" ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showBackup && (
        <BackupModal
          entries={entries}
          settings={settings}
          gastos={gastos}
          carro={carro}
          auditHistory={auditHistory}
          onRestore={handleRestore}
          onClose={() => setShowBackup(false)}
        />
      )}
    </div>
  );
}
