import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Wallet, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { isSameMonth, isSameYear, parseISO } from 'date-fns';
import { formatCurrency, cn } from '../utils';

type BudgetPeriod = 'all' | 'month' | 'year';

interface BudgetRow {
  category: string;
  budget: number;
  spent: number;
  pct: number;
}

const tone = (pct: number) =>
  pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';

const periodLabel: Record<BudgetPeriod, string> = {
  all: 'Uso histórico',
  month: 'Uso del mes actual',
  year: 'Uso del año a la fecha',
};

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

export const BudgetsCard: React.FC<{ period?: BudgetPeriod }> = ({ period = 'month' }) => {
  const { transactions, settings } = useFinance();

  const rows: BudgetRow[] = useMemo(() => {
    const now = new Date();
    const budgets = settings.budgets ?? {};
    const periodExpenses = transactions.filter((t) => {
      const date = parseISO(t.date);
      if (t.type !== 'expense') return false;
      if (period === 'year') return isSameYear(date, now);
      if (period === 'all') return true;
      return isSameMonth(date, now);
    });
    const budgetMonths =
      period === 'year'
        ? now.getMonth() + 1
        : period === 'all'
        ? Math.max(1, new Set(transactions.map((t) => monthKey(parseISO(t.date)))).size)
        : 1;

    return (Object.entries(budgets) as Array<[string, number]>)
      .filter(([, amount]) => amount > 0)
      .map<BudgetRow>(([cat, amount]) => {
        const spent = periodExpenses
          .filter((t) => t.category === cat)
          .reduce((acc, t) => acc + t.amount, 0);
        const budget = amount * budgetMonths;
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        return { category: cat, budget, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [period, transactions, settings.budgets]);

  const totalBudget = rows.reduce((acc, r) => acc + r.budget, 0);
  const totalSpent = rows.reduce((acc, r) => acc + r.spent, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overCount = rows.filter((r) => r.pct >= 100).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[32px] border border-[#e7dfd1] bg-white/70 glass-surface premium-shadow p-6 sm:p-7 transition-all duration-300 hover:shadow-[0_24px_50px_rgba(32,28,16,0.08)] hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#7c7361]/80">
            Presupuestos
          </h2>
          <p className="text-[15px] font-bold text-[#4b5741] mt-1">{periodLabel[period]}</p>
        </div>
        {rows.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#9d9687]/60">
              Restante
            </p>
            <p
              className={cn(
                'text-[17px] font-bold num leading-tight mt-1',
                totalBudget - totalSpent < 0
                  ? 'text-rose-600'
                  : totalPct >= 80
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              )}
            >
              {totalBudget - totalSpent < 0 ? '−' : ''}
              {formatCurrency(Math.abs(Math.max(totalBudget - totalSpent, 0)), settings.currency)}
            </p>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyBudgets />
      ) : (
        <div className="space-y-6">
          {overCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50/50 border border-rose-100/50 px-4 py-3.5 text-[12px] text-rose-700 shadow-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <p className="leading-relaxed font-medium">
                <span className="font-bold">{overCount}</span>{' '}
                {overCount === 1 ? 'categoría excede' : 'categorías exceden'} su presupuesto este mes.
              </p>
            </div>
          )}

          <ul className="space-y-5">
            {rows.map((r) => (
              <BudgetBar key={r.category} row={r} currency={settings.currency} />
            ))}
          </ul>

          <div className="mt-7 pt-5 border-t border-[#f0ede4] flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-[#9d9687]/80">
            <span>
              Destinado{' '}
              <span className="text-[#4b5741] num ml-1">
                {formatCurrency(totalBudget, settings.currency)}
              </span>
            </span>
            <span>
              Gastado{' '}
              <span
                className={cn(
                  'num ml-1',
                  totalPct >= 100 ? 'text-rose-600' : totalPct >= 80 ? 'text-amber-600' : 'text-[#4b5741]'
                )}
              >
                {formatCurrency(totalSpent, settings.currency)} ({totalPct.toFixed(0)}%)
              </span>
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface BudgetBarProps {
  row: BudgetRow;
  currency: string;
}
const BudgetBar: React.FC<BudgetBarProps> = ({ row, currency }) => {
  const t = tone(row.pct);
  const remaining = row.budget - row.spent;
  const fillPct = Math.min(row.pct, 100);
  const overflow = Math.max(0, remaining < 0 ? -remaining : 0);

  return (
    <li className="group">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[14px] font-bold text-[#4b5741] truncate flex-1 min-w-0 group-hover:text-[#2d5a27] transition-colors">
          {row.category}
        </span>
        <div className="text-right shrink-0">
          <span
            className={cn(
              'text-[14px] font-bold num',
              t === 'over' ? 'text-rose-600' : t === 'warn' ? 'text-amber-600' : 'text-emerald-600'
            )}
          >
            {remaining < 0 ? '−' : ''}
            {formatCurrency(Math.abs(Math.max(remaining, 0)), currency)}
          </span>
          <span className="text-[10px] font-bold text-[#9d9687]/60 num ml-1 uppercase tracking-tighter">
            de {formatCurrency(row.budget, currency)}
          </span>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full bg-[#f3f1ea] overflow-hidden border border-[#efeadd]">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.05)]',
            t === 'over' && 'bg-gradient-to-r from-rose-600 to-rose-400',
            t === 'warn' && 'bg-gradient-to-r from-amber-500 to-amber-300',
            t === 'ok' && 'bg-gradient-to-r from-emerald-600 to-emerald-400'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {overflow > 0 ? (
        <p className="mt-1.5 text-[10px] font-bold text-rose-600 num uppercase tracking-widest flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-rose-600" />
          Excedido por {formatCurrency(overflow, currency)}
        </p>
      ) : (
        <p className="mt-1.5 text-[10px] font-bold text-[#9d9687]/60 num uppercase tracking-widest">
          Consumido {row.pct.toFixed(0)}% · {formatCurrency(row.spent, currency)}
        </p>
      )}
    </li>
  );
};

const EmptyBudgets: React.FC = () => (
  <div className="text-center py-10">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f6f1e8] text-[#9d9687]/40 mb-4 border border-[#efeadd]">
      <Wallet size={24} />
    </div>
    <p className="text-[15px] font-bold text-[#4b5741]">Sin presupuestos</p>
    <p className="text-[11px] font-semibold text-[#9d9687] mt-1.5 max-w-[240px] mx-auto leading-relaxed uppercase tracking-[0.1em]">
      Asigna un monto mensual en Ajustes para ver tu progreso.
    </p>
  </div>
);
