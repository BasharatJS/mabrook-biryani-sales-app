'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order } from '@/lib/types';
import { OrderService } from '@/lib/firestore';

interface OrdersContextType {
  todayOrders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayOrders = async () => {
    try {
      setLoading(true);
      const orders = await OrderService.getTodayOrders();
      setTodayOrders(orders);
    } catch (error) {
      console.error('Error fetching today orders:', error);
      setTodayOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayOrders();
  }, []);

  const value: OrdersContextType = {
    todayOrders,
    loading,
    refreshOrders: fetchTodayOrders,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
