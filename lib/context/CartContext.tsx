'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/lib/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FlyingItem {
  id: number;
  image: string;
  startX: number;
  startY: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, event?: React.MouseEvent) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  flyingItems: FlyingItem[];
  cartIconBouncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [cartIconBouncing, setCartIconBouncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('marine_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('marine_cart', JSON.stringify(cart));
      } catch {
        // ignore
      }
    }
  }, [cart, isMounted]);

  const addToCart = (product: Product, quantity = 1, event?: React.MouseEvent) => {
    // 1. Trigger Fly-to-Cart Animation if click coordinates exist
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      const newFlyItem: FlyingItem = {
        id: Date.now() + Math.random(),
        image: product.images[0] || '',
        startX,
        startY,
      };

      setFlyingItems((prev) => [...prev, newFlyItem]);

      // Remove flying item after 850ms animation and bounce cart icon
      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== newFlyItem.id));
        setCartIconBouncing(true);
        setTimeout(() => setCartIconBouncing(false), 600);
      }, 750);
    } else {
      setCartIconBouncing(true);
      setTimeout(() => setCartIconBouncing(false), 600);
    }

    // 2. Update cart items
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        flyingItems,
        cartIconBouncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
