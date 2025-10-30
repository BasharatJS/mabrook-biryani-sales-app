'use client';

import OrdersList from './OrdersList';

interface OrderHistoryProps {
  refreshTrigger?: number;
}

export default function OrderHistory({ refreshTrigger }: OrderHistoryProps) {
  return <OrdersList refreshTrigger={refreshTrigger} />;
}