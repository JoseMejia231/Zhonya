import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Wallet, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { isSameMonth, parseISO } from 'date-fns';
import { formatCurrency, cn } from '../utils';

interface BudgetRow {
  category: string;
  budget: number;
  spent: number;
  pct: number;
}

const tone = (pct: number) =>
  pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';

export const BudgetsCard: React.FC = () => {
  const { transactions, settings } = useFinance();

  const rows: BudgetRow[] = useMemo(() => {
    const now = new Date();
    const budgets = settings.budgets ?? {};
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && isSameMonth(parseISO(t.date), now)
    );

    return (Object.entries(budgets) as Array<[string, number]>)
      .filter(([, amount]) => amount > 0)
      .map<BudgetRow>(([cat, amount]) => {
        const spent = monthExpenses
          .filter((t) => t.category === cat)
          .reduce((acc, t) => acc + t.amount, 0);
        const pct = amount > 0 ? (spent / amount) * 100 : 0;
        return { category: cat, budget: amount, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [transactions, settings.budgets]);

  const totalBudget = rows.reduce((acc, r) => acc + r.budget, 0);
  const totalSpent = rows.reduce((acc, r) => acc + r.spent, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overCount = rows.filter((r) => r.pct >= 100).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Presupuestos
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">Este mes</p>
        </div>
        {rows.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Restante
            </p>
            <p
              className={cn(
                'text-base font-semibold num leading-tight',
                totalBudget - totalSpent < 0
                  ? 'text-red-600'
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
        <>
          {overCount > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 border border-red-100 px-3 py-2.5 text-[11px] text-red-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold">{overCount}</span>{' '}
                {overCount === 1 ? 'categoría excede' : 'categorías exceden'} su presupuesto este mes.
              </p>
            </div>
          )}

          <ul className="space-y-3.5">
            {rows.map((r) => (
              <BudgetBar key={r.category} row={r} currency={settings.currency} />
            ))}
          </ul>

          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>
              Destinado{' '}
              <span className="font-semibold text-zinc-900 num">
                {formatCurrency(totalBudget, settings.currency)}
              </span>
            </span>
            <span>
              Gastado{' '}
              <span
                className={cn(
                  'font-semibold num',
                  totalPct >= 100 ? 'text-red-600' : totalPct >= 80 ? 'text-amber-600' : 'text-zinc-900'
                )}
              >
                {formatCurrency(totalSpent, settings.currency)} ({totalPct.toFixed(0)}%)
              </span>
            </span>
          </div>
        </>
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
  // Barra de consumo (no inversa): se llena conforme gastas.
  const fillPct = Math.min(row.pct, 100);
  const overflow = Math.max(0, remaining < 0 ? -remaining : 0);

  return (
    <li>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm font-semibold text-zinc-900 truncate flex-1 min-w-0">
          {row.category}
        </span>
        <div className="text-right shrink-0">
          <span
            className={cn(
              'text-sm font-semibold num',
              t === 'over' ? 'text-red-600' : t === 'warn' ? 'text-amber-600' : 'text-emerald-600'
            )}
          >
            {remaining < 0 ? '−' : ''}
            {formatCurrency(Math.abs(Math.max(remaining, 0)), currency)}
          </span>
          <span className="text-[10px] text-zinc-400 num ml-1">
            de {formatCurrency(row.budget, currency)}
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-100 overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            t === 'over' && 'bg-red-500',
            t === 'warn' && 'bg-amber-500',
            t === 'ok' && 'bg-emerald-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {overflow > 0 ? (
        <p className="mt-1 text-[10px] font-semibold text-red-600 num">
          Excedido por {formatCurrency(overflow, currency)}
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-zinc-400 num">
          Gastado {formatCurrency(row.spent, currency)} · {row.pct.toFixed(0)}%
        </p>
      )}
    </li>
  );
};

const EmptyBudgets: React.FC = () => (
  <div className="text-center py-8">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-50 mb-3">
      <Wallet className="text-zinc-300" size={22} />
    </div>
    <p className="text-sm font-semibold text-zinc-900">Sin presupuestos</p>
    <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
      Asigna un monto mensual a cada categoría desde Ajustes para ver tu progreso aquí.
    </p>
  </div>
);
