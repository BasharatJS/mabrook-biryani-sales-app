'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/lib/types';
import { ExpenseService } from '@/lib/firestore';

interface ExpensesListProps {
  refreshTrigger?: number;
}

const categoryIcons = {
  ingredients: '🌾',
  fuel: '⛽',
  packaging: '📦',
  utilities: '💡',
  labor: '👷',
  rent: '🏠',
  other: '📝',
};

const categoryLabels = {
  ingredients: 'Ingredients',
  fuel: 'Fuel',
  packaging: 'Packaging',
  utilities: 'Utilities',
  labor: 'Labor',
  rent: 'Rent',
  other: 'Other',
};

export default function ExpensesList({ refreshTrigger }: ExpensesListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let fetchedExpenses: Expense[] = [];

      if (dateFilter === 'today') {
        fetchedExpenses = await ExpenseService.getTodayExpenses();
      } else if (dateFilter === 'week') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        fetchedExpenses = await ExpenseService.getExpensesByDateRange(startDate, endDate);
      } else if (dateFilter === 'month') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        fetchedExpenses = await ExpenseService.getExpensesByDateRange(startDate, endDate);
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          fetchedExpenses = await ExpenseService.getExpensesByDateRange(startDate, endDate);
        }
      }

      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger, dateFilter, customStartDate, customEndDate]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await ExpenseService.deleteExpense(expenseId);
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-border rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-border rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Expense History</h3>

          <div className="flex items-center space-x-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-secondary">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-secondary">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
        
        {expenses.length > 0 && (
          <div className="text-right">
            <span className="text-sm text-secondary">Total: </span>
            <span className="text-lg font-bold text-danger">₹{getTotalExpenses().toLocaleString()}</span>
          </div>
        )}
      </div>
      
      {expenses.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <p>No expenses found</p>
          <p className="text-sm">
            {dateFilter === 'today' && 'Add your first expense for today'}
            {dateFilter === 'week' && 'No expenses recorded in the last 7 days'}
            {dateFilter === 'month' && 'No expenses recorded in the last 30 days'}
            {dateFilter === 'custom' && 'No expenses found for the selected date range'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {expenses.map((expense) => (
            <div key={expense.id} className="p-4 hover:bg-background/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{categoryIcons[expense.category]}</span>
                    <h4 className="font-medium text-foreground">{categoryLabels[expense.category]}</h4>
                    <span className="text-lg font-bold text-danger">₹{expense.amount.toLocaleString()}</span>
                  </div>
                  
                  <p className="text-sm text-secondary mb-1">{expense.description}</p>
                  <p className="text-xs text-secondary">{formatDate(expense.date)}</p>
                </div>
                
                <button
                  onClick={() => handleDeleteExpense(expense.id!)}
                  className="ml-4 text-danger hover:text-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}