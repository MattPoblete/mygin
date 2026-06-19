import { test, expect } from '@playwright/test';

/**
 * Overselling — verifica que el callable `createOrder` (functions/src/flow/createOrder.ts)
 * no sobre-vende bajo concurrencia. La reserva de stock ocurre dentro de
 * db.runTransaction() validando stock - stockReserved; este test lo prueba disparando
 * N create-order en paralelo contra un producto de stock conocido (mygin-concurrencia,
 * stock 5).
 *
 * No usa página: el fixture `request` pega directo al callable en el emulador de
 * Functions (5001) que levanta scripts/run-e2e.mjs, usando el sobre del protocolo
 * callable ({ data: ... } → { result: ... }). Un oversell lanza HttpsError
 * 'failed-precondition' → el callable responde HTTP 400.
 */

const STOCK = 5;
const N = 8;

// URL del callable en el emulador: /{project}/{region}/{fn}.
const FN_URL = 'http://127.0.0.1:5001/theirgin/southamerica-west1/createOrder';

const customer = {
  name: 'Cliente Concurrencia',
  email: 'concurrencia@test.local',
  phone: '+56912345678',
  address: { region: 'Araucanía', comuna: 'Villarrica', calle: 'Calle 1' },
};

test('N create-order en paralelo no sobre-venden el stock', async ({ request }) => {
  const fire = () =>
    request.post(FN_URL, {
      // Sobre del protocolo callable: el payload real va bajo `data`.
      data: { data: { items: [{ productId: 'mygin-concurrencia', qty: 1 }], customer } },
    });

  const responses = await Promise.all(Array.from({ length: N }, fire));
  const statuses = responses.map((r) => r.status());

  const ok = statuses.filter((s) => s === 200).length;
  const conflict = statuses.filter((s) => s === 400).length;
  const server = statuses.filter((s) => s >= 500).length;

  // Exactamente `STOCK` reservan; el resto choca con 400 (failed-precondition);
  // cero 500 (la transacción resuelve la contención sin romperse).
  expect(server).toBe(0);
  expect(ok).toBe(STOCK);
  expect(conflict).toBe(N - STOCK);
});
