import { NextResponse } from 'next/server';
import { validateCouponServer, CheckoutError } from '@/lib/server/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await validateCouponServer(body?.code, body?.subtotal);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ valid: false, reason: err.message }, { status: 200 });
    }
    console.error('validate-coupon error', err);
    return NextResponse.json({ valid: false, reason: 'No se pudo validar el cupón.' }, { status: 200 });
  }
}
