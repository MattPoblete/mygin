'use client';

/**
 * lib/cart/CartProvider.tsx — Estado global del carrito.
 *
 * Context + useReducer, persistido en localStorage (key `mygin_cart`). La
 * hidratación corre solo en el navegador (guard SSR) para evitar desajustes de
 * render entre servidor y cliente. Los precios son solo para mostrar; el total
 * real lo calcula el checkout server-side (worktree B).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import type { Product } from '@/lib/types';
import type { CartItem } from '@/lib/types.cart';

const STORAGE_KEY = 'mygin_cart';

type CartState = { items: CartItem[] };

type CartAction =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; item: CartItem }
  | { type: 'remove'; productId: string }
  | { type: 'setQty'; productId: string; qty: number }
  | { type: 'clear' };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items };
    case 'add': {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, qty: i.qty + action.item.qty }
              : i,
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case 'remove':
      return { items: state.items.filter((i) => i.productId !== action.productId) };
    case 'setQty': {
      if (action.qty <= 0) {
        return { items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, qty: action.qty } : i,
        ),
      };
    }
    case 'clear':
      return { items: [] };
    default:
      return state;
  }
}

export interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  /** Suma de unitPrice * qty (solo display, en CLP). */
  subtotal: number;
  /** Número total de unidades en el carrito. */
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is CartItem =>
          i &&
          typeof i.productId === 'string' &&
          typeof i.qty === 'number' &&
          typeof i.unitPrice === 'number',
      )
      .map((i) => ({ ...i, qty: Math.max(1, Math.floor(i.qty)) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const hydrated = useRef(false);

  // Hidratación: solo en navegador, una vez.
  useEffect(() => {
    dispatch({ type: 'hydrate', items: readStorage() });
    hydrated.current = true;
  }, []);

  // Persistencia: solo tras hidratar (evita pisar localStorage con el estado inicial vacío).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Cuota llena o storage deshabilitado: ignorar.
    }
  }, [state.items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = state.items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
    const count = state.items.reduce((acc, i) => acc + i.qty, 0);
    return {
      items: state.items,
      subtotal,
      count,
      addItem: (product, qty = 1) =>
        dispatch({
          type: 'add',
          item: {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images?.[0] ?? '',
            unitPrice: product.price,
            qty: Math.max(1, Math.floor(qty)),
          },
        }),
      removeItem: (productId) => dispatch({ type: 'remove', productId }),
      setQty: (productId, qty) => dispatch({ type: 'setQty', productId, qty }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>.');
  return ctx;
}
