// ── Constants ─────────────────────────────────────

export const JAPAN_RULES = {
  dailyHours: 8,
  weeklyHours: 40,
  overtimeRate: 0.25,
  overtimeHighRate: 0.50,
  monthlyOvertimeThreshold: 60,
  nightStart: 22,
  nightEnd: 5,
  nightRate: 0.25,
  holidayRate: 0.35,
};

export const AICHI_RATES = {
  kenkouHoken: 0.0525,
  kouseiNenkin: 0.0915,
  kaigoHoken: 0.0082,
  koyouHoken: 0.006,
};

export const DAY_TYPES = [
  { value: "normal",   label: "Normal" },
  { value: "saturday", label: "Sábado (6º dia)" },
  { value: "sunday",   label: "Domingo" },
  { value: "holiday",  label: "Feriado Legal" },
  { value: "yukyu",    label: "有給休暇 (Folga Remunerada)" },
];

// ── Defaults ──────────────────────────────────────

export const defaultSettings = {
  name: "",
  hourlyRate: 1500,
  mode: "japan",
  age: 35,
  healthInsurance: true,
  pension: true,
  employmentInsurance: true,
  municipalTax: false,
  saturdayRate: 0,
  sundayRate: 0,
  defaultBreak: 60,
  hireDate: "",
  customRules: { ...JAPAN_RULES },
  teate: [
    { id: "t1", name: "非課税通勤手当", label: "Vale Transporte (通勤手当)", amount: 12900, taxable: false, active: true },
    { id: "t2", name: "調用旅費", label: "Deslocamento/Viagem (eventual)", amount: 0, taxable: false, active: false },
    { id: "t3", name: "住宅手当①", label: "Moradia 1 (住宅手当)", amount: 15000, taxable: true, active: true },
    { id: "t4", name: "住宅手当②", label: "Moradia 2 (住宅手当)", amount: 10000, taxable: true, active: true },
    { id: "t5", name: "その他手当", label: "Outro benefício", amount: 0, taxable: true, active: false },
  ],
};

export const defaultGastos = {
  rendas: [
    { id: "r1", name: "Salário", amount: 0, active: true },
    { id: "r2", name: "Outro", amount: 0, active: false },
  ],
  despesas: [
    { id: "d1", name: "KDDI Telefonia", amount: 43851, tipo: "debito", active: true },
    { id: "d2", name: "Seguro Outlander", amount: 10580, tipo: "debito", active: true },
    { id: "d3", name: "Seguro Acqua", amount: 5960, tipo: "debito", active: true },
    { id: "d4", name: "Seguro Casa", amount: 4500, tipo: "debito", active: true },
    { id: "d5", name: "Internet", amount: 7450, tipo: "debito", active: true },
    { id: "d6", name: "Netflix", amount: 2290, tipo: "debito", active: true },
    { id: "d7", name: "YouTube Premium", amount: 1280, tipo: "debito", active: true },
    { id: "d8", name: "Hotmart 99Vidas", amount: 295, tipo: "debito", active: true },
    { id: "d9", name: "Cartão de Crédito", amount: 173588, tipo: "hagaki", active: true },
    { id: "d10", name: "Eletricidade", amount: 38790, tipo: "hagaki", active: true },
    { id: "d11", name: "Gás", amount: 18376, tipo: "hagaki", active: true },
    { id: "d12", name: "Água", amount: 7301, tipo: "hagaki", active: true },
    { id: "d13", name: "Imposto Casa", amount: 0, tipo: "hagaki", active: false },
    { id: "d14", name: "Imposto Igor", amount: 0, tipo: "hagaki", active: false },
    { id: "d15", name: "Imposto Patrícia", amount: 0, tipo: "hagaki", active: false },
    { id: "d16", name: "Imposto Outlander", amount: 0, tipo: "hagaki", active: false },
    { id: "d17", name: "Imposto Acqua", amount: 0, tipo: "hagaki", active: false },
    { id: "d18", name: "Empréstimo", amount: 0, tipo: "hagaki", active: false },
  ],
  overrides: {},
};

export const defaultCarro = {
  financiamentos: [
    {
      id: "f1",
      nome: "Outlander Roadest",
      valorTotal: 570000,
      entradas: [
        { id: "e1", descricao: "Honda Insight", valor: 100000, pago: true },
        { id: "e2", descricao: "Dinheiro", valor: 100000, pago: true },
      ],
      parcelas: [
        { id: "p1", numero: 1, valor: 50000, mesRef: "2020-01", pago: true },
        { id: "p2", numero: 2, valor: 50000, mesRef: "2020-02", pago: true },
        { id: "p3", numero: 3, valor: 50000, mesRef: "2020-03", pago: true },
        { id: "p4", numero: 4, valor: 50000, mesRef: "2020-04", pago: false },
        { id: "p5", numero: 5, valor: 50000, mesRef: "2020-05", pago: false },
        { id: "p6", numero: 6, valor: 50000, mesRef: "2020-06", pago: false },
        { id: "p7", numero: 7, valor: 50000, mesRef: "2020-07", pago: false },
        { id: "p8", numero: 8, valor: 20000, mesRef: "2020-08", pago: false },
      ],
    },
  ],
};

// ── Utility functions ─────────────────────────────

export function YEN(v) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(v || 0);
}

export function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function formatMinutes(mins) {
  if (mins < 0) mins = 0;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${m > 0 ? String(m).padStart(2, "0") + "m" : ""}`;
}

export function minutesToHours(mins) {
  return mins / 60;
}

export function getMonthsDiff(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

export function checkConflict(entry, entries, excludeId = null) {
  const sameDay = entries.filter(e => e.date === entry.date && e.id !== excludeId);
  if (sameDay.length > 0) {
    const existing = sameDay[0];
    return { message: `Já existe um lançamento em ${entry.date} (${existing.start}–${existing.end})` };
  }
  return null;
}

export function calcNightMinutes(startMin, endMin, rules = JAPAN_RULES) {
  const nightS = rules.nightStart * 60;
  const nightE = (24 + rules.nightEnd) * 60;

  let s = startMin;
  let e = endMin <= startMin ? endMin + 1440 : endMin;

  let night = 0;
  for (const offset of [0, 1440]) {
    const ns = nightS - offset;
    const ne = nightE - offset;
    const overlapS = Math.max(s, ns);
    const overlapE = Math.min(e, ne);
    if (overlapE > overlapS) night += overlapE - overlapS;
  }
  return Math.min(night, e - s);
}

export function calcDay(entry, settings, monthlyOvertimeSoFar = 0) {
  const rules = settings.mode === "japan" ? JAPAN_RULES : settings.customRules;
  const hourlyRate = settings.hourlyRate || 0;

  const inMin = parseTime(entry.start);
  let outMin = parseTime(entry.end);
  if (outMin <= inMin) outMin += 1440;

  const breakMin = (entry.breakMinutes != null && !isNaN(entry.breakMinutes)) ? Number(entry.breakMinutes) : 0;
  const totalMin = outMin - inMin - breakMin;
  const totalHours = minutesToHours(totalMin);

  const nightMin = calcNightMinutes(inMin, outMin - breakMin, rules);
  const dailyLimitMin = (rules.dailyHours || 8) * 60;

  let normalMin = Math.min(totalMin, dailyLimitMin);
  let overtimeDailyMin = Math.max(0, totalMin - dailyLimitMin);

  const isHoliday = entry.dayType === "holiday";
  const isSaturday = entry.dayType === "saturday";
  const isSunday = entry.dayType === "sunday";
  const isYukyu = entry.dayType === "yukyu";

  if (isYukyu) {
    const yukyuHours = rules.dailyHours || 8;
    const grossPay = Math.round(yukyuHours * hourlyRate);
    return {
      totalMin: yukyuHours * 60,
      totalHours: yukyuHours,
      normalMin: yukyuHours * 60,
      normalHours: yukyuHours,
      overtimeDailyMin: 0,
      overtimeHours: 0,
      nightMin: 0,
      nightHours: 0,
      isHoliday: false,
      isSaturday: false,
      isSunday: false,
      isYukyu: true,
      normalPay: grossPay,
      overtimePay: 0,
      nightPay: 0,
      holidayPay: 0,
      satSunPay: 0,
      grossPay,
      breakdown: {
        baseHours: yukyuHours,
        overtimeNormal: 0,
        overtimeHigh: 0,
        nightHours: 0,
        isYukyu: true,
        jpSaturdayIsAllOT: false,
        rates: { overtimeRate: 0, nightRate: 0, holidayRate: 0 },
      },
    };
  }

  const jpSaturdayIsAllOT = settings.mode === "japan" && isSaturday;
  const saturdayRate = settings.saturdayRate || 0;
  const sundayRate = settings.sundayRate || 0;
  const prevOTHours = monthlyOvertimeSoFar;

  const thisDayOTHours = jpSaturdayIsAllOT
    ? totalHours
    : minutesToHours(overtimeDailyMin);

  const highOTHours = Math.max(0, prevOTHours + thisDayOTHours - (rules.monthlyOvertimeThreshold || 60));
  const normalOTHours = thisDayOTHours - highOTHours;

  const normalBaseHours = jpSaturdayIsAllOT ? 0 : minutesToHours(normalMin);
  const normalPay = normalBaseHours * hourlyRate;

  const overtimeRate = isHoliday ? rules.holidayRate : rules.overtimeRate;
  const overtimePay =
    normalOTHours * hourlyRate * (1 + overtimeRate) +
    highOTHours * hourlyRate * (1 + (rules.overtimeHighRate || 0.5));

  const nightHours = minutesToHours(nightMin);
  const nightPay = nightHours * hourlyRate * rules.nightRate;

  let holidayPay = 0;
  if (isHoliday) {
    holidayPay = totalHours * hourlyRate * rules.holidayRate;
  }

  let satSunPay = 0;
  if (!jpSaturdayIsAllOT) {
    if (isSaturday && saturdayRate > 0) satSunPay = totalHours * hourlyRate * saturdayRate;
    if (isSunday && sundayRate > 0) satSunPay = totalHours * hourlyRate * sundayRate;
  }

  const grossPay = Math.round(normalPay + overtimePay + nightPay + holidayPay + satSunPay);

  return {
    totalMin,
    totalHours: +totalHours.toFixed(2),
    normalMin,
    normalHours: +minutesToHours(normalMin).toFixed(2),
    overtimeDailyMin,
    overtimeHours: +thisDayOTHours.toFixed(2),
    nightMin,
    nightHours: +nightHours.toFixed(2),
    isHoliday,
    isSaturday,
    isSunday,
    normalPay: Math.round(normalPay),
    overtimePay: Math.round(overtimePay),
    nightPay: Math.round(nightPay),
    holidayPay: Math.round(holidayPay),
    satSunPay: Math.round(satSunPay),
    grossPay,
    breakdown: {
      baseHours: +normalBaseHours.toFixed(2),
      overtimeNormal: +normalOTHours.toFixed(2),
      overtimeHigh: +highOTHours.toFixed(2),
      nightHours: +nightHours.toFixed(2),
      jpSaturdayIsAllOT,
      rates: { overtimeRate, nightRate: rules.nightRate, holidayRate: rules.holidayRate },
    },
  };
}

// ── Vehicle Tax Tables ─────────────────────────────
export const JIDOUSHA_ZEI_NEW = [
  { maxCc: 1000, tax: 25000 }, { maxCc: 1500, tax: 30500 }, { maxCc: 2000, tax: 36000 },
  { maxCc: 2500, tax: 43500 }, { maxCc: 3000, tax: 50000 }, { maxCc: 3500, tax: 57000 },
  { maxCc: 4000, tax: 65500 }, { maxCc: 4500, tax: 75500 }, { maxCc: 6000, tax: 87000 },
  { maxCc: Infinity, tax: 110000 },
];
export const JIDOUSHA_ZEI_OLD = [
  { maxCc: 1000, tax: 29500 }, { maxCc: 1500, tax: 34500 }, { maxCc: 2000, tax: 39500 },
  { maxCc: 2500, tax: 45000 }, { maxCc: 3000, tax: 51000 }, { maxCc: 3500, tax: 58000 },
  { maxCc: 4000, tax: 66500 }, { maxCc: 4500, tax: 76500 }, { maxCc: 6000, tax: 88000 },
  { maxCc: Infinity, tax: 111000 },
];
export const JURYO_ZEI_TABLE = [
  { maxKg: 500, base: 2500 }, { maxKg: 1000, base: 5000 }, { maxKg: 1500, base: 7500 },
  { maxKg: 2000, base: 10000 }, { maxKg: 2500, base: 12500 }, { maxKg: 3000, base: 15000 },
  { maxKg: 3500, base: 17500 }, { maxKg: Infinity, base: 20000 },
];

export function calcJidoushaZei(v) {
  const age = new Date().getFullYear() - (v.registrationYear || new Date().getFullYear());
  const isJuka = age >= 13;
  if (v.type === "kei") {
    const annualTax = isJuka ? 12900 : (v.registrationYear || 2015) < 2015 ? 7200 : 10800;
    return { annualTax, juryoZei2yr: isJuka ? 9900 : 6600, jibaiseki2yr: 19640, isJuka, age };
  }
  const table = (v.registrationYear || 2019) >= 2019 ? JIDOUSHA_ZEI_NEW : JIDOUSHA_ZEI_OLD;
  const cc = v.displacement || 1500;
  const baseTax = (table.find((r) => cc <= r.maxCc) || table[table.length - 1]).tax;
  const annualTax = isJuka ? Math.round((baseTax * 1.15) / 100) * 100 : baseTax;
  let juryoZei2yr = null;
  if (v.weight) {
    const jr = (JURYO_ZEI_TABLE.find((r) => Number(v.weight) <= r.maxKg) || JURYO_ZEI_TABLE[JURYO_ZEI_TABLE.length - 1]).base;
    juryoZei2yr = isJuka ? Math.round(jr * 1.5) * 2 : jr * 2;
  }
  return { annualTax, baseTax, juryoZei2yr, jibaiseki2yr: 20010, isJuka, age };
}

// ── Municipal Tax (住民税) Estimators ─────────────────
export function estimateJuuminZei(grossMonthlyTaxable, settings) {
  const numDependents = (settings.spouseDependent ? 1 : 0) + (settings.dependentChildren || 0);
  const annualGross = grossMonthlyTaxable * 12;
  let kyuyoKojo;
  if      (annualGross <= 1625000) kyuyoKojo = Math.max(550000, annualGross * 0.4 - 100000);
  else if (annualGross <= 1800000) kyuyoKojo = annualGross * 0.4 - 100000;
  else if (annualGross <= 3600000) kyuyoKojo = annualGross * 0.3 + 80000;
  else if (annualGross <= 6600000) kyuyoKojo = annualGross * 0.2 + 440000;
  else if (annualGross <= 8500000) kyuyoKojo = annualGross * 0.1 + 1100000;
  else                              kyuyoKojo = 1950000;
  const kyuyoShotoku = annualGross - kyuyoKojo;
  const rates = AICHI_RATES;
  const annualSocial = Math.round(grossMonthlyTaxable * (rates.kenkouHoken + rates.kaigoHoken + rates.kouseiNenkin + rates.koyouHoken)) * 12;
  const kazeiShotoku = Math.max(0, kyuyoShotoku - annualSocial - 430000 - numDependents * 330000);
  const shotokuWari  = Math.floor(kazeiShotoku * 0.10);
  const kintouWari   = 6000;
  const total        = shotokuWari + kintouWari;
  return { total, shotokuWari, kintouWari, installment: Math.ceil(total / 4), kazeiShotoku, numDependents };
}

export function estimateJuuminZeiFromGensen(shiharaiGaku, shakaiHokenGaku, settings) {
  const numDependents = (settings.spouseDependent ? 1 : 0) + (settings.dependentChildren || 0);
  let kyuyoKojo;
  if      (shiharaiGaku <= 1625000) kyuyoKojo = Math.max(550000, shiharaiGaku * 0.4 - 100000);
  else if (shiharaiGaku <= 1800000) kyuyoKojo = shiharaiGaku * 0.4 - 100000;
  else if (shiharaiGaku <= 3600000) kyuyoKojo = shiharaiGaku * 0.3 + 80000;
  else if (shiharaiGaku <= 6600000) kyuyoKojo = shiharaiGaku * 0.2 + 440000;
  else if (shiharaiGaku <= 8500000) kyuyoKojo = shiharaiGaku * 0.1 + 1100000;
  else                               kyuyoKojo = 1950000;
  const kyuyoShotoku  = shiharaiGaku - kyuyoKojo;
  const kazeiShotoku  = Math.max(0, kyuyoShotoku - shakaiHokenGaku - 430000 - numDependents * 330000);
  const shotokuWari   = Math.floor(kazeiShotoku * 0.10);
  const kintouWari    = 6000;
  const total         = shotokuWari + kintouWari;
  return { total, shotokuWari, kintouWari, installment: Math.ceil(total / 4), kazeiShotoku, numDependents, fromGensen: true };
}

export function calcShotokuZeiEstimado(annualGross, annualSocial, settings) {
  const numDependents = (settings.spouseDependent ? 1 : 0) + (settings.dependentChildren || 0);
  let kyuyoKojo;
  if      (annualGross <= 1625000) kyuyoKojo = Math.max(550000, annualGross * 0.4 - 100000);
  else if (annualGross <= 1800000) kyuyoKojo = annualGross * 0.4 - 100000;
  else if (annualGross <= 3600000) kyuyoKojo = annualGross * 0.3 + 80000;
  else if (annualGross <= 6600000) kyuyoKojo = annualGross * 0.2 + 440000;
  else if (annualGross <= 8500000) kyuyoKojo = annualGross * 0.1 + 1100000;
  else                              kyuyoKojo = 1950000;
  const kyuyoShotoku = annualGross - kyuyoKojo;
  const kazeiShotoku = Math.max(0, kyuyoShotoku - annualSocial - 480000 - numDependents * 380000);
  let shotokuZei = 0;
  if      (kazeiShotoku <= 1950000)  shotokuZei = Math.floor(kazeiShotoku * 0.05);
  else if (kazeiShotoku <= 3300000)  shotokuZei = Math.floor(kazeiShotoku * 0.10 - 97500);
  else if (kazeiShotoku <= 6950000)  shotokuZei = Math.floor(kazeiShotoku * 0.20 - 427500);
  else if (kazeiShotoku <= 9000000)  shotokuZei = Math.floor(kazeiShotoku * 0.23 - 636000);
  else if (kazeiShotoku <= 18000000) shotokuZei = Math.floor(kazeiShotoku * 0.33 - 1536000);
  else if (kazeiShotoku <= 40000000) shotokuZei = Math.floor(kazeiShotoku * 0.40 - 2796000);
  else                                shotokuZei = Math.floor(kazeiShotoku * 0.45 - 4796000);
  return { total: shotokuZei + Math.floor(shotokuZei * 0.021), kazeiShotoku };
}

export function estimateDeductions(grossMonthly, settings) {
  const age = settings.age || 35;
  const hasEmploymentInsurance = settings.employmentInsurance !== false;
  const hasHealthInsurance = settings.healthInsurance !== false;
  const hasPension = settings.pension !== false;
  const rates = AICHI_RATES;

  let deductions = [];

  if (hasHealthInsurance) {
    const health = Math.round(grossMonthly * rates.kenkouHoken);
    deductions.push({
      name: "健康保険 (Kenkou Hoken)",
      amount: health,
      rate: rates.kenkouHoken,
      note: `${(rates.kenkouHoken*100).toFixed(4)}% — Aichi-ken (holerite real)`
    });
  }

  if (hasPension) {
    const pension = Math.round(grossMonthly * rates.kouseiNenkin);
    deductions.push({
      name: "厚生年金 (Kousei Nenkin)",
      amount: pension,
      rate: rates.kouseiNenkin,
      note: `${(rates.kouseiNenkin*100).toFixed(4)}% — holerite real`
    });
  }

  if (age >= 40) {
    const kaigo = Math.round(grossMonthly * rates.kaigoHoken);
    deductions.push({
      name: "介護保険 (Kaigo Hoken)",
      amount: kaigo,
      rate: rates.kaigoHoken,
      note: `${(rates.kaigoHoken*100).toFixed(4)}% — aplicado aos 40+ anos`
    });
  }

  if (hasEmploymentInsurance) {
    const emp = Math.round(grossMonthly * rates.koyouHoken);
    deductions.push({
      name: "雇用保険 (Koyou Hoken)",
      amount: emp,
      rate: rates.koyouHoken,
      note: `${(rates.koyouHoken*100).toFixed(4)}% — holerite real`
    });
  }

  const totalSocialSec = deductions.reduce((a, b) => a + b.amount, 0);
  const taxableIncome = grossMonthly - totalSocialSec;
  let incomeTax = 0;
  let taxNote = "";
  if (taxableIncome > 0) {
    if (taxableIncome <= 88000) { incomeTax = 0; taxNote = "isento"; }
    else if (taxableIncome <= 162500) { incomeTax = Math.round((taxableIncome - 88000) * 0.05); taxNote = "5%"; }
    else if (taxableIncome <= 300000) { incomeTax = Math.round(3725 + (taxableIncome - 162500) * 0.10); taxNote = "10%"; }
    else if (taxableIncome <= 500000) { incomeTax = Math.round(17475 + (taxableIncome - 300000) * 0.20); taxNote = "20%"; }
    else { incomeTax = Math.round(57475 + (taxableIncome - 500000) * 0.23); taxNote = "23%"; }
  }
  const incomeTaxRate = grossMonthly > 0 ? incomeTax / grossMonthly : 0;
  deductions.push({
    name: "所得税 (Shotoku Zei)",
    amount: incomeTax,
    rate: incomeTaxRate,
    note: `faixa ${taxNote} — estimativa progressiva 2025`
  });

  if (settings.municipalTax) {
    const municipal = Math.round(grossMonthly * 0.1 / 12);
    deductions.push({
      name: "住民税 (Juumin Zei)",
      amount: municipal,
      rate: 0.1/12,
      note: "estimativa 10%/ano — Toyota-shi, Aichi"
    });
  }

  const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
  const netPay = grossMonthly - totalDeductions;
  const totalRate = grossMonthly > 0 ? totalDeductions / grossMonthly : 0;

  return { deductions, totalDeductions, netPay, totalRate };
}
