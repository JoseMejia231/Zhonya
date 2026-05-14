import React, { useMemo } from 'react';
import { format, isSameDay, isSameMonth, parseISO, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '../utils';
import { useFinance } from '../context/FinanceContext';

type LedgerItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
};

type FlowPoint = {
  day: string;
  entrada: number;
  salida: number;
};

type CategoryItem = {
  name: string;
  value: number;
  color: string;
};

const SAMPLE_WEEKLY_FLOW: FlowPoint[] = [
  { day: 'Lun', entrada: 320, salida: 260 },
  { day: 'Mar', entrada: 320, salida: 200 },
  { day: 'Mie', entrada: 980, salida: 390 },
  { day: 'Jue', entrada: 480, salida: 250 },
  { day: 'Vie', entrada: 480, salida: 190 },
  { day: 'Sab', entrada: 430, salida: 230 },
  { day: 'Dom', entrada: 430, salida: 340 },
];

const SAMPLE_LEDGER: LedgerItem[] = [
  {
    id: 'salary',
    title: 'Salario',
    subtitle: 'Pago quincenal',
    amount: 1200,
    date: '2026-05-11T08:00:00.000Z',
    type: 'income',
  },
  {
    id: 'food',
    title: 'Comida',
    subtitle: 'Supermercado sem...',
    amount: 450,
    date: '2026-05-11T10:30:00.000Z',
    type: 'expense',
  },
  {
    id: 'transport',
    title: 'Transporte',
    subtitle: 'Recarga tarjeta m...',
    amount: 80,
    date: '2026-05-10T13:00:00.000Z',
    type: 'expense',
  },
  {
    id: 'subscriptions',
    title: 'Suscripciones',
    subtitle: 'Netflix & Spotify',
    amount: 150,
    date: '2026-05-09T09:00:00.000Z',
    type: 'expense',
  },
  {
    id: 'sales',
    title: 'Ventas',
    subtitle: 'Venta de ropa usada',
    amount: 500,
    date: '2026-05-08T17:00:00.000Z',
    type: 'income',
  },
];

const SAMPLE_CATEGORIES: CategoryItem[] = [
  { name: 'Hogar', value: 458, color: '#2D5A27' },
  { name: 'Comida', value: 300, color: '#B98F97' },
  { name: 'Ocio', value: 150, color: '#D9DDCF' },
];

const SAMPLE_PROJECT = {
  title: 'Proyecto: Japan Core',
  progress: 68,
  current: 3400,
  target: 5000,
};

const SURFACES = {
  dark: 'rounded-[26px] bg-[#2f5a29] shadow-[0_20px_45px_rgba(39,67,30,0.2)]',
  card: 'rounded-[26px] border border-[#e7dfd1] bg-white shadow-[0_18px_40px_rgba(32,28,16,0.05)]',
  soft: 'rounded-[26px] border border-[#d8dece] bg-[#dee4d8] shadow-[0_18px_40px_rgba(32,28,16,0.05)]',
  night: 'rounded-[26px] bg-[#0f1220] shadow-[0_20px_45px_rgba(7,10,16,0.28)]',
};

function formatShortDate(date: string) {
  return format(parseISO(date), 'dd MMM', { locale: es }).toUpperCase();
}

function formatDollar(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function useDashboardModel() {
  const { transactions, filteredTransactions, settings, savingsGoals } = useFinance();
  const hasTransactions = transactions.length > 0;
  const today = new Date();

  const currentMonthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), today));
  const lastMonthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), subMonths(today, 1)));

  const monthIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  const lastMonthIncome = lastMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const lastMonthExpense = lastMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const lastMonthBalance = lastMonthIncome - lastMonthExpense;

  const capital = hasTransactions ? monthBalance : 1020;
  const savingsRate =
    hasTransactions && monthIncome > 0 ? Math.max(0, ((monthIncome - monthExpense) / monthIncome) * 100) : 82;
  const balanceDelta =
    hasTransactions && lastMonthBalance !== 0
      ? ((monthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
      : 12.4;

  const flowData = useMemo<FlowPoint[]>(() => {
    if (!hasTransactions) return SAMPLE_WEEKLY_FLOW;

    return Array.from({ length: 7 }, (_, index) => {
      const day = subDays(today, 6 - index);
      const dayTransactions = transactions.filter((t) => isSameDay(parseISO(t.date), day));
      const entrada = dayTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const salida = dayTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const shortDay = format(day, 'EEE', { locale: es }).replace(/\./g, '');

      return {
        day: shortDay.charAt(0).toUpperCase() + shortDay.slice(1),
        entrada,
        salida,
      };
    });
  }, [hasTransactions, today, transactions]);

  const recentLedger = useMemo<LedgerItem[]>(() => {
    if (!hasTransactions) return SAMPLE_LEDGER;

    return transactions.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.category,
      subtitle: t.description || 'Movimiento registrado',
      amount: t.amount,
      date: t.date,
      type: t.type,
    }));
  }, [hasTransactions, transactions]);

  const categoryData = useMemo<CategoryItem[]>(() => {
    const colors = ['#2D5A27', '#B98F97', '#D9DDCF', '#C8C9C6', '#7F8E6C'];

    const expenseCats = settings.expenseCategories || settings.categories || [];
    const actual = expenseCats
      .map((category, index) => ({
        name: category,
        value: filteredTransactions
          .filter((t) => t.category === category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        color: colors[index % colors.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (!hasTransactions || actual.length === 0) return SAMPLE_CATEGORIES;
    return actual.slice(0, 3);
  }, [filteredTransactions, hasTransactions, settings.categories]);

  const chartMax = Math.max(
    1000,
    ...flowData.map((point) => Math.max(point.entrada, point.salida))
  );

  const activeProject = useMemo(() => {
    if (savingsGoals && savingsGoals.length > 0) {
      const g = savingsGoals[0];
      return {
        title: `PROYECTO: ${g.title.toUpperCase()}`,
        progress: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)),
        current: g.currentAmount,
        target: g.targetAmount,
        currency: g.currency,
      };
    }
    return SAMPLE_PROJECT;
  }, [savingsGoals]);

  return {
    capital,
    savingsRate,
    balanceDelta,
    flowData,
    recentLedger,
    categoryData,
    chartMax,
    project: activeProject,
  };
}

export const BalanceHero: React.FC = () => {
  const { capital, balanceDelta } = useDashboardModel();
  const trendClass = balanceDelta >= 0 ? 'bg-white/10 text-white' : 'bg-rose-500/15 text-rose-100';
  const TrendIcon = balanceDelta >= 0 ? ArrowUpRight : ArrowDownLeft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        SURFACES.dark,
        'relative overflow-hidden p-5 sm:p-6 text-white min-h-[122px] flex flex-col justify-between'
      )}
    >
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white/90">
          <Wallet size={19} strokeWidth={2.15} />
        </div>
        <div className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold num', trendClass)}>
          <TrendIcon size={12} />
          {balanceDelta >= 0 ? '+' : ''}
          {balanceDelta.toFixed(1)}%
        </div>
      </div>

      <div className="relative mt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/42">Capital Activo</p>
        <h2 className="mt-2 text-[32px] font-semibold tracking-tight num leading-none text-[#f4f1e7]">
          {formatDollar(capital)}
        </h2>
      </div>
    </motion.div>
  );
};

export const StatCard: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className={cn(SURFACES.card, 'min-h-[122px] p-5 sm:p-6 flex flex-col justify-between')}
  >
    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f1ea] text-[#5d6a56]">
      {icon ?? <TrendingUp size={18} strokeWidth={2.2} />}
    </div>
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7f715d]">{label}</p>
      <h3 className="mt-2 text-[29px] font-semibold tracking-tight num leading-none text-[#6f5633]">{value}</h3>
    </div>
  </motion.div>
);

export const SavingsRateCard: React.FC = () => {
  const { savingsRate } = useDashboardModel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.soft, 'min-h-[122px] p-5 sm:p-6 flex flex-col justify-between')}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6a705e]">Índice de ahorro</p>
        <h3 className="mt-2 text-[42px] font-semibold tracking-tight num leading-none text-[#2f5a29]">
          {Math.round(savingsRate)}%
        </h3>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7d866f]">Optimizado</p>
    </motion.div>
  );
};

export const LibroOperativo: React.FC = () => {
  const { recentLedger } = useDashboardModel();

  return (
    <div className={cn(SURFACES.card, 'p-5 sm:p-6')}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7c7361]">Libro operativo</h3>
        <button className="inline-flex items-center gap-1 rounded-lg border border-[#e8e0d2] bg-[#f6f1e8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#75806b] transition-colors hover:bg-[#f3ede2]">
          Expandir
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-3">
        {recentLedger.map((item) => {
          const isIncome = item.type === 'income';
          const RowIcon = isIncome ? ArrowUpRight : ArrowDownLeft;

          return (
            <div
              key={item.id}
              className="libro-row flex items-center justify-between gap-3 rounded-2xl border border-[#efe8da] bg-[#fbfaf6] px-3 py-2.5 shadow-[0_8px_22px_rgba(27,22,10,0.03)] transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'libro-icon flex h-10 w-10 items-center justify-center rounded-xl',
                    isIncome ? 'bg-[#ecf3e8] text-[#4c6943]' : 'bg-[#f7e4ea] text-[#c27a8c]'
                  )}
                >
                  <RowIcon size={16} strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#554936]">{item.title}</p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-[#9d9687]">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    'text-sm font-semibold num',
                    isIncome ? 'text-[#5a794f]' : 'text-[#806f64]'
                  )}
                >
                  {isIncome ? '+' : '-'}
                  {formatDollar(item.amount)}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9d9687]">
                  {formatShortDate(item.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const IntuicionAutonoma: React.FC = () => {
  return (
    <div className={cn(SURFACES.dark, 'relative overflow-hidden p-5 sm:p-6 text-white')}>
      <div className="absolute -right-4 -bottom-6 text-white/6">
        <Sparkles size={150} strokeWidth={1.25} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/22">Intuición autónoma</p>
      <p className="relative mt-4 max-w-xl text-sm font-medium leading-6 text-white/90">
        Plan de gasto estable. El índice sugiere <span className="font-semibold underline decoration-white/30 underline-offset-4">$2k allocation</span> a
        "Fondo de Reserva" hoy.
      </p>
      <button className="relative mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-white/12">
        Ejecutar optimización
      </button>
    </div>
  );
};

export const ProjectProgress: React.FC = () => {
  const { savingsGoals, settings } = useFinance();

  if (!savingsGoals || savingsGoals.length === 0) {
    return (
      <div className={cn(SURFACES.night, 'relative overflow-hidden p-5 sm:p-6 text-white min-h-[160px] flex items-center justify-center')}>
         <p className="text-white/40 text-sm font-medium tracking-wide">No hay metas de ahorro activas</p>
         <div className="absolute -right-3 bottom-2 text-white/8 pointer-events-none">
           <BadgeDollarSign size={80} strokeWidth={1.25} />
         </div>
      </div>
    );
  }

  return (
    <div className={cn(SURFACES.night, 'relative overflow-hidden p-5 sm:p-6 text-white')}>
      <div className="space-y-7 relative z-10">
        {savingsGoals.map(goal => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const currency = goal.currency || settings.currency || 'USD';
          
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                  PROYECTO: {goal.title}
                </p>
                <span className="text-[10px] font-bold text-[#75b156]">{progress}%</span>
              </div>

              <div className="mt-2.5">
                <h4 className="text-sm font-semibold num tracking-tight text-white/90">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.round(goal.currentAmount))} / {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.round(goal.targetAmount))}
                </h4>
                <div className="mt-3 h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full bg-[#75b156]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
        <BadgeDollarSign size={120} strokeWidth={1.25} />
      </div>
    </div>
  );
};

export const ComparativeChart: React.FC = () => {
  const { flowData, chartMax } = useDashboardModel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.card, 'p-5 sm:p-6')}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7c7361]">
          Análisis de flujo de capital
        </h2>
        <div className="flex items-center gap-5">
          <LegendItem color="bg-[#2d5a27]" label="Entrada" />
          <LegendItem color="bg-[#d0d4c7]" label="Salida" />
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={flowData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="flowGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d5a27" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2d5a27" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efeadd" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9c9589', fontSize: 10, fontWeight: 500, fontStyle: 'italic' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9c9589', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(value) => `${value}`}
              domain={[0, chartMax]}
              tickCount={5}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: '#dcd5c7', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: '#fffdf8',
                border: '1px solid #e7dfd0',
                borderRadius: '16px',
                boxShadow: '0 18px 36px rgba(26, 22, 12, 0.08)',
                fontSize: '12px',
                padding: '12px 14px',
              }}
              labelStyle={{ color: '#6b634f', fontWeight: 700, textTransform: 'uppercase' }}
              formatter={(value: number) => [formatDollar(value), '']}
            />
            <Area
              type="stepAfter"
              dataKey="entrada"
              stroke="#2d5a27"
              strokeWidth={2}
              fill="url(#flowGreen)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="stepAfter"
              dataKey="salida"
              stroke="#d0d4c7"
              strokeWidth={1.6}
              fill="transparent"
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export const CategoryBreakdown: React.FC = () => {
  const { categoryData } = useDashboardModel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.card, 'p-5 sm:p-6')}
    >
      <div className="mb-5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7c7361]">
          Distribución de gastos
        </h2>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color ?? ['#2D5A27', '#B98F97', '#D9DDCF'][index % 3]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-4">
          {categoryData.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6f675a]">{item.name}</span>
              </div>
              <span className="text-[10px] font-bold num text-[#6d5533]">{formatDollar(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className={cn('h-2 w-2 rounded-full', color)} />
    <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#9d9687]">{label}</span>
  </div>
);
