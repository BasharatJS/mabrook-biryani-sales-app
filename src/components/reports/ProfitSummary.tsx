'use client';

import { useState, useEffect } from 'react';
import { ProfitCalculator, ProfitData } from '@/lib/profit-calculations';

interface ProfitSummaryProps {
  refreshTrigger?: number;
}

export default function ProfitSummary({ refreshTrigger }: ProfitSummaryProps) {
  const [todayProfit, setTodayProfit] = useState<ProfitData | null>(null);
  const [weeklyProfit, setWeeklyProfit] = useState<ProfitData | null>(null);
  const [monthlyProfit, setMonthlyProfit] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      
      const [today, weekly, monthly] = await Promise.all([
        ProfitCalculator.getTodayProfit(),
        ProfitCalculator.getWeeklyProfit(),
        ProfitCalculator.getMonthlyProfit()
      ]);

      setTodayProfit(today);
      setWeeklyProfit(weekly);
      setMonthlyProfit(monthly);
    } catch (error) {
      console.error('Error fetching profit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitData();
  }, [refreshTrigger]);

  const ProfitCard = ({ 
    title, 
    data, 
    isLoading = false 
  }: {
    title: string;
    data: ProfitData | null;
    isLoading?: boolean;
  }) => (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-border rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-border rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-border rounded w-2/3 animate-pulse"></div>
        </div>
      ) : data ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Revenue:</span>
            <span className="font-medium text-success">{ProfitCalculator.formatCurrency(data.totalRevenue)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Expenses:</span>
            <span className="font-medium text-danger">{ProfitCalculator.formatCurrency(data.totalExpenses)}</span>
          </div>
          
          <div className="border-t border-border pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Net Profit:</span>
              <span className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                {ProfitCalculator.formatCurrency(data.netProfit)}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-secondary">Orders: {data.totalOrders}</span>
            <span className={`font-medium ${data.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
              Margin: {ProfitCalculator.formatPercentage(data.profitMargin)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-secondary">
          <p>No data available</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ProfitCard title="Today's Profit" data={todayProfit} isLoading={loading} />
      <ProfitCard title="Weekly Profit (7 days)" data={weeklyProfit} isLoading={loading} />
      <ProfitCard title="Monthly Profit (30 days)" data={monthlyProfit} isLoading={loading} />
    </div>
  );
}