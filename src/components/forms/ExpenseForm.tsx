'use client';

import { useState } from 'react';
import { ExpenseFormData } from '@/lib/types';
import { ExpenseService } from '@/lib/firestore';

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const expenseCategories = [
  { value: 'ingredients', label: 'Ingredients', icon: '🌾' },
  { value: 'fuel', label: 'Fuel', icon: '⛽' },
  { value: 'packaging', label: 'Packaging', icon: '📦' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'labor', label: 'Labor', icon: '👷' },
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: 'ingredients',
    description: '',
    amount: 0,
    date: new Date(),
  });

  const [errors, setErrors] = useState<{[K in keyof ExpenseFormData]?: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {[K in keyof ExpenseFormData]?: string} = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Amount cannot exceed ₹1,00,000';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' 
        ? parseFloat(value) || 0 
        : name === 'date' 
        ? new Date(value)
        : value
    }));

    if (errors[name as keyof ExpenseFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await ExpenseService.createExpense(formData);
      
      setFormData({
        category: 'ingredients',
        description: '',
        amount: 0,
        date: new Date(),
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-6">Add Expense</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {expenseCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-danger focus:ring-danger'
                : 'border-border focus:ring-primary'
            }`}
            placeholder="Enter expense description (e.g., Rice purchase, Delivery fuel, etc.)"
          />
          {errors.description && (
            <p className="text-danger text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.amount
                  ? 'border-danger focus:ring-danger'
                  : 'border-border focus:ring-primary'
              }`}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-danger text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formatDateForInput(formData.date)}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.date
                  ? 'border-danger focus:ring-danger'
                  : 'border-border focus:ring-primary'
              }`}
            />
            {errors.date && (
              <p className="text-danger text-sm mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-background/50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}