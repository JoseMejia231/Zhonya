// Preferencias guardadas en localStorage (per-uid). Usamos esto cuando la
// preferencia es solo de cliente y no vale la pena tocar las reglas de
// Firestore para añadir un campo nuevo a settings.

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

// Llaves locales que escribe la app por-usuario. Las exponemos para que el
// "Empezar de cero" pueda limpiarlas todas en un solo barrido.
export const localKeysForUser = (uid: string): string[] => [
  notifyTimeKey(uid),
  `mona_goals_${uid}`,
  `mona_goal_tx_links_${uid}`,
];
