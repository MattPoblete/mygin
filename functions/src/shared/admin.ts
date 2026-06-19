/**
 * functions/src/shared/admin.ts — Inicialización única del Admin SDK.
 *
 * Se importa desde cualquier función para obtener Firestore con el Admin SDK ya
 * inicializado. initializeApp() corre una sola vez por instancia.
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();

export const db = getFirestore();
// Ignora campos undefined al escribir (p.ej. customer.rut opcional) en vez de
// fallar. Debe configurarse antes de la primera operación de Firestore.
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch {
  // settings ya aplicado (instancia re-evaluada) — sin efecto.
}
