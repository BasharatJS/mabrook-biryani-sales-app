'use client';

import { useState } from 'react';
import { Order } from '@/lib/types';

interface PostInvoiceActionsProps {
  order: Order;
  onComplete: () => void;
}

export default function PostInvoiceActions({ order, onComplete }: PostInvoiceActionsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const formatWhatsAppMessage = () => {
    const items = order.orderItems && order.orderItems.length > 0 
      ? order.orderItems.map(item => `${item.name} x ${item.quantity} = Rs.${item.total}`).join('\n')
      : `Mixed Items x ${order.biryaniQuantity} = Rs.${order.totalAmount}`;

    const message = `ARMANIA BIRYANI HOUSE
MAYA BAZAR, DURGAPUR, KOLKATA

ORDER SUMMARY
Invoice: ${order.id || 'AUTO'}
Date: ${order.orderDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : new Date().toLocaleDateString()}

ITEMS:
${items}

TOTAL AMOUNT: Rs.${order.totalAmount.toLocaleString()}
PAYMENT MODE: ${order.paymentMode || 'Cash'}

${order.notes ? `Notes: ${order.notes}\n` : ''}Thank you for choosing ARMANIA BIRYANI HOUSE!
We appreciate your business.`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = () => {
    setIsSharing(true);
    try {
      const message = formatWhatsAppMessage();
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      alert('Failed to open WhatsApp. Please try again.');
    } finally {
      setTimeout(() => setIsSharing(false), 1000);
    }
  };

  const handleThermalPrint = async () => {
    setIsPrinting(true);
    
    try {
      // Try Web Bluetooth API for thermal printer first
      if ('bluetooth' in navigator) {
        try {
          const device = await (navigator as any).bluetooth.requestDevice({
            filters: [
              { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common thermal printer service
              { namePrefix: 'Printer' },
              { namePrefix: 'POS' },
              { namePrefix: 'Thermal' }
            ],
            optionalServices: [
              '000018f0-0000-1000-8000-00805f9b34fb',
              '0000180f-0000-1000-8000-00805f9b34fb' // Battery service
            ]
          });

          const server = await device.gatt.connect();
          const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
          const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

          // Format thermal receipt
          const thermalReceipt = formatThermalReceipt();
          const encoder = new TextEncoder();
          const data = encoder.encode(thermalReceipt);
          
          await characteristic.writeValue(data);
          
          alert('Receipt sent to thermal printer successfully!');
          
        } catch (bluetoothError) {
          console.log('Bluetooth printing failed, falling back to browser print:', bluetoothError);
          fallbackToBrowserPrint();
        }
      } else {
        fallbackToBrowserPrint();
      }
    } catch (error) {
      console.error('Error printing:', error);
      fallbackToBrowserPrint();
    } finally {
      setIsPrinting(false);
    }
  };

  const formatThermalReceipt = () => {
    const items = order.orderItems && order.orderItems.length > 0 
      ? order.orderItems.map(item => `${item.name}\n  ${item.quantity} x Rs.${item.price} = Rs.${item.total}\n`).join('')
      : `Mixed Items\n  ${order.biryaniQuantity} x Rs.${order.totalAmount} = Rs.${order.totalAmount}\n`;

    return `
ARMANIA BIRYANI HOUSE
MAYA BAZAR, DURGAPUR, KOLKATA
================================
Invoice: ${order.id || 'AUTO'}
Date: ${order.orderDate ? new Date(order.orderDate.toDate()).toLocaleString() : new Date().toLocaleString()}
Payment: ${order.paymentMode || 'Cash'}
================================
${items}
================================
TOTAL: Rs.${order.totalAmount.toLocaleString()}
================================
${order.notes ? `Notes: ${order.notes}\n================================\n` : ''}
Thank you for your order!
We appreciate your business.
================================

`;
  };

  const fallbackToBrowserPrint = () => {
    const printWindow = window.open('', '_blank');
    const invoiceContent = document.querySelector('.print-page')?.innerHTML || '';
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .compact-header { margin-bottom: 15px; padding-bottom: 10px; }
            .compact-spacing { margin: 8px 0; padding: 8px; }
            .compact-table { font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .bg-gray-100 { background-color: #f5f5f5; }
            .border { border: 1px solid #ddd; }
            .rounded { border-radius: 4px; }
            .grid { display: grid; }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); gap: 10px; }
            @page { margin: 0.5in; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${invoiceContent}
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="no-print space-y-4 mt-6">
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Share Button */}
        <button
          onClick={handleWhatsAppShare}
          disabled={isSharing}
          className="bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
        >
          <span className="text-2xl">📱</span>
          <span>{isSharing ? 'Opening WhatsApp...' : 'Share via WhatsApp'}</span>
        </button>

        {/* Print Button */}
        <button
          onClick={handleThermalPrint}
          disabled={isPrinting}
          className="bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
        >
          <span className="text-2xl">🖨️</span>
          <span>{isPrinting ? 'Printing...' : 'Print Invoice'}</span>
        </button>
      </div>

      {/* Complete Order Button */}
      <button
        onClick={onComplete}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-bold text-lg transition-colors shadow-lg"
      >
        Complete Order & Return to Home
      </button>

      {/* Info Text */}
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>WhatsApp: Share order details with customer</p>
        <p>Print: Connects to thermal printer or uses browser print</p>
      </div>
    </div>
  );
}