import { getMonthsDiff } from "./calc.js";

// ── Yukyu (有給) utilities ─────────────────────

export const YUKYU_TABLE = [
  { monthsMin: 6,  monthsMax: 17,  days: 10 },
  { monthsMin: 18, monthsMax: 29,  days: 11 },
  { monthsMin: 30, monthsMax: 41,  days: 12 },
  { monthsMin: 42, monthsMax: 53,  days: 14 },
  { monthsMin: 54, monthsMax: 65,  days: 16 },
  { monthsMin: 66, monthsMax: 77,  days: 18 },
  { monthsMin: 78, monthsMax: Infinity, days: 20 },
];

export function getYukyuEntitlement(hireDate) {
  if (!hireDate) return null;
  const today = new Date();
  const hire = new Date(hireDate);
  const totalMonths = getMonthsDiff(hireDate, today);

  if (totalMonths < 6) {
    const monthsToFirst = 6 - totalMonths;
    return { eligible: false, monthsToFirst, daysTotal: 0, grants: [] };
  }

  const grants = [];
  let grantDate = new Date(hire);
  grantDate.setMonth(grantDate.getMonth() + 6);

  while (grantDate <= today) {
    const monthsAtGrant = getMonthsDiff(hireDate, grantDate);
    const row = YUKYU_TABLE.find(r => monthsAtGrant >= r.monthsMin && monthsAtGrant <= r.monthsMax);
    if (row) {
      const expiry = new Date(grantDate);
      expiry.setFullYear(expiry.getFullYear() + 2);
      const expired = expiry < today;
      grants.push({
        date: grantDate.toISOString().slice(0, 10),
        days: row.days,
        expiry: expiry.toISOString().slice(0, 10),
        expired,
        monthsService: monthsAtGrant,
      });
    }
    grantDate = new Date(grantDate);
    grantDate.setFullYear(grantDate.getFullYear() + 1);
  }

  const nextGrantDate = new Date(grantDate);
  const daysToNext = Math.ceil((nextGrantDate - today) / 86400000);

  const availableGrants = grants.filter(g => !g.expired);
  const daysTotal = availableGrants.reduce((a, g) => a + g.days, 0);

  const nextMonths = getMonthsDiff(hireDate, nextGrantDate);
  const nextRow = YUKYU_TABLE.find(r => nextMonths >= r.monthsMin && nextMonths <= r.monthsMax);

  const expiringAlerts = availableGrants.filter(g => {
    const exp = new Date(g.expiry);
    const daysLeft = Math.ceil((exp - today) / 86400000);
    return daysLeft <= 90 && daysLeft > 0;
  }).map(g => {
    const daysLeft = Math.ceil((new Date(g.expiry) - today) / 86400000);
    return { ...g, daysLeft };
  });

  return {
    eligible: true,
    daysTotal,
    grants,
    availableGrants,
    nextGrantDate: nextGrantDate.toISOString().slice(0, 10),
    nextGrantDays: nextRow?.days || 0,
    daysToNext,
    expiringAlerts,
    totalMonths,
    yearsService: Math.floor(totalMonths / 12),
    monthsRemainder: totalMonths % 12,
  };
}

export function getYukyuUsed(entries) {
  return entries.filter(e => e.dayType === "yukyu");
}
