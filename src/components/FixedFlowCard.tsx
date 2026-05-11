import React from 'react';
import { motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, Minus, Repeat } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { currentMonthCommitment } from '../utils/projection';
import { formatCurrency, cn } from '../utils';

export const FixedFlowCard: React.FC = () => {
  const { recurring, settings } = useFinance();
  const m = currentMonthCommitment(recurring);
  const hasActive = recurring.some((r) => r.enabled);

  if (!hasActive || !m) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/70 shadow-sm flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0">
          <Repeat className="text-zinc-300" size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Flujo fijo
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">Sin recurrencias activas</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
            Crea ingresos y gastos fijos en el tab Fijos para ver tu flujo proyectado.
          </p>
        </div>
      </motion.div>
    );
  }

  const income = m.income;
  const expense = m.expense;
  const max = Math.max(income, expense, 1);
  const net = m.net;
  const coverage = expense > 0 ? (income / expense) * 100 : income > 0 ? 100 : 0;
  const netRatio = income > 0 ? (net / income) * 100 : 0;

  const tone: 'positive' | 'neutral' | 'negative' =
    net > 0 ? 'positive' : net === 0 ? 'neutral' : 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/70 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Flujo fijo
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">Este mes</p>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest',
            tone === 'positive' && 'bg-emerald-50 text-emerald-700',
            tone === 'neutral' && 'bg-zinc-100 text-zinc-600',
            tone === 'negative' && 'bg-red-50 text-red-700'
          )}
        >
          {tone === 'positive' && <ArrowUpRight size={12} />}
          {tone === 'negative' && <ArrowDownLeft size={12} />}
          {tone === 'neutral' && <Minus size={12} />}
          <span className="num">
            {tone === 'positive' && '+'}
            {tone === 'negative' && '−'}
            {formatCurrency(Math.abs(net), settings.currency)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <SideBlock
          label="Ingresos fijos"
          amount={income}
          currency={settings.currency}
          accent="emerald"
        />
        <SideBlock
          label="Gastos fijos"
          amount={expense}
          currency={settings.currency}
          accent="zinc"
          negative
        />
      </div>

      {/* Bars */}
      <div className="space-y-2.5">
        <FlowBar
          label="Ingresos"
          amount={income}
          max={max}
          currency={settings.currency}
          color="bg-emerald-500"
        />
        <FlowBar
          label="Gastos"
          amount={expense}
          max={max}
          currency={settings.currency}
          color="bg-zinc-900"
        />
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3 text-[11px]">
        <div className="text-zinc-500">
          Cobertura{' '}
          <span
            className={cn(
              'font-semibold num',
              coverage >= 100 ? 'text-emerald-600' : 'text-amber-600'
            )}
          >
            {coverage.toFixed(0)}%
          </span>
        </div>
        {income > 0 && (
          <div className="text-zinc-500">
            Sobrante{' '}
            <span
              className={cn(
                'font-semibold num',
                net > 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {netRatio.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface SideBlockProps {
  label: string;
  amount: number;
  currency: string;
  accent: 'emerald' | 'zinc';
  negative?: boolean;
}
const SideBlock: React.FC<SideBlockProps> = ({ label, amount, currency, accent, negative }) => (
  <div
    className={cn(
      'rounded-2xl p-3 sm:p-4 border',
      accent === 'emerald' && 'bg-emerald-50/60 border-emerald-100',
      accent === 'zinc' && 'bg-zinc-50 border-zinc-100'
    )}
  >
    <p
      className={cn(
        'text-[9px] font-bold uppercase tracking-widest',
        accent === 'emerald' && 'text-emerald-700',
        accent === 'zinc' && 'text-zinc-500'
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        'text-base sm:text-lg font-semibold num mt-0.5 leading-tight break-words',
        accent === 'emerald' ? 'text-emerald-700' : 'text-zinc-900'
      )}
    >
      {negative ? '−' : '+'}
      {formatCurrency(amount, currency)}
    </p>
  </div>
);

interface FlowBarProps {
  label: string;
  amount: number;
  max: number;
  currency: string;
  color: string;
}
const FlowBar: React.FC<FlowBarProps> = ({ label, amount, max, currency, color }) => {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
        <span>{label}</span>
        <span className="num text-zinc-700">{formatCurrency(amount, currency)}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};
