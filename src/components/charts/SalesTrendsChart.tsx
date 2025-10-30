'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ProfitCalculator } from '@/lib/profit-calculations';

interface SalesTrendsChartProps {
  refreshTrigger?: number;
}

export default function SalesTrendsChart({ refreshTrigger }: SalesTrendsChartProps) {
  const [data, setData] = useState<Array<{date: string, profit: number, revenue: number, expenses: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [days, setDays] = useState(7);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      const trendsData = await ProfitCalculator.getDailyProfitTrend(days);
      
      // Format data for charts
      const formattedData = trendsData.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendsData();
  }, [refreshTrigger, days]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${formatCurrency(entry.value)}`}
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

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sales Trends</h3>
        
        <div className="flex items-center space-x-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          
          <div className="flex border border-border rounded overflow-hidden">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                chartType === 'line' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-background/50'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-background/50'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-secondary">
          <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No sales data available</p>
          <p className="text-sm">Start taking orders to see trends</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Expenses"
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#ea580c" 
                  strokeWidth={3}
                  name="Net Profit"
                  dot={{ fill: '#ea580c', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill="#16a34a" name="Revenue" />
                <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
                <Bar dataKey="profit" fill="#ea580c" name="Net Profit" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-success">
                {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
              </div>
              <div className="text-xs text-secondary">Total Revenue</div>
            </div>
            <div>
              <div className="text-lg font-bold text-danger">
                {formatCurrency(data.reduce((sum, item) => sum + item.expenses, 0))}
              </div>
              <div className="text-xs text-secondary">Total Expenses</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {formatCurrency(data.reduce((sum, item) => sum + item.profit, 0))}
              </div>
              <div className="text-xs text-secondary">Total Profit</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}