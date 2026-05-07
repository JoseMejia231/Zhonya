import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompact, cn } from '../utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { isSameMonth, parseISO, subDays, subMonths, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus as MinusIcon } from 'lucide-react';
import { motion } from 'motion/react';

const CHART_COLORS = [
  '#18181B',
  '#10B981',
  '#EF4444',
  '#71717A',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

function useFinanceMetrics() {
  const { filteredTransactions, transactions, settings } = useFinance();

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const now = new Date();
  const lastMonth = subMonths(now, 1);

  const currentMonthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), now));
  const lastMonthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), lastMonth));

  const monthIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  const lastMonthIncome = lastMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const lastMonthExpense = lastMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const lastMonthBalance = lastMonthIncome - lastMonthExpense;

  const balanceDelta =
    lastMonthBalance !== 0
      ? ((monthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
      : 0;

  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

  const performanceData = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const day = subDays(now, 14 - i);
        const dayIncome = transactions
          .filter((t) => t.type === 'income' && isSameDay(parseISO(t.date), day))
          .reduce((acc, t) => acc + t.amount, 0);
        const dayExpense = transactions
          .filter((t) => t.type === 'expense' && isSameDay(parseISO(t.date), day))
          .reduce((acc, t) => acc + t.amount, 0);
        return {
          date: format(day, 'dd MMM', { locale: es }),
          ingresos: dayIncome,
          egresos: dayExpense,
        };
      }),
    [transactions, now]
  );

  const categoryData = settings.categories
    .map((cat) => ({
      name: cat,
      value: filteredTransactions
        .filter((t) => t.category === cat && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    totalIncome,
    totalExpense,
    balance,
    monthBalance,
    balanceDelta,
    savingsRate,
    performanceData,
    categoryData,
    settings,
  };
}

export const BalanceHero: React.FC = () => {
  const { totalIncome, totalExpense, balance, balanceDelta, performanceData, settings } =
    useFinanceMetrics();

  const sparklineData = performanceData.map((d) => ({ v: d.ingresos - d.egresos }));
  const trendDirection = balanceDelta > 0 ? 'up' : balanceDelta < 0 ? 'down' : 'flat';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-black p-6 sm:p-8 rounded-3xl text-white flex flex-col justify-between shadow-xl shadow-black/20 overflow-hidden min-h-[200px]"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 opacity-[0.18] pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#10B981"
              strokeWidth={1.5}
              fill="url(#heroSpark)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Balance</p>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold num',
              trendDirection === 'up' && 'bg-emerald-500/15 text-emerald-300',
              trendDirection === 'down' && 'bg-red-500/15 text-red-300',
              trendDirection === 'flat' && 'bg-white/10 text-white/60'
            )}
          >
            {trendDirection === 'up' && <TrendingUp size={10} />}
            {trendDirection === 'down' && <TrendingDown size={10} />}
            {trendDirection === 'flat' && <MinusIcon size={10} />}
            {balanceDelta === 0 ? '0%' : `${balanceDelta > 0 ? '+' : ''}${balanceDelta.toFixed(1)}%`}
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight num leading-tight break-words">
          {formatCurrency(balance, settings.currency)}
        </h2>
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/30 mt-1">
          vs. mes anterior
        </p>
      </div>

      <div className="relative z-10 flex justify-between mt-8 pt-6 border-t border-white/10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ingresos</p>
          <p className="text-emerald-400 font-medium num mt-0.5">
            {formatCurrency(totalIncome, settings.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Gastos</p>
          <p className="text-red-400 font-medium num mt-0.5">
            {formatCurrency(totalExpense, settings.currency)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const ComparativeChart: React.FC = () => {
  const { performanceData, settings } = useFinanceMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Comparativa
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">Últimos 15 días</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <LegendItem color="bg-emerald-500" label="Ingresos" />
          <LegendItem color="bg-red-500" label="Egresos" dashed />
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A1A1AA', fontSize: 9, fontWeight: 600 }}
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A1A1AA', fontSize: 9, fontWeight: 600 }}
              tickFormatter={(v) => formatCompact(v, settings.currency)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E4E4E7',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)',
                fontSize: '11px',
                padding: '8px 12px',
              }}
              itemStyle={{ padding: '2px 0', fontVariantNumeric: 'tabular-nums' }}
              formatter={(value: number) => formatCurrency(value, settings.currency)}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIngresos)"
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="egresos"
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorEgresos)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export const CategoryBreakdown: React.FC = () => {
  const { totalExpense, categoryData, settings } = useFinanceMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Desglose
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">Por categoría</p>
        </div>
        {categoryData.length > 0 && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            {categoryData.length} {categoryData.length === 1 ? 'cat.' : 'cats.'}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-[200px] flex items-center">
        {categoryData.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E4E4E7',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)',
                      fontSize: '11px',
                    }}
                    itemStyle={{ fontVariantNumeric: 'tabular-nums' }}
                    formatter={(value: number) => formatCurrency(value, settings.currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  Total
                </span>
                <span className="text-sm font-semibold text-zinc-900 num">
                  {formatCompact(totalExpense, settings.currency)}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {categoryData.slice(0, 6).map((item, index) => {
                const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-zinc-700 truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-400 num shrink-0">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 num whitespace-nowrap">
                      {formatCurrency(item.value, settings.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </div>
    </motion.div>
  );
};

export const SavingsRate: React.FC = () => {
  const { savingsRate } = useFinanceMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-between"
    >
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Tasa de Ahorro
        </h2>
        <p className="text-sm font-semibold text-zinc-900 mt-0.5">Este mes</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-zinc-100"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * Math.max(0, Math.min(savingsRate, 100))) / 100}
              className={cn(
                'transition-all duration-1000',
                savingsRate > 20
                  ? 'text-emerald-500'
                  : savingsRate > 0
                  ? 'text-amber-500'
                  : 'text-red-500'
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold num">{Math.max(0, savingsRate).toFixed(0)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 -mt-0.5">
              % ahorrado
            </span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
        {savingsRate > 20
          ? 'Excelente, ritmo saludable.'
          : savingsRate > 0
          ? 'Vas bien, reduce gastos hormiga.'
          : 'Tus gastos superan tus ingresos.'}
      </p>
    </motion.div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; dashed?: boolean }> = ({
  color,
  label,
  dashed,
}) => (
  <div className="flex items-center gap-1.5">
    <div className={cn('w-3.5 h-0.5 rounded-full', color, dashed && 'opacity-60')} />
    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
  </div>
);

const EmptyChart: React.FC = () => (
  <div className="w-full text-center py-12">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-50 mb-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
        <path d="M3 3v18h18M7 14l4-4 4 4 6-6" />
      </svg>
    </div>
    <p className="text-sm text-zinc-500">Sin gastos registrados aún</p>
    <p className="text-xs text-zinc-400 mt-1">Añade una transacción para ver el desglose</p>
  </div>
);
