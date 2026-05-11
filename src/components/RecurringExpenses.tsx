import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringExpense, RecurringFrequency, TransactionType } from '../types';
import { formatCurrency, cn, getCurrencySymbol } from '../utils';
import {
  Bell,
  BellOff,
  CalendarDays,
  CalendarRange,
  Clock,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
  Check,
  Minus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { success } from '../utils/haptics';
import { currentMonthCommitment } from '../utils/projection';

const ordinalDay = (day: number) => {
  const safe = Math.max(1, Math.min(31, Math.round(day)));
  return `${safe}`;
};

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

  const showPermissionPrompt =
    notificationStatus !== 'granted' && notificationStatus !== 'unsupported';

  const commitment = currentMonthCommitment(recurring);
  const hasActive = recurring.some((r) => r.enabled);

  const handleEnableNotifications = async () => {
    setAskingPermission(true);
    try {
      await enableNotifications();
    } finally {
      setAskingPermission(false);
    }
  };

  return (
    <div className="space-y-4">
      {showPermissionPrompt && (
        <div className="bg-zinc-900 text-white p-5 rounded-3xl shadow-xl shadow-black/20 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Activa los recordatorios</h3>
            <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
              Te avisaremos el día de cada gasto fijo, incluso con la app cerrada.
            </p>
            <button
              onClick={handleEnableNotifications}
              disabled={askingPermission}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Bell size={13} />
              {askingPermission ? 'Solicitando…' : 'Activar notificaciones'}
            </button>
          </div>
        </div>
      )}

      {hasActive && commitment && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/20 overflow-hidden relative"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Compromiso este mes
              </p>
              <p className="text-3xl sm:text-4xl font-light tracking-tight num leading-tight mt-1 break-words">
                {formatCurrency(commitment.expense, settings.currency)}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/30 mt-1">
                Ingresos fijos:{' '}
                <span className="text-emerald-300 num">
                  +{formatCurrency(commitment.income, settings.currency)}
                </span>
              </p>
            </div>
            <div
              className={cn(
                'shrink-0 text-right rounded-2xl px-3 py-2 border',
                commitment.net >= 0
                  ? 'bg-emerald-500/15 border-emerald-400/20 text-emerald-300'
                  : 'bg-red-500/15 border-red-400/20 text-red-300'
              )}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Neto</p>
              <p className="text-sm font-semibold num">
                {commitment.net >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(commitment.net), settings.currency)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200/70 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Gastos fijos
            </h2>
            <p className="text-sm font-semibold text-zinc-900 mt-0.5">
              {recurring.length} {recurring.length === 1 ? 'recurrencia' : 'recurrencias'}
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            <Plus size={14} />
            Añadir
          </button>
        </div>

        {recurring.length === 0 ? (
          <div className="px-5 pb-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-50 mb-3">
              <Repeat className="text-zinc-300" size={26} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Sin gastos fijos</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
              Configura suscripciones, alquileres o pagos mensuales para recibir recordatorios.
            </p>
          </div>
        ) : (
          <ul className="border-t border-zinc-100">
            <AnimatePresence initial={false}>
              {recurring
                .slice()
                .sort((a, b) => {
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
                })
                .map((r) => (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-4 sm:p-5 border-b border-zinc-100 last:border-b-0 group"
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-colors',
                        r.enabled ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                      )}
                    >
                      {r.frequency === 'daily' && <Repeat size={18} strokeWidth={2.4} />}
                      {r.frequency === 'weekly' && (
                        <>
                          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60 leading-none">
                            Sem
                          </span>
                          <span className="text-[10px] font-bold leading-none mt-0.5 num">
                            {(r.daysOfWeek ?? []).length > 3
                              ? `${(r.daysOfWeek ?? []).length}d`
                              : (r.daysOfWeek ?? [])
                                  .map((d) => WEEKDAY_SHORT[d][0])
                                  .join('')}
                          </span>
                        </>
                      )}
                      {r.frequency === 'monthly' && (
                        <>
                          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60 leading-none">
                            Día
                          </span>
                          <span className="text-base font-bold num leading-none mt-0.5">
                            {ordinalDay(r.dayOfMonth ?? 1)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
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
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                          {r.category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-900 text-white font-medium">
                          {FREQ_LABEL[r.frequency]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium num">
                          <Clock size={10} />
                          {r.notifyTime ?? '09:00'}
                        </span>
                        {isRecurringPaidThisPeriod(r.id) && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                            <Check size={10} strokeWidth={3} />
                            {r.frequency === 'monthly' ? 'Pagado este mes' : 'Pagado hoy'}
                          </span>
                        )}
                        {!r.enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                            Pausado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isRecurringPaidThisPeriod(r.id) && (
                        <button
                          onClick={async () => {
                            await confirmRecurringPayment(r.id);
                            success();
                          }}
                          aria-label="Marcar pagado"
                          title="Marcar como pagado este periodo"
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
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
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
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial?.category ?? settings.categories[0]);
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.dayOfMonth ?? new Date().getDate());
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initial?.daysOfWeek && initial.daysOfWeek.length > 0 ? initial.daysOfWeek : [1]
  );
  const [notifyTime, setNotifyTime] = useState(initial?.notifyTime ?? '09:00');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const symbol = getCurrencySymbol(settings.currency);

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
            <h3 className="text-base font-bold text-zinc-900">
              {initial ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
            </h3>
            <p className="text-[11px] text-zinc-500">Recordatorio mensual automático.</p>
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
              onClick={() => setType('expense')}
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
              onClick={() => setType('income')}
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
              {settings.categories.map((cat) => {
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
              <label htmlFor="rec-day" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
                Día del mes
              </label>
              <div className="mt-1 flex items-center gap-3">
                <CalendarDays size={18} className="text-zinc-400 shrink-0" />
                <input
                  id="rec-day"
                  type="range"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="flex-1 accent-zinc-900"
                />
                <span className="w-12 text-center text-sm font-bold num bg-zinc-100 rounded-lg py-1.5">
                  {dayOfMonth}
                </span>
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
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_PICKER_ORDER.map((d) => {
                  const active = daysOfWeek.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleDayOfWeek(d)}
                      className={cn(
                        'py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
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
