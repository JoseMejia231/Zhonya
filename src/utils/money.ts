import type { Transaction } from '../types';

export interface CurrencyTotals {
  currency: string;
  income: number;
  expense: number;
  net: number;
}

/**
 * Agrupa transacciones por moneda y devuelve income/expense/net por cada una.
 * Las transacciones legacy sin campo `currency` se asignan al `fallbackCurrency`
 * (típicamente `settings.currency` del usuario), para que el comportamiento
 * histórico no cambie cuando todas las txs son de una sola moneda.
 *
 * El resultado se ordena por valor absoluto descendente (la moneda con más
 * movimiento queda primera), con desempate alfabético.
 */
export function groupTotalsByCurrency(
  transactions: Transaction[],
  fallbackCurrency: string
): CurrencyTotals[] {
  const buckets = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const ccy = t.currency || fallbackCurrency;
    const bucket = buckets.get(ccy) ?? { income: 0, expense: 0 };
    if (t.type === 'income') bucket.income += t.amount;
    else bucket.expense += t.amount;
    buckets.set(ccy, bucket);
  }

  const list: CurrencyTotals[] = [];
  for (const [currency, { income, expense }] of buckets) {
    list.push({ currency, income, expense, net: income - expense });
  }

  list.sort((a, b) => {
    const va = Math.abs(a.income) + Math.abs(a.expense);
    const vb = Math.abs(b.income) + Math.abs(b.expense);
    if (vb !== va) return vb - va;
    return a.currency.localeCompare(b.currency);
  });

  return list;
}
