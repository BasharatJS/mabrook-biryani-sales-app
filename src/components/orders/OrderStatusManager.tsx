'use client'

import { useState } from 'react'
import { Order } from '@/lib/types'
import { OrderService } from '@/lib/firestore'

interface OrderStatusManagerProps {
  order: Order
  onStatusUpdate: () => void
}

const statusFlow = [
  {
    value: 'pending',
    label: 'Pending',
    icon: '⏳',
    color: 'bg-warning',
    description: 'Order received',
  },
  {
    value: 'preparing',
    label: 'Preparing',
    icon: '🔥',
    color: 'bg-secondary',
    description: 'Cooking in progress',
  },
  {
    value: 'ready',
    label: 'Ready',
    icon: '🍽️',
    color: 'bg-success',
    description: 'Ready for pickup/delivery',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: '🚚',
    color: 'bg-success',
    description: 'Order completed',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: '❌',
    color: 'bg-danger',
    description: 'Order cancelled',
  },
]

export default function OrderStatusManager({
  order,
  onStatusUpdate,
}: OrderStatusManagerProps) {
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (newStatus === order.status) return

    setUpdating(true)
    try {
      await OrderService.updateOrderStatus(order.id!, newStatus)
      onStatusUpdate()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const getCurrentStatusIndex = () => {
    return statusFlow.findIndex((status) => status.value === order.status)
  }

  const getNextStatus = () => {
    const currentIndex = getCurrentStatusIndex()
    if (currentIndex < statusFlow.length - 2) {
      // -2 to exclude 'cancelled'
      return statusFlow[currentIndex + 1]
    }
    return null
  }

  const canMoveToNext = () => {
    return order.status !== 'completed' && order.status !== 'cancelled'
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A'

    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const currentStatus = statusFlow.find(
    (status) => status.value === order.status
  )
  const nextStatus = getNextStatus()

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Order Header */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            {/* <h3 className="font-semibold text-foreground">
              {order.customerName}
            </h3> */}
            {/* <p className="text-sm text-secondary">{order.customerPhone}</p> */}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-success">
              ₹{order.totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-secondary">
              {formatDate(order.orderDate)}
            </div>
          </div>
        </div>

        <div className="mt-2 text-sm text-secondary">
          {/* <p><strong>Address:</strong> {order.customerAddress}</p> */}
          <p>
            <strong>Quantity:</strong> {order.biryaniQuantity} biryani(s)
          </p>
          {order.notes && (
            <p>
              <strong>Notes:</strong> {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Order Progress
            </span>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentStatus?.color} text-white`}
            >
              {currentStatus?.icon} {currentStatus?.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-border rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStatus?.color || 'bg-border'
              }`}
              style={{
                width:
                  order.status === 'cancelled'
                    ? '100%'
                    : `${
                        ((getCurrentStatusIndex() + 1) /
                          (statusFlow.length - 1)) *
                        100
                      }%`,
              }}
            ></div>
          </div>

          <div className="text-xs text-secondary">
            {currentStatus?.description}
          </div>
        </div>

        {/* Action Buttons */}
        {canMoveToNext() && (
          <div className="space-y-2">
            {nextStatus && (
              <button
                onClick={() =>
                  handleStatusChange(nextStatus.value as Order['status'])
                }
                disabled={updating}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <span>{nextStatus.icon}</span>
                <span>
                  {updating ? 'Updating...' : `Mark as ${nextStatus.label}`}
                </span>
              </button>
            )}

            {order.status !== 'cancelled' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="w-full bg-danger text-danger-foreground py-2 px-4 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <span>❌</span>
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        )}

        {/* Manual Status Override (for admin) */}
        <div className="mt-4 pt-4 border-t border-border">
          <label className="block text-sm font-medium text-foreground mb-2">
            Quick Status Change:
          </label>
          <select
            value={order.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as Order['status'])
            }
            disabled={updating}
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {statusFlow.map((status) => (
              <option key={status.value} value={status.value}>
                {status.icon} {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
