import { NextResponse } from 'next/server';
import { createOrderServer, CheckoutError } from '@/lib/server/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createOrderServer({
      items: body?.items,
      customer: body?.customer,
      couponCode: body?.couponCode,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('create-order error', err);
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' }, { status: 500 });
  }
}
