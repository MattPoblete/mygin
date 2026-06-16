/**
 * scripts/_admin.mjs — Inicialización compartida del Firebase Admin SDK para los
 * scripts de mantenimiento (seed, set-admin-claim).
 *
 * Credenciales vía Application Default Credentials o GOOGLE_APPLICATION_CREDENTIALS
 * apuntando a una service account de theirgin.
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';

export const PROJECT_ID = 'theirgin';

export function ensureAdminApp() {
  return getApps().length
    ? getApps()[0]
    : initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}
