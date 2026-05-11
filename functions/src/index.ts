import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

const DEBUG_TOKEN = 'zc-debug-7q3w-fr8x'; // efímero, se elimina tras el diagnóstico

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const TIME_ZONE = 'America/Santo_Domingo';
const WINDOW_MINUTES = 1;

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const lastDayOfMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

interface RecurringExpenseDoc {
  id: string;
  uid: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfMonth?: number;
  daysOfWeek?: number[];
  notifyTime: string;
  enabled: boolean;
  createdAt: string;
  lastNotifiedKey?: string;
}

/** Devuelve "ahora" como Date pero con sus campos en zona TIME_ZONE. */
function localNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIME_ZONE }));
}

/** Convierte "HH:mm" a minutos desde 00:00. Devuelve null si parseo falla. */
function timeToMinutes(t: string): number | null {
  const m = /^([0-2]\d):([0-5]\d)$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23) return null;
  return h * 60 + mm;
}

/**
 * Cron cada 15 min. Procesa cada gasto fijo activo cuyo día (según frequency)
 * sea hoy y cuya hora caiga en la ventana (now - 15min, now]. Idempotente vía
 * lastNotifiedKey ("YYYY-MM-DD" para diario/semanal, "YYYY-MM" para mensual).
 */
export const sendRecurringReminders = onSchedule(
  {
    schedule: '* * * * *',
    timeZone: TIME_ZONE,
    region: 'us-central1',
    retryCount: 1,
  },
  async () => {
    const now = localNow();
    const today = now.getDate();
    const todayDow = now.getDay();
    const isLastDay = today === lastDayOfMonth(now.getFullYear(), now.getMonth());
    const currentMonthKey = monthKey(now);
    const currentDateKey = dateKey(now);
    const windowMs = WINDOW_MINUTES * 60_000;
    const windowStartTs = now.getTime() - windowMs; // exclusivo

    const snap = await db
      .collectionGroup('recurringExpenses')
      .where('enabled', '==', true)
      .get();

    logger.info(
      `Tick ${currentDateKey} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')} · activas=${snap.size}`
    );

    let sent = 0;
    let processed = 0;

    for (const ref of snap.docs) {
      const rec = ref.data() as RecurringExpenseDoc;

      // Validar la hora configurada y comprobar la ventana actual. Comprobamos
      // contra la hora "de hoy" y "de ayer" para cubrir wrap-around alrededor
      // de medianoche (ej. notifyTime=23:55 detectado por el tick 00:00).
      const scheduledMinutes = timeToMinutes(rec.notifyTime ?? '09:00');
      if (scheduledMinutes === null) continue;
      const todayScheduled = new Date(now);
      todayScheduled.setHours(Math.floor(scheduledMinutes / 60), scheduledMinutes % 60, 0, 0);
      const yesterdayScheduled = new Date(todayScheduled.getTime() - 24 * 60 * 60_000);
      const inWindow =
        (todayScheduled.getTime() > windowStartTs &&
          todayScheduled.getTime() <= now.getTime()) ||
        (yesterdayScheduled.getTime() > windowStartTs &&
          yesterdayScheduled.getTime() <= now.getTime());
      if (!inWindow) continue;

      // ¿Coincide con el día según frequency?
      let dayMatches = false;
      let expectedKey = '';
      if (rec.frequency === 'daily') {
        dayMatches = true;
        expectedKey = currentDateKey;
      } else if (rec.frequency === 'weekly') {
        dayMatches = (rec.daysOfWeek ?? []).includes(todayDow);
        expectedKey = currentDateKey;
      } else if (rec.frequency === 'monthly') {
        const day = rec.dayOfMonth ?? 0;
        dayMatches = day === today || (isLastDay && day > today);
        expectedKey = currentMonthKey;
      }
      if (!dayMatches) continue;
      if (rec.lastNotifiedKey === expectedKey) continue;

      processed += 1;
      const userPath = ref.ref.parent.parent;
      if (!userPath) continue;

      const tokensSnap = await userPath.collection('pushTokens').get();
      const tokens = tokensSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.id);

      const verb = rec.type === 'income' ? 'Ingreso' : 'Pago';
      const formattedAmount = new Intl.NumberFormat('es', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rec.amount);
      const periodicity =
        rec.frequency === 'daily'
          ? 'diario'
          : rec.frequency === 'weekly'
          ? 'semanal'
          : 'programado';
      const title = `${verb} ${periodicity}: ${rec.name}`;
      const body = `${rec.name} · ${formattedAmount} (${rec.category})`;

      if (tokens.length > 0) {
        const response = await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: {
            recurringId: rec.id,
            periodKey: expectedKey,
            tag: `mona-recurring-${rec.id}-${expectedKey}`,
            type: rec.type,
            frequency: rec.frequency,
          },
          webpush: {
            fcmOptions: { link: '/' },
            notification: {
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              requireInteraction: true,
              actions: [
                { action: 'paid', title: 'Pagado' },
                { action: 'skip', title: 'Aún no' },
              ],
            },
          },
        });
        sent += response.successCount;

        const stale: Promise<unknown>[] = [];
        response.responses.forEach((r: admin.messaging.SendResponse, idx: number) => {
          if (!r.success) {
            const code = r.error?.code ?? '';
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              stale.push(userPath.collection('pushTokens').doc(tokens[idx]).delete());
            } else {
              logger.warn('Fallo enviando push', { token: tokens[idx], code });
            }
          }
        });
        await Promise.all(stale);
      } else {
        logger.info(`Usuario sin tokens push: ${userPath.id}`);
      }

      await ref.ref.update({ lastNotifiedKey: expectedKey });
    }

    if (processed > 0) {
      logger.info(`Resumen: procesadas=${processed}, push=${sent}.`);
    }
  }
);

/**
 * Endpoint temporal de diagnóstico. Devuelve el estado de las recurrencias y
 * tokens push. Protegido con un token simple en query string.
 */
export const debugZencash = onRequest(
  { region: 'us-central1', cors: true },
  async (req: any, res: any) => {
    if (req.query.token !== DEBUG_TOKEN) {
      res.status(401).send('forbidden');
      return;
    }

    try {
      const recurringSnap = await db.collectionGroup('recurringExpenses').get();
      const recurring = recurringSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = d.data();
        return {
          path: d.ref.path,
          name: data.name,
          frequency: data.frequency,
          notifyTime: data.notifyTime,
          enabled: data.enabled,
          dayOfMonth: data.dayOfMonth ?? null,
          dayOfWeek: data.dayOfWeek ?? null,
          lastNotifiedKey: data.lastNotifiedKey ?? null,
        };
      });

      const tokensSnap = await db.collectionGroup('pushTokens').get();
      const tokens = tokensSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: d.id,
        path: d.ref.path,
        userAgent: (d.data().userAgent || '').slice(0, 80),
        createdAt: d.data().createdAt,
      }));

      const now = new Date(new Date().toLocaleString('en-US', { timeZone: TIME_ZONE }));

      // Forzar envío de push de prueba a TODOS los tokens si ?fire=1
      let fireResult: unknown = null;
      if (req.query.fire === '1') {
        const tokenIds = tokens.map((t: {id: string; path: string; userAgent: string; createdAt: any}) => t.id);
        const minimal = req.query.minimal === '1';
        const response = await messaging.sendEachForMulticast({
          tokens: tokenIds,
          notification: {
            title: '🧪 MONA - Prueba',
            body: 'Si ves esto, el push funciona.',
          },
          ...(minimal
            ? {}
            : {
                data: { recurringId: 'debug-test', tag: 'mona-debug' },
                webpush: {
                  headers: { Urgency: 'high', TTL: '300' },
                  fcmOptions: { link: '/' },
                  notification: {
                    icon: '/favicon.svg',
                    badge: '/favicon.svg',
                  },
                },
              }),
        });
        fireResult = {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses.map((r: admin.messaging.SendResponse, i: number) => ({
            tokenIndex: i,
            success: r.success,
            messageId: r.messageId ?? null,
            errorCode: r.error?.code ?? null,
            errorMessage: r.error?.message ?? null,
          })),
        };
      }

      // Wipe destructivo. Requiere ?wipe=1&confirm=YES además del token.
      let wipeResult: unknown = null;
      if (req.query.wipe === '1' && req.query.confirm === 'YES') {
        const collections = ['transactions', 'recurringExpenses', 'wheels', 'pushTokens'];
        const counts: Record<string, number> = {};
        for (const col of collections) {
          const snap = await db.collectionGroup(col).get();
          counts[col] = snap.size;
          // Borrar en lotes de 400 para no exceder el límite de batch.
          for (let i = 0; i < snap.docs.length; i += 400) {
            const batch = db.batch();
            snap.docs.slice(i, i + 400).forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(d.ref));
            await batch.commit();
          }
        }
        // Borrar también los docs settings/current de cada usuario.
        const settingsSnap = await db.collectionGroup('settings').get();
        counts['settings'] = settingsSnap.size;
        for (let i = 0; i < settingsSnap.docs.length; i += 400) {
          const batch = db.batch();
          settingsSnap.docs.slice(i, i + 400).forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(d.ref));
          await batch.commit();
        }
        wipeResult = { deleted: counts };
      }

      res.json({
        ok: true,
        nowLocal: now.toISOString(),
        recurringCount: recurring.length,
        recurring,
        pushTokenCount: tokens.length,
        tokens,
        fireResult,
        wipeResult,
      });
    } catch (err: unknown) {
      const e = err as Error;
      res.status(500).json({ ok: false, error: e.message, stack: e.stack });
    }
  }
);
