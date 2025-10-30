'use client';

import { useState, useEffect } from 'react';
import { Order, MenuItem } from '@/lib/types';
import { MenuItemService } from '@/lib/firestore';

interface OrderEditModalProps {
  order: Order;
  onClose: () => void;
  onSave: (orderId: string, updatedData: Partial<Order>) => Promise<void>;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function OrderEditModal({ order, onClose, onSave }: OrderEditModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(order.orderItems || []);
  const [customerName, setCustomerName] = useState((order as any).customerName || '');
  const [customerPhone, setCustomerPhone] = useState((order as any).customerPhone || '');
  const [paymentMode, setPaymentMode] = useState(order.paymentMode || 'Cash');
  const [notes, setNotes] = useState(order.notes || '');
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoadingMenu(true);
      const items = await MenuItemService.getActiveMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoadingMenu(false);
    }
  };

  const addOrderItem = () => {
    if (menuItems.length === 0) return;
    const firstItem = menuItems[0];
    setOrderItems([
      ...orderItems,
      {
        name: firstItem.name,
        quantity: 1,
        price: firstItem.price,
        total: firstItem.price,
      },
    ]);
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If changing name, update price from menu
    if (field === 'name') {
      const menuItem = menuItems.find(item => item.name === value);
      if (menuItem) {
        newItems[index].price = menuItem.price;
        newItems[index].total = menuItem.price * newItems[index].quantity;
      }
    }

    // If changing quantity or price, recalculate total
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }

    setOrderItems(newItems);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
    const biryaniQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    return { totalAmount, biryaniQuantity };
  };

  const handleSave = async () => {
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    try {
      setLoading(true);
      const { totalAmount, biryaniQuantity } = calculateTotals();

      const updatedData: Partial<Order> = {
        orderItems,
        totalAmount,
        biryaniQuantity,
        paymentMode: paymentMode as 'UPI' | 'Cash',
        notes,
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
      };

      await onSave(order.id!, updatedData);
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { totalAmount, biryaniQuantity } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Edit Order #{order.id?.slice(-6)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Customer Details */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Customer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Order Items</h3>
              <button
                onClick={addOrderItem}
                disabled={loadingMenu}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                + Add Item
              </button>
            </div>

            {loadingMenu ? (
              <div className="text-center py-4 text-gray-500">Loading menu items...</div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Item Name */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Item
                        </label>
                        <select
                          value={item.name}
                          onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {menuItems.map((menuItem) => (
                            <option key={menuItem.id} value={menuItem.name}>
                              {menuItem.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Total */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="font-semibold text-primary text-sm bg-white border border-gray-300 rounded px-2 py-1.5">
                          ₹{item.total}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1">
                        <button
                          onClick={() => removeOrderItem(index)}
                          className="w-full bg-red-500 text-white px-2 py-1.5 rounded hover:bg-red-600 transition-colors text-sm"
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {orderItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No items added yet</p>
                    <p className="text-xs mt-1">Click "Add Item" to add items to this order</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'UPI' | 'Cash')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Any special instructions"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-primary to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Items:</span>
              <span className="text-lg font-bold">{biryaniQuantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-2xl font-bold">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || orderItems.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
