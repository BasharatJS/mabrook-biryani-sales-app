'use client';

import { useState, useEffect } from 'react';
import { ProfitCalculator, ProfitData } from '@/lib/profit-calculations';

interface DashboardStatsProps {
  refreshTrigger?: number;
}

export default function DashboardStats({ refreshTrigger }: DashboardStatsProps) {
  const [stats, setStats] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStats = await ProfitCalculator.getTodayProfit();
      setStats(todayStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    textColor = 'text-foreground',
    isLoading = false 
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    textColor?: string;
    isLoading?: boolean;
  }) => (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">{title}</p>
          {isLoading ? (
            <div className="h-8 bg-border rounded w-20 animate-pulse mt-1"></div>
          ) : (
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (!stats && !loading) {
    return (
      <div className="text-center py-8 text-secondary">
        <p>Unable to load dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Today's Orders"
        value={stats?.totalOrders || 0}
        color="bg-primary"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />

      <StatCard
        title="Today's Revenue"
        value={ProfitCalculator.formatCurrency(stats?.totalRevenue || 0)}
        color="bg-success"
        textColor="text-success"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        }
      />

      <StatCard
        title="Today's Expenses"
        value={ProfitCalculator.formatCurrency(stats?.totalExpenses || 0)}
        color="bg-danger"
        textColor="text-danger"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-danger-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        }
      />

      <StatCard
        title="Net Profit"
        value={ProfitCalculator.formatCurrency(stats?.netProfit || 0)}
        color="bg-warning"
        textColor={stats && stats.netProfit >= 0 ? "text-success" : "text-danger"}
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-warning-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
    </div>
  );
}