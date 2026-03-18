import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export type Product = {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  image: string | null;
  rating: number;
  review_count: number;
  badge: string | null;
  in_stock: boolean;
};

type ProductsContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (opts?: { category?: string; search?: string; limit?: number }) => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  refreshProducts: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextType>({} as ProductsContextType);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetchProducts = useCallback(async (opts?: {
    category?: string; search?: string; limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (opts?.category) query = query.eq("category", opts.category);
      if (opts?.search)   query = query.ilike("name", `%${opts.search}%`);
      if (opts?.limit)    query = query.limit(opts.limit);

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }, []);

  const refreshProducts = useCallback(() => fetchProducts(), [fetchProducts]);

  // Load on mount
  useEffect(() => { fetchProducts(); }, []);

  return (
    <ProductsContext.Provider value={{
      products, loading, error,
      fetchProducts, fetchProductById, refreshProducts,
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);