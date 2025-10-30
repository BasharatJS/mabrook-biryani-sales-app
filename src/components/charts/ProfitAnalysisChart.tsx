'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import { ProfitCalculator, ProfitData } from '@/lib/profit-calculations';

interface ProfitAnalysisChartProps {
  refreshTrigger?: number;
}

export default function ProfitAnalysisChart({ refreshTrigger }: ProfitAnalysisChartProps) {
  const [trendsData, setTrendsData] = useState<Array<{date: string, profit: number, revenue: number, expenses: number, margin: number}>>([]);
  const [summaryData, setSummaryData] = useState<{today: ProfitData, weekly: ProfitData, monthly: ProfitData} | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'trends' | 'comparison'>('trends');
  const [days, setDays] = useState(14);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      
      const [trends, today, weekly, monthly] = await Promise.all([
        ProfitCalculator.getDailyProfitTrend(days),
        ProfitCalculator.getTodayProfit(),
        ProfitCalculator.getWeeklyProfit(),
        ProfitCalculator.getMonthlyProfit()
      ]);

      // Format trends data with margin calculation
      const formattedTrends = trends.map(item => ({
        ...item,
        margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
        formattedDate: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));

      setTrendsData(formattedTrends);
      setSummaryData({ today, weekly, monthly });
    } catch (error) {
      console.error('Error fetching profit analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [refreshTrigger, days]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'margin' 
                ? `Margin: ${formatPercentage(entry.value)}`
                : `${entry.name}: ${formatCurrency(entry.value)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-border rounded w-1/3"></div>
          <div className="h-64 bg-border rounded"></div>
        </div>
      </div>
    );
  }

  // Prepare comparison data
  const comparisonData = summaryData ? [
    { period: 'Today', ...summaryData.today },
    { period: 'Weekly', ...summaryData.weekly },
    { period: 'Monthly', ...summaryData.monthly }
  ] : [];

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Profit Analysis</h3>
        
        <div className="flex items-center space-x-2">
          {viewType === 'trends' && (
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          )}
          
          <div className="flex border border-border rounded overflow-hidden">
            <button
              onClick={() => setViewType('trends')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewType === 'trends' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-background/50'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setViewType('comparison')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewType === 'comparison' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-background/50'
              }`}
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      {viewType === 'trends' ? (
        trendsData.length === 0 ? (
          <div className="text-center py-16 text-secondary">
            <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p>No profit data available</p>
            <p className="text-sm">Start taking orders and adding expenses to see analysis</p>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="currency"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis 
                    yAxisId="percentage"
                    orientation="right"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={formatPercentage}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="currency"
                    type="monotone"
                    dataKey="profit"
                    fill="#ea580c"
                    fillOpacity={0.1}
                    stroke="#ea580c"
                    strokeWidth={3}
                    name="Net Profit"
                  />
                  <Bar 
                    yAxisId="currency"
                    dataKey="revenue" 
                    fill="#16a34a" 
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Bar 
                    yAxisId="currency"
                    dataKey="expenses" 
                    fill="#dc2626" 
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                  <Line
                    yAxisId="percentage"
                    type="monotone"
                    dataKey="margin"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                    name="Profit Margin %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Trend Summary */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-success">
                    {formatCurrency(trendsData.reduce((sum, item) => sum + item.revenue, 0))}
                  </div>
                  <div className="text-xs text-secondary">Total Revenue</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-danger">
                    {formatCurrency(trendsData.reduce((sum, item) => sum + item.expenses, 0))}
                  </div>
                  <div className="text-xs text-secondary">Total Expenses</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(trendsData.reduce((sum, item) => sum + item.profit, 0))}
                  </div>
                  <div className="text-xs text-secondary">Net Profit</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-secondary">
                    {formatPercentage(
                      trendsData.reduce((sum, item) => sum + item.margin, 0) / trendsData.length
                    )}
                  </div>
                  <div className="text-xs text-secondary">Avg Margin</div>
                </div>
              </div>
            </div>
          </>
        )
      ) : (
        // Comparison View
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'profitMargin' ? formatPercentage(value) : formatCurrency(value),
                    name === 'profitMargin' ? 'Profit Margin' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#16a34a" name="Revenue" />
                <Bar dataKey="totalExpenses" fill="#dc2626" name="Expenses" />
                <Line 
                  type="monotone" 
                  dataKey="netProfit" 
                  stroke="#ea580c" 
                  strokeWidth={3}
                  name="Net Profit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.map((item, index) => (
              <div key={index} className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-3">{item.period}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Orders:</span>
                    <span className="font-medium">{item.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Revenue:</span>
                    <span className="font-medium text-success">{formatCurrency(item.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Expenses:</span>
                    <span className="font-medium text-danger">{formatCurrency(item.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-medium">Net Profit:</span>
                    <span className={`font-bold ${item.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(item.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Margin:</span>
                    <span className={`font-medium ${item.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatPercentage(item.profitMargin)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}