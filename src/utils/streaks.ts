import { parseISO, startOfWeek } from 'date-fns';
import type { StreakCadence, Transaction } from '../types';

export interface GoalStreak {
  /** Periodos consecutivos con aporte que llegan hasta el actual (o al anterior, en gracia). */
  current: number;
  /** Mayor racha histórica (incluye la actual si es la más larga). */
  best: number;
  /** Si el usuario ya cumplió la condición del periodo en curso. */
  aportedThisPeriod: boolean;
  /** Total de periodos distintos que cumplieron la condición. */
  totalPeriodsWithAporte: number;
  /** Cadencia usada para el cálculo (para que la UI muestre el texto correcto). */
  cadence: StreakCadence;
  /** Aporte total acumulado en el periodo actual (en la moneda del goal). */
  currentPeriodAmount: number;
  /** Monto que faltaría en este periodo para cumplir el compromiso. 0 si no hay compromiso o ya se cumplió. */
  currentPeriodRemaining: number;
  /** Si la racha es por compromiso de monto, refleja el compromiso usado en el cálculo. */
  commitmentAmount: number | null;
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
function periodIdx(date: Date, cadence: StreakCadence): number {
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
}

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

  // Suma de aportes por periodo. Permite evaluar "se cumplió el compromiso".
  const sumByPeriod = new Map<number, number>();
  for (const t of transactions) {
    if (t.goalId !== goalId) continue;
    const idx = periodIdx(parseISO(t.date), cadence);
    sumByPeriod.set(idx, (sumByPeriod.get(idx) ?? 0) + t.amount);
  }

  const periodsMet = new Set<number>();
  for (const [idx, sum] of sumByPeriod) {
    if (commitment === null ? sum > 0 : sum >= commitment) {
      periodsMet.add(idx);
    }
  }

  const currentPeriodAmount = Math.round((sumByPeriod.get(currentIdx) ?? 0) * 100) / 100;
  const currentPeriodRemaining = commitment
    ? Math.max(0, Math.round((commitment - currentPeriodAmount) * 100) / 100)
    : 0;

  if (periodsMet.size === 0) {
    return {
      current: 0,
      best: 0,
      aportedThisPeriod: false,
      totalPeriodsWithAporte: 0,
      cadence,
      currentPeriodAmount,
      currentPeriodRemaining,
      commitmentAmount: commitment,
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

  const sorted = [...periodsMet].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = Number.NEGATIVE_INFINITY;
  for (const idx of sorted) {
    run = idx === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = idx;
  }

  return {
    current,
    best,
    aportedThisPeriod,
    totalPeriodsWithAporte: periodsMet.size,
    cadence,
    currentPeriodAmount,
    currentPeriodRemaining,
    commitmentAmount: commitment,
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
