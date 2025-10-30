'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem } from '@/lib/types';
import { MenuItemService } from '@/lib/firestore';

interface MenuItemsContextType {
  menuItems: MenuItem[];
  activeMenuItems: MenuItem[];
  loading: boolean;
  refreshMenuItems: () => Promise<void>;
}

const MenuItemsContext = createContext<MenuItemsContextType | undefined>(undefined);

export function MenuItemsProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // OPTIMIZATION: Check localStorage cache first
      if (!forceRefresh && typeof window !== 'undefined') {
        const cachedData = localStorage.getItem('menuItems');
        const cacheTime = localStorage.getItem('menuItemsTimestamp');

        if (cachedData && cacheTime) {
          const cacheAge = Date.now() - parseInt(cacheTime);
          const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

          // Use cache if less than 1 hour old
          if (cacheAge < CACHE_DURATION) {
            const parsedItems = JSON.parse(cachedData) as MenuItem[];
            setMenuItems(parsedItems);
            setLoading(false);
            return;
          }
        }
      }

      // Cache miss or expired - fetch from Firestore
      const items = await MenuItemService.getAllMenuItems();
      setMenuItems(items);

      // Store in localStorage for future use
      if (typeof window !== 'undefined') {
        localStorage.setItem('menuItems', JSON.stringify(items));
        localStorage.setItem('menuItemsTimestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const activeMenuItems = menuItems.filter(item => item.isActive !== false);

  const value: MenuItemsContextType = {
    menuItems,
    activeMenuItems,
    loading,
    refreshMenuItems: () => fetchMenuItems(true), // Force refresh when manually called
  };

  return (
    <MenuItemsContext.Provider value={value}>
      {children}
    </MenuItemsContext.Provider>
  );
}

export function useMenuItems() {
  const context = useContext(MenuItemsContext);
  if (context === undefined) {
    throw new Error('useMenuItems must be used within a MenuItemsProvider');
  }
  return context;
}
