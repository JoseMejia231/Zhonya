// Preferencias guardadas en localStorage (per-uid). Usamos esto cuando la
// preferencia es solo de cliente y no vale la pena tocar las reglas de
// Firestore para añadir un campo nuevo a settings.

import type { StreakCadence } from '../types';

const DEFAULT_NOTIFY_TIME = '09:00';

const notifyTimeKey = (uid: string) => `mona_default_notify_time_${uid}`;

const isValidHHMM = (v: string) => /^([0-1]\d|2[0-3]):[0-5]\d$/.test(v);

export const getDefaultNotifyTime = (uid: string | undefined | null): string => {
  if (!uid) return DEFAULT_NOTIFY_TIME;
  try {
    const raw = localStorage.getItem(notifyTimeKey(uid));
    return raw && isValidHHMM(raw) ? raw : DEFAULT_NOTIFY_TIME;
  } catch {
    return DEFAULT_NOTIFY_TIME;
  }
};

export const setDefaultNotifyTime = (uid: string, value: string): void => {
  if (!isValidHHMM(value)) return;
  try {
    localStorage.setItem(notifyTimeKey(uid), value);
  } catch {
    // localStorage puede no estar disponible (modo privado iOS, etc.); silenciamos.
  }
};

// ---- Streak baseline ---------------------------------------------------
// Cuando el usuario cambia la cadencia de una meta, snapshotamos el streak
// actual convertido a la nueva cadencia y lo guardamos como "punto de partida".
// La computación de racha lo añade encima del live mientras la cadena no se
// rompa. Va en localStorage porque añadir un campo nuevo al doc savingsGoal
// requeriría desplegar firestore.rules (acceso que el usuario no tiene).

export const STREAK_BASELINE_PREFIX = 'mona_streak_baseline_';

export interface StreakBaseline {
  /** Streak `current` en la NUEVA cadencia al momento del cambio (convertido). */
  inheritedCurrent: number;
  /** Streak `best` en la NUEVA cadencia al momento del cambio (convertido). */
  inheritedBest: number;
  /** Cadencia activa después del cambio; si no coincide al leer, se ignora. */
  cadence: StreakCadence;
  /** periodIdx() en la NUEVA cadencia al momento del cambio. */
  asOfIdx: number;
}

const streakBaselineKey = (uid: string, goalId: string) =>
  `${STREAK_BASELINE_PREFIX}${uid}_${goalId}`;

export const getStreakBaseline = (
  uid: string | undefined | null,
  goalId: string
): StreakBaseline | null => {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(streakBaselineKey(uid, goalId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StreakBaseline>;
    if (
      typeof parsed.inheritedCurrent !== 'number' ||
      typeof parsed.inheritedBest !== 'number' ||
      typeof parsed.cadence !== 'string' ||
      typeof parsed.asOfIdx !== 'number'
    ) return null;
    return parsed as StreakBaseline;
  } catch {
    return null;
  }
};

export const setStreakBaseline = (
  uid: string,
  goalId: string,
  baseline: StreakBaseline
): void => {
  try {
    localStorage.setItem(streakBaselineKey(uid, goalId), JSON.stringify(baseline));
  } catch {}
};

export const clearStreakBaseline = (uid: string, goalId: string): void => {
  try {
    localStorage.removeItem(streakBaselineKey(uid, goalId));
  } catch {}
};

/** Limpia TODOS los baselines del usuario. Usado por "Empezar de cero". */
export const clearAllStreakBaselines = (uid: string): void => {
  try {
    const prefix = `${STREAK_BASELINE_PREFIX}${uid}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
  } catch {}
};

// Llaves locales que escribe la app por-usuario. Las exponemos para que el
// "Empezar de cero" pueda limpiarlas todas en un solo barrido.
export const localKeysForUser = (uid: string): string[] => [
  notifyTimeKey(uid),
  `mona_goals_${uid}`,
  `mona_goal_tx_links_${uid}`,
];
