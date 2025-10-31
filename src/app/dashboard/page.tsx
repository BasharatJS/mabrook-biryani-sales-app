'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentOrders from '@/components/dashboard/RecentOrders';
import OrderForm from '@/components/forms/OrderForm';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const handleOrderSuccess = () => {
    setShowOrderForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="text-xs sm:text-sm text-secondary">
            Welcome to your Biryani Sales Manager
          </div>
        </div>

        <DashboardStats refreshTrigger={refreshTrigger} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => setShowOrderForm(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:from-orange-600 hover:to-yellow-600 transition-all transform hover:scale-105 shadow-lg"
              >
                🍽️ Order Biryani Now
              </button>
              <Link
                href="/orders"
                className="w-full bg-primary text-primary-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-orange-600 transition-colors block text-center"
              >
                📋 View All Orders
              </Link>
              <Link
                href="/expenses"
                className="w-full bg-secondary text-secondary-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-yellow-600 transition-colors block text-center"
              >
                💰 Add Expense
              </Link>
              <Link
                href="/menu-items"
                className="w-full bg-green-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-green-700 transition-colors block text-center"
              >
                🍽️ Manage Menu Items
              </Link>
              <Link
                href="/reports"
                className="w-full border border-border text-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-background/50 transition-colors block text-center"
              >
                📊 View Reports
              </Link>
            </div>
          </div>

          <RecentOrders refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Order Form Modal */}
      <Modal
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        size="lg"
      >
        <OrderForm
          onSuccess={handleOrderSuccess}
          onCancel={() => setShowOrderForm(false)}
          isCustomerFlow={false}
        />
      </Modal>
    </AppLayout>
  );
}