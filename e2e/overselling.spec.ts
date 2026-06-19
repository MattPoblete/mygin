import { test, expect } from '@playwright/test';

/**
 * Overselling — verifica que createOrderServer (lib/server/checkout.ts) no sobre-vende
 * bajo concurrencia. La reserva de stock ocurre dentro de adminDb.runTransaction()
 * validando stock - stockReserved; este test lo prueba disparando N create-order en
 * paralelo contra un producto de stock conocido (mygin-concurrencia, stock 5).
 *
 * No usa página: el fixture `request` pega al endpoint contra el next dev + emulador
 * que levanta scripts/run-e2e.mjs.
 */

const STOCK = 5;
const N = 8;

const customer = {
  name: 'Cliente Concurrencia',
  email: 'concurrencia@test.local',
  phone: '+56912345678',
  address: { region: 'Araucanía', comuna: 'Villarrica', calle: 'Calle 1' },
};

test('N create-order en paralelo no sobre-venden el stock', async ({ request }) => {
  const fire = () =>
    request.post('/api/checkout/create-order', {
      data: { items: [{ productId: 'mygin-concurrencia', qty: 1 }], customer },
    });

  const responses = await Promise.all(Array.from({ length: N }, fire));
  const statuses = responses.map((r) => r.status());

  const ok = statuses.filter((s) => s === 200).length;
  const conflict = statuses.filter((s) => s === 409).length;
  const server = statuses.filter((s) => s >= 500).length;

  // Exactamente `STOCK` reservan; el resto choca con 409; cero 500 (la transacción
  // resuelve la contención sin romperse).
  expect(server).toBe(0);
  expect(ok).toBe(STOCK);
  expect(conflict).toBe(N - STOCK);
});
