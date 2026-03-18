import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { Product } from "./ProductsContext";

type WishlistItem = Product & { wishlist_id: string };

type WishlistContextType = {
  items: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  fetchWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items,   setItems]   = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data ?? []).map((row: any) => ({
        ...row.product,
        wishlist_id: row.id,
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isWishlisted = useCallback(
    (productId: string) => items.some(i => i.id === productId),
    [items]
  );

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!user) return;

    const existing = items.find(i => i.id === product.id);

    if (existing) {
      // Remove
      setItems(prev => prev.filter(i => i.id !== product.id));
      await supabase.from("wishlist").delete().eq("id", existing.wishlist_id);
    } else {
      // Add — optimistic update
      const tempItem: WishlistItem = { ...product, wishlist_id: "temp" };
      setItems(prev => [tempItem, ...prev]);

      const { data, error } = await supabase
        .from("wishlist")
        .insert({ user_id: user.id, product_id: product.id })
        .select()
        .single();

      if (error) {
        // Roll back
        setItems(prev => prev.filter(i => i.id !== product.id));
      } else {
        // Update with real wishlist id
        setItems(prev =>
          prev.map(i => i.id === product.id ? { ...i, wishlist_id: data.id } : i)
        );
      }
    }
  }, [user, items]);

  useEffect(() => { if (user) fetchWishlist(); }, [user]);

  return (
    <WishlistContext.Provider value={{ items, loading, isWishlisted, toggleWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);