'use client';

import { useState, useEffect } from 'react';
import { ProfitCalculator } from '@/lib/profit-calculations';

interface ExpenseBreakdownProps {
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

const categoryColors = {
  ingredients: 'bg-green-500',
  fuel: 'bg-blue-500',
  packaging: 'bg-yellow-500',
  utilities: 'bg-purple-500',
  labor: 'bg-red-500',
  rent: 'bg-indigo-500',
  other: 'bg-gray-500',
};

export default function ExpenseBreakdown({ refreshTrigger }: ExpenseBreakdownProps) {
  const [breakdown, setBreakdown] = useState<Array<{category: string, amount: number, percentage: number}>>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('today');

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      const data = await ProfitCalculator.getExpenseBreakdown(timePeriod);
      
      // Filter out categories with 0 amount and sort by amount descending
      const filteredBreakdown = data.breakdown
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount);
      
      setBreakdown(filteredBreakdown);
      setTotalExpenses(data.totalExpenses);
    } catch (error) {
      console.error('Error fetching expense breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdown();
  }, [refreshTrigger, timePeriod]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-border rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-border rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Expense Breakdown</h3>
        
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as 'today' | 'week' | 'month')}
          className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>

      {breakdown.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p>No expenses to analyze</p>
          <p className="text-sm">
            {timePeriod === 'today' && 'Add expenses for today to see breakdown'}
            {timePeriod === 'week' && 'No expenses recorded in the last 7 days'}
            {timePeriod === 'month' && 'No expenses recorded in the last 30 days'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <span className="text-sm text-secondary">Total Expenses: </span>
            <span className="text-lg font-bold text-danger">
              {ProfitCalculator.formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{categoryIcons[item.category as keyof typeof categoryIcons]}</span>
                    <span className="text-sm font-medium text-foreground">
                      {categoryLabels[item.category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {ProfitCalculator.formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-secondary">
                      {ProfitCalculator.formatPercentage(item.percentage)}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${categoryColors[item.category as keyof typeof categoryColors]}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {breakdown.map((item) => (
                <div key={item.category} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${categoryColors[item.category as keyof typeof categoryColors]}`}></div>
                  <span className="text-secondary truncate">
                    {categoryLabels[item.category as keyof typeof categoryLabels]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}