import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { RecurringExpense } from '../types';
import { format, isSameMonth } from 'date-fns';

export function useFinanceRecurring(user: User | null) {
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);

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

  const isPermissionDenied = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'permission-denied';

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
    if (!user) {
      setRecurring([]);
      return;
    }
    const recurringRef = collection(db, 'users', user.uid, 'recurringExpenses');
    const recurringQuery = query(recurringRef, where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(recurringQuery, (snapshot) => {
      setRecurring(snapshot.docs.map((d) => d.data() as RecurringExpense));
    });
    return unsubscribe;
  }, [user]);

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
      { ...target, enabled },
      { merge: true }
    );
  };

  const deleteRecurring = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'recurringExpenses', id));
  };

  // Utilities
  const isRecurringPaidThisPeriod = (
    recurringId: string,
    transactions: any[],
    periodKey?: string
  ): boolean => {
    const r = recurring.find((x) => x.id === recurringId);
    if (!r) return false;
    
    // Logic from original file to check if paid
    const now = new Date();
    if (r.frequency === 'monthly') {
      const monthTx = transactions.filter((t) => isSameMonth(new Date(t.date), now));
      return monthTx.some((t) => t.recurringId === r.id);
    }
    
    if (r.frequency === 'weekly' && periodKey) {
      return transactions.some((t) => t.recurringId === r.id && t.recurringPeriodKey === periodKey);
    }
    
    if (r.frequency === 'daily') {
      const todayStr = format(now, 'yyyy-MM-dd');
      return transactions.some((t) => t.recurringId === r.id && t.date.startsWith(todayStr));
    }
    
    return false;
  };

  return {
    recurring,
    upsertRecurring,
    toggleRecurring,
    deleteRecurring,
    isRecurringPaidThisPeriod,
  };
}
