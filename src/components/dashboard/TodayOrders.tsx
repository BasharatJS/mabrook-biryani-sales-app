'use client';

import { useEffect } from 'react';
import { OrderService } from '@/lib/firestore';
import { Order } from '@/lib/types';
import { useOrders } from '@/contexts/OrdersContext';

interface TodayOrdersProps {
  refreshTrigger: number;
}

export default function TodayOrders({ refreshTrigger }: TodayOrdersProps) {
  const { todayOrders: orders, loading, refreshOrders } = useOrders();

  useEffect(() => {
    refreshOrders();
  }, [refreshTrigger]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await OrderService.updateOrderStatus(orderId, status);
      refreshOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10';
      case 'preparing': return 'text-primary bg-primary/10';
      case 'ready': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-success bg-success/10';
      case 'cancelled': return 'text-danger bg-danger/10';
      default: return 'text-secondary bg-secondary/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Today's Orders</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-border/20 rounded-lg p-4 h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Today's Orders ({orders.length})
      </h3>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <span className="text-4xl mb-4 block">🍛</span>
          <p>No orders yet today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-lg p-4 hover:bg-background/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-foreground">
                    Order #{order.id?.slice(-6)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">₹{order.totalAmount}</p>
                  <p className="text-xs text-secondary">
                    {order.orderDate?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-secondary mb-3">
                {order.orderItems.map((item, index) => (
                  <span key={index}>
                    {item.quantity}x {item.name}
                    {index < order.orderItems.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>

              {order.notes && (
                <div className="text-sm text-secondary mb-3 italic">
                  Note: {order.notes}
                </div>
              )}

              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id!, 'preparing')}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:bg-orange-600 transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id!, 'ready')}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id!, 'completed')}
                      className="bg-success text-success-foreground px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => updateOrderStatus(order.id!, 'cancelled')}
                    className="bg-danger text-danger-foreground px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}