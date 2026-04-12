// context/ProductsContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export type ProductVariant = {
  id: string;
  product_id: string;
  price_override: number | null;
  stock: number;
  sku: string | null;
  options: { name: string; value: string }[];
};

export type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  category_name: string | null; // joined from categories
  images: string[];             // was: image string
  rating: number;               // computed from reviews avg
  review_count: number;         // computed from reviews count
  badge: string | null;
  in_stock: boolean;
  variants: ProductVariant[];   // joined
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (opts?: {
    category?: string; search?: string; limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(
            id, 
            product_id,
            price_override, 
            stock, 
            sku,
            options:variant_option_values(
              option_value:product_option_values(
                value,
                option_type:product_option_types(name)
              )
            )
          ),
          reviews(rating)
        `)
        .order("created_at", { ascending: false });

      if (opts?.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", opts.category)
          .single();
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (opts?.search) query = query.ilike("name", `%${opts.search}%`);
      if (opts?.limit) query = query.limit(opts.limit);

      const { data, error } = await query;
      if (error) throw error;

      // Shape the data — compute rating/review_count from joined reviews
      const shaped = (data ?? []).map((p: any) => {
        // Calculate average rating from reviews
        const reviews = p.reviews || [];
        const avgRating = reviews.length
          ? +(reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0;

        // Process variants with their options
        const variants = (p.variants ?? []).map((v: any) => ({
          id: v.id,
          product_id: v.product_id,
          price_override: v.price_override,
          stock: v.stock,
          sku: v.sku,
          options: (v.options ?? []).map((o: any) => ({
            name: o.option_value?.option_type?.name ?? "",
            value: o.option_value?.value ?? "",
          })),
        }));

        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          description: p.description,
          price: p.price,
          original_price: p.original_price,
          category_id: p.category_id,
          category_name: p.category?.name ?? null,
          images: p.images ?? [],
          rating: avgRating,
          review_count: reviews.length,
          badge: p.badge,
          in_stock: p.in_stock ?? true,
          variants: variants,
        };
      });

      setProducts(shaped);
    } catch (e: any) {
      console.error("Error fetching products:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(
            id, 
            price_override, 
            stock, 
            sku,
            options:variant_option_values(
              option_value:product_option_values(
                value,
                option_type:product_option_types(name)
              )
            )
          ),
          reviews(rating)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Shape the data similarly to fetchProducts
      const reviews = data.reviews || [];
      const avgRating = reviews.length
        ? +(reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

      const variants = (data.variants ?? []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        price_override: v.price_override,
        stock: v.stock,
        sku: v.sku,
        options: (v.options ?? []).map((o: any) => ({
          name: o.option_value?.option_type?.name ?? "",
          value: o.option_value?.value ?? "",
        })),
      }));

      const product: Product = {
        id: data.id,
        name: data.name,
        brand: data.brand,
        description: data.description,
        price: data.price,
        original_price: data.original_price,
        category_id: data.category_id,
        category_name: data.category?.name ?? null,
        images: data.images ?? [],
        rating: avgRating,
        review_count: reviews.length,
        badge: data.badge,
        in_stock: data.in_stock ?? true,
        variants: variants,
      };

      return product;
    } catch (e: any) {
      console.error("Error fetching product by id:", e);
      return null;
    }
  }, []);

  const refreshProducts = useCallback(() => fetchProducts(), [fetchProducts]);

  // Load on mount
  useEffect(() => {
    fetchProducts();
  }, []);

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