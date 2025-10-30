'use client';

import { useState, useEffect } from 'react';
import { OrderFormData, MenuItem, OrderItem } from '@/lib/types';
import { OrderService } from '@/lib/firestore';
import Invoice from '@/components/orders/Invoice';
import PaymentModeModal from '@/components/modals/PaymentModeModal';
import { Timestamp } from 'firebase/firestore';
import { useMenuItems } from '@/contexts/MenuItemsContext';

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  title?: string;
  isCustomerFlow?: boolean;
  isStaffFlow?: boolean;
  orderType?: 'online' | 'offline';
}


const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'mutton': return '🐑';
    case 'chicken': return '🐔';
    case 'egg': return '🥚';
    case 'veg': return '🥔';
    case 'beverages': return '🥤';
    case 'extras': return '🍽️';
    default: return '🍛';
  }
};

export default function OrderForm({ onSuccess, onCancel, title, isCustomerFlow = false, isStaffFlow = false, orderType }: OrderFormProps) {
  const { activeMenuItems: menuItems, loading: loadingMenuItems } = useMenuItems();
  const [currentStep, setCurrentStep] = useState<'menu' | 'payment' | 'invoice' | 'post-order'>('menu');
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [generatedOrder, setGeneratedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'UPI' | 'Cash' | null>(null);

  const [formData, setFormData] = useState<OrderFormData>({
    biryaniQuantity: 1,
    orderItems: [],
    notes: '',
  });

  // Customer details for staff flow
  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    customerPhone: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItems = Object.entries(quantities)
    .filter(([_, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => {
      const menuItem = menuItems.find(item => item.id === menuItemId);
      if (!menuItem) return null;
      return {
        menuItemId: menuItem.id!,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
        total: menuItem.price * quantity
      };
    })
    .filter(item => item !== null) as OrderItem[];

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (menuItemId: string, delta: number) => {
    setQuantities(prev => {
      const currentQty = prev[menuItemId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [menuItemId]: newQty };
    });
  };

  const validateForm = (): boolean => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to proceed.');
      return false;
    }
    
    // Validation for customer flow (home page orders)
    if (isCustomerFlow) {
      if (!customerDetails.customerName.trim()) {
        alert('Please enter your name.');
        return false;
      }
      if (!customerDetails.customerPhone.trim()) {
        alert('Please enter your phone number.');
        return false;
      }
      if (!/^[0-9]{10}$/.test(customerDetails.customerPhone.replace(/\D/g, ''))) {
        alert('Please enter a valid 10-digit phone number.');
        return false;
      }
    }
    
    // Validation for staff flow online orders
    if (isStaffFlow && orderType === 'online') {
      if (!customerDetails.customerName.trim()) {
        alert('Please enter customer name.');
        return false;
      }
      if (!customerDetails.customerPhone.trim()) {
        alert('Please enter customer phone number.');
        return false;
      }
      if (!/^[0-9]{10}$/.test(customerDetails.customerPhone.replace(/\D/g, ''))) {
        alert('Please enter a valid 10-digit phone number.');
        return false;
      }
    }
    
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'biryaniQuantity' ? parseInt(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setShowPaymentModal(true);
  };

  const handlePaymentModeSelect = async (paymentMode: 'UPI' | 'Cash') => {
    setSelectedPaymentMode(paymentMode);
    setShowPaymentModal(false);
    setIsSubmitting(true);

    try {
      const orderData = {
        ...formData,
        orderItems: selectedItems,
        biryaniQuantity: totalItems,
        paymentMode: paymentMode,
        // Add customer details for customer flow
        ...(isCustomerFlow && {
          customerName: customerDetails.customerName,
          customerPhone: customerDetails.customerPhone,
          orderType: 'online'
        }),
        // Add customer details for staff online orders
        ...(isStaffFlow && {
          customerName: customerDetails.customerName,
          customerPhone: customerDetails.customerPhone,
          orderType: orderType
        }),
      };

      let createdOrder;
      if (isCustomerFlow) {
        createdOrder = await OrderService.createCustomerOrder(orderData);
      } else if (isStaffFlow) {
        createdOrder = await OrderService.createStaffOrder(orderData);
      } else {
        createdOrder = await OrderService.createOrder(orderData);
      }
      
      // Generate order object
      const orderForInvoice = {
        ...createdOrder,
        id: createdOrder.id || Date.now().toString(),
        biryaniQuantity: totalItems,
        totalAmount: totalAmount,
        orderItems: selectedItems,
        orderDate: Timestamp.now(),
        status: 'pending' as const,
        notes: formData.notes,
        paymentMode: paymentMode,
        customerName: customerDetails.customerName,
        customerPhone: customerDetails.customerPhone
      };
      
      setGeneratedOrder(orderForInvoice);
      
      // For customer flow, send WhatsApp and show success
      if (isCustomerFlow) {
        // Send WhatsApp to biryani owner
        sendWhatsAppToOwner(orderForInvoice);
        setCurrentStep('post-order');
      } else if (isStaffFlow) {
        setCurrentStep('post-order');
      } else {
        setCurrentStep('invoice');
      }
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsAppToOwner = (order: any) => {
    const ownerPhone = '7022340149'; // Biryani owner's WhatsApp number
    const customerName = order.customerName || 'Customer';
    
    const message = `🍛 NEW ORDER RECEIVED!

Customer: ${customerName}
Phone: ${order.customerPhone}
Order ID: #${order.id?.slice(-6)}

Items:
${order.orderItems.map((item: any) => `• ${item.quantity}x ${item.name} - ₹${item.total}`).join('\n')}

Total Amount: ₹${order.totalAmount}
Payment: ${order.paymentMode}

Please prepare this delicious biryani order!

- ARMANIA BIRYANI HOUSE`;

    const whatsappLink = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  const handleCompleteOrder = () => {
    setFormData({
      biryaniQuantity: 1,
      orderItems: [],
      notes: '',
    });
    setQuantities({});
    setCustomerDetails({ customerName: '', customerPhone: '' });
    setCurrentStep('menu');
    setGeneratedOrder(null);
    setSelectedPaymentMode(null);
    
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleWhatsAppShare = () => {
    if (generatedOrder && customerDetails.customerPhone) {
      const message = `Hello! Your order from ARMANIA BIRYANI HOUSE is confirmed.
      
Order Details:
${generatedOrder.orderItems.map((item: any) => `• ${item.quantity}x ${item.name} - ₹${item.total}`).join('\n')}

Total Amount: ₹${generatedOrder.totalAmount}
Order ID: #${generatedOrder.id?.slice(-6)}

We will prepare your delicious biryani and contact you shortly. Thank you for choosing us!`;

      const phone = customerDetails.customerPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (currentStep === 'invoice' && generatedOrder) {
    return (
      <div className="max-w-4xl mx-auto">
        <Invoice order={generatedOrder} onPrint={handleCompleteOrder} />
      </div>
    );
  }

  if (currentStep === 'post-order' && generatedOrder) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L5.53 12.7a.996.996 0 10-1.41 1.41L9 18.99l10.88-10.88a.996.996 0 10-1.41-1.41L9 16.17z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-1">Order Placed!</h2>
          <p className="text-green-100">Order #{generatedOrder.id?.slice(-6)} has been placed successfully</p>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-background rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Order ID:</span>
              <span className="font-bold">#{generatedOrder.id?.slice(-6)}</span>
            </div>
            {customerDetails.customerName && (
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Customer:</span>
                <span>{customerDetails.customerName}</span>
              </div>
            )}
            {customerDetails.customerPhone && (
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Phone:</span>
                <span>{customerDetails.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-primary">₹{generatedOrder.totalAmount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {customerDetails.customerPhone && !isCustomerFlow && (
              <button
                onClick={handleWhatsAppShare}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                </svg>
                <span>Share via WhatsApp</span>
              </button>
            )}
            
            {/* Print Invoice button - Only for staff orders, not for customer orders */}
            {!isCustomerFlow && (
              <button
                onClick={handlePrintInvoice}
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                <span>Print Invoice</span>
              </button>
            )}

            <button
              onClick={handleCompleteOrder}
              className="w-full bg-secondary text-secondary-foreground py-3 px-6 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
            >
              {isCustomerFlow ? 'Book Another Order' : 'Take Another Order'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-6 text-center">
        <span className="text-4xl mb-2 block">🍛</span>
        <h2 className="text-2xl font-bold mb-1">Choose Your Biryani</h2>
        <p className="text-orange-100">Select from our delicious menu</p>
        {totalItems > 0 && (
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <p className="font-medium">Selected: {totalItems} items | Total: ₹{totalAmount.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="p-6">
        {currentStep === 'menu' ? (
          <div>
            {/* Menu Items Grid */}
            {loadingMenuItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600">Loading menu items...</span>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🍽️</div>
                <p className="text-lg font-medium mb-2">No menu items available</p>
                <p className="text-sm">Please contact the restaurant to add menu items</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {menuItems.map((item) => {
                  const quantity = quantities[item.id!] || 0;
                return (
                  <div key={item.id} className="bg-white border-2 border-border rounded-xl p-4 hover:border-primary transition-colors">
                    <div className="text-center mb-3">
                      <span className="text-3xl mb-2 block">{getCategoryEmoji(item.category)}</span>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{item.name}</h3>
                      <p className="text-2xl font-bold text-primary mt-2">₹{item.price}</p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id!, -1)}
                        disabled={quantity === 0}
                        className="w-10 h-10 rounded-full bg-danger text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-danger/90 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold min-w-[2rem] text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id!, 1)}
                        className="w-10 h-10 rounded-full bg-success text-white font-bold text-xl hover:bg-success/90 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    {quantity > 0 && (
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-success">
                          Total: ₹{(item.price * quantity).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {/* Customer Details Section - For customer flow and staff online orders */}
            {!loadingMenuItems && ((isCustomerFlow && selectedItems.length > 0) || (isStaffFlow && selectedItems.length > 0)) && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-primary mb-3">
                  {isCustomerFlow ? '👤 Your Details' : '👤 Customer Details'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {isCustomerFlow ? 'Your Name *' : 'Customer Name *'}
                    </label>
                    <input
                      type="text"
                      value={customerDetails.customerName}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={isCustomerFlow ? "Enter your name" : "Enter customer name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {isCustomerFlow ? 'Your Phone Number *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      value={customerDetails.customerPhone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
                {isCustomerFlow && (
                  <p className="text-xs text-gray-600 mt-2">
                    📱 We'll send order confirmation via WhatsApp to our kitchen
                  </p>
                )}
              </div>
            )}

            {/* Selected Items Summary */}
            {!loadingMenuItems && selectedItems.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-primary mb-2">Selected Items ({totalItems}):</h3>
                <div className="space-y-1">
                  {selectedItems.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">₹{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            {!loadingMenuItems && selectedItems.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing Order...' : 'Select Payment Mode'}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Payment Mode Modal */}
      <PaymentModeModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentModeSelect}
        totalAmount={totalAmount}
      />
    </div>
  );
}