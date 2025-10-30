'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ProfitCalculator } from '@/lib/profit-calculations';

interface ExpenseBreakdownChartProps {
  refreshTrigger?: number;
}

const categoryColors = {
  ingredients: '#16a34a',
  fuel: '#3b82f6',
  packaging: '#eab308',
  utilities: '#8b5cf6',
  labor: '#dc2626',
  rent: '#6366f1',
  other: '#6b7280',
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

export default function ExpenseBreakdownChart({ refreshTrigger }: ExpenseBreakdownChartProps) {
  const [data, setData] = useState<Array<{category: string, amount: number, percentage: number, name: string, fill: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('today');
  const [totalExpenses, setTotalExpenses] = useState(0);

  const fetchBreakdownData = async () => {
    try {
      setLoading(true);
      const breakdownData = await ProfitCalculator.getExpenseBreakdown(timePeriod);
      
      // Filter out categories with 0 amount and add colors
      const formattedData = breakdownData.breakdown
        .filter(item => item.amount > 0)
        .map(item => ({
          ...item,
          name: categoryLabels[item.category as keyof typeof categoryLabels],
          fill: categoryColors[item.category as keyof typeof categoryColors]
        }))
        .sort((a, b) => b.amount - a.amount);
      
      setData(formattedData);
      setTotalExpenses(breakdownData.totalExpenses);
    } catch (error) {
      console.error('Error fetching expense breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdownData();
  }, [refreshTrigger, timePeriod]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-success">{`Amount: ${formatCurrency(data.amount)}`}</p>
          <p className="text-sm text-secondary">{`${data.percentage.toFixed(1)}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
        <h3 className="text-lg font-semibold text-foreground">Expense Breakdown</h3>
        
        <div className="flex items-center space-x-2">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as 'today' | 'week' | 'month')}
            className="border border-border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          
          <div className="flex border border-border rounded overflow-hidden">
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                chartType === 'pie' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-foreground hover:bg-background/50'
              }`}
            >
              Pie
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p>No expense data available</p>
          <p className="text-sm">Add expenses to see breakdown</p>
        </div>
      ) : (
        <>
          {/* Total Expenses */}
          <div className="text-center mb-4">
            <span className="text-sm text-secondary">Total Expenses: </span>
            <span className="text-xl font-bold text-danger">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={data} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend for Pie Chart */}
          {chartType === 'pie' && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="text-sm text-foreground truncate">
                    {item.name} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}