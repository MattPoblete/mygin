import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { settleOrder } from '@/lib/server/checkout';

/**
 * POST /api/checkout/expire-orders — cancela órdenes colgadas en `awaiting_payment`
 * por más de 24h, liberando su `stockReserved` (reusa settleOrder en transacción).
 *
 * Pensado para un cron externo (cron-job.org / GitHub Actions) que llame cada ~1h con
 * el header `x-cron-secret`. Protegido por CRON_SECRET porque muta órdenes.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cutoff = Date.now() - DAY_MS;
  // ponytail: filtra el corte por createdAt en código para no exigir un índice compuesto
  // (status + createdAt). Si las awaiting_payment crecen mucho, crear el índice y usar
  // .where('createdAt', '<', Timestamp.fromMillis(cutoff)).
  const snap = await adminDb.collection('orders').where('status', '==', 'awaiting_payment').get();

  let cancelled = 0;
  for (const d of snap.docs) {
    const createdAt = d.get('createdAt') as { toMillis(): number } | undefined;
    if (createdAt && createdAt.toMillis() < cutoff) {
      if ((await settleOrder(d.id, false)) === 'cancelled') cancelled++;
    }
  }

  return NextResponse.json({ checked: snap.size, cancelled });
}
