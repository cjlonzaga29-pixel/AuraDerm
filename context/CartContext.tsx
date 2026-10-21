"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/types/store";
import { addMoney, multiplyMoney } from "@/lib/money";

// v1 held demo skincare items with fictional prices. Bumping the version drops
// them instead of mapping them onto the real catalog; only the stale v1 key is
// removed, other storage is left alone.
const CART_STORAGE_KEY = "auraderm_cart_v2";
const STALE_CART_KEYS = ["auraderm_cart_v1"];

export interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: number;
  subtotalMinor: number;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

// The cart lives in a small external store read through useSyncExternalStore:
// the server and the hydration render both see the empty server snapshot, then
// React re-renders with the stored cart — no setState-in-effect sync step.
// Storage is only written on a cart change, which starts from the restored
// cart, so an empty initial render can never overwrite a saved cart.
const EMPTY_CART: CartItem[] = [];
let cartSnapshot: CartItem[] | null = null;
const cartListeners = new Set<() => void>();

function getCartSnapshot(): CartItem[] {
  cartSnapshot ??= readStoredCart();
  return cartSnapshot;
}

function getServerCartSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

function updateCart(update: (prev: CartItem[]) => CartItem[]) {
  const next = update(getCartSnapshot());
  if (next === cartSnapshot) return;
  cartSnapshot = next;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory cart for this session.
  }
  for (const listener of cartListeners) listener();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      for (const key of STALE_CART_KEYS) window.localStorage.removeItem(key);
    } catch {
      // Storage unavailable: nothing to clean up.
    }
  }, []);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    updateCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      const newItem: CartItem = {
        productId: product.id,
        handle: product.handle,
        title: product.title,
        priceMinor: product.priceMinor,
        quantity,
        volume: product.volume,
        image: product.images[0]?.src ?? "",
      };
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    updateCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    updateCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => updateCart(() => []), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const itemCount = useMemo(
    () => (items.length ? addMoney(...items.map((item) => item.quantity)) : 0),
    [items]
  );

  const subtotalMinor = useMemo(
    () =>
      items.length
        ? addMoney(...items.map((item) => multiplyMoney(item.priceMinor, item.quantity)))
        : 0,
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      itemCount,
      subtotalMinor,
    }),
    [
      items,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      itemCount,
      subtotalMinor,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
