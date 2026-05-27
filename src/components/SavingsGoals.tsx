import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, Plus, Trash2, ChevronDown, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../utils';
import { CADENCE_LABELS, computeGoalStreak, type GoalStreak } from '../utils/streaks';
import type { SavingsGoal, StreakCadence } from '../types';

const CURRENCIES = ['USD', 'EUR', 'DOP', 'MXN'] as const;
const CADENCE_OPTIONS: StreakCadence[] = ['weekly', 'biweekly', 'monthly'];

export const SavingsGoalsSection: React.FC = () => {
  const { savingsGoals, upsertSavingsGoal, deleteSavingsGoal, settings, transactions } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState(settings.currency || 'DOP');
  const [cadence, setCadence] = useState<StreakCadence>('monthly');

  // Mapa goalId → racha. Se recalcula cuando cambian transacciones o metas, no
  // en cada keystroke del formulario. Respeta la cadencia configurada por meta.
  const streaksByGoal = useMemo(() => {
    const map = new Map<string, GoalStreak>();
    for (const g of savingsGoals) {
      map.set(g.id, computeGoalStreak(transactions, g.id, g.streakCadence ?? 'monthly'));
    }
    return map;
  }, [transactions, savingsGoals]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    await upsertSavingsGoal({
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      currency,
      streakCadence: cadence,
    });

    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setCadence('monthly');
    setIsAdding(false);
  };

  const handleCadenceChange = (goal: SavingsGoal, next: StreakCadence) => {
    upsertSavingsGoal({ ...goal, streakCadence: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-900">Metas de Ahorro</h2>
          <p className="text-sm text-zinc-500 mt-1">Planifica tus próximos grandes objetivos.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 bg-[#2D5A27] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#244920] transition-colors"
        >
          {isAdding ? 'Cancelar' : <><Plus size={18} /> Nueva Meta</>}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden"
            onSubmit={handleAdd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Viaje a Japón"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2D5A27]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Monto Objetivo</label>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-[#2D5A27] focus-within:ring-2 focus-within:ring-[#2D5A27]/20 transition-all">
                  <div className="relative flex w-[5.5rem] shrink-0 items-center border-r border-zinc-200 bg-white/70">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-full w-full appearance-none bg-transparent pl-3 pr-6 py-2.5 text-sm font-medium uppercase tracking-tight text-zinc-900 focus:outline-none cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 text-zinc-400 pointer-events-none" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="5000"
                    className="flex-1 w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none num"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Monto Actual (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2D5A27]"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Ritmo de la Racha
              </label>
              <p className="text-[11px] text-zinc-500 mb-3">
                Elige según cómo cobras: si te pagan cada semana, quincena o mes, la racha se cuenta así.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CADENCE_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCadence(c)}
                    className={cn(
                      'px-2 sm:px-3 py-3 min-h-[44px] rounded-xl text-[11px] sm:text-[12px] font-semibold border transition-colors',
                      cadence === c
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-[#2D5A27]/40'
                    )}
                    aria-pressed={cadence === c}
                  >
                    {CADENCE_LABELS[c].selectorLabel}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-[#2D5A27] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#244920] transition-colors"
              >
                Guardar Meta
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savingsGoals.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            <Target size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-lg font-medium text-zinc-600">No tienes metas de ahorro aún.</p>
            <p className="text-sm">Tus objetivos aparecerán en el panel principal.</p>
          </div>
        )}
        
        {savingsGoals.map(goal => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const streak = streaksByGoal.get(goal.id);
          const goalCadence: StreakCadence = goal.streakCadence ?? 'monthly';
          return (
            <div key={goal.id} className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-zinc-900 tracking-tight pr-8">{goal.title}</h3>
                <button
                  onClick={() => deleteSavingsGoal(goal.id)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {streak && <StreakBadge streak={streak} />}

              <div className="mb-4 flex items-center gap-2">
                <label
                  htmlFor={`cadence-${goal.id}`}
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  Ritmo
                </label>
                <div className="relative">
                  <select
                    id={`cadence-${goal.id}`}
                    value={goalCadence}
                    onChange={(e) => handleCadenceChange(goal, e.target.value as StreakCadence)}
                    className="appearance-none bg-zinc-50 border border-zinc-200 rounded-lg pl-2.5 pr-7 py-1 text-[11px] font-semibold text-zinc-700 focus:outline-none focus:border-[#2D5A27] cursor-pointer"
                  >
                    {CADENCE_OPTIONS.map((c) => (
                      <option key={c} value={c}>{CADENCE_LABELS[c].selectorLabel}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-zinc-500">Progreso</span>
                  <span className="text-[#2D5A27]">{progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#2D5A27]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Acumulado</p>
                  <p className="font-semibold text-zinc-900 num">{formatCurrency(goal.currentAmount, goal.currency || settings.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Objetivo</p>
                  <p className="font-semibold text-zinc-500 num">{formatCurrency(goal.targetAmount, goal.currency || settings.currency)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StreakBadgeProps {
  streak: GoalStreak;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  const { current, best, aportedThisPeriod, cadence } = streak;
  const labels = CADENCE_LABELS[cadence];

  // Sin actividad nunca: ocultamos en lugar de mostrar un "0 seguidos" deprimente.
  if (current === 0 && best === 0) return null;

  // Racha activa: verde si ya aportó este periodo, ámbar si todavía no (queda el
  // periodo de gracia pero conviene avisar para no romperla).
  if (current > 0) {
    const tone = aportedThisPeriod
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';
    const unit = current === 1 ? labels.singular : labels.plural;
    return (
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border', tone)}>
          <Flame size={12} strokeWidth={2.5} />
          {current} {unit} {labels.consecutiveAdjective}
        </span>
        {best > current && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Mejor: {best}
          </span>
        )}
        {!aportedThisPeriod && (
          <span className="text-[10px] text-amber-700">{labels.pendingHint}</span>
        )}
      </div>
    );
  }

  // Racha rota pero hay historia: mostrar el récord como referencia.
  const recordUnit = best === 1 ? labels.singular : labels.plural;
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-zinc-50 text-zinc-500 border border-zinc-200">
        <Flame size={12} strokeWidth={2.5} className="text-zinc-400" />
        Mejor racha: {best} {recordUnit}
      </span>
    </div>
  );
};
