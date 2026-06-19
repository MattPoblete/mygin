/**
 * lib/config.ts — Configuración del frontend leída del entorno.
 *
 * Centraliza las variables de configuración (NEXT_PUBLIC_* y ajustes de
 * despliegue) que antes vivían inline en lib/firebase/client.ts. La config web
 * de Firebase es pública; la seguridad real la dan las reglas de Firestore. Las
 * constantes de dominio (no de entorno) van en lib/constants.ts.
 */

/**
 * Región de las Cloud Functions (callables de checkout). Debe coincidir con
 * `REGION` en functions/src/shared/config.ts y con firebase.json.
 */
export const FUNCTIONS_REGION = 'southamerica-west1';

/** Conectar a los emuladores locales (tests E2E) cuando NEXT_PUBLIC_FIREBASE_EMULATOR=1. */
export const USE_EMULATORS = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === '1';

/**
 * Config web de Firebase. Referencias literales a process.env.NEXT_PUBLIC_*:
 * Next.js solo inlina estas variables en el bundle del cliente cuando se accede
 * de forma literal (no por índice dinámico).
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
