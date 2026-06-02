import React, { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
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
  Eye,
  EyeOff,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn, formatCurrency } from '../utils';
import { useFinance } from '../context/FinanceContext';
import { groupTotalsByCurrency } from '../utils/money';
import { useDashboardModel, type AnalysisPeriod } from '../hooks/useDashboardModel';

export type { AnalysisPeriod };

const SURFACES = {
  dark: 'rounded-[32px] bg-emerald-800 dark:bg-emerald-900 premium-shadow border border-white/5',
  card: 'rounded-[32px] border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900 glass-surface premium-shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
  soft: 'rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800 glass-surface premium-shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
  night: 'rounded-[32px] bg-zinc-950 dark:bg-black premium-shadow border border-white/5',
};

function formatShortDate(date: string) {
  return format(parseISO(date), 'dd MMM', { locale: es }).toUpperCase();
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export const BalanceHero: React.FC = () => {
  const { capital, balanceDelta, currency } = useDashboardModel();
  const { settings, updateSettings, transactions } = useFinance();
  const isHidden = !!settings.hideBalance;
  const toggleHidden = () => updateSettings({ hideBalance: !isHidden });

  // Totales del mes en curso, agrupados por moneda. Las txs legacy sin currency
  // caen al settings.currency, así que cuando todo el historial usa una sola
  // moneda el comportamiento es idéntico al anterior.
  const today = useMemo(() => new Date(), []);
  const monthTotals = useMemo(() => {
    const monthTxs = transactions.filter((t) => isSameMonth(parseISO(t.date), today));
    return groupTotalsByCurrency(monthTxs, settings.currency || 'DOP');
  }, [transactions, today, settings.currency]);

  const hasMultiple = monthTotals.length > 1;
  const primary = monthTotals[0];
  // Si no hay txs aún, caemos al `capital` del modelo (que tiene sample data).
  const headlineAmount = primary ? primary.net : capital;
  const headlineCurrency = primary ? primary.currency : currency;

  const trendClass = balanceDelta >= 0 ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-100';
  const TrendIcon = balanceDelta >= 0 ? ArrowUpRight : ArrowDownLeft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        SURFACES.dark,
        'relative overflow-hidden p-6 sm:p-7 text-white min-h-[140px] flex flex-col justify-between group cursor-default'
      )}
    >
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-[80px] transition-all duration-700 group-hover:scale-125" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white/90 glass-surface border-white/10">
          <Wallet size={20} strokeWidth={2} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHidden}
            aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
            aria-pressed={isHidden}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
          >
            {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          {/* El delta vs mes anterior solo tiene sentido con una sola moneda;
              comparar porcentajes entre divisas distintas es ruido visual. */}
          {!hasMultiple && (
            <div className={cn('inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold num glass-surface border-white/5', trendClass)}>
              <TrendIcon size={13} />
              {balanceDelta >= 0 ? '+' : ''}
              {balanceDelta.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/50">Capital Activo</p>
        <div className={cn('mt-2 transition-all duration-300', isHidden && 'blur-md select-none')} aria-hidden={isHidden}>
          <h2
            className={cn(
              'font-bold tracking-tight num leading-none text-white drop-shadow-sm',
              hasMultiple ? 'text-[28px]' : 'text-[36px]'
            )}
          >
            {isHidden ? '••••••' : formatMoney(headlineAmount, headlineCurrency)}
          </h2>
          {hasMultiple && (
            <ul className="mt-2 space-y-0.5">
              {monthTotals.slice(1).map((t) => (
                <li key={t.currency} className="text-sm font-semibold num text-white/70">
                  {isHidden ? '•••••' : formatMoney(t.net, t.currency)}
                </li>
              ))}
            </ul>
          )}
        </div>
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
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className={cn(SURFACES.card, 'min-h-[140px] p-6 sm:p-7 flex flex-col justify-between')}
  >
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f1ea] text-[#5d6a56] border border-white/50">
      {icon ?? <TrendingUp size={19} strokeWidth={2} />}
    </div>
    <div className="mt-4">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#7f715d]/70">{label}</p>
      <h3 className="mt-2 text-[32px] font-bold tracking-tight num leading-none text-[#4b5741]">{value}</h3>
    </div>
  </motion.div>
);

export const SavingsRateCard: React.FC<{ period?: AnalysisPeriod }> = ({ period }) => {
  const { savingsRate, hasPeriodTransactions, isSampleData } = useDashboardModel({ period });
  const statusLabel = isSampleData ? 'Demostración' : hasPeriodTransactions ? 'Calculado' : 'Sin movimientos';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.soft, 'min-h-[140px] p-6 sm:p-7 flex flex-col justify-between')}
    >
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#6a705e]/60">Índice de ahorro</p>
        <h3 className="mt-2 text-[48px] font-bold tracking-tight num leading-none text-[#2f5a29]">
          {Math.round(savingsRate)}%
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#7d866f]">{statusLabel}</p>
      </div>
    </motion.div>
  );
};

export const LibroOperativo: React.FC = () => {
  const { recentLedger, currency } = useDashboardModel();

  return (
    <div className={cn(SURFACES.card, 'p-6 sm:p-7')}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#7c7361]/80">Libro operativo</h3>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#e8e0d2] bg-[#f6f1e8] px-3.5 py-2 text-sm font-bold uppercase tracking-[0.24em] text-[#75806b] transition-all hover:bg-[#f3ede2] hover:scale-105 active:scale-95">
          Expandir
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-3.5">
        {recentLedger.map((item) => {
          const isIncome = item.type === 'income';
          const RowIcon = isIncome ? ArrowUpRight : ArrowDownLeft;

          return (
            <div
              key={item.id}
              className="libro-row group flex items-center justify-between gap-4 rounded-[20px] border border-[#efe8da] bg-[#fbfaf6]/50 p-4 transition-all hover:border-[#dcd5c7] hover:bg-white hover:premium-shadow"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={cn(
                    'libro-icon flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                    isIncome ? 'bg-[#ecf3e8] text-[#4c6943]' : 'bg-[#f7e4ea] text-[#c27a8c]'
                  )}
                >
                  <RowIcon size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-[#4b5741]">{item.title}</p>
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.2em] text-[#9d9687]/70">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    'text-[15px] font-bold num',
                    isIncome ? 'text-[#5a794f]' : 'text-[#806f64]'
                  )}
                >
                  {isIncome ? '+' : '-'}
                  {formatMoney(item.amount, currency)}
                </p>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d9687]/70">
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
    <div className={cn(SURFACES.dark, 'relative overflow-hidden p-7 text-white group')}>
      <div className="absolute -right-10 -bottom-10 text-white/5 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
        <Sparkles size={220} strokeWidth={1} />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-white/40" />
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/30">Intuición autónoma</p>
      </div>
      <p className="relative max-w-xl text-[15px] font-medium leading-relaxed text-white/90">
        Plan de gasto estable. El índice sugiere <span className="font-bold underline decoration-white/40 underline-offset-8">$2k allocation</span> a
        "Fondo de Reserva" hoy.
      </p>
      <button className="relative mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-white/15 hover:premium-shadow active:scale-[0.98]">
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
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/40">
                  PROYECTO: {goal.title}
                </p>
                <span className="text-sm font-bold text-[#75b156]">{progress}%</span>
              </div>

              <div className="mt-2.5">
                <h4 className="text-sm font-semibold num tracking-tight text-white/90">
                  {formatMoney(goal.currentAmount, currency)} / {formatMoney(goal.targetAmount, currency)}
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

export const ComparativeChart: React.FC<{ period?: AnalysisPeriod }> = ({ period }) => {
  const { flowData, chartMax, currency, hasPeriodTransactions, isSampleData } = useDashboardModel({ period });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.card, 'p-5 sm:p-6')}
    >
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em] text-[#7c7361]/80 truncate">
            Análisis de flujo de capital
          </h2>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <LegendItem color="bg-[#2d5a27]" label="Entrada" />
          <LegendItem color="bg-[#dcd5c7]" label="Salida" />
        </div>
      </div>

      {!isSampleData && !hasPeriodTransactions ? (
        <EmptyAnalyticState
          title="Sin flujo para este período"
          description="No hay ingresos ni gastos registrados en el rango seleccionado."
        />
      ) : (
      <div className="h-[300px] mt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={flowData} margin={{ top: 10, right: 10, left: -25, bottom: 15 }}>
            <defs>
              <linearGradient id="flowGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d5a27" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2d5a27" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="flowGray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dcd5c7" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#dcd5c7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0ede4" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a19a8e', fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a19a8e', fontSize: 11, fontWeight: 600 }}
              tickFormatter={(value) => formatMoney(Number(value), currency)}
              domain={[0, chartMax]}
              tickCount={5}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: '#dcd5c7', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: 'rgba(255, 253, 248, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(231, 223, 208, 0.5)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(26, 22, 12, 0.06)',
                fontSize: '12px',
                padding: '16px',
              }}
              labelStyle={{ color: '#4b5741', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}
              formatter={(value: number) => [formatMoney(value, currency), '']}
            />
            <Area
              type="monotone"
              dataKey="entrada"
              stroke="#2d5a27"
              strokeWidth={3}
              fill="url(#flowGreen)"
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, shadow: '0 0 10px rgba(0,0,0,0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="salida"
              stroke="#dcd5c7"
              strokeWidth={2}
              fill="url(#flowGray)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </motion.div>
  );
};

export const CategoryBreakdown: React.FC<{ period?: AnalysisPeriod }> = ({ period }) => {
  const { categoryData, currency, hasPeriodExpenses, isSampleData } = useDashboardModel({ period });
  const [expanded, setExpanded] = useState(false);
  const visibleData = expanded ? categoryData : categoryData.slice(0, 3);
  const hasMore = categoryData.length > 3;
  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.card, 'p-4 sm:p-5 lg:p-6')}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.24em] text-[#7c7361] truncate">
          Distribución de gastos
        </h2>
        {!isSampleData && total > 0 && (
          <span className="text-xs sm:text-sm font-bold num text-[#6d5533] shrink-0">
            Total: {formatMoney(total, currency)}
          </span>
        )}
      </div>

      {!isSampleData && !hasPeriodExpenses ? (
        <EmptyAnalyticState
          title="Sin gastos en este período"
          description="Cuando registres gastos en el rango seleccionado, aparecerá la distribución por categoría."
        />
      ) : (
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="h-32 w-32 sm:h-36 sm:w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
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

        <div className="flex-1 w-full space-y-2.5 min-w-0">
          {visibleData.map((item) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={item.name} className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.08em] sm:tracking-[0.16em] text-[#6f675a] truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <span className="text-[10px] sm:text-xs font-medium text-[#9d9687] num">{pct}%</span>
                  <span className="text-xs sm:text-sm font-bold num text-[#6d5533]">
                    {formatMoney(item.value, currency)}
                  </span>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.24em] text-[#75806b] transition-colors hover:text-[#5a6851]"
            >
              {expanded ? 'Ver menos' : `Ver todo (${categoryData.length})`}
              <ChevronRight size={11} className={cn('transition-transform', expanded && 'rotate-90')} />
            </button>
          )}
        </div>
      </div>
      )}
    </motion.div>
  );
};

const EmptyAnalyticState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#e4dccd] bg-white/35 px-6 py-8 text-center">
    <Info size={18} className="text-[#9d9687]" />
    <p className="mt-3 text-sm font-bold text-[#554936]">{title}</p>
    <p className="mt-1 max-w-[320px] text-sm font-medium leading-relaxed text-[#9d9687]">
      {description}
    </p>
  </div>
);

/** Banner visible when displaying sample/demo data instead of real transactions */
export const SampleDataBanner: React.FC = () => {
  const { isSampleData } = useDashboardModel();
  if (!isSampleData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3"
    >
      <Info size={15} className="shrink-0 mt-0.5 text-amber-600" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Datos de demostración</p>
        <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
          Estás viendo datos de ejemplo. Agrega transacciones para ver tu análisis real.
        </p>
      </div>
    </motion.div>
  );
};

/** Month-over-month comparison card for the analysis section */
export const MonthComparisonCard: React.FC = () => {
  const { monthComparison, isSampleData } = useDashboardModel();
  const { settings } = useFinance();

  if (isSampleData || !monthComparison) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(SURFACES.card, 'p-5 sm:p-6')}
      >
        <h2 className="text-sm font-bold uppercase tracking-[0.28em] text-[#7c7361] mb-4">
          Comparativa mensual
        </h2>
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#f3f1ea] mb-3">
            <TrendingUp className="text-[#9d9687]" size={18} />
          </div>
          <p className="text-sm font-semibold text-[#554936]">Sin datos suficientes</p>
          <p className="text-sm text-[#9d9687] mt-1 max-w-[240px] mx-auto leading-relaxed">
            Necesitas al menos 1 mes de transacciones para ver la comparativa.
          </p>
        </div>
      </motion.div>
    );
  }

  const rows = [
    {
      label: 'Ingresos',
      current: monthComparison.currentIncome,
      previous: monthComparison.lastIncome,
      delta: monthComparison.incomeDelta,
      positiveIsGood: true,
    },
    {
      label: 'Gastos',
      current: monthComparison.currentExpense,
      previous: monthComparison.lastExpense,
      delta: monthComparison.expenseDelta,
      positiveIsGood: false,
    },
    {
      label: 'Balance',
      current: monthComparison.currentBalance,
      previous: monthComparison.lastBalance,
      delta: monthComparison.balanceDelta,
      positiveIsGood: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(SURFACES.card, 'p-5 sm:p-6')}
    >
      <h2 className="text-sm font-bold uppercase tracking-[0.28em] text-[#7c7361] mb-5">
        Comparativa mensual
      </h2>

      <div className="space-y-4">
        {rows.map((row) => {
          const hasDelta = row.delta !== null;
          const isGood = hasDelta && (row.positiveIsGood ? row.delta >= 0 : row.delta <= 0);
          const DeltaIcon = !hasDelta || row.delta >= 0 ? TrendingUp : TrendingDown;
          return (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#7c7361]">
                  {row.label}
                </p>
                <p className="text-base font-semibold num text-[#554936] mt-0.5">
                  {formatCurrency(row.current, settings.currency)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-bold num',
                  !hasDelta && 'bg-zinc-50 text-zinc-500',
                  hasDelta && (isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')
                )}>
                  <DeltaIcon size={11} />
                  {hasDelta ? `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(1)}%` : 'Sin base'}
                </div>
                <p className="text-xs text-[#9d9687] num mt-0.5">
                  Prev: {formatCurrency(row.previous, settings.currency)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className={cn('h-2 w-2 rounded-full', color)} />
    <span className="text-xs font-bold uppercase tracking-[0.26em] text-[#9d9687]">{label}</span>
  </div>
);
