/**
 * functions/src/flow/secrets.test.ts — Self-check de la selección de credenciales.
 *
 * Rama de dinero/seguridad: verifica que el modo mapea al par correcto y que la
 * base URL de Flow concuerda con el modo. Sin framework; correr tras el build:
 *   node functions/lib/flow/secrets.test.js
 */
import assert from 'node:assert/strict';
import { pickCreds } from './secrets.js';
import { flowApiBase } from '../shared/config.js';

function demo(): void {
  const pairs = {
    sandbox: { apiKey: 'sb-key', secretKey: 'sb-secret' },
    production: { apiKey: 'pr-key', secretKey: 'pr-secret' },
  };

  assert.deepEqual(pickCreds('sandbox', pairs), pairs.sandbox);
  assert.deepEqual(pickCreds('production', pairs), pairs.production);
  assert.throws(() => pickCreds('mock', pairs), /mock/);

  // flowApiBase deriva de PAYMENTS_MODE.
  process.env.PAYMENTS_MODE = 'production';
  assert.equal(flowApiBase(), 'https://www.flow.cl/api');
  process.env.PAYMENTS_MODE = 'sandbox';
  assert.equal(flowApiBase(), 'https://sandbox.flow.cl/api');
  process.env.PAYMENTS_MODE = 'mock';
  assert.equal(flowApiBase(), 'https://sandbox.flow.cl/api');

  console.log('secrets.test.ts OK');
}

demo();
