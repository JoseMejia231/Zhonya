import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import {
  Transaction,
  UserSettings,
  FinanceState,
  FilterType,
  RecurringExpense,
  Wheel,
  SavingsGoal,
} from '../types';
import { auth, db, logout, requestPushToken, onForegroundMessage } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { isSameDay, isSameMonth, isSameYear, parseISO } from 'date-fns';

type FinanceAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_RECURRING'; payload: RecurringExpense[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_FILTER'; payload: FilterType }
  | { type: 'SET_STATE'; payload: FinanceState };

interface FinanceContextType extends FinanceState {
  user: User | null;
  loading: boolean;
  recurring: RecurringExpense[];
  notificationStatus: NotificationPermission | 'unsupported';
  enableNotifications: () => Promise<boolean>;
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'uid'>,
    options?: { syncGoalBalance?: boolean }
  ) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'uid'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setCategoryBudget: (category: string, amount: number | null) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  logout: () => Promise<void>;
  filteredTransactions: Transaction[];
  lastDeleted: Transaction | null;
  undoDelete: () => Promise<void>;
  dismissUndo: () => void;
  upsertRecurring: (
    recurring: Omit<RecurringExpense, 'uid' | 'createdAt' | 'lastNotifiedKey'> & { id?: string }
  ) => Promise<void>;
  toggleRecurring: (id: string, enabled: boolean) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  confirmRecurringPayment: (recurringId: string, periodKey?: string) => Promise<void>;
  isRecurringPaidThisPeriod: (recurringId: string) => boolean;
  wheels: Wheel[];
  upsertWheel: (wheel: Omit<Wheel, 'uid' | 'createdAt'> & { id?: string; createdAt?: string }) => Promise<void>;
  deleteWheel: (id: string) => Promise<void>;
  recordWheelSpin: (wheelId: string, sliceId: string) => Promise<void>;
  recurringPrompt: { recurringId: string; periodKey?: string } | null;
  setRecurringPrompt: (p: { recurringId: string; periodKey?: string } | null) => void;
  inAppNotification: { title: string; body: string } | null;
  dismissInAppNotification: () => void;
  savingsGoals: SavingsGoal[];
  upsertSavingsGoal: (goal: Omit<SavingsGoal, 'uid' | 'createdAt'> & { id?: string; createdAt?: string }) => Promise<string>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  errorMessage: string | null;
  dismissError: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'DOP',
  theme: 'light',
  incomeCategories: ['Salario', 'Inversión', 'Regalos', 'Otros Ingresos'],
  expenseCategories: ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Compras', 'Servicios', 'Metas', 'Otros Gastos'],
};

const INITIAL_STATE: FinanceState = {
  transactions: [],
  settings: DEFAULT_SETTINGS,
  filter: 'all',
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: normalizeSettings({ ...state.settings, ...action.payload }),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_STATE':
      return action.payload;
    default:
      return state;
  }
}

const uniqueStrings = (values: unknown[]) =>
  Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

const normalizeSettings = (settings: Partial<UserSettings>): UserSettings => {
  const legacyCategories = Array.isArray(settings.categories) ? uniqueStrings(settings.categories) : [];
  const configuredIncome = Array.isArray(settings.incomeCategories)
    ? uniqueStrings(settings.incomeCategories)
    : [];
  const configuredExpense = Array.isArray(settings.expenseCategories)
    ? uniqueStrings(settings.expenseCategories)
    : [];

  const migratedIncome = legacyCategories.filter((cat) =>
    DEFAULT_SETTINGS.incomeCategories.includes(cat)
  );
  const migratedExpense = legacyCategories.filter((cat) =>
    !DEFAULT_SETTINGS.incomeCategories.includes(cat)
  );

  const incomeCategories =
    configuredIncome.length > 0
      ? configuredIncome
      : migratedIncome.length > 0
      ? migratedIncome
      : DEFAULT_SETTINGS.incomeCategories;

  const expenseCategories =
    configuredExpense.length > 0
      ? configuredExpense
      : migratedExpense.length > 0
      ? migratedExpense
      : DEFAULT_SETTINGS.expenseCategories;

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    incomeCategories: uniqueStrings(incomeCategories),
    expenseCategories: uniqueStrings([...expenseCategories, 'Metas']),
  };
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, INITIAL_STATE);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastDeleted, setLastDeleted] = useState<Transaction | null>(null);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [inAppNotification, setInAppNotification] = useState<{ title: string; body: string } | null>(null);
  const [recurringPrompt, setRecurringPrompt] = useState<{ recurringId: string; periodKey?: string } | null>(null);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Muestra un toast de error y lo auto-descarta. Logueamos siempre el error real
  // para diagnóstico; al usuario solo le mostramos un mensaje corto.
  const showError = React.useCallback((label: string, err?: unknown) => {
    if (err) console.error(`[finance] ${label}:`, err);
    setErrorMessage(label);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 6000);
  }, []);

  const dismissError = () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMessage(null);
  };

  // Always-fresh ref for settings to avoid stale closures in async Firestore writes
  const latestSettingsRef = React.useRef<UserSettings>(state.settings);
  useEffect(() => {
    latestSettingsRef.current = state.settings;
  }, [state.settings]);

  const buildSettingsPayload = (settings: UserSettings) => {
    const allCats = [...(settings.incomeCategories || []), ...(settings.expenseCategories || [])];
    const payload: Record<string, unknown> = {
      currency: settings.currency || DEFAULT_SETTINGS.currency,
      theme: settings.theme || DEFAULT_SETTINGS.theme,
      categories: allCats,
      incomeCategories: settings.incomeCategories || [],
      expenseCategories: settings.expenseCategories || [],
    };
    if (settings.budgets && Object.keys(settings.budgets).length > 0) {
      payload.budgets = settings.budgets;
    }
    if (settings.hideBalance) {
      payload.hideBalance = true;
    }
    return payload;
  };

  const isPermissionDenied = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'permission-denied';

  const goalLinksKey = (uid: string) => `mona_goal_tx_links_${uid}`;

  const readGoalLinks = (uid: string): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(goalLinksKey(uid)) || '{}');
    } catch {
      return {};
    }
  };

  const writeGoalLink = (uid: string, transactionId: string, goalId: string) => {
    const links = readGoalLinks(uid);
    links[transactionId] = goalId;
    localStorage.setItem(goalLinksKey(uid), JSON.stringify(links));
  };

  const deleteGoalLink = (uid: string, transactionId: string) => {
    const links = readGoalLinks(uid);
    if (!(transactionId in links)) return;
    delete links[transactionId];
    localStorage.setItem(goalLinksKey(uid), JSON.stringify(links));
  };

  const withLocalGoalLink = (uid: string, transaction: Transaction): Transaction => {
    if (transaction.goalId) return transaction;
    const goalId = readGoalLinks(uid)[transaction.id];
    return goalId ? { ...transaction, goalId } : transaction;
  };

  const setTransactionDoc = async (transaction: Transaction) => {
    const transactionRef = doc(db, 'users', transaction.uid, 'transactions', transaction.id);
    try {
      await setDoc(transactionRef, transaction);
    } catch (error) {
      if (!isPermissionDenied(error)) throw error;
      // Las rules viejas (pre-bc88665) rechazan goalId y/o currency. Reintentamos
      // sin esos campos para que el guardado no se rompa si alguien clona el repo
      // antes de que se haya desplegado `firebase deploy --only firestore:rules`.
      // El goalId se preserva localmente para no perder el vínculo con la meta.
      const { goalId, currency, ...firestoreSafeTransaction } = transaction;
      if (goalId === undefined && currency === undefined) throw error;
      console.warn(
        '[MONA] Firestore rules rejected transaction fields (likely goalId/currency).',
        'Saving without them; deploy firestore.rules to enable.'
      );
      await setDoc(transactionRef, firestoreSafeTransaction);
      if (goalId) writeGoalLink(transaction.uid, transaction.id, goalId);
    }
  };

  const normalizeMonthlyDays = (value: unknown) =>
    Array.from(
      new Set(
        (Array.isArray(value) ? value : [value ?? 1])
          .map((d) => Math.max(1, Math.min(31, Math.round(Number(d) || 1))))
      )
    )
      .sort((a, b) => a - b)
      .slice(0, 2);

  const monthlyDayValue = (value: unknown) => {
    const days = normalizeMonthlyDays(value);
    return days.length > 1 ? days : days[0];
  };

  const writeRecurring = async (id: string, payload: RecurringExpense) => {
    const recurringRef = doc(db, 'users', payload.uid, 'recurringExpenses', id);
    try {
      await setDoc(recurringRef, payload);
    } catch (error) {
      if (Array.isArray(payload.dayOfMonth) && isPermissionDenied(error)) {
        console.warn(
          '[MONA] Firestore rules rejected multiple monthly days. Deploy firestore.rules to enable both days.'
        );
        await setDoc(recurringRef, {
          ...payload,
          dayOfMonth: payload.dayOfMonth[0],
        });
        return;
      }
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        dispatch({ type: 'SET_STATE', payload: INITIAL_STATE });
        setRecurring([]);
        setWheels([]);
        setSavingsGoals([]);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fallback: si Firestore no responde en 10 s (sin error tampoco), salimos del
    // skeleton para no dejar al usuario colgado. Los listeners se mantienen activos.
    const loadingTimeout = setTimeout(() => setLoading(false), 10000);

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
    const unsubscribeSettings = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserSettings;
          // Migración de datos antiguos
          if (data.categories && (!data.incomeCategories || !data.expenseCategories)) {
            const defaultIncomes = ['Salario', 'Inversión', 'Regalos', 'Otros Ingresos'];
            data.incomeCategories = data.categories.filter(c => defaultIncomes.includes(c));
            if (data.incomeCategories.length === 0) data.incomeCategories = ['Salario', 'Otros Ingresos'];
            data.expenseCategories = data.categories.filter(c => !defaultIncomes.includes(c));
            if (data.expenseCategories.length === 0) data.expenseCategories = ['Otros Gastos'];
          }
          dispatch({ type: 'UPDATE_SETTINGS', payload: data });
        } else {
          const payload = buildSettingsPayload(latestSettingsRef.current);
          setDoc(settingsRef, payload).catch((err) =>
            showError('No se pudo inicializar tu configuración', err)
          );
        }
      },
      (err) => {
        setLoading(false);
        showError('No se pudo cargar tu configuración', err);
      }
    );

    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    const unsubscribeTransactions = onSnapshot(
      q,
      (snapshot) => {
        // withLocalGoalLink reanima el goalId desde localStorage para transacciones
        // antiguas o creadas antes del deploy de las rules nuevas (fallback graceful).
        const transactions = snapshot.docs.map((doc) =>
          withLocalGoalLink(user.uid, doc.data() as Transaction)
        );
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        showError('No se pudieron cargar tus movimientos', err);
      }
    );

    const recurringRef = collection(db, 'users', user.uid, 'recurringExpenses');
    const recurringQuery = query(recurringRef, where('uid', '==', user.uid));
    const unsubscribeRecurring = onSnapshot(
      recurringQuery,
      (snapshot) => {
        setRecurring(snapshot.docs.map((d) => d.data() as RecurringExpense));
      },
      (err) => showError('No se pudieron cargar los gastos fijos', err)
    );

    const wheelsRef = collection(db, 'users', user.uid, 'wheels');
    const wheelsQuery = query(wheelsRef, where('uid', '==', user.uid));
    const unsubscribeWheels = onSnapshot(
      wheelsQuery,
      (snapshot) => {
        setWheels(snapshot.docs.map((d) => d.data() as Wheel));
      },
      (err) => showError('No se pudieron cargar las ruletas', err)
    );

    const goalsRef = collection(db, 'users', user.uid, 'savingsGoals');
    const goalsQuery = query(goalsRef, where('uid', '==', user.uid));
    const unsubscribeGoals = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const fromCloud = snapshot.docs.map((d) => d.data() as SavingsGoal);
        // Migración suave one-shot: si Firestore está vacío pero hay datos viejos
        // en localStorage, los subimos. Después de la primera subida, el listener
        // refleja Firestore y borramos la copia local para evitar divergencia.
        const localKey = `mona_goals_${user.uid}`;
        if (fromCloud.length === 0) {
          const raw = localStorage.getItem(localKey);
          if (raw) {
            try {
              const legacy = JSON.parse(raw) as SavingsGoal[];
              Promise.all(
                legacy.map((g) =>
                  setDoc(doc(db, 'users', user.uid, 'savingsGoals', g.id), {
                    ...g,
                    uid: user.uid,
                  })
                )
              )
                .then(() => localStorage.removeItem(localKey))
                .catch((err) => showError('No se pudieron migrar tus metas', err));
            } catch (e) {
              console.error('Error parsing legacy goals:', e);
            }
          }
        } else {
          // Ya hay datos en cloud: la copia local quedó obsoleta.
          localStorage.removeItem(localKey);
        }
        setSavingsGoals(fromCloud);
      },
      (err) => showError('No se pudieron cargar tus metas', err)
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribeSettings();
      unsubscribeTransactions();
      unsubscribeRecurring();
      unsubscribeWheels();
      unsubscribeGoals();
    };
  }, [user, showError]);

  // Aplicar el tema persistido a <html> para que sobreviva refresh.
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.settings.theme]);

  // Foreground push messages.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    onForegroundMessage((payload) => {
      if (payload.title || payload.body) {
        setInAppNotification({
          title: payload.title || 'MONA',
          body: payload.body || '',
        });
      }
    }).then((u) => {
      unsub = u;
    });
    return () => {
      unsub?.();
    };
  }, []);

  const enableNotifications = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const token = await requestPushToken();
      setNotificationStatus(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
      if (!token) return false;
      await setDoc(doc(db, 'users', user.uid, 'pushTokens', token), {
        token,
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent.slice(0, 200),
      });
      return true;
    } catch (err) {
      showError('No se pudieron activar las notificaciones', err);
      return false;
    }
  };

  // Helper: ajusta el currentAmount de un goal en delta (puede ser negativo).
  // No baja de 0 para evitar estados absurdos si el usuario reasigna metas.
  // Redondea a 2 decimales para evitar drift acumulado entre operaciones.
  const adjustGoalAmount = async (goalId: string, delta: number) => {
    if (!user || delta === 0) return;
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;
    const roundedDelta = Math.round(delta * 100) / 100;
    const nextAmount = Math.max(0, Math.round((goal.currentAmount + roundedDelta) * 100) / 100);
    const payload: SavingsGoal = {
      ...goal,
      currentAmount: nextAmount,
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'savingsGoals', goalId), payload);
    } catch (err) {
      showError('No se pudo actualizar la meta', err);
    }
  };


  const addTransaction = async (
    t: Omit<Transaction, 'id' | 'uid'>,
    options?: { syncGoalBalance?: boolean }
  ) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const newTransaction: Transaction = {
      ...t,
      id,
      uid: user.uid,
    };
    try {
      await setTransactionDoc(newTransaction);
    } catch (err) {
      showError('No se pudo guardar el movimiento', err);
      return;
    }
    if (options?.syncGoalBalance && newTransaction.goalId) {
      await adjustGoalAmount(newTransaction.goalId, newTransaction.amount);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'uid'>>) => {
    if (!user) return;
    // Comparamos prev vs next para mantener el currentAmount del goal vinculado:
    // cambio de monto, cambio de goalId, o quitar/agregar el vínculo de meta.
    const previous = state.transactions.find((t) => t.id === id) ?? null;
    try {
      await setDoc(doc(db, 'users', user.uid, 'transactions', id), updates, { merge: true });
    } catch (err) {
      showError('No se pudo actualizar el movimiento', err);
      return;
    }
    if (!previous) return;
    const next: Transaction = {
      ...previous,
      ...updates,
      id: previous.id,
      uid: previous.uid,
    };
    if (previous.goalId && previous.goalId === next.goalId) {
      const delta = next.amount - previous.amount;
      if (delta) await adjustGoalAmount(previous.goalId, delta);
    } else {
      if (previous.goalId) await adjustGoalAmount(previous.goalId, -previous.amount);
      if (next.goalId) await adjustGoalAmount(next.goalId, next.amount);
    }
  };

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const tx = state.transactions.find((t) => t.id === id) ?? null;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (err) {
      showError('No se pudo eliminar el movimiento', err);
      return;
    }
    // Limpia el link local de goalId aunque la tx no tuviera el campo en Firestore
    // (caso legacy: el goalId estaba en localStorage por fallback).
    deleteGoalLink(user.uid, id);
    if (tx) {
      if (tx.goalId) await adjustGoalAmount(tx.goalId, -tx.amount);
      setLastDeleted(tx);
      clearUndoTimer();
      undoTimerRef.current = setTimeout(() => setLastDeleted(null), 5000);
    }
  };

  const undoDelete = async () => {
    if (!user || !lastDeleted) return;
    const tx = lastDeleted;
    clearUndoTimer();
    setLastDeleted(null);
    try {
      await setTransactionDoc(tx);
    } catch (err) {
      showError('No se pudo deshacer la eliminación', err);
      return;
    }
    // Re-aplicar el aporte a la meta si la transacción la tenía.
    if (tx.goalId) await adjustGoalAmount(tx.goalId, tx.amount);
  };

  const dismissUndo = () => {
    clearUndoTimer();
    setLastDeleted(null);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    // Optimistic: update UI immediately
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    // Use ref for latest state to prevent stale closures on rapid calls
    const merged = { ...latestSettingsRef.current, ...newSettings };
    latestSettingsRef.current = merged;
    // Build Firestore payload – include legacy 'categories' field for rule compat
    const payload = buildSettingsPayload(merged);
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
    try {
      await setDoc(settingsRef, payload);
    } catch (err) {
      // Mismo escenario que setTransactionDoc: si las rules viejas no conocen
      // hideBalance, lo reintentamos sin él. El estado local conserva el toggle.
      if (isPermissionDenied(err) && 'hideBalance' in payload) {
        const { hideBalance: _omit, ...safePayload } = payload;
        try {
          await setDoc(settingsRef, safePayload);
          console.warn(
            '[MONA] Firestore rules rejected settings.hideBalance. Persisted other settings; deploy firestore.rules to enable.'
          );
          return;
        } catch (retryErr) {
          showError('No se pudo guardar la configuración', retryErr);
          return;
        }
      }
      showError('No se pudo guardar la configuración', err);
    }
  };

  const setCategoryBudget = async (category: string, amount: number | null) => {
    if (!user) return;
    const current = latestSettingsRef.current;
    const next: Record<string, number> = { ...(current.budgets ?? {}) };
    if (amount === null || isNaN(amount) || amount <= 0) {
      delete next[category];
    } else {
      next[category] = Math.round(amount * 100) / 100;
    }
    const budgets = Object.keys(next).length > 0 ? next : undefined;
    await updateSettings({ budgets } as Partial<UserSettings>);
  };

  const setFilter = (filter: FilterType) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const handleLogout = async () => {
    await logout();
  };

  const upsertRecurring = async (
    rec: Omit<RecurringExpense, 'uid' | 'createdAt' | 'lastNotifiedKey'> & { id?: string }
  ) => {
    if (!user) return;
    const existing = rec.id ? recurring.find((r) => r.id === rec.id) : undefined;
    const id = rec.id ?? crypto.randomUUID();
    const notifyTime = /^\d{2}:\d{2}$/.test(rec.notifyTime) ? rec.notifyTime : '09:00';
    const payload: RecurringExpense = {
      id,
      uid: user.uid,
      name: rec.name,
      amount: rec.amount,
      category: rec.category,
      type: rec.type,
      frequency: rec.frequency,
      notifyTime,
      enabled: rec.enabled,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      ...(rec.frequency === 'monthly'
        ? {
            dayOfMonth: monthlyDayValue(rec.dayOfMonth),
          }
        : {}),
      ...(rec.frequency === 'weekly'
        ? {
            daysOfWeek: Array.from(
              new Set(
                (rec.daysOfWeek ?? [1])
                  .map((d) => Math.max(0, Math.min(6, Math.round(d))))
              )
            ).sort((a, b) => a - b),
          }
        : {}),
      ...(existing?.lastNotifiedKey ? { lastNotifiedKey: existing.lastNotifiedKey } : {}),
    };
    void serverTimestamp;
    try {
      await writeRecurring(id, payload);
    } catch (err) {
      showError('No se pudo guardar el gasto fijo', err);
    }
  };

  const toggleRecurring = async (id: string, enabled: boolean) => {
    if (!user) return;
    const target = recurring.find((r) => r.id === id);
    if (!target) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'recurringExpenses', id),
        { ...target, enabled }
      );
    } catch (err) {
      showError('No se pudo actualizar el gasto fijo', err);
    }
  };

  const deleteRecurring = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'recurringExpenses', id));
    } catch (err) {
      showError('No se pudo eliminar el gasto fijo', err);
    }
  };

  const upsertWheel = async (
    w: Omit<Wheel, 'uid' | 'createdAt'> & { id?: string; createdAt?: string }
  ) => {
    if (!user) return;
    const id = w.id ?? crypto.randomUUID();
    const existing = wheels.find((x) => x.id === id);
    const payload: Wheel = {
      id,
      uid: user.uid,
      title: w.title,
      mode: w.mode,
      slices: w.slices,
      createdAt: existing?.createdAt ?? w.createdAt ?? new Date().toISOString(),
      ...(w.mode === 'transaction' && w.txType ? { txType: w.txType } : {}),
      ...(existing?.lastSpunAt ? { lastSpunAt: existing.lastSpunAt } : {}),
      ...(existing?.lastResultId ? { lastResultId: existing.lastResultId } : {}),
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'wheels', id), payload);
    } catch (err) {
      showError('No se pudo guardar la ruleta', err);
    }
  };

  const deleteWheel = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'wheels', id));
    } catch (err) {
      showError('No se pudo eliminar la ruleta', err);
    }
  };

  const recordWheelSpin = async (wheelId: string, sliceId: string) => {
    if (!user) return;
    const w = wheels.find((x) => x.id === wheelId);
    if (!w) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'wheels', wheelId), {
        ...w,
        lastSpunAt: new Date().toISOString(),
        lastResultId: sliceId,
      });
    } catch (err) {
      showError('No se pudo registrar el giro', err);
    }
  };

  const upsertSavingsGoal = async (
    g: Omit<SavingsGoal, 'uid' | 'createdAt'> & { id?: string; createdAt?: string }
  ) => {
    if (!user) return '';
    const id = g.id ?? crypto.randomUUID();
    const existing = savingsGoals.find((x) => x.id === id);
    // El validador de Firestore rechaza claves desconocidas, así que solo incluimos
    // los campos opcionales cuando tienen valor (omitirlos == undefined-friendly).
    const payload: SavingsGoal = {
      id,
      uid: user.uid,
      title: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      createdAt: existing?.createdAt ?? g.createdAt ?? new Date().toISOString(),
      ...(g.currency ? { currency: g.currency } : {}),
      ...(g.deadline ? { deadline: g.deadline } : {}),
      ...(g.streakCadence ? { streakCadence: g.streakCadence } : {}),
      ...(g.commitmentAmount && g.commitmentAmount > 0
        ? { commitmentAmount: g.commitmentAmount }
        : {}),
    };
    const goalRef = doc(db, 'users', user.uid, 'savingsGoals', id);
    try {
      await setDoc(goalRef, payload);
    } catch (err) {
      // Fallback: si las rules viejas no conocen commitmentAmount, lo descartamos
      // y reintentamos. Sigue el mismo patrón que setTransactionDoc para que un
      // pull antes de `firebase deploy --only firestore:rules` no rompa la meta.
      if (isPermissionDenied(err) && payload.commitmentAmount !== undefined) {
        const { commitmentAmount: _omit, ...safePayload } = payload;
        try {
          await setDoc(goalRef, safePayload);
          console.warn(
            '[MONA] Firestore rules rejected savingsGoal.commitmentAmount. Saved without it; deploy firestore.rules to enable.'
          );
          return id;
        } catch (retryErr) {
          showError('No se pudo guardar la meta', retryErr);
          return '';
        }
      }
      showError('No se pudo guardar la meta', err);
      return '';
    }
    return id;
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savingsGoals', id));
    } catch (err) {
      showError('No se pudo eliminar la meta', err);
    }
  };

  const periodKeyFor = (rec: RecurringExpense, when: Date = new Date()): string => {
    const yyyy = when.getFullYear();
    const mm = String(when.getMonth() + 1).padStart(2, '0');
    const dd = String(when.getDate()).padStart(2, '0');
    return rec.frequency === 'monthly' ? `${yyyy}-${mm}` : `${yyyy}-${mm}-${dd}`;
  };

  const txIdForRecurring = (rec: RecurringExpense, periodKey: string) =>
    `${rec.id}-${periodKey}`;

  const isRecurringPaidThisPeriod = (recurringId: string) => {
    const rec = recurring.find((r) => r.id === recurringId);
    if (!rec) return false;
    const expectedId = txIdForRecurring(rec, periodKeyFor(rec));
    return state.transactions.some((t) => t.id === expectedId);
  };

  const confirmRecurringPayment = async (recurringId: string, periodKey?: string) => {
    if (!user) return;
    const rec = recurring.find((r) => r.id === recurringId);
    if (!rec) return;
    const period = periodKey || periodKeyFor(rec);
    const id = txIdForRecurring(rec, period);
    const tx: Transaction = {
      id,
      uid: user.uid,
      amount: rec.amount,
      category: rec.category,
      type: rec.type,
      description: rec.name,
      date: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'transactions', id), tx);
      // Marcar el recurrente como notificado para este periodo para que el cron de
      // Cloud Functions no vuelva a disparar la push del mismo gasto en la ventana.
      if (rec.lastNotifiedKey !== period) {
        await setDoc(
          doc(db, 'users', user.uid, 'recurringExpenses', rec.id),
          { ...rec, lastNotifiedKey: period }
        );
      }
    } catch (err) {
      showError('No se pudo registrar el pago', err);
    }
  };

  // SW → app: las acciones de la notificación llegan vía postMessage cuando
  // hay una pestaña abierta, o vía URL params al abrir la PWA en frío.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.type !== 'mona-recurring-action') return;
      const { recurringId, periodKey, action } = msg;
      if (!recurringId) return;
      if (action === 'paid') {
        confirmRecurringPayment(recurringId, periodKey);
      } else if (action === 'skip') {
        setRecurringPrompt(null);
      } else {
        setRecurringPrompt({ recurringId, periodKey });
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recurring]);

  // Cold-open deep link: leer params al cargar y limpiar la URL.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const recurringId = params.get('recurringId');
    const action = params.get('rAction');
    const periodKey = params.get('periodKey') || undefined;
    if (!recurringId) return;
    if (action === 'paid') {
      confirmRecurringPayment(recurringId, periodKey);
    } else if (action === 'skip') {
      // nada que persistir por ahora
    } else {
      setRecurringPrompt({ recurringId, periodKey });
    }
    // limpiar URL para no reaccionar dos veces tras refresh.
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recurring.length]);

  const filteredTransactions = state.transactions.filter((t) => {
    const date = parseISO(t.date);
    const now = new Date();
    if (state.filter === 'day') return isSameDay(date, now);
    if (state.filter === 'month') return isSameMonth(date, now);
    if (state.filter === 'year') return isSameYear(date, now);
    return true;
  });

  return (
    <FinanceContext.Provider
      value={{
        ...state,
        user,
        loading,
        recurring,
        notificationStatus,
        enableNotifications,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateSettings,
        setCategoryBudget,
        setFilter,
        logout: handleLogout,
        filteredTransactions,
        lastDeleted,
        undoDelete,
        dismissUndo,
        upsertRecurring,
        toggleRecurring,
        deleteRecurring,
        confirmRecurringPayment,
        isRecurringPaidThisPeriod,
        wheels,
        upsertWheel,
        deleteWheel,
        recordWheelSpin,
        recurringPrompt,
        setRecurringPrompt,
        inAppNotification,
        dismissInAppNotification: () => setInAppNotification(null),
        savingsGoals,
        upsertSavingsGoal,
        deleteSavingsGoal,
        errorMessage,
        dismissError,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
