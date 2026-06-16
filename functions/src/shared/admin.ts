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
