import { NextResponse } from 'next/server';
import { settleOrder, isMockMode, CheckoutError } from '@/lib/server/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Confirma (acepta/rechaza) un pago SIMULADO. Deshabilitado si PAYMENTS_MODE=live. */
export async function POST(req: Request) {
  try {
    if (!isMockMode()) {
      return NextResponse.json({ error: 'El pago simulado está deshabilitado.' }, { status: 403 });
    }
    const body = await req.json();
    const orderId = body?.orderId;
    const decision = body?.decision;
    if (typeof orderId !== 'string' || !orderId) {
      throw new CheckoutError('orderId requerido.');
    }
    if (decision !== 'accept' && decision !== 'reject') {
      throw new CheckoutError('decision debe ser "accept" o "reject".');
    }
    const status = await settleOrder(orderId, decision === 'accept');
    return NextResponse.json({ status });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('mock-confirm error', err);
    return NextResponse.json({ error: 'No se pudo procesar el pago.' }, { status: 500 });
  }
}
