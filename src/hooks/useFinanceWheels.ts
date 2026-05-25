import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Wheel } from '../types';

export function useFinanceWheels(user: User | null) {
  const [wheels, setWheels] = useState<Wheel[]>([]);

  useEffect(() => {
    if (!user) {
      setWheels([]);
      return;
    }
    const wheelsRef = collection(db, 'users', user.uid, 'wheels');
    const wheelsQuery = query(wheelsRef, where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(wheelsQuery, (snapshot) => {
      setWheels(snapshot.docs.map((d) => d.data() as Wheel));
    });
    return unsubscribe;
  }, [user]);

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
    const existing = wheels.find((x) => x.id === wheelId);
    if (!existing) return;
    await setDoc(
      doc(db, 'users', user.uid, 'wheels', wheelId),
      {
        ...existing,
        lastSpunAt: new Date().toISOString(),
        lastResultId: sliceId,
      },
      { merge: true }
    );
  };

  return {
    wheels,
    upsertWheel,
    deleteWheel,
    recordWheelSpin,
  };
}
