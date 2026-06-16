/**
 * scripts/set-admin-claim.mjs — Asigna (o revoca) el rol admin a un usuario.
 *
 * El panel /admin exige el custom claim `admin: true`. Este script lo setea
 * fuera de banda usando el Admin SDK. Requiere credenciales de admin (ADC o
 * GOOGLE_APPLICATION_CREDENTIALS de theirgin).
 *
 *   node scripts/set-admin-claim.mjs <email> [--revoke]
 *
 * El usuario debe existir en Firebase Auth (créalo en la consola o por sign-up).
 * Tras correrlo, el usuario debe re-loguearse para que el nuevo token tenga el claim.
 */
import { getAuth } from 'firebase-admin/auth';
import { ensureAdminApp } from './_admin.mjs';

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!email) {
  console.error('Uso: node scripts/set-admin-claim.mjs <email> [--revoke]');
  process.exit(1);
}

ensureAdminApp();
const auth = getAuth();

async function main() {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, revoke ? { admin: false } : { admin: true });
  await auth.revokeRefreshTokens(user.uid);
  console.log(`✓ ${email} (${user.uid}) ahora ${revoke ? 'NO es' : 'es'} admin.`);
  console.log('  El usuario debe cerrar y volver a iniciar sesión.');
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error('✗ Falló:', err.message);
    process.exit(1);
  },
);
