'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import OrderHistory from '@/components/orders/OrderHistory';
import Link from 'next/link';

export default function OrdersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Orders Management</h1>
        </div>

        <OrderHistory refreshTrigger={refreshTrigger} />
      </div>
    </AppLayout>
  );
}