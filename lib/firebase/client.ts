/**
 * lib/firebase/client.ts — Firebase SDK del lado del cliente (navegador).
 *
 * La config se lee de variables de entorno `NEXT_PUBLIC_FIREBASE_*` (ver
 * `.env.local` / `.env.example`). Aunque la config web de Firebase es pública,
 * la mantenemos fuera del código fuente por higiene. La seguridad real la dan
 * las reglas de Firestore. Para operaciones privilegiadas se usa el Admin SDK
 * en Cloud Functions — NUNCA este módulo. Ver lib/firebase/admin.ts.
 */
import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Referencias estáticas a process.env.* — Next.js solo inlina NEXT_PUBLIC_* en el
// bundle del cliente cuando se accede de forma literal (no por índice dinámico).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    'Faltan variables NEXT_PUBLIC_FIREBASE_*. Copia .env.example a .env.local y complétalas.',
  );
}

const isNewApp = !getApps().length;
export const app: FirebaseApp = isNewApp ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Tests E2E: conecta al emulador (Firestore + Auth) cuando NEXT_PUBLIC_FIREBASE_EMULATOR=1.
// Solo en la primera init para no re-conectar en hot-reload.
if (isNewApp && process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === '1') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

/** Analytics solo en navegador y si el entorno lo soporta. Devuelve null en SSR. */
export async function getClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  return (await isSupported()) ? getAnalytics(app) : null;
}
