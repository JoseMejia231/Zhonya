import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, SavingsGoal, RecurringExpense } from '../types';

export function useFirebaseSync(
  userId: string | undefined,
  dispatch: any,
  setSavingsGoals: (goals: SavingsGoal[]) => void,
  setRecurring: (recurring: RecurringExpense[]) => void
) {
  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      setSavingsGoals([]);
      setRecurring([]);
      return;
    }

    const txQ = query(
      collection(db, `users/${userId}/transactions`),
      orderBy('date', 'desc')
    );
    const unsubTx = onSnapshot(txQ, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      dispatch({ type: 'SET_TRANSACTIONS', payload: data });
    });

    const goalsQ = query(
      collection(db, `users/${userId}/savingsGoals`),
      orderBy('createdAt', 'asc')
    );
    const unsubGoals = onSnapshot(goalsQ, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsGoal[];
      setSavingsGoals(data);
    });

    const recurringQ = query(
      collection(db, `users/${userId}/recurring`),
      orderBy('createdAt', 'asc')
    );
    const unsubRecurring = onSnapshot(recurringQ, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecurringExpense[];
      setRecurring(data);
    });

    return () => {
      unsubTx();
      unsubGoals();
      unsubRecurring();
    };
  }, [userId, dispatch, setSavingsGoals, setRecurring]);
}
