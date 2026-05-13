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
  '#2D5A27', // Verde Bosque
  '#836637', // Marrón Castaño
  '#A8DADC', // Aguamarina
  '#BDBDBD', // Gris Piedra
  '#4B5741', // Verde Oscuro
  '#71644f', // Marrón Oscuro
  '#e5cb90', // Dorado Claro
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

  const expenseCats = settings.expenseCategories || settings.categories || [];
  const categoryData = expenseCats
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
      className="relative bg-emerald-800 p-6 sm:p-7 rounded-3xl text-white flex flex-col justify-between shadow-xl shadow-emerald-900/20 overflow-hidden min-h-[160px]"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/[0.06] blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded-xl">
             <TrendingUp size={14} className="text-white/80" />
          </div>
          <div className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold num">
            {balanceDelta > 0 ? '+' : ''}{balanceDelta.toFixed(1)}%
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Capital Activo</p>
        <h2 className="text-3xl font-light tracking-tight num leading-tight">
          {formatCurrency(balance, settings.currency)}
        </h2>
      </div>
    </motion.div>
  );
};

export const StatCard: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/50 shadow-sm flex flex-col justify-between min-h-[160px]"
  >
    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mb-4">
      {icon || <TrendingUp size={18} className="text-zinc-400" />}
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-zinc-900 num">{value}</h3>
    </div>
  </motion.div>
);

export const SavingsRateCard: React.FC = () => {
  const { savingsRate } = useFinanceMetrics();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#E6EBE1] p-6 sm:p-7 rounded-3xl border border-emerald-100/50 shadow-sm flex flex-col justify-between min-h-[160px]"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/40 mb-1">Índice de Ahorro</p>
        <h3 className="text-4xl font-bold text-emerald-900 num">{Math.max(0, savingsRate).toFixed(0)}%</h3>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">Optimizado</p>
    </motion.div>
  );
};

export const LibroOperativo: React.FC = () => {
  const { transactions, settings } = useFinance();
  const recent = transactions.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200/50 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Libro Operativo</h3>
        <button className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Expandir</button>
      </div>
      <div className="space-y-4 flex-1">
        {recent.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate uppercase tracking-tight">{t.category}</p>
                <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">
                  {format(parseISO(t.date), 'dd MMM', { locale: es })}
                </p>
              </div>
            </div>
            <span className={cn(
              "text-xs font-bold num whitespace-nowrap",
              t.type === 'income' ? "text-emerald-600" : "text-red-600"
            )}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const IntuicionAutonoma: React.FC = () => (
  <div className="bg-emerald-800 p-8 rounded-3xl text-white shadow-xl shadow-emerald-900/20">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Intuición Autónoma</p>
    <p className="text-sm font-medium leading-relaxed mb-8">
      Plan de gasto estable. El índice sugiere <span className="underline decoration-emerald-400/50 underline-offset-4">$2k allocation</span> a "Fondo de Reserva" hoy.
    </p>
    <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-bold tracking-[0.2em] uppercase transition-all active:scale-[0.98]">
      Ejecutar Optimización
    </button>
  </div>
);

export const ProjectProgress: React.FC = () => (
  <div className="bg-zinc-950 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between min-h-[140px]">
    <div className="flex items-center justify-between mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Proyecto: Japan Core</p>
      <span className="text-[10px] font-bold text-emerald-500">68%</span>
    </div>
    <div className="space-y-4">
      <h4 className="text-base font-bold num tracking-tight">$3,400 / $5k</h4>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '68%' }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-emerald-500"
        />
      </div>
    </div>
  </div>
);

export const ComparativeChart: React.FC = () => {
  const { performanceData, settings } = useFinanceMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/50 shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center justify-between gap-3 mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Análisis de Flujo de Capital</h2>
        <div className="flex items-center gap-6">
          <LegendItem color="bg-zinc-900" label="Entrada" />
          <LegendItem color="bg-zinc-300" label="Salida" />
        </div>
      </div>

      <div className="flex-1 min-h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D5A27" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#2D5A27" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(v) => formatCompact(v, settings.currency)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)',
                fontSize: '12px',
                padding: '12px 16px',
              }}
              formatter={(value: number) => formatCurrency(value, settings.currency)}
            />
            <Area
              type="stepAfter"
              dataKey="ingresos"
              stroke="#2D5A27"
              strokeWidth={2}
              fill="url(#colorIngresos)"
              animationDuration={1000}
            />
            <Area
              type="stepAfter"
              dataKey="egresos"
              stroke="#BDBDBD"
              strokeWidth={1.5}
              fill="transparent"
              animationDuration={1000}
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
      className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/50 shadow-sm flex flex-col"
    >
      <div className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Distribución de Gastos</h2>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-8">
        <div className="w-40 h-40 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3 w-full">
          {categoryData.slice(0, 4).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.name}</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-900 num">${formatCompact(item.value, settings.currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={cn('w-2 h-2 rounded-full', color)} />
    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
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
  </div>
);

