/**
 * functions/src/flow/flowClient.ts — Cliente HTTP de la API de Flow.cl.
 *
 * Flow firma cada request: se ordenan TODOS los params alfabéticamente por
 * nombre, se concatenan `nombre+valor` (sin separadores), se calcula
 * HMAC-SHA256 con la secretKey, y el hex resultante viaja como param `s`.
 * Los requests POST van como application/x-www-form-urlencoded; los GET llevan
 * los params (incluido `s`) en la query string.
 *
 * Las llaves NUNCA se hardcodean: llegan vía Secret Manager (defineSecret) y se
 * pasan a estas funciones como argumentos.
 */
import { createHmac } from 'node:crypto';
import { flowApiBase } from '../shared/config.js';

/** Firma Flow: params ordenados alfabéticamente, concatenados nombre+valor, HMAC-SHA256 hex. */
export function signParams(params: Record<string, string>, secretKey: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join('');
  return createHmac('sha256', secretKey).update(toSign).digest('hex');
}

interface FlowCreds {
  apiKey: string;
  secretKey: string;
}

export interface CreatePaymentInput {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}

export interface CreatePaymentResult {
  url: string;
  token: string;
  flowOrder: number;
  /** URL final a la que redirigir al cliente. */
  redirectUrl: string;
}

/** POST /payment/create. Devuelve url+token+flowOrder y la redirectUrl ya armada. */
export async function createPayment(
  input: CreatePaymentInput,
  creds: FlowCreds,
): Promise<CreatePaymentResult> {
  const params: Record<string, string> = {
    apiKey: creds.apiKey,
    commerceOrder: input.commerceOrder,
    subject: input.subject,
    currency: 'CLP',
    amount: String(input.amount),
    email: input.email,
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
  };
  params.s = signParams(params, creds.secretKey);

  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${flowApiBase()}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as { url?: string; token?: string; flowOrder?: number; message?: string };
  if (!res.ok || !data.url || !data.token) {
    throw new Error(`Flow createPayment falló: ${data.message ?? res.status}`);
  }
  return {
    url: data.url,
    token: data.token,
    flowOrder: data.flowOrder ?? 0,
    redirectUrl: `${data.url}?token=${data.token}`,
  };
}

export interface FlowStatus {
  /** 1 pendiente, 2 pagado, 3 rechazado, 4 anulado. */
  status: number;
  commerceOrder?: string;
  flowOrder?: number;
  amount?: number;
  raw: Record<string, unknown>;
}

/** GET /payment/getStatus. Fuente de verdad del estado de un pago. */
export async function getStatus(token: string, creds: FlowCreds): Promise<FlowStatus> {
  const params: Record<string, string> = { apiKey: creds.apiKey, token };
  params.s = signParams(params, creds.secretKey);
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${flowApiBase()}/payment/getStatus?${qs}`, { method: 'GET' });
  const data = (await res.json()) as Record<string, unknown> & { status?: number; message?: string };
  if (!res.ok || typeof data.status !== 'number') {
    throw new Error(`Flow getStatus falló: ${data.message ?? res.status}`);
  }
  return {
    status: data.status,
    commerceOrder: typeof data.commerceOrder === 'string' ? data.commerceOrder : undefined,
    flowOrder: typeof data.flowOrder === 'number' ? data.flowOrder : undefined,
    amount: typeof data.amount === 'number' ? data.amount : undefined,
    raw: data,
  };
}
