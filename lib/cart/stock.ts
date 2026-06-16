import type { Product } from '@/lib/types';

/** Stock disponible = físico - reservado (nunca negativo). */
export function availableStock(p: Pick<Product, 'stock' | 'stockReserved'>): number {
  return Math.max(0, (p.stock ?? 0) - (p.stockReserved ?? 0));
}

/** Hay stock para vender. */
export function inStock(p: Pick<Product, 'stock' | 'stockReserved'>): boolean {
  return availableStock(p) > 0;
}

/** True si conviene mostrar "Últimas N unidades". */
export function isLowStock(
  p: Pick<Product, 'stock' | 'stockReserved' | 'lowStockThreshold'>,
): boolean {
  const avail = availableStock(p);
  return avail > 0 && avail <= (p.lowStockThreshold ?? 0);
}
