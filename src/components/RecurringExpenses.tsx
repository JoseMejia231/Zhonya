import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringExpense, RecurringFrequency, TransactionType } from '../types';
import { formatCurrency, cn, getCurrencySymbol } from '../utils';
import {
  Bell,
  BellOff,
  CalendarDays,
  CalendarRange,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
  Check,
  Minus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { success } from '../utils/haptics';
import { currentMonthCommitment } from '../utils/projection';

const ordinalDay = (day: number) => {
  const safe = Math.max(1, Math.min(31, Math.round(day)));
  return `${safe}`;
};

const lastDayOfMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const normalizeNotifyTime = (value?: string) => {
  const match = /^([0-2]\d):([0-5]\d)$/.exec(value ?? '');
  if (!match) return { hours: 9, minutes: 0 };
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23) return { hours: 9, minutes: 0 };
  return { hours, minutes };
};

const withTime = (date: Date, hours: number, minutes: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);

const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Lun → Dom para el picker (más natural en es-DO).
const WEEKDAY_PICKER_ORDER = [1, 2, 3, 4, 5, 6, 0];

const FREQ_LABEL: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

export const RecurringExpenses: React.FC = () => {
  const {
    transactions,
    recurring,
    settings,
    toggleRecurring,
    deleteRecurring,
    confirmRecurringPayment,
    isRecurringPaidThisPeriod,
    notificationStatus,
    enableNotifications,
  } = useFinance();
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [creating, setCreating] = useState(false);
  const [askingPermission, setAskingPermission] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [currentCalDate, setCurrentCalDate] = useState(() => new Date());
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCalDay(null);
  }, [currentCalDate]);

  const getRecurringHistory = (recurringId: string) => {
    return transactions
      .filter((t) => t.id.startsWith(`${recurringId}-`))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const showPermissionPrompt =
    notificationStatus !== 'granted' && notificationStatus !== 'unsupported';

  const commitment = currentMonthCommitment(recurring);
  const hasRecurring = recurring.length > 0;
  const incomeRecurring = recurring.filter((r) => r.type === 'income');
  const expenseRecurring = recurring.filter((r) => r.type === 'expense');
  const activeCount = recurring.filter((r) => r.enabled).length;
  const pausedCount = recurring.length - activeCount;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const handleEnableNotifications = async () => {
    setAskingPermission(true);
    try {
      await enableNotifications();
    } finally {
      setAskingPermission(false);
    }
  };

  const occurrencesInMonth = (rec: RecurringExpense, year: number, month: number) => {
    const lastDay = lastDayOfMonth(year, month);
    if (rec.frequency === 'daily') return lastDay;
    if (rec.frequency === 'monthly') {
      const day = rec.dayOfMonth ?? 1;
      return day >= 1 ? 1 : 0;
    }
    const targets = new Set(rec.daysOfWeek ?? []);
    if (targets.size === 0) return 0;
    let count = 0;
    for (let d = 1; d <= lastDay; d += 1) {
      if (targets.has(new Date(year, month, d).getDay())) count += 1;
    }
    return count;
  };

  const monthlyTotalFor = (items: RecurringExpense[]) =>
    items
      .filter((r) => r.enabled)
      .reduce(
        (sum, rec) => sum + rec.amount * occurrencesInMonth(rec, currentYear, currentMonth),
        0
      );

  const getOccurrencesInMonthDates = (rec: RecurringExpense, year: number, month: number) => {
    const { hours, minutes } = normalizeNotifyTime(rec.notifyTime);
    const lastDay = lastDayOfMonth(year, month);
    if (rec.frequency === 'daily') {
      return Array.from({ length: lastDay }, (_, i) => new Date(year, month, i + 1, hours, minutes));
    }
    if (rec.frequency === 'monthly') {
      const day = Math.min(Math.max(1, rec.dayOfMonth ?? 1), lastDay);
      return [new Date(year, month, day, hours, minutes)];
    }
    const targets = new Set(rec.daysOfWeek ?? []);
    if (targets.size === 0) return [];
    const out: Date[] = [];
    for (let d = 1; d <= lastDay; d += 1) {
      if (targets.has(new Date(year, month, d).getDay())) {
        out.push(new Date(year, month, d, hours, minutes));
      }
    }
    return out;
  };

  const getNextOccurrence = (rec: RecurringExpense, from: Date) => {
    if (!rec.enabled) return null;
    const { hours, minutes } = normalizeNotifyTime(rec.notifyTime);
    if (rec.frequency === 'daily') {
      const today = withTime(from, hours, minutes);
      if (today.getTime() >= from.getTime()) return today;
      const tomorrow = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
      return withTime(tomorrow, hours, minutes);
    }
    if (rec.frequency === 'weekly') {
      const targets = rec.daysOfWeek ?? [];
      if (targets.length === 0) return null;
      for (let i = 0; i <= 7; i += 1) {
        const candidate = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        if (!targets.includes(candidate.getDay())) continue;
        const candidateTime = withTime(candidate, hours, minutes);
        if (candidateTime.getTime() >= from.getTime()) return candidateTime;
      }
      return null;
    }
    const day = Math.max(1, rec.dayOfMonth ?? 1);
    const thisMonthDay = Math.min(day, lastDayOfMonth(from.getFullYear(), from.getMonth()));
    const thisMonthDate = new Date(from.getFullYear(), from.getMonth(), thisMonthDay, hours, minutes);
    if (thisMonthDate.getTime() >= from.getTime()) return thisMonthDate;
    const nextMonth = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const nextMonthDay = Math.min(day, lastDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth()));
    return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDay, hours, minutes);
  };

  const formatNextLabel = (date: Date) =>
    `${date.toLocaleDateString('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })} · ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;

  const calendar = useMemo(() => {
    const reference = currentCalDate;
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const lastDay = lastDayOfMonth(year, month);
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
    const byDay = new Map<number, { income: number; expense: number }>();

    recurring
      .filter((r) => r.enabled)
      .forEach((rec) => {
        getOccurrencesInMonthDates(rec, year, month).forEach((date) => {
          const day = date.getDate();
          const entry = byDay.get(day) ?? { income: 0, expense: 0 };
          if (rec.type === 'income') entry.income += 1;
          else entry.expense += 1;
          byDay.set(day, entry);
        });
      });

    const days = Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      const entry = byDay.get(day);
      return {
        day,
        incomeCount: entry?.income ?? 0,
        expenseCount: entry?.expense ?? 0,
      };
    });

    const todayDate = new Date();
    const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;

    return {
      year,
      month,
      today: isCurrentMonth ? todayDate.getDate() : null,
      monthLabel: reference.toLocaleDateString('es', { month: 'long', year: 'numeric' }),
      firstWeekday,
      days,
    };
  }, [recurring, currentCalDate]);

  const selectedDayOccurrences = useMemo(() => {
    if (selectedCalDay === null) return [];
    const year = calendar.year;
    const month = calendar.month;

    return recurring
      .filter((r) => r.enabled)
      .filter((rec) => {
        const dates = getOccurrencesInMonthDates(rec, year, month);
        return dates.some((d) => d.getDate() === selectedCalDay);
      });
  }, [selectedCalDay, recurring, calendar.year, calendar.month]);

  const overspendThreshold = 0.8;
  const overspendPct =
    commitment && commitment.income > 0
      ? Math.round((commitment.expense / commitment.income) * 100)
      : 0;
  const showOverspendAlert =
    commitment &&
    commitment.income > 0 &&
    commitment.expense >= commitment.income * overspendThreshold;

  const sortedRecurring = (items: RecurringExpense[]) =>
    items.slice().sort((a, b) => {
      // Diarios → Semanales → Mensuales, luego por hora asc.
      const order: Record<string, number> = { daily: 0, weekly: 1, monthly: 2 };
      if (a.frequency !== b.frequency) {
        return order[a.frequency] - order[b.frequency];
      }
      if (a.frequency === 'monthly') {
        return (a.dayOfMonth ?? 0) - (b.dayOfMonth ?? 0);
      }
      if (a.frequency === 'weekly') {
        const aFirst = (a.daysOfWeek ?? [])[0] ?? 0;
        const bFirst = (b.daysOfWeek ?? [])[0] ?? 0;
        return aFirst - bFirst;
      }
      return (a.notifyTime ?? '').localeCompare(b.notifyTime ?? '');
    });

  const groupByCategory = (items: RecurringExpense[]) => {
    const groups = new Map<string, RecurringExpense[]>();
    for (const item of items) {
      const key = item.category || 'Sin categoría';
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries())
      .map(([category, list]) => ({ category, items: list }))
      .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
  };

  const renderRecurringCards = (items: RecurringExpense[]) => (
    <motion.div layout className="grid gap-3 sm:grid-cols-2">
      <AnimatePresence initial={false}>
        {sortedRecurring(items).map((r) => {
          const weeklyLabel =
            (r.daysOfWeek ?? []).length > 3
              ? `${(r.daysOfWeek ?? []).length} días`
              : (r.daysOfWeek ?? []).map((d) => WEEKDAY_SHORT[d]).join(', ');
          const scheduleLabel =
            r.frequency === 'daily'
              ? 'Todos los días'
              : r.frequency === 'weekly'
              ? weeklyLabel || 'Semanal'
              : `Día ${ordinalDay(r.dayOfMonth ?? 1)}`;
          const paidLabel =
            r.type === 'income'
              ? r.frequency === 'monthly'
                ? 'Cobrado este mes'
                : 'Cobrado hoy'
              : r.frequency === 'monthly'
              ? 'Pagado este mes'
              : 'Pagado hoy';
          const nextOccurrence = getNextOccurrence(r, now);
          const nextLabel = nextOccurrence ? formatNextLabel(nextOccurrence) : null;
          const nextPrefix = r.type === 'income' ? 'Próximo cobro' : 'Próximo pago';
          const confirmLabel = r.type === 'income' ? 'Marcar recibido' : 'Marcar pagado';
          const confirmTitle =
            r.type === 'income'
              ? 'Marcar como recibido este periodo'
              : 'Marcar como pagado este periodo';
          return (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 shadow-sm',
                !r.enabled && 'opacity-80'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
                    r.enabled ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                  )}
                >
                  {r.frequency === 'daily' && <Repeat size={18} strokeWidth={2.4} />}
                  {r.frequency === 'weekly' && <CalendarRange size={18} strokeWidth={2.4} />}
                  {r.frequency === 'monthly' && <CalendarDays size={18} strokeWidth={2.4} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 truncate">{r.name}</h4>
                    <span
                      className={cn(
                        'text-sm font-semibold whitespace-nowrap num',
                        r.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'
                      )}
                    >
                      {r.type === 'income' ? '+' : '−'}
                      {formatCurrency(r.amount, settings.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-zinc-600 font-medium border border-zinc-200/70">
                      {r.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-900 text-white font-medium">
                      {FREQ_LABEL[r.frequency]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-zinc-600 font-medium border border-zinc-200/70">
                      {scheduleLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-white text-zinc-700 font-medium num border border-zinc-200/70">
                      <Clock size={10} />
                      {r.notifyTime ?? '09:00'}
                    </span>
                    {isRecurringPaidThisPeriod(r.id) && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                        <Check size={10} strokeWidth={3} />
                        {paidLabel}
                      </span>
                    )}
                    {!r.enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                        Pausado
                      </span>
                    )}
                  </div>
                  {r.enabled && nextLabel && (
                    <p className="text-[10px] text-zinc-500 mt-2">
                      {nextPrefix}:{' '}
                      <span className="font-semibold num text-zinc-700">{nextLabel}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedHistoryId((prev) => (prev === r.id ? null : r.id))}
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {r.type === 'income' ? 'Ingreso fijo' : 'Gasto fijo'}
                  <span className="text-[9px] opacity-60">
                    ({getRecurringHistory(r.id).length > 0 ? `${getRecurringHistory(r.id).length} pagos` : 'sin pagos'})
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  {!isRecurringPaidThisPeriod(r.id) && (
                    <button
                      onClick={async () => {
                        await confirmRecurringPayment(r.id);
                        success();
                      }}
                      aria-label={confirmLabel}
                      title={confirmTitle}
                      className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    >
                      <Check size={17} strokeWidth={2.5} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleRecurring(r.id, !r.enabled)}
                    aria-label={r.enabled ? 'Pausar' : 'Reanudar'}
                    title={r.enabled ? 'Pausar recordatorio' : 'Reanudar recordatorio'}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                      r.enabled
                        ? 'text-zinc-700 hover:bg-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-100'
                    )}
                  >
                    {r.enabled ? <Bell size={15} /> : <BellOff size={15} />}
                  </button>
                  <button
                    onClick={() => setEditing(r)}
                    aria-label="Editar"
                    title="Editar"
                    className="p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteRecurring(r.id)}
                    aria-label="Eliminar"
                    title="Eliminar"
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {expandedHistoryId === r.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 border-t border-zinc-200/60 pt-3 space-y-1.5"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Historial de pagos</p>
                  {getRecurringHistory(r.id).length === 0 ? (
                    <p className="text-[10px] text-zinc-500 italic">No hay transacciones registradas.</p>
                  ) : (
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {getRecurringHistory(r.id).map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center text-[10px] py-0.5 border-b border-zinc-100 last:border-0">
                          <span className="text-zinc-600 num">
                            {new Date(tx.date).toLocaleDateString('es', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="font-semibold text-zinc-900 num">
                            {formatCurrency(tx.amount, settings.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );

  const renderRecurringRows = (items: RecurringExpense[]) => (
    <div className="rounded-2xl border border-zinc-200/70 bg-white overflow-hidden">
      {sortedRecurring(items).map((r, idx) => {
        const weeklyLabel =
          (r.daysOfWeek ?? []).length > 3
            ? `${(r.daysOfWeek ?? []).length} días`
            : (r.daysOfWeek ?? []).map((d) => WEEKDAY_SHORT[d]).join(', ');
        const scheduleLabel =
          r.frequency === 'daily'
            ? 'Diario'
            : r.frequency === 'weekly'
            ? weeklyLabel || 'Semanal'
            : `Día ${ordinalDay(r.dayOfMonth ?? 1)}`;
        const paidLabel =
          r.type === 'income'
            ? r.frequency === 'monthly'
              ? 'Cobrado este mes'
              : 'Cobrado hoy'
            : r.frequency === 'monthly'
            ? 'Pagado este mes'
            : 'Pagado hoy';
        const nextOccurrence = getNextOccurrence(r, now);
        const nextLabel = nextOccurrence ? formatNextLabel(nextOccurrence) : null;
        const nextPrefix = r.type === 'income' ? 'Próximo cobro' : 'Próximo pago';
        const history = getRecurringHistory(r.id);
        const isExpanded = expandedHistoryId === r.id;
        return (
          <div key={r.id} className={cn(idx > 0 && 'border-t border-zinc-100')}>
            <div
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-3.5 hover:bg-zinc-50/50 cursor-pointer transition-colors',
                !r.enabled && 'opacity-80'
              )}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('button')) return;
                setExpandedHistoryId((prev) => (prev === r.id ? null : r.id));
              }}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    r.enabled ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                  )}
                >
                  {r.frequency === 'daily' && <Repeat size={16} strokeWidth={2.4} />}
                  {r.frequency === 'weekly' && <CalendarRange size={16} strokeWidth={2.4} />}
                  {r.frequency === 'monthly' && <CalendarDays size={16} strokeWidth={2.4} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-zinc-900 truncate max-w-[150px] sm:max-w-none">{r.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-50 text-zinc-600 font-medium border border-zinc-200/70">
                      {r.category}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-900 text-white font-medium">
                      {FREQ_LABEL[r.frequency]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 mt-1">
                    <span>{scheduleLabel}</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Clock size={10} />
                      {r.notifyTime ?? '09:00'}
                    </span>
                    {isRecurringPaidThisPeriod(r.id) && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                        <Check size={10} strokeWidth={3} />
                        {paidLabel}
                      </span>
                    )}
                    {!r.enabled && <span className="text-amber-600 font-medium">Pausado</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 pt-2.5 sm:pt-0 border-t border-dashed border-zinc-100 sm:border-t-0 w-full sm:w-auto">
                <div
                  className={cn(
                    'text-sm font-semibold whitespace-nowrap num',
                    r.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'
                  )}
                >
                  {r.type === 'income' ? '+' : '−'}
                  {formatCurrency(r.amount, settings.currency)}
                </div>
                <div className="flex items-center gap-0.5">
                  {!isRecurringPaidThisPeriod(r.id) && (
                    <button
                      onClick={async () => {
                        await confirmRecurringPayment(r.id);
                        success();
                      }}
                      aria-label={r.type === 'income' ? 'Marcar recibido' : 'Marcar pagado'}
                      title={r.type === 'income' ? 'Marcar como recibido este periodo' : 'Marcar como pagado este periodo'}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors cursor-pointer focus:outline-none"
                    >
                      <Check size={15} strokeWidth={2.5} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleRecurring(r.id, !r.enabled)}
                    aria-label={r.enabled ? 'Pausar' : 'Reanudar'}
                    title={r.enabled ? 'Pausar recordatorio' : 'Reanudar recordatorio'}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer focus:outline-none',
                      r.enabled ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-zinc-100'
                    )}
                  >
                    {r.enabled ? <Bell size={14} /> : <BellOff size={14} />}
                  </button>
                  <button
                    onClick={() => setEditing(r)}
                    aria-label="Editar"
                    title="Editar"
                    className="p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-none"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteRecurring(r.id)}
                    aria-label="Eliminar"
                    title="Eliminar"
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus:outline-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            {isExpanded && (
              <div className="bg-zinc-50/50 border-t border-zinc-100 px-4 py-2.5 space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Historial de pagos</p>
                {history.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic">No hay transacciones registradas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                    {history.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center text-[10px] py-1 border-b border-zinc-100/80 last:border-0">
                        <span className="text-zinc-600 num">
                          {new Date(tx.date).toLocaleDateString('es', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="font-semibold text-zinc-900 num">
                          {formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderRecurringGroups = (items: RecurringExpense[], type: 'income' | 'expense') => (
    <div className="space-y-4">
      {groupByCategory(items).map((group) => {
        const total = monthlyTotalFor(group.items);
        const netLabel =
          type === 'income'
            ? `+${formatCurrency(Math.abs(total), settings.currency)}`
            : `−${formatCurrency(Math.abs(total), settings.currency)}`;
        return (
          <div key={group.category} className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {group.category}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Total mes: {formatCurrency(total, settings.currency)} · Neto: {netLabel}
              </div>
            </div>
            {compactView ? renderRecurringRows(group.items) : renderRecurringCards(group.items)}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {activeCount > 0 && commitment && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
        >
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Gasto fijo mensual
            </p>
            <p className="text-xl font-semibold num text-zinc-900 mt-1">
              {formatCurrency(commitment.expense, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Ingreso fijo mensual
            </p>
            <p className="text-xl font-semibold num text-emerald-600 mt-1">
              +{formatCurrency(commitment.income, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Neto mensual
            </p>
            <p
              className={cn(
                'text-xl font-semibold num mt-1',
                commitment.net >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {commitment.net >= 0 ? '+' : '−'}
              {formatCurrency(Math.abs(commitment.net), settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Recurrencias
            </p>
            <p className="text-xl font-semibold num text-zinc-900 mt-1">{recurring.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mt-1">
              Ingresos {incomeRecurring.length} · Gastos {expenseRecurring.length}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mt-1">
              Activas {activeCount} · Pausadas {pausedCount}
            </p>
          </div>
        </motion.div>
      )}

      {showOverspendAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-900">Alerta de sobrecosto</h3>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Los gastos fijos ya representan {overspendPct}% de los ingresos fijos (umbral{' '}
              {Math.round(overspendThreshold * 100)}%).
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200/70 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Recurrencias fijas
            </h2>
            <p className="text-sm font-semibold text-zinc-900 mt-0.5">
              {recurring.length} {recurring.length === 1 ? 'recurrencia' : 'recurrencias'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 justify-start sm:justify-end">
            {showPermissionPrompt && (
              <button
                onClick={handleEnableNotifications}
                disabled={askingPermission}
                title="Activar notificaciones"
                aria-label="Activar notificaciones"
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 shrink-0"
              >
                <Bell size={16} />
              </button>
            )}
            <button
              onClick={() => setCompactView((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 text-[10px] font-semibold uppercase tracking-widest hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 shrink-0"
              aria-label={compactView ? 'Ver tarjetas' : 'Ver compacta'}
              title={compactView ? 'Cambiar a tarjetas' : 'Cambiar a compacta'}
            >
              {compactView ? <LayoutGrid size={14} /> : <List size={14} />}
              <span>{compactView ? 'Tarjetas' : 'Compacta'}</span>
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 shrink-0"
            >
              <Plus size={14} />
              Añadir
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-6">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Ingresos fijos
              </p>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                {incomeRecurring.length} {incomeRecurring.length === 1 ? 'recurrencia' : 'recurrencias'}
              </p>
            </div>
            {incomeRecurring.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/60 p-4 text-center">
                <h3 className="text-sm font-semibold text-zinc-900">Sin ingresos fijos</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-[320px] mx-auto leading-relaxed">
                  Agrega sueldos, rentas o ingresos recurrentes para tenerlos controlados.
                </p>
              </div>
            ) : (
              renderRecurringGroups(incomeRecurring, 'income')
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Gastos fijos
              </p>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                {expenseRecurring.length} {expenseRecurring.length === 1 ? 'recurrencia' : 'recurrencias'}
              </p>
            </div>
            {expenseRecurring.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/60 p-4 text-center">
                <h3 className="text-sm font-semibold text-zinc-900">Sin gastos fijos</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-[320px] mx-auto leading-relaxed">
                  Configura suscripciones, alquileres o pagos mensuales para recibir recordatorios.
                </p>
              </div>
            ) : (
              renderRecurringGroups(expenseRecurring, 'expense')
            )}
          </div>
        </div>

        {hasRecurring && (
          <div className="border-t border-zinc-100 px-5 pb-6 pt-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Calendario del mes
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 capitalize">
                    {calendar.monthLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200/60 rounded-xl p-0.5">
                  <button
                    onClick={() => {
                      setCurrentCalDate((prev) => {
                        const d = new Date(prev);
                        d.setMonth(d.getMonth() - 1);
                        return d;
                      });
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/50 text-zinc-600 transition-colors cursor-pointer"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentCalDate((prev) => {
                        const d = new Date(prev);
                        d.setMonth(d.getMonth() + 1);
                        return d;
                      });
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/50 text-zinc-600 transition-colors cursor-pointer"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-400 justify-end sm:justify-start w-full sm:w-auto">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ingresos
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Gastos
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-zinc-400 mb-1">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => (
                <div key={label} className="text-center font-semibold">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendar.firstWeekday }).map((_, idx) => (
                <div key={`empty-${idx}`} />
              ))}
              {calendar.days.map((day) => {
                const hasIncome = day.incomeCount > 0;
                const hasExpense = day.expenseCount > 0;
                const isToday = day.day === calendar.today;
                const isSelected = day.day === selectedCalDay;
                const total = day.incomeCount + day.expenseCount;
                return (
                  <button
                    key={day.day}
                    onClick={() => {
                      setSelectedCalDay((prev) => (prev === day.day ? null : day.day));
                    }}
                    type="button"
                    className={cn(
                      'rounded-lg border border-transparent p-2 sm:p-2.5 text-center text-[10px] sm:text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                      isToday && 'border-zinc-900/30 bg-zinc-50',
                      isSelected && 'bg-zinc-900 text-white hover:bg-zinc-800'
                    )}
                    title={
                      total > 0
                        ? `${day.incomeCount} ingresos · ${day.expenseCount} gastos`
                        : 'Sin movimientos'
                    }
                  >
                    <div className={cn('num', isSelected && 'text-white')}>{day.day}</div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {hasIncome && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-emerald-500')} />}
                      {hasExpense && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-rose-500')} />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedCalDay !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 border-t border-zinc-100 pt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 capitalize">
                    Vencimientos del {selectedCalDay} de {calendar.monthLabel}
                  </h4>
                  <button
                    onClick={() => setSelectedCalDay(null)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                  >
                    Cerrar detalle
                  </button>
                </div>
                {selectedDayOccurrences.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-2">
                    No hay ingresos ni gastos fijos programados para este día.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayOccurrences.map((r) => {
                      const isPaid = isRecurringPaidThisPeriod(r.id);
                      const paidLabel = r.type === 'income' ? 'Cobrado' : 'Pagado';
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white',
                                r.type === 'income' ? 'bg-emerald-500' : 'bg-zinc-900'
                              )}
                            >
                              {r.type === 'income' ? <Plus size={14} /> : <Minus size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 truncate">{r.name}</p>
                              <p className="text-[10px] text-zinc-400 capitalize">
                                {r.category} · {FREQ_LABEL[r.frequency]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'text-xs font-bold num',
                                r.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'
                              )}
                            >
                              {r.type === 'income' ? '+' : '−'}
                              {formatCurrency(r.amount, settings.currency)}
                            </span>
                            {!isPaid ? (
                              <button
                                onClick={async () => {
                                  await confirmRecurringPayment(r.id);
                                  success();
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <Check size={11} strokeWidth={3} />
                                {r.type === 'income' ? 'Recibir' : 'Pagar'}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <Check size={10} strokeWidth={3} />
                                {paidLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <RecurringSheet
            initial={editing}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface RecurringSheetProps {
  initial: RecurringExpense | null;
  onClose: () => void;
}

const RecurringSheet: React.FC<RecurringSheetProps> = ({ initial, onClose }) => {
  const { upsertRecurring, settings } = useFinance();
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  
  const incomeCats = settings.incomeCategories || settings.categories || [];
  const expenseCats = settings.expenseCategories || settings.categories || [];
  const activeCategories = type === 'income' ? incomeCats : expenseCats;

  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial?.category ?? activeCategories[0] ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.dayOfMonth ?? new Date().getDate());
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initial?.daysOfWeek && initial.daysOfWeek.length > 0 ? initial.daysOfWeek : [1]
  );
  const [notifyTime, setNotifyTime] = useState(initial?.notifyTime ?? '09:00');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const symbol = getCurrencySymbol(settings.currency);
  const sheetTitle = initial
    ? type === 'income'
      ? 'Editar ingreso fijo'
      : 'Editar gasto fijo'
    : type === 'income'
    ? 'Nuevo ingreso fijo'
    : 'Nuevo gasto fijo';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || isNaN(Number(amount))) return;
    if (frequency === 'weekly' && daysOfWeek.length === 0) return;
    setSaving(true);
    try {
      await upsertRecurring({
        id: initial?.id,
        name: name.trim(),
        amount: Number(amount),
        category,
        type,
        frequency,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        notifyTime,
        enabled,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleDayOfWeek = (d: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">{sheetTitle}</h3>
            <p className="text-[11px] text-zinc-500">Recordatorio automático.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div role="tablist" className="relative flex p-1 bg-zinc-100 rounded-xl">
            <button
              type="button"
              role="tab"
              aria-selected={type === 'expense'}
              onClick={() => { setType('expense'); setCategory(expenseCats[0] || ''); }}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                type === 'expense' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Minus size={15} />
              Gasto
              {type === 'expense' && (
                <motion.span
                  layoutId="rec-type-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={type === 'income'}
              onClick={() => { setType('income'); setCategory(incomeCats[0] || ''); }}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                type === 'income' ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Plus size={15} />
              Ingreso
              {type === 'income' && (
                <motion.span
                  layoutId="rec-type-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          </div>

          <div>
            <label htmlFor="rec-name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Nombre
            </label>
            <input
              id="rec-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Renta, Netflix, Salario…"
              maxLength={60}
              required
              className="mt-1 w-full px-3.5 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm"
            />
          </div>

          <div>
            <label htmlFor="rec-amount" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Monto
            </label>
            <div className="mt-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl focus-within:border-zinc-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all overflow-hidden">
              <span
                className={cn(
                  'pl-4 pr-2 text-2xl font-light select-none num transition-colors',
                  amount ? 'text-zinc-900' : 'text-zinc-300'
                )}
              >
                {symbol}
              </span>
              <input
                id="rec-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="flex-1 min-w-0 pr-4 py-3 bg-transparent focus:outline-none text-2xl font-light num tracking-tight"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
              Categoría
            </label>
            <div className="flex flex-wrap gap-1.5">
              {activeCategories.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
              Frecuencia
            </label>
            <div role="tablist" className="relative grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-xl">
              {(
                [
                  { id: 'daily', label: 'Diario', icon: Repeat },
                  { id: 'weekly', label: 'Semanal', icon: CalendarRange },
                  { id: 'monthly', label: 'Mensual', icon: CalendarDays },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = frequency === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFrequency(id)}
                    className={cn(
                      'relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                      active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    <Icon size={14} />
                    {label}
                    {active && (
                      <motion.span
                        layoutId="rec-freq-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {frequency === 'monthly' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
                Día del mes
              </label>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200">
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const active = dayOfMonth === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setDayOfMonth(day)}
                      className={cn(
                        'py-2 px-0.5 rounded-lg text-xs font-semibold num transition-colors cursor-pointer focus:outline-none flex items-center justify-center',
                        active
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/50'
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">
                Si el mes no llega a ese día se dispara el último día del mes.
              </p>
            </div>
          )}

          {frequency === 'weekly' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block">
                  Días de la semana
                </label>
                <span className="text-[10px] text-zinc-400 num">
                  {daysOfWeek.length}/7
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {WEEKDAY_PICKER_ORDER.map((d) => {
                  const active = daysOfWeek.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleDayOfWeek(d)}
                      className={cn(
                        'py-2.5 sm:py-2.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-semibold tracking-tight transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 truncate flex items-center justify-center',
                        active
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      )}
                    >
                      {WEEKDAY_SHORT[d]}
                    </button>
                  );
                })}
              </div>
              {daysOfWeek.length === 0 && (
                <p className="text-[11px] text-red-500 mt-1.5 ml-1">Selecciona al menos un día.</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="rec-time" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Hora de la notificación
            </label>
            <div className="mt-1 flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 focus-within:border-zinc-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all">
              <Clock size={16} className="text-zinc-400 shrink-0" />
              <input
                id="rec-time"
                type="time"
                value={notifyTime}
                onChange={(e) => setNotifyTime(e.target.value || '09:00')}
                required
                className="flex-1 min-w-0 bg-transparent focus:outline-none text-sm font-semibold num"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">
              Hora local de Santo Domingo. Llega al minuto exacto.
            </p>
          </div>

          <div className="space-y-2">
            <ToggleRow
              label="Activo"
              description="Recibir recordatorio para confirmar el pago."
              checked={enabled}
              onChange={setEnabled}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-semibold shadow-lg shadow-black/10 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} />
            {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear gasto fijo'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors text-left cursor-pointer"
  >
    <div className="min-w-0">
      <p className="text-sm font-semibold text-zinc-900">{label}</p>
      {description && <p className="text-[11px] text-zinc-500">{description}</p>}
    </div>
    <span
      className={cn(
        'relative w-10 h-6 rounded-full transition-colors shrink-0',
        checked ? 'bg-zinc-900' : 'bg-zinc-300'
      )}
    >
      <motion.span
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
      />
    </span>
  </button>
);
