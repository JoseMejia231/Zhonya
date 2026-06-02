import { parseISO, startOfWeek } from 'date-fns';
import type { StreakCadence, Transaction } from '../types';
import type { StreakBaseline } from './localPrefs';

/** Cantidad de periodos recientes que devolvemos para la mini-timeline visual. */
export const RECENT_PERIODS_WINDOW = 8;

/** Hitos celebrables. Cruzar uno desbloquea un badge especial en la card. */
export const STREAK_MILESTONES = [4, 12, 24, 52, 104] as const;

export interface GoalStreak {
  /** Periodos consecutivos con aporte que llegan hasta el actual (o al anterior, en gracia). */
  current: number;
  /** Mayor racha histórica (incluye la actual si es la más larga). */
  best: number;
  /** Si el usuario ya cumplió la condición del periodo en curso. */
  aportedThisPeriod: boolean;
  /**
   * True cuando hay racha viva (`current > 0`) pero el periodo actual todavía
   * no cumple la condición. La racha sigue contando gracias al periodo de
   * gracia, pero la UI debe comunicar que está pendiente / en riesgo.
   */
  inGrace: boolean;
  /** Total de periodos distintos que cumplieron la condición. */
  totalPeriodsWithAporte: number;
  /** Cadencia usada para el cálculo (para que la UI muestre el texto correcto). */
  cadence: StreakCadence;
  /** Aporte NETO acumulado en el periodo actual (aportes − retiros). */
  currentPeriodAmount: number;
  /** Monto que faltaría en este periodo para cumplir el compromiso. 0 si no hay compromiso o ya se cumplió. */
  currentPeriodRemaining: number;
  /** Si la racha es por compromiso de monto, refleja el compromiso usado en el cálculo. */
  commitmentAmount: number | null;
  /**
   * Últimos `RECENT_PERIODS_WINDOW` periodos (cronológicos, último = actual).
   * Cada entrada dice si ese periodo cumplió la condición. Sirve para pintar
   * la mini-timeline en la card sin recalcular en la UI.
   */
  recentPeriods: boolean[];
  /** Timestamp en el que termina el periodo actual (exclusivo). */
  currentPeriodEndsAt: number;
  /** Hito alcanzado por la racha actual, o null si current no coincide con ninguno. */
  milestoneReached: number | null;
}

/**
 * Calcula el instante (exclusivo) en el que termina el periodo actual según la
 * cadencia. La UI lo usa para mostrar "cierra en N días/horas".
 */
function endOfCurrentPeriod(now: Date, cadence: StreakCadence): Date {
  if (cadence === 'weekly') {
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);
  }
  if (cadence === 'biweekly') {
    if (now.getDate() <= 15) {
      return new Date(now.getFullYear(), now.getMonth(), 16);
    }
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Convierte una fecha a un índice entero por periodo, según la cadencia. Dos
 * periodos consecutivos siempre difieren en 1, lo que permite contar rachas
 * sin pelear con cruces de mes, año o DST.
 *
 * - weekly: número de semana absoluta desde epoch, normalizada a lunes UTC para
 *   evitar drift por cambios de horario.
 * - biweekly: dos quincenas por mes (días 1-15 y 16-fin), siguiendo el patrón
 *   común de nóminas en LATAM.
 * - monthly: año*12 + mes.
 */
export function periodIdx(date: Date, cadence: StreakCadence): number {
  if (cadence === 'weekly') {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    // Normalizamos a UTC midnight para que dos lunes consecutivos disten
    // exactamente 7 días aunque haya DST en el medio.
    const utc = Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate());
    return Math.floor(utc / (7 * 86400000));
  }
  if (cadence === 'biweekly') {
    return date.getFullYear() * 24 + date.getMonth() * 2 + (date.getDate() > 15 ? 1 : 0);
  }
  return date.getFullYear() * 12 + date.getMonth();
}

interface ComputeOptions {
  /** Si se pasa y es > 0, la racha cuenta solo periodos donde la suma de aportes lo iguala/supera. */
  commitmentAmount?: number;
  /** Snapshot del streak convertido al cambiar cadencia. Mantiene la racha "viva" cuando se mueve a una cadencia más fina/gruesa. */
  baseline?: StreakBaseline | null;
}

/**
 * Pesos relativos entre cadencias. monthly ≈ 4 weekly, biweekly ≈ 2 weekly.
 * Sirven para convertir el streak (en cantidad de periodos) entre cadencias
 * cuando el usuario cambia el ritmo. monthly→weekly = ratio 4 (1 mes ≈ 4 semanas),
 * weekly→monthly = ratio 0.25 (4 semanas ≈ 1 mes). Aproximación: el mes "real"
 * tiene ≈4.33 semanas pero 4 da una conversión limpia y comprensible.
 */
const CADENCE_WEIGHT: Record<StreakCadence, number> = {
  weekly: 1,
  biweekly: 2,
  monthly: 4,
};

/**
 * Cuántas unidades de `to` equivalen a una unidad de `from`. Ej:
 * cadenceRatio('monthly', 'biweekly') === 2 (1 mes ≈ 2 quincenas).
 * cadenceRatio('weekly', 'monthly') === 0.25 (4 semanas ≈ 1 mes).
 */
export const cadenceRatio = (from: StreakCadence, to: StreakCadence): number =>
  CADENCE_WEIGHT[from] / CADENCE_WEIGHT[to];

/**
 * Convierte un conteo de racha de una cadencia a otra, redondeando a entero.
 * Devuelve 0 si el resultado es < 1 (no inflamos rachas vacías).
 */
export const convertStreakCount = (
  count: number,
  from: StreakCadence,
  to: StreakCadence
): number => {
  if (count <= 0) return 0;
  return Math.round(count * cadenceRatio(from, to));
};

/**
 * Calcula la racha de aportes a una meta a partir de las transacciones vinculadas
 * con `goalId`. Cualquier transacción ligada al goal cuenta como aporte
 * (sin filtrar por tipo), porque desde la perspectiva del usuario "aportar a
 * la meta" es un acto único: hace `+ Aportar` y la racha se mantiene.
 *
 * Modos:
 * - Sin commitmentAmount: cualquier aporte en el periodo cuenta.
 * - Con commitmentAmount > 0: el periodo cuenta solo si la suma de aportes
 *   iguala o supera ese monto. Esto permite "Quiero ahorrar X por mes" y la
 *   racha refleja el compromiso real, no solo la actividad.
 *
 * Damos un periodo de gracia: si el último periodo cumplido es el inmediato
 * anterior y el actual aún no se cumplió, la racha sigue viva (el usuario
 * todavía está a tiempo).
 */
export function computeGoalStreak(
  transactions: Transaction[],
  goalId: string,
  cadence: StreakCadence = 'monthly',
  options: ComputeOptions = {},
  now: Date = new Date()
): GoalStreak {
  const commitment = options.commitmentAmount && options.commitmentAmount > 0
    ? options.commitmentAmount
    : null;
  const currentIdx = periodIdx(now, cadence);
  const currentPeriodEndsAt = endOfCurrentPeriod(now, cadence).getTime();

  // Suma NETA por periodo: aportes (expense) suman, retiros (income) restan.
  // Antes contábamos cualquier tx ligada como aporte; eso permitía gamear la
  // racha haciendo aporte+retiro en el mismo periodo. Ahora el periodo cumple
  // si el saldo neto del periodo iguala/supera el compromiso.
  const sumByPeriod = new Map<number, number>();
  for (const t of transactions) {
    if (t.goalId !== goalId) continue;
    const idx = periodIdx(parseISO(t.date), cadence);
    const signed = t.type === 'expense' ? t.amount : -t.amount;
    sumByPeriod.set(idx, (sumByPeriod.get(idx) ?? 0) + signed);
  }

  const periodsMet = new Set<number>();
  for (const [idx, sum] of sumByPeriod) {
    if (commitment === null ? sum > 0 : sum >= commitment) {
      periodsMet.add(idx);
    }
  }

  // recentPeriods: ventana cronológica desde currentIdx - (N-1) hasta currentIdx.
  // Última posición = periodo en curso, primera = más antigua.
  const recentPeriods: boolean[] = [];
  for (let i = RECENT_PERIODS_WINDOW - 1; i >= 0; i--) {
    recentPeriods.push(periodsMet.has(currentIdx - i));
  }

  const currentPeriodAmount = Math.round((sumByPeriod.get(currentIdx) ?? 0) * 100) / 100;
  const currentPeriodRemaining = commitment
    ? Math.max(0, Math.round((commitment - currentPeriodAmount) * 100) / 100)
    : 0;

  if (periodsMet.size === 0) {
    // Caso especial: justo después de cambiar la cadencia, periodsMet podría
    // estar vacío en la nueva cadencia (los aportes históricos quedaron en
    // periodos no cumplidos por commitment, etc.). Si el baseline coincide con
    // el periodo actual, lo mostramos como punto de partida del nuevo cómputo.
    let baselineCurrent = 0;
    let baselineBest = 0;
    if (
      options.baseline &&
      options.baseline.cadence === cadence &&
      currentIdx === options.baseline.asOfIdx
    ) {
      baselineCurrent = options.baseline.inheritedCurrent;
      baselineBest = options.baseline.inheritedBest;
    }
    return {
      current: baselineCurrent,
      best: baselineBest,
      aportedThisPeriod: false,
      inGrace: false,
      totalPeriodsWithAporte: 0,
      cadence,
      currentPeriodAmount,
      currentPeriodRemaining,
      commitmentAmount: commitment,
      recentPeriods,
      currentPeriodEndsAt,
      milestoneReached: null,
    };
  }

  const aportedThisPeriod = periodsMet.has(currentIdx);

  // Si cumplió este periodo arrancamos a contar acá; si no, le damos un periodo
  // de gracia y arrancamos desde el anterior.
  let current = 0;
  let cursor = aportedThisPeriod ? currentIdx : currentIdx - 1;
  while (periodsMet.has(cursor)) {
    current++;
    cursor--;
  }

  // Estamos en gracia cuando la racha sigue viva pero el periodo en curso aún
  // no cumple. La UI usa esto para señalar "en riesgo" sin perder el contador.
  const inGrace = current > 0 && !aportedThisPeriod;

  const sorted = [...periodsMet].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = Number.NEGATIVE_INFINITY;
  for (const idx of sorted) {
    run = idx === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = idx;
  }

  // Baseline: cuando el usuario cambia cadencia, el snapshot convertido se
  // suma al cómputo vivo mientras la cadena post-cambio no se rompa. Si la
  // cadena se rompe, el baseline se ignora (no contamina; queda en
  // localStorage hasta que el siguiente cambio lo sobreescriba).
  let displayedCurrent = current;
  let displayedBest = best;
  if (options.baseline && options.baseline.cadence === cadence) {
    const { inheritedCurrent, inheritedBest, asOfIdx } = options.baseline;
    const elapsed = currentIdx - asOfIdx;
    if (elapsed >= 0) {
      let chainHolds = true;
      for (let i = asOfIdx + 1; i < currentIdx; i++) {
        if (!periodsMet.has(i)) {
          chainHolds = false;
          break;
        }
      }
      // El currentIdx debe estar cumplido o, en su defecto, estar en gracia
      // (lo que implica que el currentIdx-1 sí está cumplido y current > 0).
      if (chainHolds && currentIdx > asOfIdx) {
        if (!periodsMet.has(currentIdx) && current === 0) chainHolds = false;
      }
      if (chainHolds) {
        displayedCurrent = Math.max(current, inheritedCurrent + elapsed);
        displayedBest = Math.max(best, inheritedBest + elapsed);
      }
    }
  }

  const milestoneReached = STREAK_MILESTONES.includes(
    displayedCurrent as (typeof STREAK_MILESTONES)[number]
  )
    ? displayedCurrent
    : null;

  return {
    current: displayedCurrent,
    best: displayedBest,
    aportedThisPeriod,
    inGrace,
    totalPeriodsWithAporte: periodsMet.size,
    cadence,
    currentPeriodAmount,
    currentPeriodRemaining,
    commitmentAmount: commitment,
    recentPeriods,
    currentPeriodEndsAt,
    milestoneReached,
  };
}

/** Etiquetas humanas por cadencia. Centralizado para que la UI sea consistente. */
export const CADENCE_LABELS: Record<
  StreakCadence,
  {
    singular: string;
    plural: string;
    /** "seguida"/"seguidas" o "seguido"/"seguidos" según el género en español. */
    consecutiveAdjective: string;
    pendingHint: string;
    selectorLabel: string;
    /** "este mes" / "esta semana" / "esta quincena" */
    thisPeriod: string;
    /** "al mes" / "a la semana" / "a la quincena" */
    perPeriod: string;
  }
> = {
  weekly: {
    singular: 'semana',
    plural: 'semanas',
    consecutiveAdjective: 'seguidas',
    pendingHint: 'Aporta esta semana para mantenerla',
    selectorLabel: 'Semanal',
    thisPeriod: 'esta semana',
    perPeriod: 'a la semana',
  },
  biweekly: {
    singular: 'quincena',
    plural: 'quincenas',
    consecutiveAdjective: 'seguidas',
    pendingHint: 'Aporta esta quincena para mantenerla',
    selectorLabel: 'Quincenal',
    thisPeriod: 'esta quincena',
    perPeriod: 'a la quincena',
  },
  monthly: {
    singular: 'mes',
    plural: 'meses',
    consecutiveAdjective: 'seguidos',
    pendingHint: 'Aporta este mes para mantenerla',
    selectorLabel: 'Mensual',
    thisPeriod: 'este mes',
    perPeriod: 'al mes',
  },
};
