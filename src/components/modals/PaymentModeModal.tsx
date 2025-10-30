'use client';

import { useState } from 'react';

interface PaymentModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (paymentMode: 'UPI' | 'Cash') => void;
  totalAmount: number;
}

export default function PaymentModeModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  totalAmount 
}: PaymentModeModalProps) {
  const [selectedMode, setSelectedMode] = useState<'UPI' | 'Cash' | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedMode) {
      onSelect(selectedMode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Select Payment Mode
          </h2>
          <p className="text-gray-600">
            Total Amount: <span className="font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-4 mb-6">
          {/* UPI Payment */}
          <div 
            onClick={() => setSelectedMode('UPI')}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedMode === 'UPI' 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📱</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">UPI Payment</h3>
                <p className="text-gray-600 text-sm">Pay via PhonePe, GooglePay, Paytm, etc.</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                selectedMode === 'UPI' 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-300'
              }`}>
                {selectedMode === 'UPI' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
          </div>

          {/* Cash Payment */}
          <div 
            onClick={() => setSelectedMode('Cash')}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedMode === 'Cash' 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">Cash Payment</h3>
                <p className="text-gray-600 text-sm">Pay with cash on delivery/pickup</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                selectedMode === 'Cash' 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-300'
              }`}>
                {selectedMode === 'Cash' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm & Proceed
          </button>
        </div>
      </div>
    </div>
  );
}