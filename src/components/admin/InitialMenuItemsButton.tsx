'use client';

import { useState } from 'react';
import { addInitialMenuItems } from '@/scripts/addInitialMenuItems';

export default function InitialMenuItemsButton() {
  const [isAdding, setIsAdding] = useState(false);
  const [result, setResult] = useState<{ successful: number; failed: number; total: number } | null>(null);

  const handleAddItems = async () => {
    if (!confirm('This will add all initial menu items to the database. Continue?')) {
      return;
    }

    setIsAdding(true);
    setResult(null);

    try {
      const result = await addInitialMenuItems();
      setResult(result);
      
      if (result.successful > 0) {
        alert(`Successfully added ${result.successful} menu items! You can now refresh the menu items page.`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add menu items. Please check the console for details.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">🚀 Setup Initial Menu Items</h3>
      
      <p className="text-sm text-secondary mb-4">
        This will add all the default menu items (biryani items, beverages, extras) to your database.
        Only run this once when setting up the restaurant.
      </p>

      <button
        onClick={handleAddItems}
        disabled={isAdding}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAdding ? 'Adding Items...' : '🍽️ Add Initial Menu Items'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">✅ Setup Complete!</h4>
          <p className="text-sm text-green-700">
            Successfully added {result.successful} out of {result.total} menu items.
            {result.failed > 0 && ` ${result.failed} items failed to add.`}
          </p>
        </div>
      )}
    </div>
  );
}