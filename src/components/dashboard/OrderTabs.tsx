'use client';

import { useState, useEffect } from 'react';
import { OrderService } from '@/lib/firestore';
import { Order } from '@/lib/types';
import { useOrders } from '@/contexts/OrdersContext';

interface OrderTabsProps {
  refreshTrigger: number;
}

export default function OrderTabs({ refreshTrigger }: OrderTabsProps) {
  const { todayOrders, loading, refreshOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    refreshOrders();
  }, [refreshTrigger]);

  // Separate online and offline orders from context
  const onlineOrders = todayOrders.filter(order =>
    (order as any).orderType === 'online' && (order as any).status === 'pending'
  );
  const offlineOrders = todayOrders.filter(order =>
    (order as any).orderType === 'offline' && (order as any).status === 'pending'
  );

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await OrderService.updateOrderStatus(orderId, status);
      refreshOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderOrderCard = (order: Order & { customerName?: string; customerPhone?: string; orderType?: string }) => (
    <div key={order.id} className="bg-white border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-primary truncate">#{order.id?.slice(-6)}</h3>
          {order.customerName && (
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              <p className="truncate"><span className="font-medium">Customer:</span> {order.customerName}</p>
              {order.customerPhone && (
                <p className="truncate"><span className="font-medium">Phone:</span> {order.customerPhone}</p>
              )}
            </div>
          )}
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-primary">₹{order.totalAmount}</p>
          <p className="text-xs text-gray-500">
            {order.orderDate?.toDate?.()?.toLocaleTimeString() || 'Now'}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-3">
        <h4 className="font-medium text-xs sm:text-sm text-gray-700 mb-2">Items:</h4>
        <div className="space-y-1">
          {order.orderItems?.map((item, index) => (
            <div key={index} className="flex justify-between text-xs sm:text-sm gap-2">
              <span className="truncate">{item.quantity}x {item.name}</span>
              <span className="font-medium shrink-0">₹{item.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Mode */}
      {(order as any).paymentMode && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            💳 {(order as any).paymentMode}
          </span>
        </div>
      )}

      {/* Status and Actions */}
      <div className="flex items-center justify-end">
        {/* <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
          {order.status.toUpperCase()}
        </span> */}

        <div className="flex space-x-2">
          {order.status === 'pending' && (
            <button
              onClick={() => updateOrderStatus(order.id!, 'completed')}
              className="bg-green-500 text-white px-4 sm:px-6 py-2 cursor-pointer rounded-lg font-bold text-sm sm:text-lg hover:bg-green-600 transition-colors shadow-lg w-full sm:w-auto"
            >
              Complete
            </button>
          )}
          {/* {order.status === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order.id!, 'ready')}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
            >
              Mark Ready
            </button>
          )} */}
          {/* {order.status === 'ready' && (
            <button
              onClick={() => updateOrderStatus(order.id!, 'completed')}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              Complete
            </button>
          )} */}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 break-words">
            <span className="font-medium">Notes:</span> {order.notes}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Tab Headers */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors relative ${
              activeTab === 'online'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <span className="text-sm sm:text-base">🌐</span>
              <span className="text-xs sm:text-base hidden xs:inline">Online Orders</span>
              <span className="text-xs sm:text-base xs:hidden">Online</span>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                activeTab === 'online' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {onlineOrders.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors relative ${
              activeTab === 'offline'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <span className="text-sm sm:text-base">🏪</span>
              <span className="text-xs sm:text-base hidden xs:inline">Offline Orders</span>
              <span className="text-xs sm:text-base xs:hidden">Offline</span>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                activeTab === 'offline' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {offlineOrders.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-3 sm:p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-sm sm:text-base text-gray-600">Loading orders...</span>
          </div>
        ) : (
          <div>
            {activeTab === 'online' && (
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">🌐</span>
                  <span className="text-sm sm:text-base">Online Orders from Customers</span>
                </h3>
                {onlineOrders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📱</div>
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No online orders yet</p>
                    <p className="text-xs sm:text-sm">Customer orders will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {onlineOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'offline' && (
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">🏪</span>
                  <span className="text-sm sm:text-base">Offline Orders by Staff</span>
                </h3>
                {offlineOrders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🍽️</div>
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No offline orders yet</p>
                    <p className="text-xs sm:text-sm">Use "Take New Order" to add offline orders</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {offlineOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}