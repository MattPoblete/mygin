/**
 * functions/src/shared/config.ts — Configuración de despliegue y entorno.
 *
 * Centraliza la región y las bases de URL/API que antes vivían como literales o
 * lecturas de process.env dispersas en cada función. Las constantes de dominio
 * (precios, minutos de reserva) van en shared/constants.ts.
 */

/**
 * Región de las Cloud Functions. Debe coincidir con firebase.json y con
 * FUNCTIONS_REGION en lib/config.ts (frontend).
 */
export const REGION = 'southamerica-west1';

/**
 * Región para funciones programadas (Cloud Scheduler). Santiago
 * (southamerica-west1) aún no tiene Scheduler; São Paulo sí. La región del cron
 * no afecta latencia: solo lee/escribe Firestore.
 */
export const SCHEDULER_REGION = 'southamerica-east1';

/** Project id activo de Firebase/GCP (default theirgin). */
export function projectId(): string {
  return process.env.GCLOUD_PROJECT || 'theirgin';
}

/** Base pública de las Cloud Functions (urlConfirmation del webhook de Flow). */
export function functionsBase(): string {
  return process.env.FLOW_FUNCTIONS_BASE || `https://${REGION}-${projectId()}.cloudfunctions.net`;
}

/** Base pública del sitio (urlReturn de Flow). */
export function siteBase(): string {
  return process.env.SITE_BASE_URL || `https://${projectId()}.web.app`;
}

/** Base de la API de Flow. Sandbox por defecto; prod vía env FLOW_API_BASE. */
export function flowApiBase(): string {
  return process.env.FLOW_API_BASE || 'https://sandbox.flow.cl/api';
}
