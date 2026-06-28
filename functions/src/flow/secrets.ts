/**
 * functions/src/flow/secrets.ts — Credenciales de Flow por ambiente.
 *
 * Dos pares de secretos coexisten en Secret Manager (sandbox + producción), así
 * que promover a prod = cambiar `PAYMENTS_MODE`, sin re-subir secretos. El par
 * usado en runtime lo decide `paymentsMode()`: imposible mezclar una key de
 * sandbox con la URL de producción (ambos derivan del mismo modo).
 *
 * Las llaves NUNCA se hardcodean: llegan vía defineSecret (.value() en runtime).
 * Los cuatro secretos deben EXISTIR para deployar (firebase deploy lo exige),
 * aunque en modo mock no se lean — usar dummies si solo se necesita mock.
 */
import { defineSecret } from 'firebase-functions/params';
import { paymentsMode, type PaymentsMode } from '../shared/payments.js';

export const FLOW_SANDBOX_API_KEY = defineSecret('FLOW_SANDBOX_API_KEY');
export const FLOW_SANDBOX_SECRET_KEY = defineSecret('FLOW_SANDBOX_SECRET_KEY');
export const FLOW_PRODUCTION_API_KEY = defineSecret('FLOW_PRODUCTION_API_KEY');
export const FLOW_PRODUCTION_SECRET_KEY = defineSecret('FLOW_PRODUCTION_SECRET_KEY');

/** Enlazar en la config de cada función que llame a Flow (onCall/onRequest). */
export const FLOW_SECRETS = [
  FLOW_SANDBOX_API_KEY,
  FLOW_SANDBOX_SECRET_KEY,
  FLOW_PRODUCTION_API_KEY,
  FLOW_PRODUCTION_SECRET_KEY,
];

export interface FlowCreds {
  apiKey: string;
  secretKey: string;
}

interface CredPair {
  apiKey: string;
  secretKey: string;
}

/** Mapeo puro modo→par (testeable sin runtime de secretos). */
export function pickCreds(
  mode: PaymentsMode,
  pairs: { sandbox: CredPair; production: CredPair },
): FlowCreds {
  if (mode === 'production') return pairs.production;
  if (mode === 'sandbox') return pairs.sandbox;
  throw new Error('flowCreds() no debe llamarse en modo mock.');
}

/** Credenciales de Flow para el modo activo. Lanza en modo mock. */
export function flowCreds(): FlowCreds {
  return pickCreds(paymentsMode(), {
    sandbox: {
      apiKey: FLOW_SANDBOX_API_KEY.value(),
      secretKey: FLOW_SANDBOX_SECRET_KEY.value(),
    },
    production: {
      apiKey: FLOW_PRODUCTION_API_KEY.value(),
      secretKey: FLOW_PRODUCTION_SECRET_KEY.value(),
    },
  });
}
