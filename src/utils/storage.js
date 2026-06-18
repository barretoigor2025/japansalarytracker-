// ── Storage utilities ──────────────────────────

export const STORAGE_KEYS = {
  entries: "jst_entries",
  settings: "jst_settings",
  payslips: "jst_payslips",
  gastos: "jst_gastos",
  payslipAudit: "jst_audit",
  carro: "jst_carro",
  gensen: "jst_gensen",
  taxVehicles: "jst_tax_vehicles",
};

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function exportBackup(entries, settings, gastos, carro, auditHistory) {
  const data = {
    version: 3,
    exportedAt: new Date().toISOString(),
    entries,
    settings,
    gastos: gastos || null,
    carro: carro || null,
    auditHistory: auditHistory || [],
  };
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
  const a = document.createElement("a");
  a.href = uri;
  a.download = `jst-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return json;
}

export function parseBackup(jsonText) {
  const data = JSON.parse(jsonText);
  if (!data.entries || !Array.isArray(data.entries)) throw new Error("Arquivo inválido");
  return data;
}
