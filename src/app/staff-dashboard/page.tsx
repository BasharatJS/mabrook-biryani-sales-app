'use client';

import { useState, useEffect } from 'react';
import StaffLayout from '@/components/layout/StaffLayout';
import StaffDashboardStats from '@/components/dashboard/StaffDashboardStats';
import OrderTabs from '@/components/dashboard/OrderTabs';
import OrderForm from '@/components/forms/OrderForm';
import Modal from '@/components/ui/Modal';

export default function StaffDashboardPage() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // add auto refresh after 30 seconds if client needs in future
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRefreshTrigger(prev => prev + 1);
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  const handleOrderSuccess = () => {
    setShowOrderForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <StaffLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Staff Dashboard</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
            onClick={() => setShowOrderForm(true)}
            className="bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-orange-600 transition-colors shadow-lg whitespace-nowrap"
          >
            + Take New Order
          </button>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="bg-secondary text-secondary-foreground flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-orange-600 transition-colors shadow-lg whitespace-nowrap"
          >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          </div>
        </div>
        
        {/* <StaffDashboardStats refreshTrigger={refreshTrigger} /> */}

        <OrderTabs refreshTrigger={refreshTrigger} />
      </div>

      {/* Staff Order Modal */}
      <Modal 
        isOpen={showOrderForm} 
        onClose={() => setShowOrderForm(false)}
        size="lg"
      >
        <OrderForm 
          onSuccess={handleOrderSuccess}
          onCancel={() => setShowOrderForm(false)}
          isStaffFlow={true}
          orderType="offline"
          title="Take New Order"
        />
      </Modal>
    </StaffLayout>
  );
}