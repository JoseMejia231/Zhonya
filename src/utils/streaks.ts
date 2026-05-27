import { parseISO, startOfWeek } from 'date-fns';
import type { StreakCadence, Transaction } from '../types';

export interface GoalStreak {
  /** Periodos consecutivos con aporte que llegan hasta el actual (o al anterior, en gracia). */
  current: number;
  /** Mayor racha histórica (incluye la actual si es la más larga). */
  best: number;
  /** Si el usuario ya hizo al menos un aporte en el periodo en curso. */
  aportedThisPeriod: boolean;
  /** Total de periodos distintos con aporte (no necesariamente consecutivos). */
  totalPeriodsWithAporte: number;
  /** Cadencia usada para el cálculo (para que la UI muestre el texto correcto). */
  cadence: StreakCadence;
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

/**
 * Calcula la racha de aportes a una meta a partir de las transacciones vinculadas
 * con `goalId`. Solo se cuentan aportes tipo 'income' (retiros/gastos no
 * rompen la racha; tampoco la mantienen).
 *
 * Reglas:
 * - La racha actual cuenta periodos contiguos hacia atrás desde el último
 *   periodo con aporte. Si el último aporte fue hace más de un periodo, se
 *   considera rota (current = 0). Damos un periodo de gracia para no romperla
 *   el primer día del nuevo periodo.
 * - La mejor racha es la run más larga en todo el historial.
 */
export function computeGoalStreak(
  transactions: Transaction[],
  goalId: string,
  cadence: StreakCadence = 'monthly',
  now: Date = new Date()
): GoalStreak {
  const currentIdx = periodIdx(now, cadence);
  const periods = new Set<number>();
  for (const t of transactions) {
    if (t.goalId !== goalId) continue;
    if (t.type !== 'income') continue;
    periods.add(periodIdx(parseISO(t.date), cadence));
  }

  if (periods.size === 0) {
    return {
      current: 0,
      best: 0,
      aportedThisPeriod: false,
      totalPeriodsWithAporte: 0,
      cadence,
    };
  }

  const aportedThisPeriod = periods.has(currentIdx);

  // Si aportó este periodo arrancamos a contar acá; si no, le damos un periodo
  // de gracia y arrancamos desde el anterior.
  let current = 0;
  let cursor = aportedThisPeriod ? currentIdx : currentIdx - 1;
  while (periods.has(cursor)) {
    current++;
    cursor--;
  }

  const sorted = [...periods].sort((a, b) => a - b);
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
    totalPeriodsWithAporte: periods.size,
    cadence,
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
  }
> = {
  weekly: {
    singular: 'semana',
    plural: 'semanas',
    consecutiveAdjective: 'seguidas',
    pendingHint: 'Aporta esta semana para mantenerla',
    selectorLabel: 'Semanal',
  },
  biweekly: {
    singular: 'quincena',
    plural: 'quincenas',
    consecutiveAdjective: 'seguidas',
    pendingHint: 'Aporta esta quincena para mantenerla',
    selectorLabel: 'Quincenal',
  },
  monthly: {
    singular: 'mes',
    plural: 'meses',
    consecutiveAdjective: 'seguidos',
    pendingHint: 'Aporta este mes para mantenerla',
    selectorLabel: 'Mensual',
  },
};
