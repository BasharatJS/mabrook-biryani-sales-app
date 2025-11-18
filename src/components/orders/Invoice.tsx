'use client'

import { Order } from '@/lib/types'
import PostInvoiceActions from './PostInvoiceActions'

interface InvoiceProps {
  order: Order
  onPrint?: () => void
}

export default function Invoice({ order, onPrint }: InvoiceProps) {
  // Use default settings instead of fetching from Firebase to avoid permissions issues
  const settings = {
    businessName: 'MABROOK RESTAURANT',
    businessPhone: '+918248717393/7003654945',
    businessAddress:
      '1, Feeder Rd, Manasbag, Rathtala, Crossing, Kolkata, West Bengal 700066',
    currency: '₹',
    taxRate: 0,
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return new Date().toLocaleDateString()
    return timestamp.toDate().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return new Date().toLocaleTimeString()
    return timestamp.toDate().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatReceiptDate = (timestamp: any) => {
    const date = timestamp && timestamp.toDate ? timestamp.toDate() : new Date()
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('en-IN', { month: 'short' })
    const year = String(date.getFullYear()).slice(-2)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year} ${hours}:${minutes}`
  }

  const formatKitchenDate = (timestamp: any) => {
    const date = timestamp && timestamp.toDate ? timestamp.toDate() : new Date()
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('en-IN', { month: 'short' })
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year} ${hours}:${minutes}`
  }

  const businessName = settings.businessName
  const businessPhone = settings.businessPhone
  const businessAddress = settings.businessAddress
  const currency = settings.currency
  const taxRate = settings.taxRate

  // Calculate subtotal from order items
  const itemsSubtotal =
    order.orderItems && order.orderItems.length > 0
      ? order.orderItems.reduce((sum, item) => sum + item.total, 0)
      : order.totalAmount

  // Calculate discount
  const discountPercent = order.discount || 0
  const discountAmount =
    discountPercent > 0 ? (itemsSubtotal * discountPercent) / 100 : 0
  const subtotal = itemsSubtotal - discountAmount

  const taxAmount = (subtotal * taxRate) / 100
  const finalTotal = subtotal + taxAmount

  return (
    <div className="invoice-container max-w-sm mx-auto bg-white">
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .invoice-container,
          .invoice-container * {
            visibility: visible !important;
          }

          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          .invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            font-size: 11px !important;
            background: white !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .receipt-header {
            font-size: 14px !important;
          }

          .dotted-line {
            border-top: 1px dotted #000 !important;
          }

          @page {
            margin: 0.2in !important;
            size: 80mm auto !important;
          }
        }

        .receipt-font {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>

      <div className="print-page bg-white p-6 border border-gray-300 receipt-font">
        {/* Header - Restaurant Name and Address */}
        <div className="text-center mb-3">
          <h1 className="receipt-header text-lg font-bold tracking-wider uppercase mb-2">
            {businessName}
          </h1>
          <p className="text-xs leading-tight mb-1">{businessAddress}</p>
          <p className="text-xs">{businessPhone}</p>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-2"></div>

        {/* Bill Number and Date */}
        <div className="flex justify-between text-xs mb-2">
          <span>
            Bill{' '}
            {order.id
              ? order.id.substring(0, 8).toUpperCase()
              : 'AM-' + new Date().getTime().toString().slice(-4)}
          </span>
          <span>{formatReceiptDate(order.orderDate)}</span>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-2"></div>

        {/* Table Header */}
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="w-1/4">MRP</span>
          <span className="w-1/4 text-center">Rate</span>
          <span className="w-1/4 text-center">Qty</span>
          <span className="w-1/4 text-right">Amount</span>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-2"></div>

        {/* Items */}
        <div className="mb-2">
          {order.orderItems && order.orderItems.length > 0 ? (
            order.orderItems.map((item: any, index: number) => (
              <div key={index} className="mb-3">
                <div className="text-xs uppercase font-semibold mb-1">
                  {item.name}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="w-1/4">{item.price}</span>
                  <span className="w-1/4 text-center">{item.price}</span>
                  <span className="w-1/4 text-center">{item.quantity}</span>
                  <span className="w-1/4 text-right">{item.total}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="mb-3">
              <div className="text-xs uppercase font-semibold mb-1">
                Mixed Items
              </div>
              <div className="flex justify-between text-xs">
                <span className="w-1/4">--</span>
                <span className="w-1/4 text-center">--</span>
                <span className="w-1/4 text-center">
                  {order.biryaniQuantity}
                </span>
                <span className="w-1/4 text-right">{order.totalAmount}</span>
              </div>
            </div>
          )}
          {order.notes && (
            <p className="text-xs text-gray-600 italic mt-1">
              Note: {order.notes}
            </p>
          )}
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-2"></div>

        {/* Total Items and Subtotal */}
        <div className="text-xs mb-2">
          <div className="flex justify-between mb-1">
            <span>Total items</span>
            <span>
              {order.orderItems && order.orderItems.length > 0
                ? order.orderItems.length
                : 1}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {currency}
              {itemsSubtotal}/-
            </span>
          </div>
        </div>

        {/* Discount if applicable */}
        {discountPercent > 0 && (
          <div className="flex justify-between text-xs mb-2">
            <span>Discount ({discountPercent}%)</span>
            <span>
              - {currency}
              {discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Dotted Line */}
        <div className="dotted-line my-3"></div>

        {/* Total Amount - Large and Prominent */}
        <div className="flex justify-between text-lg font-bold mb-2">
          <span>Total Amount</span>
          <span>
            {currency}
            {Math.round(finalTotal)}
          </span>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-3"></div>

        {/* Amount Received */}
        <div className="flex justify-between text-xs mb-2">
          <span>Amount Received</span>
          <span>
            {currency}
            {Math.round(finalTotal)}
          </span>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-2"></div>

        {/* Payment Details */}
        <div className="text-xs mb-2">
          <div className="mb-1">Payment details :</div>
          <div className="dotted-line my-1"></div>
          <div className="flex justify-between">
            <span>{order.paymentMode || 'Cash'}</span>
            <span>
              {currency}
              {Math.round(finalTotal)}
            </span>
          </div>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-3"></div>

        {/* Thank You Message */}
        <div className="text-center text-xs mb-2">
          <p className="font-semibold">Thank You , Visit Again. MABROOK</p>
          <p className="font-semibold">RESTAURANT</p>
        </div>

        {/* Dotted Line */}
        <div className="dotted-line my-3"></div>

        {/* Footer */}
        <div className="text-center text-xs mb-8">
          <p>Powered by Evonnexis Pvt Ltd.</p>
        </div>

        {/* Kitchen Copy Section */}
        <div className="mt-8 pt-6">
          {/* Order Number */}
          <div className="text-base font-bold mb-2">
            {order.id
              ? order.id.substring(0, 8).toUpperCase()
              : 'AH-' + new Date().getTime().toString().slice(-4)}
          </div>

          {/* Dotted Line */}
          <div className="dotted-line my-2"></div>

          {/* By Restaurant Name */}
          <div className="text-xs mb-1">
            <span>By: {businessName}</span>
          </div>

          {/* Date and Time */}
          <div className="text-xs mb-2">
            {formatKitchenDate(order.orderDate)}
          </div>

          {/* Dotted Line */}
          <div className="dotted-line my-2"></div>

          {/* Kitchen Items List - Simple list with quantities */}
          <div className="mb-2">
            {order.orderItems && order.orderItems.length > 0 ? (
              order.orderItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between text-xs mb-1 uppercase"
                >
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-xs mb-1 uppercase">
                <span>Mixed Items</span>
                <span>{order.biryaniQuantity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Post-Invoice Actions */}
        <PostInvoiceActions
          order={order}
          onComplete={() => onPrint && onPrint()}
        />
      </div>
    </div>
  )
}
