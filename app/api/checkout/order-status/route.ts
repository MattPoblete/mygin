import { NextResponse } from 'next/server';
import { getOrderStatusServer, CheckoutError } from '@/lib/server/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const orderId = new URL(req.url).searchParams.get('orderId') ?? '';
    const result = await getOrderStatusServer(orderId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('order-status error', err);
    return NextResponse.json({ error: 'No se pudo consultar el pedido.' }, { status: 500 });
  }
}
