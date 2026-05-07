import { RecurringExpense } from '../types';

export interface MonthProjection {
  /** Primer día del mes proyectado (UTC-safe local). */
  date: Date;
  /** Etiqueta corta tipo "May 2026". */
  label: string;
  income: number;
  expense: number;
  net: number;
  /** Desglose por gasto fijo: {recurringId, name, amount, occurrences}. */
  contributions: Array<{
    recurringId: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    occurrences: number;
    total: number;
  }>;
}

const lastDayOfMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

/**
 * Cuenta exactamente cuántas veces dispara una recurrencia dentro del mes
 * `(year, month)` (month es 0-indexado). Respeta el clamp de mensuales con
 * dayOfMonth > días del mes (ej. 31 en febrero).
 */
function occurrencesInMonth(rec: RecurringExpense, year: number, month: number): number {
  const lastDay = lastDayOfMonth(year, month);
  if (rec.frequency === 'daily') {
    return lastDay;
  }
  if (rec.frequency === 'monthly') {
    return rec.dayOfMonth && rec.dayOfMonth >= 1 ? 1 : 0;
  }
  // weekly: cuenta todos los días seleccionados que caen en este mes.
  const targets = new Set(rec.daysOfWeek ?? []);
  if (targets.size === 0) return 0;
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (targets.has(new Date(year, month, d).getDay())) count += 1;
  }
  return count;
}

/**
 * Proyecta los próximos `months` meses (incluyendo el actual) sumando todas
 * las recurrencias activas. Los importes se normalizan por ocurrencia × monto.
 */
export function projectRecurring(
  recurring: RecurringExpense[],
  months: number = 6,
  reference: Date = new Date()
): MonthProjection[] {
  const active = recurring.filter((r) => r.enabled);
  const out: MonthProjection[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(reference.getFullYear(), reference.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    let income = 0;
    let expense = 0;
    const contributions: MonthProjection['contributions'] = [];

    for (const rec of active) {
      const occ = occurrencesInMonth(rec, year, month);
      if (occ === 0) continue;
      const total = occ * rec.amount;
      if (rec.type === 'income') income += total;
      else expense += total;
      contributions.push({
        recurringId: rec.id,
        name: rec.name,
        type: rec.type,
        amount: rec.amount,
        occurrences: occ,
        total,
      });
    }

    out.push({
      date,
      label: date.toLocaleDateString('es', { month: 'short', year: 'numeric' }),
      income,
      expense,
      net: income - expense,
      contributions: contributions.sort((a, b) => b.total - a.total),
    });
  }
  return out;
}

/**
 * Atajo: el compromiso fijo del **mes en curso** (income, expense, net).
 */
export function currentMonthCommitment(recurring: RecurringExpense[], reference: Date = new Date()) {
  const proj = projectRecurring(recurring, 1, reference);
  return proj[0];
}
