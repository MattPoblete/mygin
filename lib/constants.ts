/**
 * lib/constants.ts — Constantes de dominio del frontend.
 *
 * Valores fijos (no de entorno) que antes vivían dispersos como literales en
 * páginas y componentes. La configuración de despliegue/entorno va en
 * lib/config.ts; aquí solo constantes de negocio/UI.
 */

/**
 * Tarifa plana de despacho en CLP. ESPEJO solo-display de `SHIPPING_FLAT_CLP`
 * en functions/src/shared/constants.ts, que es la FUENTE DE VERDAD: el cliente
 * nunca dicta el precio de envío (lo calcula el servidor al crear la orden).
 * Si cambia uno, cambia el otro.
 */
export const SHIPPING_FLAT_CLP = 3990;

// Nota: el ISR (`export const revalidate`) NO puede leerse de una constante
// importada — Next exige un literal estáticamente analizable. Va inline en cada
// página (blog/equipo/sitemap = 300; catálogo = force-dynamic).

/** Timeout del popup de pago: tras esto damos el pago por colgado (ms). */
export const PAY_TIMEOUT_MS = 5 * 60 * 1000;

/** Backoff (ms) entre auto-consultas del estado de la orden en /checkout/retorno. */
export const ORDER_POLL_DELAYS = [1500, 2500, 4000, 6000];

/**
 * Máximo de caracteres del cuerpo de una reseña. Debe coincidir con la regla de
 * Firestore (`body` ≤ 2000) en firestore.rules.
 */
export const REVIEW_MAX_BODY = 2000;
