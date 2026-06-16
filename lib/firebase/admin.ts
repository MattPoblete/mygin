/**
 * lib/firebase/admin.ts — Firebase Admin SDK (PRIVILEGIADO, solo servidor).
 *
 * ⚠️ NUNCA importar este módulo desde un componente cliente ni desde código que
 * llegue al bundle del navegador. El Admin SDK bypassa las reglas de seguridad
 * de Firestore y usa credenciales de servicio.
 *
 * Uso: Cloud Functions y, si aplica, Server Components / route handlers que
 * necesiten lecturas/escrituras privilegiadas (stock, órdenes).
 *
 * Credenciales: vía Application Default Credentials (ADC) en GCP, o la variable
 * de entorno GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_SERVICE_ACCOUNT en local.
 * NUNCA hardcodear la service account ni commitearla.
 *
 * Nota: requiere `firebase-admin` (se instala en functions/). Este archivo es el
 * punto único de inicialización compartido.
 */
import 'server-only';
import { getApps, initializeApp, applicationDefault, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// ponytail: esqueleto privilegiado de Oleada 1. Aún no lo importa ningún módulo
// de la app (las escrituras de admin van por el client SDK + reglas). Se activa
// cuando una Server Component / route handler necesite bypassear las reglas.

function resolveCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return cert(JSON.parse(raw));
    } catch {
      // cae a ADC si el JSON es inválido
    }
  }
  return applicationDefault();
}

export const adminApp: App = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: resolveCredential(), projectId: 'theirgin' });

export const adminDb: Firestore = getFirestore(adminApp);
// Ignora campos undefined al escribir (p.ej. customer.rut opcional) en vez de
// fallar. Debe configurarse antes de la primera operación de Firestore.
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // settings ya aplicado (módulo re-evaluado) — sin efecto.
}
export const adminAuth: Auth = getAuth(adminApp);
