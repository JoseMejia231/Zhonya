import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Target,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Flame,
  Check,
  X,
  Sparkles,
  Pencil,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../utils';
import { CADENCE_LABELS, computeGoalStreak, type GoalStreak } from '../utils/streaks';
import type { SavingsGoal, SavingsGoalKind, StreakCadence } from '../types';

const CURRENCIES = ['USD', 'EUR', 'DOP', 'MXN'] as const;
const CADENCE_OPTIONS: StreakCadence[] = ['weekly', 'biweekly', 'monthly'];

/**
 * Factores para llevar el compromiso a "por mes" en el resumen del header.
 * Aproximación razonable: 4.33 semanas/mes (52/12), 2 quincenas/mes.
 */
const COMMITMENT_TO_MONTHLY: Record<StreakCadence, number> = {
  weekly: 52 / 12,
  biweekly: 2,
  monthly: 1,
};

export const SavingsGoalsSection: React.FC = () => {
  const {
    savingsGoals,
    upsertSavingsGoal,
    deleteSavingsGoal,
    settings,
    transactions,
    addTransaction,
  } = useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<SavingsGoalKind>('goal');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState(settings.currency || 'DOP');
  const [cadence, setCadence] = useState<StreakCadence>('monthly');
  const [commitmentAmount, setCommitmentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estado por-card para inline UIs (Aportar / Confirmar borrado / Confirmar cadencia).
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [contributionMode, setContributionMode] = useState<'add' | 'withdraw'>('add');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionError, setContributionError] = useState<string | null>(null);
  const [contributing, setContributing] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [pendingCadence, setPendingCadence] = useState<{
    goalId: string;
    next: StreakCadence;
  } | null>(null);

  // Mapa goalId → racha. Se recalcula cuando cambian transacciones o metas,
  // no en cada keystroke del formulario. Respeta cadencia y compromiso.
  const streaksByGoal = useMemo(() => {
    const map = new Map<string, GoalStreak>();
    for (const g of savingsGoals) {
      map.set(
        g.id,
        computeGoalStreak(transactions, g.id, g.streakCadence ?? 'monthly', {
          commitmentAmount: g.commitmentAmount,
        })
      );
    }
    return map;
  }, [transactions, savingsGoals]);

  // Resumen agregado del header: # metas activas, total acumulado por moneda,
  // compromiso mensual total normalizado. Las metas libres no se "completan",
  // así que siempre cuentan como activas.
  const aggregates = useMemo(() => {
    const activeGoals = savingsGoals.filter((g) => {
      if ((g.kind ?? 'goal') === 'free') return true;
      const target = g.targetAmount ?? 0;
      return target > 0 && g.currentAmount < target;
    });
    const accumulatedByCurrency = new Map<string, number>();
    for (const g of savingsGoals) {
      const cur = g.currency || settings.currency || 'DOP';
      accumulatedByCurrency.set(cur, (accumulatedByCurrency.get(cur) ?? 0) + g.currentAmount);
    }
    // El compromiso mensual normalizado solo tiene sentido cuando todas las metas
    // activas con compromiso comparten moneda. Si hay mezcla, lo agrupamos por
    // moneda para no sumar peras con manzanas.
    const monthlyCommitmentByCurrency = new Map<string, number>();
    for (const g of activeGoals) {
      if (!g.commitmentAmount || g.commitmentAmount <= 0) continue;
      const cur = g.currency || settings.currency || 'DOP';
      const factor = COMMITMENT_TO_MONTHLY[g.streakCadence ?? 'monthly'];
      monthlyCommitmentByCurrency.set(
        cur,
        (monthlyCommitmentByCurrency.get(cur) ?? 0) + g.commitmentAmount * factor
      );
    }
    return {
      activeCount: activeGoals.length,
      totalCount: savingsGoals.length,
      accumulatedByCurrency: [...accumulatedByCurrency.entries()],
      monthlyCommitmentByCurrency: [...monthlyCommitmentByCurrency.entries()],
    };
  }, [savingsGoals, settings.currency]);

  // Cuando arranca un edit, hidratamos el form con los valores existentes.
  useEffect(() => {
    if (!editingGoal) return;
    setTitle(editingGoal.title);
    setKind(editingGoal.kind ?? 'goal');
    setTargetAmount(
      editingGoal.targetAmount ? String(editingGoal.targetAmount) : ''
    );
    setCurrentAmount(String(editingGoal.currentAmount));
    setCurrency(editingGoal.currency || settings.currency || 'DOP');
    setCadence(editingGoal.streakCadence ?? 'monthly');
    setCommitmentAmount(
      editingGoal.commitmentAmount ? String(editingGoal.commitmentAmount) : ''
    );
    setFormError(null);
  }, [editingGoal, settings.currency]);

  const resetForm = () => {
    setTitle('');
    setKind('goal');
    setTargetAmount('');
    setCurrentAmount('');
    setCadence('monthly');
    setCommitmentAmount('');
    setCurrency(settings.currency || 'DOP');
    setFormError(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
    resetForm();
  };

  const openCreate = () => {
    setEditingGoal(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
    // Cerramos otros estados expandidos para no confundir.
    setContributingGoalId(null);
    setDeletingGoalId(null);
    setPendingCadence(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const trimmedTitle = title.trim();
    const targetNum = Number(targetAmount);
    const currentNum = Number(currentAmount || '0');
    const commitmentNum = Number(commitmentAmount || '0');
    const isFree = kind === 'free';

    if (!trimmedTitle) {
      setFormError('El nombre de la meta es obligatorio.');
      return;
    }
    if (!isFree && (!Number.isFinite(targetNum) || targetNum <= 0)) {
      setFormError('El monto objetivo debe ser mayor que 0.');
      return;
    }
    if (!Number.isFinite(currentNum) || currentNum < 0) {
      setFormError('El monto actual no puede ser negativo.');
      return;
    }
    if (!isFree && currentNum > targetNum) {
      setFormError('El monto actual no puede superar el objetivo.');
      return;
    }
    if (!Number.isFinite(commitmentNum) || commitmentNum < 0) {
      setFormError('El compromiso no puede ser negativo.');
      return;
    }

    setSubmitting(true);
    const resultId = await upsertSavingsGoal({
      ...(editingGoal ? { id: editingGoal.id } : {}),
      title: trimmedTitle,
      kind,
      ...(isFree ? {} : { targetAmount: targetNum }),
      currentAmount: currentNum,
      currency,
      streakCadence: cadence,
      ...(commitmentNum > 0 ? { commitmentAmount: commitmentNum } : {}),
    });
    setSubmitting(false);

    if (!resultId) return;
    closeForm();
  };

  const requestCadenceChange = (goal: SavingsGoal, next: StreakCadence) => {
    if (next === (goal.streakCadence ?? 'monthly')) return;
    // Cualquier cambio de cadencia reagrupa los aportes en ventanas distintas y
    // puede recalcular `current` y `best`. Si además hay compromiso, el monto
    // pasa a aplicar a la nueva ventana (p. ej. $500/mes → $500/semana, mucho
    // más exigente). Confirmamos siempre para que no haya cambios silenciosos.
    setPendingCadence({ goalId: goal.id, next });
  };

  const confirmCadenceChange = async () => {
    if (!pendingCadence) return;
    const goal = savingsGoals.find((g) => g.id === pendingCadence.goalId);
    if (!goal) {
      setPendingCadence(null);
      return;
    }
    await upsertSavingsGoal({ ...goal, streakCadence: pendingCadence.next });
    setPendingCadence(null);
  };

  const openContribute = (goalId: string, mode: 'add' | 'withdraw' = 'add') => {
    setContributingGoalId(goalId);
    setContributionMode(mode);
    setContributionAmount('');
    setContributionError(null);
    setDeletingGoalId(null);
  };

  const closeContribute = () => {
    setContributingGoalId(null);
    setContributionAmount('');
    setContributionError(null);
  };

  const handleContribute = async (goal: SavingsGoal) => {
    if (contributing) return;
    setContributionError(null);
    const amt = Number(contributionAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setContributionError('Indica un monto mayor que 0.');
      return;
    }
    const isWithdraw = contributionMode === 'withdraw';
    if (isWithdraw && amt > goal.currentAmount) {
      setContributionError('No puedes retirar más de lo acumulado.');
      return;
    }
    setContributing(true);
    // Aporte = expense (sale de tu cuenta al sobre). Retiro = income (vuelve a
    // tu cuenta). El context resta del acumulado según el tipo (ver goalDelta).
    await addTransaction(
      {
        amount: amt,
        type: isWithdraw ? 'income' : 'expense',
        category: 'Metas',
        description: `${isWithdraw ? 'Retiro' : 'Aporte'}: ${goal.title}`,
        date: new Date().toISOString(),
        currency: goal.currency || settings.currency,
        goalId: goal.id,
      },
      { syncGoalBalance: true }
    );
    setContributing(false);
    closeContribute();
  };

  const openDeleteConfirm = (goalId: string) => {
    setDeletingGoalId(goalId);
    setContributingGoalId(null);
  };

  const cancelDelete = () => setDeletingGoalId(null);

  const confirmDelete = async (goalId: string) => {
    await deleteSavingsGoal(goalId);
    setDeletingGoalId(null);
  };

  const isEditing = editingGoal !== null;
  const pendingCadenceMeta = pendingCadence
    ? {
        goal: savingsGoals.find((g) => g.id === pendingCadence.goalId),
        next: pendingCadence.next,
      }
    : null;

  return (
    <div className="space-y-7">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7c7361]/80 mb-2">
            Objetivos de Ahorro
          </p>
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--color-action)]">
            Tus metas activas
          </h2>
          <p className="text-sm text-zinc-500 mt-1.5">
            Define a dónde va tu dinero y mantén la racha de aportes.
          </p>
        </div>
        <button
          onClick={() => (isFormOpen ? closeForm() : openCreate())}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95',
            isFormOpen
              ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              : 'bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] shadow-[0_12px_24px_rgba(45,90,39,0.18)]'
          )}
        >
          {isFormOpen ? (
            <>
              <X size={14} strokeWidth={2.5} />
              Cancelar
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={2.5} />
              Nueva Meta
            </>
          )}
        </button>
      </header>

      {savingsGoals.length > 0 && <AggregatesStrip aggregates={aggregates} />}

      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            key={isEditing ? `edit-${editingGoal!.id}` : 'create'}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[28px] border border-zinc-200/70 bg-white/70 glass-surface premium-shadow p-6 sm:p-7 overflow-hidden"
            onSubmit={handleSave}
          >
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9d9687] mb-1">
                {isEditing ? 'Editar meta' : 'Nueva meta'}
              </p>
              <h3 className="text-lg font-bold tracking-tight text-[var(--color-action)]">
                {isEditing ? editingGoal!.title : 'Define tu próximo objetivo'}
              </h3>
            </div>

            {/* Toggle de tipo de meta: con objetivo vs libre. */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                Tipo de meta
              </label>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                <button
                  type="button"
                  onClick={() => setKind('goal')}
                  className={cn(
                    'px-3 py-3 min-h-[44px] rounded-xl text-[12px] font-semibold border transition-colors active:scale-95 text-left',
                    kind === 'goal'
                      ? 'bg-[var(--color-action)] text-white border-[var(--color-action)]'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-[var(--color-action)]/40'
                  )}
                  aria-pressed={kind === 'goal'}
                >
                  Con objetivo
                  <span
                    className={cn(
                      'block text-[10px] font-medium mt-0.5',
                      kind === 'goal' ? 'text-white/80' : 'text-zinc-500'
                    )}
                  >
                    Hacia un monto concreto
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setKind('free')}
                  className={cn(
                    'px-3 py-3 min-h-[44px] rounded-xl text-[12px] font-semibold border transition-colors active:scale-95 text-left',
                    kind === 'free'
                      ? 'bg-[var(--color-action)] text-white border-[var(--color-action)]'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-[var(--color-action)]/40'
                  )}
                  aria-pressed={kind === 'free'}
                >
                  Libre
                  <span
                    className={cn(
                      'block text-[10px] font-medium mt-0.5',
                      kind === 'free' ? 'text-white/80' : 'text-zinc-500'
                    )}
                  >
                    Solo acumular y mantener racha
                  </span>
                </button>
              </div>
            </div>

            <div
              className={cn(
                'grid grid-cols-1 gap-4',
                kind === 'free' ? 'md:grid-cols-2' : 'md:grid-cols-3'
              )}
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={kind === 'free' ? 'Ej. Mi ahorro general' : 'Ej. Viaje a Japón'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-action)]"
                />
              </div>
              {kind === 'goal' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                    Monto objetivo
                  </label>
                  <div className="flex items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-[var(--color-action)] focus-within:ring-2 focus-within:ring-[var(--color-action)]/20 transition-all">
                    <div className="relative flex w-[5.5rem] shrink-0 items-center border-r border-zinc-200 bg-white/70">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-full w-full appearance-none bg-transparent pl-3 pr-6 py-2.5 text-sm font-medium uppercase tracking-tight text-zinc-900 focus:outline-none cursor-pointer"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                      />
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="5000"
                      className="flex-1 w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none num"
                    />
                  </div>
                </div>
              )}
              {kind === 'free' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                    Moneda
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-9 py-2.5 text-sm font-medium uppercase tracking-tight text-zinc-900 focus:outline-none focus:border-[var(--color-action)] cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                  {isEditing ? 'Acumulado actual' : 'Ya tienes (opcional)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-action)]"
                />
                {isEditing && (
                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                    Cambiar este valor lo sobreescribe directamente sin crear un movimiento.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                  Ritmo de la racha
                </label>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Periodicidad en la que se cuenta cada aporte.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CADENCE_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCadence(c)}
                      className={cn(
                        'px-2 sm:px-3 py-3 min-h-[44px] rounded-xl text-[11px] sm:text-[12px] font-semibold border transition-colors active:scale-95',
                        cadence === c
                          ? 'bg-[var(--color-action)] text-white border-[var(--color-action)]'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-[var(--color-action)]/40'
                      )}
                      aria-pressed={cadence === c}
                    >
                      {CADENCE_LABELS[c].selectorLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2">
                  Compromiso por periodo (opcional)
                </label>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Si lo defines, la racha solo cuenta cuando aportas al menos
                  este monto {CADENCE_LABELS[cadence].perPeriod}.
                </p>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={commitmentAmount}
                  onChange={(e) => setCommitmentAmount(e.target.value)}
                  placeholder={`Ej. 500 ${CADENCE_LABELS[cadence].perPeriod}`}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-action)] num"
                />
              </div>
            </div>

            {formError && (
              <p className="mt-4 text-xs font-semibold text-red-600" role="alert">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[var(--color-action)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              >
                {submitting
                  ? 'Guardando…'
                  : isEditing
                  ? 'Guardar cambios'
                  : 'Crear meta'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {savingsGoals.length === 0 && !isFormOpen ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {savingsGoals.map((goal) => {
            const streak = streaksByGoal.get(goal.id);
            const isContributing = contributingGoalId === goal.id;
            const isDeleting = deletingGoalId === goal.id;
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                streak={streak}
                fallbackCurrency={settings.currency}
                isContributing={isContributing}
                contributionMode={contributionMode}
                contributionAmount={contributionAmount}
                contributionError={contributionError}
                contributing={contributing}
                isDeleting={isDeleting}
                onContributeOpen={() => openContribute(goal.id, 'add')}
                onWithdrawOpen={() => openContribute(goal.id, 'withdraw')}
                onContributeClose={closeContribute}
                onContributionAmountChange={setContributionAmount}
                onContributeSubmit={() => handleContribute(goal)}
                onDeleteOpen={() => openDeleteConfirm(goal.id)}
                onDeleteCancel={cancelDelete}
                onDeleteConfirm={() => confirmDelete(goal.id)}
                onCadenceChange={(next) => requestCadenceChange(goal, next)}
                onEdit={() => openEdit(goal)}
              />
            );
          })}
        </div>
      )}

      <CadenceChangeModal
        meta={pendingCadenceMeta}
        onCancel={() => setPendingCadence(null)}
        onConfirm={confirmCadenceChange}
      />
    </div>
  );
};

interface AggregatesStripProps {
  aggregates: {
    activeCount: number;
    totalCount: number;
    accumulatedByCurrency: Array<[string, number]>;
    monthlyCommitmentByCurrency: Array<[string, number]>;
  };
}

const AggregatesStrip: React.FC<AggregatesStripProps> = ({ aggregates }) => {
  const { activeCount, totalCount, accumulatedByCurrency, monthlyCommitmentByCurrency } =
    aggregates;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AggregateTile
        label="Metas activas"
        primary={`${activeCount}`}
        secondary={
          totalCount > activeCount
            ? `${totalCount - activeCount} ya logradas`
            : totalCount === 0
            ? 'Aún ninguna'
            : 'Todas en progreso'
        }
        icon={<Target size={16} strokeWidth={2} />}
      />
      <AggregateTile
        label="Acumulado"
        primary={
          accumulatedByCurrency.length === 0
            ? '—'
            : formatCurrency(accumulatedByCurrency[0][1], accumulatedByCurrency[0][0])
        }
        secondary={
          accumulatedByCurrency.length > 1
            ? accumulatedByCurrency
                .slice(1)
                .map(([cur, amt]) => formatCurrency(amt, cur))
                .join(' · ')
            : 'Suma de todas las metas'
        }
        icon={<TrendingUp size={16} strokeWidth={2} />}
      />
      <AggregateTile
        label="Compromiso mensual"
        primary={
          monthlyCommitmentByCurrency.length === 0
            ? 'Sin compromiso'
            : formatCurrency(
                monthlyCommitmentByCurrency[0][1],
                monthlyCommitmentByCurrency[0][0]
              )
        }
        secondary={
          monthlyCommitmentByCurrency.length > 1
            ? monthlyCommitmentByCurrency
                .slice(1)
                .map(([cur, amt]) => formatCurrency(amt, cur))
                .join(' · ')
            : monthlyCommitmentByCurrency.length === 0
            ? 'Define un compromiso por meta'
            : 'Normalizado al mes'
        }
        icon={<Flame size={16} strokeWidth={2} />}
      />
    </div>
  );
};

interface AggregateTileProps {
  label: string;
  primary: string;
  secondary: string;
  icon: React.ReactNode;
}

const AggregateTile: React.FC<AggregateTileProps> = ({ label, primary, secondary, icon }) => (
  <div className="rounded-2xl border border-zinc-200/70 bg-white/60 glass-surface premium-shadow px-5 py-4 flex flex-col gap-2 min-h-[100px]">
    <div className="flex items-center gap-2 text-[#7c7361]/70">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#f6f1e8] text-[#9d9687]">
        {icon}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.24em]">{label}</span>
    </div>
    <div className="mt-auto">
      <p className="text-xl font-bold tracking-tight text-[var(--color-action)] num tabular-nums leading-none">
        {primary}
      </p>
      <p className="text-[11px] text-zinc-500 mt-1.5">{secondary}</p>
    </div>
  </div>
);

interface GoalCardProps {
  goal: SavingsGoal;
  streak?: GoalStreak;
  fallbackCurrency: string;
  isContributing: boolean;
  contributionMode: 'add' | 'withdraw';
  contributionAmount: string;
  contributionError: string | null;
  contributing: boolean;
  isDeleting: boolean;
  onContributeOpen: () => void;
  onWithdrawOpen: () => void;
  onContributeClose: () => void;
  onContributionAmountChange: (value: string) => void;
  onContributeSubmit: () => void;
  onDeleteOpen: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onCadenceChange: (next: StreakCadence) => void;
  onEdit: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  streak,
  fallbackCurrency,
  isContributing,
  contributionMode,
  contributionAmount,
  contributionError,
  contributing,
  isDeleting,
  onContributeOpen,
  onWithdrawOpen,
  onContributeClose,
  onContributionAmountChange,
  onContributeSubmit,
  onDeleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
  onCadenceChange,
  onEdit,
}) => {
  const isFree = (goal.kind ?? 'goal') === 'free';
  // En metas libres no hay objetivo, así que no calculamos progreso ni
  // remaining ni el estado "COMPLETA". El acumulado es el único hard data.
  const target = !isFree ? goal.targetAmount ?? 0 : 0;
  const progress = !isFree && target > 0
    ? Math.min(100, Math.round((goal.currentAmount / target) * 100))
    : 0;
  const isComplete = !isFree && progress >= 100;
  const goalCurrency = goal.currency || fallbackCurrency;
  const cadence: StreakCadence = goal.streakCadence ?? 'monthly';
  const remaining = !isFree ? Math.max(0, target - goal.currentAmount) : 0;

  // Estado mostrado en el eyebrow. Separamos "ACTIVA" (cumplió este periodo)
  // de "EN RIESGO" (racha viva pero periodo en curso pendiente) para que el
  // color no contradiga al texto. Las metas libres nunca son COMPLETA.
  const statusLabel = isComplete
    ? 'COMPLETA'
    : streak && streak.inGrace
    ? 'EN RIESGO'
    : streak && streak.aportedThisPeriod
    ? 'ACTIVA'
    : streak && streak.best > 0
    ? 'PAUSADA'
    : 'EN PROGRESO';

  const statusTone = isComplete
    ? 'text-[var(--color-action)]'
    : streak && streak.inGrace
    ? 'text-amber-700'
    : streak && streak.aportedThisPeriod
    ? 'text-[var(--color-action)]'
    : 'text-[#9d9687]';

  const kindLabel = isFree ? 'Meta libre' : 'Meta';
  const isWithdraw = contributionMode === 'withdraw';

  const cadenceLabels = CADENCE_LABELS[cadence];

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[28px] border bg-white/70 glass-surface premium-shadow p-6 sm:p-7 transition-all duration-300',
        isComplete
          ? 'border-[var(--color-action)]/40 hover:shadow-[0_24px_50px_rgba(45,90,39,0.12)]'
          : 'border-zinc-200/70 hover:shadow-lg hover:-translate-y-0.5'
      )}
    >
      {/* Header: eyebrow + actions */}
      <div className="flex items-center justify-between mb-4">
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.3em]',
            statusTone
          )}
        >
          {kindLabel} · {statusLabel}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            aria-label="Editar meta"
            className="p-2 rounded-xl text-zinc-400 hover:text-[var(--color-action)] hover:bg-[var(--color-action)]/10 transition-colors active:scale-95"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button
            onClick={onDeleteOpen}
            aria-label="Eliminar meta"
            className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors active:scale-95"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Title + (percentage en metas con objetivo) */}
      <div className="flex items-end justify-between gap-3 mb-3">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-action)] truncate min-w-0">
          {goal.title}
        </h3>
        {!isFree && (
          <span
            className={cn(
              'text-3xl font-bold num leading-none tabular-nums shrink-0',
              isComplete ? 'text-[var(--color-action)]' : 'text-[#4b5741]'
            )}
          >
            {progress}%
          </span>
        )}
      </div>

      {/* Commitment chip OR free-aporte hint */}
      <div className="mb-5">
        {goal.commitmentAmount && goal.commitmentAmount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f1e8] border border-[#efe8da] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">
            <Flame size={11} strokeWidth={2.5} />
            {formatCurrency(goal.commitmentAmount, goalCurrency)}{' '}
            {cadenceLabels.perPeriod}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 border border-zinc-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Aporte libre · {cadenceLabels.selectorLabel.toLowerCase()}
          </span>
        )}
      </div>

      {/* Progress bar — solo metas con objetivo */}
      {!isFree && (
        <div className="h-2 rounded-full bg-[#f3f1ea] overflow-hidden mb-5 border border-[#efeadd]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'h-full rounded-full',
              isComplete
                ? 'bg-gradient-to-r from-[#2d5a27] to-[#75b156]'
                : 'bg-gradient-to-r from-[#2d5a27] to-[#75b156]'
            )}
          />
        </div>
      )}

      {/* Amounts — en libres mostramos solo Acumulado a full ancho */}
      <div className={cn('mb-5', isFree ? '' : 'grid grid-cols-2 gap-4')}>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#9d9687]/70 mb-1">
            Acumulado
          </p>
          <p className="text-[15px] font-bold text-[#4b5741] num tabular-nums leading-tight">
            {formatCurrency(goal.currentAmount, goalCurrency)}
          </p>
        </div>
        {!isFree && (
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#9d9687]/70 mb-1">
              {isComplete ? 'Lograste' : 'Faltan'}
            </p>
            <p className="text-[15px] font-semibold text-[#7c7361] num tabular-nums leading-tight">
              {isComplete
                ? formatCurrency(target, goalCurrency)
                : formatCurrency(remaining, goalCurrency)}
            </p>
          </div>
        )}
      </div>

      {/* Streak / period progress */}
      {streak && (
        <StreakBadge
          streak={streak}
          goalCurrency={goalCurrency}
          isComplete={isComplete}
        />
      )}

      {/* Cadence selector — simplified, commitment summary already in chip above */}
      <div className="mt-5 pt-4 border-t border-[#f0ede4] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d9687]/80">
          Ritmo
        </span>
        <div className="relative">
          <select
            value={cadence}
            onChange={(e) => onCadenceChange(e.target.value as StreakCadence)}
            className="appearance-none bg-zinc-50 border border-zinc-200 rounded-lg pl-2.5 pr-7 py-1 text-[11px] font-semibold text-zinc-700 focus:outline-none focus:border-[var(--color-action)] cursor-pointer"
            aria-label="Cambiar ritmo"
          >
            {CADENCE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CADENCE_LABELS[c].selectorLabel}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Acciones: aportar / retirar */}
      {!isContributing && !isDeleting && (
        <div className="mt-5 space-y-3">
          {isComplete && (
            <div className="inline-flex items-center justify-center gap-2 w-full bg-[var(--color-action)]/10 text-[var(--color-action)] py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.22em] border border-[var(--color-action)]/20">
              <Sparkles size={14} strokeWidth={2.5} />
              Meta lograda
            </div>
          )}
          {(!isComplete || goal.currentAmount > 0) && (
            <div className="flex gap-2">
              {!isComplete && (
                <button
                  onClick={onContributeOpen}
                  className="flex-[2] inline-flex items-center justify-center gap-2 bg-[var(--color-action)] text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.22em] hover:bg-[var(--color-action-hover)] transition-all shadow-[0_8px_20px_rgba(45,90,39,0.18)] active:scale-[0.98]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Aportar
                </button>
              )}
              {goal.currentAmount > 0 && (
                <button
                  onClick={onWithdrawOpen}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-600 py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.22em] hover:bg-zinc-50 transition-all active:scale-[0.98]"
                >
                  <Minus size={14} strokeWidth={2.5} />
                  Retirar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline Aportar form */}
      <AnimatePresence>
        {isContributing && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'rounded-2xl border p-4',
                isWithdraw
                  ? 'border-zinc-300 bg-zinc-50'
                  : 'border-[var(--color-action)]/30 bg-[#f6f9f4]'
              )}
            >
              <label
                htmlFor={`contribute-${goal.id}`}
                className={cn(
                  'block text-[9px] font-bold uppercase tracking-[0.24em] mb-2',
                  isWithdraw ? 'text-zinc-600' : 'text-[var(--color-action)]'
                )}
              >
                {isWithdraw ? '¿Cuánto retiras?' : '¿Cuánto aportas hoy?'}
              </label>
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-[#9d9687] pointer-events-none"
                >
                  {goalCurrency}
                </span>
                <input
                  id={`contribute-${goal.id}`}
                  type="number"
                  min="0"
                  step="any"
                  autoFocus
                  inputMode="decimal"
                  value={contributionAmount}
                  onChange={(e) => onContributionAmountChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onContributeSubmit();
                    } else if (e.key === 'Escape') {
                      onContributeClose();
                    }
                  }}
                  placeholder="0.00"
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-14 pr-3 py-3 text-lg font-bold num text-zinc-900 placeholder:text-zinc-300 placeholder:font-medium focus:outline-none focus:border-[var(--color-action)] focus:ring-2 focus:ring-[var(--color-action)]/15 transition-all"
                />
              </div>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={onContributeClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={onContributeSubmit}
                  disabled={contributing}
                  className={cn(
                    'flex-[1.6] inline-flex items-center justify-center gap-1.5 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-95',
                    isWithdraw
                      ? 'bg-zinc-800 hover:bg-zinc-900'
                      : 'bg-[var(--color-action)] hover:bg-[var(--color-action-hover)]'
                  )}
                >
                  {isWithdraw ? <Minus size={13} strokeWidth={2.5} /> : <Check size={13} strokeWidth={2.5} />}
                  {contributing
                    ? 'Guardando…'
                    : isWithdraw
                    ? 'Confirmar retiro'
                    : 'Confirmar aporte'}
                </button>
              </div>
              {contributionError && (
                <p className="mt-2 text-[11px] font-semibold text-red-600" role="alert">
                  {contributionError}
                </p>
              )}
              <p className="mt-2 text-[10px] text-[#7c7361]/80 leading-relaxed">
                {isWithdraw
                  ? 'Se registrará como un ingreso categoría "Metas". Bajará el acumulado de la meta.'
                  : 'Se registrará como un gasto categoría "Metas" ligado a esta meta. Sumará al acumulado y a la racha.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-[28px] p-6 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Trash2 size={20} strokeWidth={2} />
            </div>
            <h4 className="text-[15px] font-bold text-zinc-900 mb-1">
              ¿Eliminar esta meta?
            </h4>
            <p className="text-xs text-zinc-500 max-w-[260px] leading-relaxed mb-5">
              Se borrará <span className="font-semibold text-zinc-700">{goal.title}</span>. Los
              movimientos ligados a ella se conservarán en tu historial.
            </p>
            <div className="flex gap-2 w-full max-w-[260px]">
              <button
                onClick={onDeleteCancel}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={onDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

interface StreakBadgeProps {
  streak: GoalStreak;
  goalCurrency: string;
  isComplete: boolean;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, goalCurrency, isComplete }) => {
  const {
    current,
    best,
    aportedThisPeriod,
    inGrace,
    cadence,
    commitmentAmount,
    currentPeriodAmount,
    currentPeriodRemaining,
  } = streak;
  const labels = CADENCE_LABELS[cadence];

  if (isComplete) return null;

  // Sin actividad nunca: invitamos a empezar en vez de mostrar "0 seguidos".
  if (current === 0 && best === 0 && currentPeriodAmount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-[#fbfaf6] border border-[#efe8da] px-3 py-2.5">
        <Sparkles size={13} strokeWidth={2} className="text-[#9d9687]" />
        <p className="text-[11px] font-semibold text-[#7c7361]">
          Haz tu primer aporte para arrancar la racha
        </p>
      </div>
    );
  }

  // Aportó pero aún no cumple el compromiso, y no hay historial. Antes caía en
  // el branch "racha rota" y se renderizaba "Mejor racha: 0 meses", que es
  // semánticamente vacío. Mostramos el progreso real con copy de arranque.
  if (current === 0 && best === 0 && commitmentAmount && currentPeriodAmount > 0) {
    return (
      <PeriodProgressHint
        current={currentPeriodAmount}
        commitment={commitmentAmount}
        remaining={currentPeriodRemaining}
        currency={goalCurrency}
        label={`Tu primer ${labels.singular}`}
        met={false}
        firstPeriod
      />
    );
  }

  // Racha activa
  if (current > 0) {
    const tone = aportedThisPeriod
      ? 'bg-[var(--color-action)]/10 text-[var(--color-action)] border-[var(--color-action)]/20'
      : 'bg-amber-50 text-amber-800 border-amber-200';
    const unit = current === 1 ? labels.singular : labels.plural;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border',
              tone
            )}
          >
            <Flame size={12} strokeWidth={2.5} />
            {current} {unit} {labels.consecutiveAdjective}
            {inGrace && (
              <span className="font-semibold opacity-80">
                · {labels.thisPeriod} pendiente
              </span>
            )}
          </span>
          {best > current && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Mejor: {best}
            </span>
          )}
        </div>
        {commitmentAmount ? (
          <PeriodProgressHint
            current={currentPeriodAmount}
            commitment={commitmentAmount}
            remaining={currentPeriodRemaining}
            currency={goalCurrency}
            label={labels.thisPeriod}
            met={aportedThisPeriod}
          />
        ) : !aportedThisPeriod ? (
          <p className="text-[10px] font-semibold text-amber-700">{labels.pendingHint}</p>
        ) : null}
      </div>
    );
  }

  // Racha rota pero hay historia
  const recordUnit = best === 1 ? labels.singular : labels.plural;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-200">
          <Flame size={12} strokeWidth={2.5} className="text-zinc-400" />
          Mejor racha: {best} {recordUnit}
        </span>
      </div>
      {commitmentAmount && (
        <PeriodProgressHint
          current={currentPeriodAmount}
          commitment={commitmentAmount}
          remaining={currentPeriodRemaining}
          currency={goalCurrency}
          label={labels.thisPeriod}
          met={currentPeriodAmount >= commitmentAmount}
        />
      )}
    </div>
  );
};

interface PeriodProgressHintProps {
  current: number;
  commitment: number;
  remaining: number;
  currency: string;
  label: string;
  met: boolean;
  /** Si true, el copy del estado "no cumplido" habla de arrancar la racha en vez de mantenerla. */
  firstPeriod?: boolean;
}

const PeriodProgressHint: React.FC<PeriodProgressHintProps> = ({
  current,
  commitment,
  remaining,
  currency,
  label,
  met,
  firstPeriod = false,
}) => {
  const pct = Math.min(100, Math.round((current / commitment) * 100));
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2',
        met ? 'bg-[var(--color-action)]/8 border-[var(--color-action)]/25' : 'bg-[#fbfaf6] border-[#efe8da]'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            met ? 'text-[var(--color-action)]' : 'text-[#7c7361]'
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'text-[11px] font-bold num tabular-nums',
            met ? 'text-[var(--color-action)]' : 'text-[#4b5741]'
          )}
        >
          {formatCurrency(current, currency)} / {formatCurrency(commitment, currency)}
        </span>
      </div>
      <div
        className={cn(
          'h-1 rounded-full overflow-hidden mb-1',
          met ? 'bg-[var(--color-action)]/15' : 'bg-[#efeadd]'
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={cn(
            'h-full rounded-full',
            met ? 'bg-emerald-500' : 'bg-amber-500'
          )}
        />
      </div>
      {met ? (
        <p className="text-[10px] font-semibold text-[var(--color-action)] inline-flex items-center gap-1">
          <Check size={10} strokeWidth={3} />
          Compromiso cumplido
          {current > commitment && (
            <span className="text-[var(--color-action)]/70 ml-1">
              (+{formatCurrency(current - commitment, currency)})
            </span>
          )}
        </p>
      ) : (
        <p className="text-[10px] font-medium text-amber-700">
          Falta {formatCurrency(remaining, currency)} para{' '}
          {firstPeriod ? 'arrancar la racha' : 'mantener la racha'}.
        </p>
      )}
    </div>
  );
};

interface CadenceChangeModalProps {
  meta: { goal: SavingsGoal | undefined; next: StreakCadence } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const CadenceChangeModal: React.FC<CadenceChangeModalProps> = ({ meta, onCancel, onConfirm }) => (
  <AnimatePresence>
    {meta && meta.goal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-700 mb-2">
            Cambio de ritmo
          </p>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            ¿Confirmar cambio a {CADENCE_LABELS[meta.next].selectorLabel.toLowerCase()}?
          </h3>
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">
            {meta.goal.commitmentAmount && meta.goal.commitmentAmount > 0 ? (
              <>
                Tu compromiso de{' '}
                <span className="font-bold num">
                  {formatCurrency(
                    meta.goal.commitmentAmount,
                    meta.goal.currency || 'DOP'
                  )}
                </span>{' '}
                pasa a aplicarse {CADENCE_LABELS[meta.next].perPeriod} (antes era{' '}
                {CADENCE_LABELS[meta.goal.streakCadence ?? 'monthly'].perPeriod}).
                Tu racha se recalcula con el nuevo ritmo y puede cambiar.
              </>
            ) : (
              <>
                La racha pasa de medirse{' '}
                {CADENCE_LABELS[meta.goal.streakCadence ?? 'monthly'].perPeriod} a{' '}
                {CADENCE_LABELS[meta.next].perPeriod}. Tus aportes se reagrupan en
                ventanas distintas, así que la racha actual y la mejor pueden
                cambiar.
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] transition-colors active:scale-95"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface EmptyStateProps {
  onCreate: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreate }) => (
  <div className="rounded-[28px] border border-dashed border-[#e4dccd] bg-white/40 px-6 py-14 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f6f1e8] text-[#9d9687] mb-5 border border-[#efeadd]">
      <Target size={28} strokeWidth={1.75} />
    </div>
    <h3 className="text-base font-bold text-[var(--color-action)] tracking-tight">
      Aún no tienes metas
    </h3>
    <p className="text-sm text-zinc-500 mt-1.5 max-w-[320px] mx-auto leading-relaxed">
      Crea tu primer objetivo de ahorro y MONA cuenta cada aporte que hagas.
    </p>
    <button
      onClick={onCreate}
      className="mt-6 inline-flex items-center gap-2 bg-[var(--color-action)] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--color-action-hover)] transition-colors shadow-[0_12px_24px_rgba(45,90,39,0.18)] active:scale-95"
    >
      <Plus size={14} strokeWidth={2.5} />
      Crear meta
    </button>
  </div>
);
