'use client';

import { useState, useEffect } from 'react';
import { MenuItemFormData, MenuItem } from '@/lib/types';
import { MenuItemService } from '@/lib/firestore';

interface MenuItemFormProps {
  editingItem?: MenuItem | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const menuCategories = [
  { value: 'mutton', label: 'Mutton Biryani', icon: '🐑' },
  { value: 'chicken', label: 'Chicken Biryani', icon: '🐔' },
  { value: 'egg', label: 'Egg Biryani', icon: '🥚' },
  { value: 'veg', label: 'Vegetarian', icon: '🥔' },
  { value: 'beverages', label: 'Beverages', icon: '🥤' },
  { value: 'extras', label: 'Extras', icon: '🍽️' },
];

export default function MenuItemForm({ editingItem, onSuccess, onCancel }: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    price: 0,
    category: 'chicken',
    description: '',
    imageUrl: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<{[K in keyof MenuItemFormData]?: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        price: editingItem.price || 0,
        category: editingItem.category || 'chicken',
        description: editingItem.description || '',
        imageUrl: editingItem.imageUrl || '',
        isActive: editingItem.isActive ?? true,
      });
    }
  }, [editingItem]);

  const validateForm = (): boolean => {
    const newErrors: {[K in keyof MenuItemFormData]?: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    } else if (formData.price > 10000) {
      newErrors.price = 'Price cannot exceed ₹10,000';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? parseFloat(value) || 0 
        : type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }));

    if (errors[name as keyof MenuItemFormData]) {
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
      if (editingItem?.id) {
        await MenuItemService.updateMenuItem(editingItem.id, formData);
      } else {
        await MenuItemService.createMenuItem(formData);
      }
      
      setFormData({
        name: '',
        price: 0,
        category: 'chicken',
        description: '',
        imageUrl: '',
        isActive: true,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      </h2>
      
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
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {menuCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Item Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-danger focus:ring-danger'
                : 'border-border focus:ring-green-500'
            }`}
            placeholder="e.g., Chicken Biryani (Special), Water Bottle"
          />
          {errors.name && (
            <p className="text-danger text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Optional description of the item"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price || ''}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.price
                  ? 'border-danger focus:ring-danger'
                  : 'border-border focus:ring-green-500'
              }`}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-danger text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-foreground mb-1">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.imageUrl
                  ? 'border-danger focus:ring-danger'
                  : 'border-border focus:ring-green-500'
              }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && (
              <p className="text-danger text-sm mt-1">{errors.imageUrl}</p>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {formData.imageUrl && isValidUrl(formData.imageUrl) && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Image Preview
            </label>
            <div className="w-32 h-32 border border-border rounded-lg overflow-hidden">
              <img 
                src={formData.imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="w-4 h-4 text-green-600 border-border rounded focus:ring-green-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm font-medium text-foreground">
            Active (visible to customers)
          </label>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update Item' : 'Add Item')}
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