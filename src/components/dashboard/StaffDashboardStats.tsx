'use client';

import { useEffect } from 'react';
import { useOrders } from '@/contexts/OrdersContext';

interface StaffDashboardStatsProps {
  refreshTrigger: number;
}

export default function StaffDashboardStats({ refreshTrigger }: StaffDashboardStatsProps) {
  const { todayOrders, loading, refreshOrders } = useOrders();

  useEffect(() => {
    refreshOrders();
  }, [refreshTrigger]);

  const completedOrders = todayOrders.filter(order => order.status === 'completed').length;
  const pendingOrders = todayOrders.filter(order => order.status === 'pending').length;
  const preparingOrders = todayOrders.filter(order => order.status === 'preparing').length;
  const totalRevenue = todayOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
            <div className="h-4 bg-border rounded mb-2"></div>
            <div className="h-8 bg-border rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-sm font-medium text-secondary mb-1">Total Orders</h3>
        <p className="text-2xl font-bold text-foreground">{todayOrders.length}</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-sm font-medium text-secondary mb-1">Pending</h3>
        <p className="text-2xl font-bold text-warning">{pendingOrders}</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-sm font-medium text-secondary mb-1">Preparing</h3>
        <p className="text-2xl font-bold text-primary">{preparingOrders}</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-sm font-medium text-secondary mb-1">Completed</h3>
        <p className="text-2xl font-bold text-success">{completedOrders}</p>
      </div>
    </div>
  );
}