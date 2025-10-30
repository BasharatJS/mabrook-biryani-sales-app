'use client';

import { useState } from 'react';
import { MenuItemService } from '@/lib/firestore';
import type { MenuItemFormData } from '@/lib/types';

const BULK_MENU_ITEMS: MenuItemFormData[] = [
  // BIRYANI
  { name: 'CHICKEN BIRYANI', price: 160, category: 'chicken', isActive: true },
  { name: 'MUTTON BIRYANI', price: 180, category: 'mutton', isActive: true },
  { name: 'CHICKEN SPL. BIRYANI', price: 250, category: 'chicken', isActive: true },
  { name: 'MUTTON SPL. BIRYANI', price: 430, category: 'mutton', isActive: true },
  { name: 'ALOO BIRYANI', price: 90, category: 'veg', isActive: true },
  { name: 'EGG BIRYANI', price: 110, category: 'egg', isActive: true },

  // ROLLS
  { name: 'EGG ROLL', price: 40, category: 'egg', isActive: true },
  { name: 'DOUBLE EGG ROLL', price: 50, category: 'egg', isActive: true },
  { name: 'CHICKEN ROLL', price: 65, category: 'chicken', isActive: true },
  { name: 'EGG CHICKEN ROLL', price: 75, category: 'chicken', isActive: true },
  { name: 'DOUBLE EGG CHICKEN', price: 85, category: 'chicken', isActive: true },
  { name: 'DOUBLE CHICKEN', price: 90, category: 'chicken', isActive: true },
  { name: 'DOUBLE CHICKEN EGG', price: 100, category: 'chicken', isActive: true },
  { name: 'DOUBLE CHICKEN DOUBLE EGG', price: 110, category: 'chicken', isActive: true },
  { name: 'PANEER ROLL', price: 70, category: 'veg', isActive: true },
  { name: 'EGG PANEER ROLL', price: 80, category: 'veg', isActive: true },
  { name: 'VEG ROLL', price: 50, category: 'veg', isActive: true },
  { name: 'LACCHA PARATHA', price: 25, category: 'veg', isActive: true },

  // EXTRA
  { name: 'EXTRA ALOO', price: 10, category: 'extras', isActive: true },
  { name: 'EXTRA EGG', price: 15, category: 'extras', isActive: true },
  { name: 'EXTRA CHICKEN', price: 60, category: 'extras', isActive: true },
  { name: 'EXTRA MUTTON', price: 150, category: 'extras', isActive: true },

  // SALAD
  { name: 'GREEN SALAD', price: 50, category: 'veg', isActive: true },

  // CURRY ITEMS
  { name: 'CHICKEN KASA', price: 90, category: 'chicken', isActive: true },
  { name: 'CHICKEN CHAP', price: 120, category: 'chicken', isActive: true },

  // KABAB
  { name: 'CHICKEN TAWA FRY KABAB', price: 150, category: 'chicken', isActive: true },
];

export default function BulkMenuItemsButton({ onComplete }: { onComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleBulkImport = async () => {
    if (!window.confirm(
      `This will add ${BULK_MENU_ITEMS.length} menu items to your database.\n\nAre you sure you want to continue?`
    )) {
      return;
    }

    setLoading(true);
    setStatus('processing');
    setProgress({ current: 0, total: BULK_MENU_ITEMS.length });
    setError(null);

    try {
      let successCount = 0;
      let failedItems: string[] = [];

      for (let i = 0; i < BULK_MENU_ITEMS.length; i++) {
        const item = BULK_MENU_ITEMS[i];
        setProgress({ current: i + 1, total: BULK_MENU_ITEMS.length });

        try {
          await MenuItemService.createMenuItem(item);
          successCount++;
        } catch (err) {
          console.error(`Failed to add ${item.name}:`, err);
          failedItems.push(item.name);
        }

        // Small delay to prevent overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (failedItems.length > 0) {
        setError(`Added ${successCount} items. Failed: ${failedItems.join(', ')}`);
        setStatus('error');
      } else {
        setStatus('success');
        alert(`Successfully added all ${successCount} menu items to the database!`);
        onComplete?.();
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import menu items');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Bulk Import Menu Items
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Add {BULK_MENU_ITEMS.length} menu items to database with one click
          </p>
        </div>
        <button
          onClick={handleBulkImport}
          disabled={loading || status === 'success'}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : status === 'success'
              ? 'bg-green-500 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Importing {progress.current}/{progress.total}...
            </span>
          ) : status === 'success' ? (
            '✓ Import Complete'
          ) : (
            `Import ${BULK_MENU_ITEMS.length} Items`
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center">
            {Math.round((progress.current / progress.total) * 100)}% Complete
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 text-sm">
          ✓ All menu items have been successfully added to the database!
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
          ⚠ {error}
        </div>
      )}

      <details className="mt-3">
        <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
          View items to be imported ({BULK_MENU_ITEMS.length})
        </summary>
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {BULK_MENU_ITEMS.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-600 dark:text-gray-400">₹{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
