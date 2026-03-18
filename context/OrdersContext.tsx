import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: { name: string; image: string | null };
};

export type Order = {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled";
  total: number;
  delivery_method: string | null;
  delivery_address: {
    name: string; street: string; city: string;
    region: string; phone: string; note?: string;
  } | null;
  created_at: string;
  items?: OrderItem[];
};

type CartItemInput = {
  product_id: string;
  quantity: number;
  price: number;
};

type OrdersContextType = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  placeOrder: (data: {
    items: CartItemInput[];
    total: number;
    deliveryMethod: string;
    deliveryAddress: Order["delivery_address"];
  }) => Promise<{ orderId: string | null; error: string | null }>;
  getOrderById: (id: string) => Promise<Order | null>;
};

const OrdersContext = createContext<OrdersContextType>({} as OrdersContextType);

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items (
            id, product_id, quantity, price,
            product:products ( name, image )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const placeOrder = useCallback(async ({
    items, total, deliveryMethod, deliveryAddress,
  }: {
    items: CartItemInput[];
    total: number;
    deliveryMethod: string;
    deliveryAddress: Order["delivery_address"];
  }): Promise<{ orderId: string | null; error: string | null }> => {
    if (!user) return { orderId: null, error: "Not authenticated" };

    try {
      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total,
          delivery_method: deliveryMethod,
          delivery_address: deliveryAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Refresh orders list
      await fetchOrders();

      return { orderId: order.id, error: null };
    } catch (e: any) {
      return { orderId: null, error: e.message };
    }
  }, [user, fetchOrders]);

  const getOrderById = useCallback(async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items (
          id, product_id, quantity, price,
          product:products ( name, image )
        )
      `)
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Order;
  }, []);

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  return (
    <OrdersContext.Provider value={{
      orders, loading, error,
      fetchOrders, placeOrder, getOrderById,
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => useContext(OrdersContext);