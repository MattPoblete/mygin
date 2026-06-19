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
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { firebaseConfig, FUNCTIONS_REGION, USE_EMULATORS } from '@/lib/config';

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    'Faltan variables NEXT_PUBLIC_FIREBASE_*. Copia .env.example a .env.local y complétalas.',
  );
}

const isNewApp = !getApps().length;
export const app: FirebaseApp = isNewApp ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const functions: Functions = getFunctions(app, FUNCTIONS_REGION);

// Tests E2E: conecta a los emuladores (Firestore + Auth + Functions) cuando
// USE_EMULATORS. Solo en la primera init para no re-conectar en hot-reload.
if (isNewApp && USE_EMULATORS) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

/** Analytics solo en navegador y si el entorno lo soporta. Devuelve null en SSR. */
export async function getClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  return (await isSupported()) ? getAnalytics(app) : null;
}
