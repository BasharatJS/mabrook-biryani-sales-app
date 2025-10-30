'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { useOrders } from '@/contexts/OrdersContext';

interface RecentOrdersProps {
  refreshTrigger?: number;
}


export default function RecentOrders({ refreshTrigger }: RecentOrdersProps) {
  // OPTIMIZATION: Use OrdersContext instead of fetching independently
  // This prevents duplicate queries when multiple components need today's orders
  const { todayOrders, loading: contextLoading, refreshOrders } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use data from context (no Firestore query!)
    setOrders(todayOrders.slice(0, 5));
    setLoading(contextLoading);
  }, [todayOrders, contextLoading]);

  useEffect(() => {
    // Refresh when trigger changes
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refreshOrders();
    }
  }, [refreshTrigger]);

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Recent Orders</h3>

      {orders.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-secondary">
          <svg className="mx-auto w-10 sm:w-12 h-10 sm:h-12 mb-3 sm:mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm sm:text-base">No orders today</p>
          <p className="text-xs sm:text-sm">Orders will appear here once customers place them</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between p-2.5 sm:p-3 bg-background rounded-lg border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  <h4 className="font-medium text-sm sm:text-base text-foreground">Order #{order.id?.slice(-6) || 'N/A'}</h4>
                  {(order as any).customerName && (
                    <span className="text-xs text-gray-500 truncate">- {(order as any).customerName}</span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-secondary flex flex-wrap items-center gap-1">
                  <span>{order.biryaniQuantity} items</span>
                  <span>•</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{formatTime(order.orderDate)}</span>
                  {order.paymentMode && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        order.paymentMode === 'UPI'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {order.paymentMode === 'UPI' ? '💳 UPI' : '💵 Cash'}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 sm:hidden">
                  {formatTime(order.orderDate)}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-base sm:text-sm font-medium text-foreground">
                  ₹{order.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {orders.length === 5 && (
            <div className="text-center pt-2">
              <a
                href="/orders"
                className="text-primary text-xs sm:text-sm font-medium hover:text-orange-600 transition-colors"
              >
                View all orders →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}