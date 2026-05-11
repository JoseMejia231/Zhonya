import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Mantener la sesión abierta hasta que el usuario cierre sesión manualmente.
setPersistence(auth, indexedDBLocalPersistence).catch(() =>
  setPersistence(auth, browserLocalPersistence).catch((err) =>
    console.error('No se pudo establecer la persistencia de sesión:', err)
  )
);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred;
};
export const logout = () => signOut(auth);

// ---- Cloud Messaging ----

const VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) ?? '';

let messagingInstance: Messaging | null = null;

async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Pide permiso al usuario, obtiene un token FCM y lo asocia al SW de la PWA.
 * Devuelve el token o null si el usuario rechaza / el navegador no soporta push.
 */
export async function requestPushToken(): Promise<string | null> {
  if (!VAPID_KEY) {
    console.warn('VITE_FIREBASE_VAPID_KEY no está configurada. Push deshabilitado.');
    return null;
  }
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // Reutilizar el SW que ya registramos en main.tsx para evitar dos workers.
  const registration = await navigator.serviceWorker.ready;
  try {
    return await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error('No se pudo obtener el token FCM:', err);
    return null;
  }
}

/** Suscribe un callback a los mensajes recibidos mientras la app está en foreground. */
export async function onForegroundMessage(
  cb: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    cb({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data as Record<string, string> | undefined,
    });
  });
}

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();
