// context/CartContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { Product, ProductVariant } from "./ProductsContext";

export type CartItem = {
  id: string;
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  unitPrice: number;
};

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: Product, variant?: ProductVariant | null, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  getCartItemId: (productId: string, variantId?: string | null) => string | undefined;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 1️⃣ fetchCart — no deps on other callbacks
  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id, quantity,
          product:products(*, category:categories(id, name)),
          variant:product_variants(id, price_override, stock, sku)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const shaped: CartItem[] = (data ?? []).map((row: any) => ({
        id: row.id,
        product: {
          ...row.product,
          category_name: row.product?.category?.name ?? null,
          images: Array.isArray(row.product?.images) ? row.product.images : [],
          rating: row.product?.rating ?? 0,
          review_count: row.product?.review_count ?? 0,
        },
        variant: row.variant ?? null,
        quantity: row.quantity,
        unitPrice: row.variant?.price_override ?? row.product?.price ?? 0,
      }));

      setItems(shaped);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // 2️⃣ getCartItemId
  const getCartItemId = useCallback((productId: string, variantId?: string | null) => {
    return items.find(i =>
      i.product.id === productId &&
      (variantId ? i.variant?.id === variantId : i.variant === null)
    )?.id;
  }, [items]);

  // 3️⃣ removeFromCart — no dep on updateQuantity
  const removeFromCart = useCallback(async (cartItemId: string) => {
    setItems(prev => prev.filter(i => i.id !== cartItemId));
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
      if (error) throw error;
    } catch (err) {
      console.error("Error removing from cart:", err);
      await fetchCart();
      throw err;
    }
  }, [fetchCart]);

  // 4️⃣ updateQuantity — depends on removeFromCart (already defined above)
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }
    setItems(prev => prev.map(i => i.id === cartItemId ? { ...i, quantity } : i));
    try {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
      if (error) throw error;
    } catch (err) {
      console.error("Error updating quantity:", err);
      await fetchCart();
      throw err;
    }
  }, [removeFromCart, fetchCart]);

  // 5️⃣ addToCart — depends on updateQuantity (now defined above ✅)
  const addToCart = useCallback(async (product: Product, variant?: ProductVariant | null, quantity: number = 1) => {
    if (!user) { console.warn("User not logged in"); return; }

    const existingItemId = getCartItemId(product.id, variant?.id);
    if (existingItemId) {
      const existingItem = items.find(i => i.id === existingItemId);
      if (existingItem) {
        await updateQuantity(existingItemId, existingItem.quantity + quantity);
        return;
      }
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setItems(prev => [...prev, {
      id: tempId,
      product,
      variant: variant ?? null,
      quantity,
      unitPrice: variant?.price_override ?? product.price,
    }]);

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: product.id, variant_id: variant?.id ?? null, quantity })
        .select()
        .single();

      if (error) throw error;
      setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: data.id } : i));
    } catch (err) {
      console.error("Error adding to cart:", err);
      setItems(prev => prev.filter(i => i.id !== tempId));
      throw err;
    }
  }, [user, items, getCartItemId, updateQuantity]);

  // 6️⃣ clearCart
  const clearCart = useCallback(async () => {
    if (!user) return;
    setItems([]);
    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
    } catch (err) {
      console.error("Error clearing cart:", err);
      await fetchCart();
      throw err;
    }
  }, [user, fetchCart]);

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount, getCartItemId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);