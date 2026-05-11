import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompact, cn } from '../utils';
import { projectRecurring } from '../utils/projection';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface RecurringProjectionProps {
  /** Cuántos meses proyectar incluido el actual. */
  months?: number;
}

export const RecurringProjection: React.FC<RecurringProjectionProps> = ({ months = 6 }) => {
  const { recurring, settings } = useFinance();

  const projection = useMemo(() => projectRecurring(recurring, months), [recurring, months]);
  const current = projection[0];
  const totalCommitted = projection.reduce((acc, p) => acc + p.expense, 0);
  const totalIncome = projection.reduce((acc, p) => acc + p.income, 0);
  const avgMonthlyExpense = projection.length > 0 ? totalCommitted / projection.length : 0;

  const chartData = projection.map((p) => ({
    label: p.label.replace('.', ''),
    Ingresos: p.income,
    Gastos: p.expense,
  }));

  const empty = recurring.filter((r) => r.enabled).length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/70 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Proyección
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">
            Próximos {months} meses según tus gastos fijos
          </p>
        </div>
      </div>

      {empty ? (
        <EmptyProjection />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <Kpi
              label="Compromiso este mes"
              value={formatCurrency(current?.expense ?? 0, settings.currency)}
              icon={<TrendingDown size={14} />}
              tone="expense"
            />
            <Kpi
              label="Ingresos fijos"
              value={formatCurrency(current?.income ?? 0, settings.currency)}
              icon={<TrendingUp size={14} />}
              tone="income"
            />
            <Kpi
              label="Promedio mensual"
              value={formatCurrency(avgMonthlyExpense, settings.currency)}
              icon={<Wallet size={14} />}
              tone="neutral"
            />
          </div>

          {/* Bar chart */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5dccb" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 600 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A1A1AA', fontSize: 9, fontWeight: 600 }}
                  tickFormatter={(v) => formatCompact(v, settings.currency)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(104, 142, 89, 0.04)' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5dccb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(75 65 51 / 0.10)',
                    fontSize: '11px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ padding: '2px 0', fontVariantNumeric: 'tabular-nums' }}
                  formatter={(value: number) => formatCurrency(value, settings.currency)}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', paddingTop: 8 }}
                  formatter={(v) => (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      {v}
                    </span>
                  )}
                />
                <Bar
                  dataKey="Ingresos"
                  fill="#688e59"
                  radius={[6, 6, 0, 0]}
                  animationDuration={600}
                />
                <Bar
                  dataKey="Gastos"
                  fill="#4b5741"
                  radius={[6, 6, 0, 0]}
                  animationDuration={600}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-month breakdown */}
          <ul className="mt-5 divide-y divide-zinc-100">
            {projection.map((p) => (
              <li key={p.label} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 capitalize truncate">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {p.contributions.length}{' '}
                    {p.contributions.length === 1 ? 'cargo' : 'cargos'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'text-sm font-semibold num',
                      p.net >= 0 ? 'text-emerald-600' : 'text-zinc-900'
                    )}
                  >
                    {p.net >= 0 ? '+' : '−'}
                    {formatCurrency(Math.abs(p.net), settings.currency)}
                  </p>
                  <p className="text-[10px] text-zinc-400 num">
                    {p.income > 0 && (
                      <span className="text-emerald-600">+{formatCompact(p.income, settings.currency)} </span>
                    )}
                    <span>−{formatCompact(p.expense, settings.currency)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {totalIncome === 0 && (
            <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed">
              Total proyectado en {months} meses:{' '}
              <span className="font-semibold text-zinc-900 num">
                −{formatCurrency(totalCommitted, settings.currency)}
              </span>{' '}
              en gastos fijos.
            </p>
          )}
        </>
      )}
    </motion.div>
  );
};

interface KpiProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'income' | 'expense' | 'neutral';
}
const Kpi: React.FC<KpiProps> = ({ label, value, icon, tone }) => (
  <div
    className={cn(
      'rounded-2xl p-3 sm:p-4 border',
      tone === 'expense' && 'bg-zinc-50 border-zinc-100',
      tone === 'income' && 'bg-emerald-50/60 border-emerald-100',
      tone === 'neutral' && 'bg-zinc-50 border-zinc-100'
    )}
  >
    <div
      className={cn(
        'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest',
        tone === 'expense' && 'text-zinc-500',
        tone === 'income' && 'text-emerald-700',
        tone === 'neutral' && 'text-zinc-500'
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <p className="text-base sm:text-lg font-semibold text-zinc-900 num mt-1 leading-tight break-words">
      {value}
    </p>
  </div>
);

const EmptyProjection: React.FC = () => (
  <div className="text-center py-10">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-50 mb-3">
      <Wallet className="text-zinc-300" size={22} />
    </div>
    <p className="text-sm font-semibold text-zinc-900">Sin gastos fijos activos</p>
    <p className="text-xs text-zinc-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
      Crea recurrencias en el tab Fijos para ver tu proyección de los próximos meses.
    </p>
  </div>
);
