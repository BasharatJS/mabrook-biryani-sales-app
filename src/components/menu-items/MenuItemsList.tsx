'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/lib/types';
import { MenuItemService } from '@/lib/firestore';
import { useMenuItems } from '@/contexts/MenuItemsContext';

interface MenuItemsListProps {
  refreshTrigger?: number;
  onEditItem?: (item: MenuItem) => void;
}

const categoryIcons = {
  mutton: '🐑',
  chicken: '🐔',
  egg: '🥚',
  veg: '🥔',
  beverages: '🥤',
  extras: '🍽️',
};

const categoryLabels = {
  mutton: 'Mutton Biryani',
  chicken: 'Chicken Biryani',
  egg: 'Egg Biryani',
  veg: 'Vegetarian',
  beverages: 'Beverages',
  extras: 'Extras',
};

export default function MenuItemsList({ refreshTrigger, onEditItem }: MenuItemsListProps) {
  const { menuItems, loading, refreshMenuItems } = useMenuItems();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    refreshMenuItems();
  }, [refreshTrigger]);

  const handleToggleStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await MenuItemService.deactivateMenuItem(itemId);
      } else {
        await MenuItemService.activateMenuItem(itemId);
      }
      await refreshMenuItems();
    } catch (error) {
      console.error('Error updating menu item status:', error);
      alert('Failed to update item status');
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await MenuItemService.deleteMenuItem(itemId);
      await refreshMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.isActive) ||
      (statusFilter === 'inactive' && !item.isActive);
    
    return matchesCategory && matchesStatus;
  });

  const getItemsByCategory = () => {
    const categorized: {[key: string]: MenuItem[]} = {};
    
    filteredItems.forEach(item => {
      if (!categorized[item.category]) {
        categorized[item.category] = [];
      }
      categorized[item.category].push(item);
    });
    
    // Define custom category order: Mutton → Chicken → Egg → Veg → Extras → Beverages
    const categoryOrder = {
      'mutton': 1,
      'chicken': 2,
      'egg': 3,
      'veg': 4,
      'extras': 5,
      'beverages': 6
    };
    
    // Sort categories in the desired order
    const orderedCategorized: {[key: string]: MenuItem[]} = {};
    const sortedCategories = Object.keys(categorized).sort((a, b) => {
      const orderA = categoryOrder[a as keyof typeof categoryOrder] || 999;
      const orderB = categoryOrder[b as keyof typeof categoryOrder] || 999;
      return orderA - orderB;
    });
    
    sortedCategories.forEach(category => {
      // Sort items within each category by name
      orderedCategorized[category] = categorized[category].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    });
    
    return orderedCategorized;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-border rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-border rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categorizedItems = getItemsByCategory();

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2 md:mb-0">Menu Items</h3>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {categoryIcons[key as keyof typeof categoryIcons]} {label}
                </option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
        
        {filteredItems.length > 0 && (
          <div className="text-sm text-secondary">
            Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} of {menuItems.length} total
          </div>
        )}
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h5.586a1 1 0 00.707-.293L16 14V7a2 2 0 00-2-2H9z" />
          </svg>
          <p>No menu items found</p>
          <p className="text-sm">
            {menuItems.length === 0 ? 'Add your first menu item to get started' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {Object.entries(categorizedItems).map(([category, items]) => (
            <div key={category}>
              <div className="px-6 py-3 bg-background/50">
                <h4 className="font-medium text-foreground flex items-center">
                  <span className="text-lg mr-2">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  {categoryLabels[category as keyof typeof categoryLabels]} ({items.length})
                </h4>
              </div>
              
              {items.map((item) => (
                <div key={item.id} className="p-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start space-x-4">
                      {/* Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-2xl ${item.imageUrl ? 'hidden' : ''}`}>
                          {categoryIcons[item.category]}
                        </div>
                      </div>
                      
                      {/* Item Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-green-600">₹{item.price.toLocaleString()}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-secondary mb-1">{item.description}</p>
                        )}
                        
                        <p className="text-xs text-secondary">
                          Created: {formatDate(item.createdAt)}
                          {item.updatedAt && item.updatedAt !== item.createdAt && (
                            <span> • Updated: {formatDate(item.updatedAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onEditItem?.(item)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        title="Edit item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(item.id!, item.isActive ?? true)}
                        className={`transition-colors p-1 ${
                          item.isActive 
                            ? 'text-orange-600 hover:text-orange-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={item.isActive ? 'Deactivate item' : 'Activate item'}
                      >
                        {item.isActive ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteItem(item.id!, item.name)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                        title="Delete item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}