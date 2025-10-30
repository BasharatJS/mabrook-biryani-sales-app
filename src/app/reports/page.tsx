'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ProfitSummary from '@/components/reports/ProfitSummary';
import SalesTrendsChart from '@/components/charts/SalesTrendsChart';
import ExpenseBreakdownChart from '@/components/charts/ExpenseBreakdownChart';
import ProfitAnalysisChart from '@/components/charts/ProfitAnalysisChart';

export default function ReportsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-background/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        
        <ProfitSummary refreshTrigger={refreshTrigger} />
        
        <SalesTrendsChart refreshTrigger={refreshTrigger} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseBreakdownChart refreshTrigger={refreshTrigger} />
          {/* <ProfitAnalysisChart refreshTrigger={refreshTrigger} /> */}
        </div>

        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">19+</div>
              <div className="text-sm text-secondary">Menu Varieties</div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-success">Active</div>
              <div className="text-sm text-secondary">Business Status</div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-warning">7</div>
              <div className="text-sm text-secondary">Expense Categories</div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-secondary">Real-time</div>
              <div className="text-sm text-secondary">Data Updates</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}