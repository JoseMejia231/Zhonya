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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'DOP',
  theme: 'light',
  incomeCategories: ['Salario', 'Inversión', 'Regalos', 'Otros Ingresos'],
  expenseCategories: ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Compras', 'Servicios', 'Otros Gastos'],
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
        settings: { ...state.settings, ...action.payload },
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_STATE':
      return action.payload;
    default:
      return state;
  }
}

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
      if (transaction.goalId && isPermissionDenied(error)) {
        console.warn(
          '[MONA] Firestore rules rejected transaction.goalId. Saving transaction without goalId and keeping the goal link locally.'
        );
        const { goalId, ...firestoreSafeTransaction } = transaction;
        await setDoc(transactionRef, firestoreSafeTransaction);
        writeGoalLink(transaction.uid, transaction.id, goalId);
        return;
      }
      throw error;
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

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
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
        setDoc(settingsRef, payload);
      }
    });

    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map((doc) => withLocalGoalLink(user.uid, doc.data() as Transaction));
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      setLoading(false);
    });

    const recurringRef = collection(db, 'users', user.uid, 'recurringExpenses');
    const recurringQuery = query(recurringRef, where('uid', '==', user.uid));
    const unsubscribeRecurring = onSnapshot(recurringQuery, (snapshot) => {
      setRecurring(snapshot.docs.map((d) => d.data() as RecurringExpense));
    });

    const wheelsRef = collection(db, 'users', user.uid, 'wheels');
    const wheelsQuery = query(wheelsRef, where('uid', '==', user.uid));
    const unsubscribeWheels = onSnapshot(wheelsQuery, (snapshot) => {
      setWheels(snapshot.docs.map((d) => d.data() as Wheel));
    });

    // Metas de ahorro almacenadas localmente para evitar problemas de reglas en Firebase
    const savedGoals = localStorage.getItem(`mona_goals_${user.uid}`);
    if (savedGoals) {
      try {
        setSavingsGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error('Error parsing local goals', e);
      }
    }

    return () => {
      unsubscribeSettings();
      unsubscribeTransactions();
      unsubscribeRecurring();
      unsubscribeWheels();
    };
  }, [user]);

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
    const token = await requestPushToken();
    setNotificationStatus(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
    if (!token) return false;
    await setDoc(doc(db, 'users', user.uid, 'pushTokens', token), {
      token,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 200),
    });
    return true;
  };

  const applySavingsGoalDelta = async (goalId: string, delta: number) => {
    if (!user || !delta) return;
    const roundedDelta = Math.round(delta * 100) / 100;
    setSavingsGoals((prev) => {
      const updated = prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              currentAmount: Math.max(0, Math.round((goal.currentAmount + roundedDelta) * 100) / 100),
            }
          : goal
      );
      localStorage.setItem(`mona_goals_${user.uid}`, JSON.stringify(updated));
      return updated;
    });
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
    await setTransactionDoc(newTransaction);
    if (options?.syncGoalBalance && newTransaction.goalId) {
      await applySavingsGoalDelta(newTransaction.goalId, newTransaction.amount);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'uid'>>) => {
    if (!user) return;
    const previous = state.transactions.find((t) => t.id === id) ?? null;
    await setDoc(doc(db, 'users', user.uid, 'transactions', id), updates, { merge: true });
    if (previous) {
      const next: Transaction = {
        ...previous,
        ...updates,
        id: previous.id,
        uid: previous.uid,
      };

      if (previous.goalId && previous.goalId === next.goalId) {
        const delta = next.amount - previous.amount;
        if (delta) await applySavingsGoalDelta(previous.goalId, delta);
      } else {
        if (previous.goalId) {
          await applySavingsGoalDelta(previous.goalId, -previous.amount);
        }
        if (next.goalId) {
          await applySavingsGoalDelta(next.goalId, next.amount);
        }
      }
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
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    deleteGoalLink(user.uid, id);
    if (tx) {
      if (tx.goalId) {
        await applySavingsGoalDelta(tx.goalId, -tx.amount);
      }
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
    await setTransactionDoc(tx);
    if (tx.goalId) {
      await applySavingsGoalDelta(tx.goalId, tx.amount);
    }
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
    await setDoc(settingsRef, payload);
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
    await writeRecurring(id, payload);
  };

  const toggleRecurring = async (id: string, enabled: boolean) => {
    if (!user) return;
    const target = recurring.find((r) => r.id === id);
    if (!target) return;
    await setDoc(
      doc(db, 'users', user.uid, 'recurringExpenses', id),
      { ...target, enabled }
    );
  };

  const deleteRecurring = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'recurringExpenses', id));
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
    await setDoc(doc(db, 'users', user.uid, 'wheels', id), payload);
  };

  const deleteWheel = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'wheels', id));
  };

  const recordWheelSpin = async (wheelId: string, sliceId: string) => {
    if (!user) return;
    const w = wheels.find((x) => x.id === wheelId);
    if (!w) return;
    await setDoc(doc(db, 'users', user.uid, 'wheels', wheelId), {
      ...w,
      lastSpunAt: new Date().toISOString(),
      lastResultId: sliceId,
    });
  };

  const upsertSavingsGoal = async (
    g: Omit<SavingsGoal, 'uid' | 'createdAt'> & { id?: string; createdAt?: string }
  ) => {
    if (!user) return '';
    const id = g.id ?? crypto.randomUUID();
    const existing = savingsGoals.find((x) => x.id === id);
    const payload: SavingsGoal = {
      id,
      uid: user.uid,
      title: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      currency: g.currency,
      deadline: g.deadline,
      createdAt: existing?.createdAt ?? g.createdAt ?? new Date().toISOString(),
    };
    
    setSavingsGoals((prev) => {
      const updated = prev.filter(x => x.id !== id);
      updated.push(payload);
      localStorage.setItem(`mona_goals_${user.uid}`, JSON.stringify(updated));
      return updated;
    });
    return id;
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!user) return;
    setSavingsGoals((prev) => {
      const updated = prev.filter(x => x.id !== id);
      localStorage.setItem(`mona_goals_${user.uid}`, JSON.stringify(updated));
      return updated;
    });
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
    await setDoc(doc(db, 'users', user.uid, 'transactions', id), tx);
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
