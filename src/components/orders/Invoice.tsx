'use client';

import { Order } from '@/lib/types';
import PostInvoiceActions from './PostInvoiceActions';

interface InvoiceProps {
  order: Order;
  onPrint?: () => void;
}

export default function Invoice({ order, onPrint }: InvoiceProps) {
  // Use default settings instead of fetching from Firebase to avoid permissions issues
  const settings = {
    businessName: 'ARMANIA BIRYANI HOUSE',
    businessPhone: '+91 XXXXX XXXXX', 
    businessAddress: 'MAYA BAZAR, DURGAPUR, KOLKATA',
    currency: '₹',
    taxRate: 0
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return new Date().toLocaleDateString();
    return timestamp.toDate().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return new Date().toLocaleTimeString();
    return timestamp.toDate().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const businessName = settings.businessName;
  const businessPhone = settings.businessPhone;
  const businessAddress = settings.businessAddress;
  const currency = settings.currency;
  const taxRate = settings.taxRate;
  
  const subtotal = order.totalAmount;
  const taxAmount = (subtotal * taxRate) / 100;
  const finalTotal = subtotal + taxAmount;


  return (
    <div className="invoice-container max-w-4xl mx-auto bg-white">
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
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            font-size: 12px !important;
            background: white !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print-page {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            max-height: 100vh !important;
            overflow: hidden !important;
            padding: 15px !important;
            margin: 0 !important;
            width: 100% !important;
          }
          
          .compact-spacing {
            margin: 8px 0 !important;
            padding: 8px !important;
          }
          
          .compact-table {
            font-size: 11px !important;
          }
          
          .compact-header {
            margin-bottom: 15px !important;
            padding-bottom: 10px !important;
          }
          
          @page {
            margin: 0.5in !important;
            size: A4 !important;
          }
        }
      `}</style>

      <div className="print-page bg-white p-8 border border-gray-200 shadow-lg">
        {/* Header */}
        <div className="compact-header border-b-2 border-gray-300 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{businessName}</h1>
              <div className="text-gray-600 text-sm">
                <p>{businessAddress}</p>
                <p>Phone: {businessPhone}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-100 p-3 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-1">INVOICE</h2>
                <p className="text-gray-600 text-sm">
                  <span className="font-semibold">Invoice #:</span> {order.id || 'AUTO'}
                </p>
                <p className="text-gray-600 text-sm">
                  <span className="font-semibold">Date:</span> {formatDate(order.orderDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="compact-spacing mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Order Details</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-800">{formatDate(order.orderDate)}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Time</p>
                <p className="font-semibold text-gray-800">{formatTime(order.orderDate)}</p>
              </div>
              <div>
                <p className="text-gray-600">Payment Mode</p>
                <p className="font-semibold text-gray-800">{order.paymentMode || 'Cash'}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Type</p>
                <p className="font-semibold text-gray-800">Counter Sale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="compact-spacing mb-4">
          <table className="compact-table w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left py-2 px-3 font-semibold text-gray-800 text-sm">Item</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-800 text-sm">Qty</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-800 text-sm">Rate</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-800 text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems && order.orderItems.length > 0 ? (
                order.orderItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-3 text-sm">
                      <p className="font-medium text-gray-800">{item.name}</p>
                    </td>
                    <td className="text-center py-2 px-3 text-gray-700 text-sm">{item.quantity}</td>
                    <td className="text-right py-2 px-3 text-gray-700 text-sm">{currency}{item.price}</td>
                    <td className="text-right py-2 px-3 text-gray-700 text-sm">{currency}{item.total.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">Mixed Items</p>
                      {order.notes && <p className="text-xs text-gray-600">Note: {order.notes}</p>}
                    </div>
                  </td>
                  <td className="text-center py-2 px-3 text-gray-700 text-sm">{order.biryaniQuantity}</td>
                  <td className="text-right py-2 px-3 text-gray-700 text-sm">{currency}--</td>
                  <td className="text-right py-2 px-3 text-gray-700 text-sm">{currency}{order.totalAmount.toLocaleString()}</td>
                </tr>
              )}
              {order.notes && order.orderItems && order.orderItems.length > 0 && (
                <tr>
                  <td colSpan={4} className="py-1 px-3">
                    <p className="text-xs text-gray-600 italic">Special Instructions: {order.notes}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end compact-spacing mb-4">
          <div className="w-64">
            <div className="border border-gray-200 rounded">
              <div className="flex justify-between items-center py-2 px-3 border-b border-gray-200 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800 font-medium">{currency}{subtotal.toLocaleString()}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between items-center py-2 px-3 border-b border-gray-200 text-sm">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="text-gray-800 font-medium">{currency}{taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 px-3 bg-gray-100 font-bold text-base">
                <span className="text-gray-800">Total:</span>
                <span className="text-gray-800">{currency}{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="compact-spacing border-t-2 border-gray-300 pt-3 text-center">
          <p className="text-base font-medium text-gray-800 mb-1">Thank you for your order!</p>
          <p className="text-gray-600 text-sm">We appreciate your business and hope you enjoy our delicious biryani.</p>
        </div>

        {/* Post-Invoice Actions */}
        <PostInvoiceActions order={order} onComplete={() => onPrint && onPrint()} />
      </div>
    </div>
  );
}