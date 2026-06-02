import { useMemo } from 'react';
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
import { useFinance } from '../context/FinanceContext';

export type LedgerItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
};

export type FlowPoint = {
  day: string;
  entrada: number;
  salida: number;
};

export type CategoryItem = {
  name: string;
  value: number;
  color: string;
};

export type AnalysisPeriod = 'all' | 'month' | 'year';

export type MonthComparison = {
  currentIncome: number;
  lastIncome: number;
  incomeDelta: number | null;
  currentExpense: number;
  lastExpense: number;
  expenseDelta: number | null;
  currentBalance: number;
  lastBalance: number;
  balanceDelta: number | null;
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
  currency: 'USD',
};

function sumByType(items: Array<{ amount: number; type: 'income' | 'expense' }>, type: 'income' | 'expense') {
  return items.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

function getPeriodTransactions<T extends { date: string }>(transactions: T[], period: AnalysisPeriod, today: Date) {
  if (period === 'all') return transactions;
  if (period === 'year') return transactions.filter((t) => isSameYear(parseISO(t.date), today));
  return transactions.filter((t) => isSameMonth(parseISO(t.date), today));
}

function buildFlowData(
  transactions: Array<{ date: string; amount: number; type: 'income' | 'expense' }>,
  period: AnalysisPeriod,
  today: Date
): FlowPoint[] {
  if (period === 'year') {
    return eachMonthOfInterval({ start: startOfYear(today), end: startOfMonth(today) }).map((month) => {
      const monthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), month));
      return {
        day: format(month, 'MMM', { locale: es }).replace(/\./g, ''),
        entrada: sumByType(monthTransactions, 'income'),
        salida: sumByType(monthTransactions, 'expense'),
      };
    });
  }

  if (period === 'all') {
    if (transactions.length === 0) return [];
    const dates = transactions.map((t) => parseISO(t.date)).sort((a, b) => a.getTime() - b.getTime());
    return eachMonthOfInterval({ start: startOfMonth(dates[0]), end: startOfMonth(dates[dates.length - 1]) }).map((month) => {
      const monthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), month));
      return {
        day: format(month, 'MMM yy', { locale: es }).replace(/\./g, ''),
        entrada: sumByType(monthTransactions, 'income'),
        salida: sumByType(monthTransactions, 'expense'),
      };
    });
  }

  return eachDayOfInterval({ start: startOfMonth(today), end: today }).map((day) => {
    const dayTransactions = transactions.filter((t) => isSameDay(parseISO(t.date), day));
    return {
      day: format(day, 'd MMM', { locale: es }).replace(/\./g, ''),
      entrada: sumByType(dayTransactions, 'income'),
      salida: sumByType(dayTransactions, 'expense'),
    };
  });
}

export function useDashboardModel({ period = 'month' }: { period?: AnalysisPeriod } = {}) {
  const { transactions, settings, savingsGoals } = useFinance();
  const today = useMemo(() => new Date(), []);
  const hasTransactions = transactions.length > 0;
  const isSampleData = !hasTransactions;

  const currentMonthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), today));
  const lastMonthTransactions = transactions.filter((t) => isSameMonth(parseISO(t.date), subMonths(today, 1)));
  const periodTransactions = useMemo(
    () => getPeriodTransactions(transactions, period, today),
    [period, today, transactions]
  );
  const hasPeriodTransactions = periodTransactions.length > 0;
  const hasPeriodExpenses = periodTransactions.some((t) => t.type === 'expense');

  const monthIncome = sumByType(currentMonthTransactions, 'income');
  const monthExpense = sumByType(currentMonthTransactions, 'expense');
  const monthBalance = monthIncome - monthExpense;

  const lastMonthIncome = sumByType(lastMonthTransactions, 'income');
  const lastMonthExpense = sumByType(lastMonthTransactions, 'expense');
  const lastMonthBalance = lastMonthIncome - lastMonthExpense;
  const periodIncome = sumByType(periodTransactions, 'income');
  const periodExpense = sumByType(periodTransactions, 'expense');
  const periodBalance = periodIncome - periodExpense;

  const capital = hasTransactions ? periodBalance : 1020;
  const savingsRate =
    hasTransactions && periodIncome > 0 ? Math.max(0, ((periodIncome - periodExpense) / periodIncome) * 100) : isSampleData ? 82 : 0;
  const balanceDelta =
    hasTransactions && lastMonthBalance !== 0
      ? ((monthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
      : 12.4;

  const monthComparison = useMemo<MonthComparison | null>(() => {
    if (!hasTransactions || (currentMonthTransactions.length === 0 && lastMonthTransactions.length === 0)) return null;
    const incomeDelta = lastMonthIncome > 0 ? ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100 : null;
    const expenseDelta = lastMonthExpense > 0 ? ((monthExpense - lastMonthExpense) / lastMonthExpense) * 100 : null;
    const comparisonBalanceDelta =
      lastMonthBalance !== 0 ? ((monthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100 : null;
    return {
      currentIncome: monthIncome,
      lastIncome: lastMonthIncome,
      incomeDelta,
      currentExpense: monthExpense,
      lastExpense: lastMonthExpense,
      expenseDelta,
      currentBalance: monthBalance,
      lastBalance: lastMonthBalance,
      balanceDelta: comparisonBalanceDelta,
    };
  }, [
    currentMonthTransactions.length,
    hasTransactions,
    lastMonthTransactions.length,
    monthBalance,
    monthExpense,
    monthIncome,
    lastMonthBalance,
    lastMonthExpense,
    lastMonthIncome,
  ]);

  const flowData = useMemo<FlowPoint[]>(() => {
    if (!hasTransactions) return SAMPLE_WEEKLY_FLOW;
    return buildFlowData(periodTransactions, period, today);
  }, [hasTransactions, period, periodTransactions, today]);

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
    const colors = ['#2D5A27', '#B98F97', '#D9DDCF', '#C8C9C6', '#7F8E6C', '#5A7A4A', '#A0826D', '#8B9A7C'];

    const expenseCats = Array.from(
      new Set([
        ...(settings.expenseCategories || settings.categories || []),
        ...periodTransactions.filter((t) => t.type === 'expense').map((t) => t.category),
      ])
    );
    const actual = expenseCats
      .map((category, index) => ({
        name: category,
        value: periodTransactions
          .filter((t) => t.category === category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        color: colors[index % colors.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (!hasTransactions) return SAMPLE_CATEGORIES;
    return actual;
  }, [hasTransactions, periodTransactions, settings.categories, settings.expenseCategories]);

  const chartMax = Math.max(
    1000,
    ...flowData.map((point) => Math.max(point.entrada, point.salida))
  );

  const activeProject = useMemo(() => {
    if (savingsGoals && savingsGoals.length > 0) {
      const g = savingsGoals[0];
      const target = g.targetAmount ?? 0;
      return {
        title: `PROYECTO: ${g.title.toUpperCase()}`,
        progress: target > 0 ? Math.min(100, Math.round((g.currentAmount / target) * 100)) : 0,
        current: g.currentAmount,
        target,
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
    currency: settings.currency,
    hasPeriodTransactions,
    hasPeriodExpenses,
    isSampleData,
    monthComparison,
    project: activeProject,
  };
}
