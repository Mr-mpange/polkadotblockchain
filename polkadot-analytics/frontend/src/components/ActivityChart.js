'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';

const ActivityChart = ({ data = [], period = '24h', className = '' }) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedTime: format(new Date(item.timestamp), 'MMM dd, HH:mm'),
      formattedTransactions: new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(item.transactions || 0),
      formattedAccounts: new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(item.activeAccounts || 0),
      formattedVolume: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(item.volume || 0),
    }));
  }, [data]);

  const formatTooltipValue = (value, name) => {
    switch (name) {
      case 'transactions':
        return [value, 'Transactions'];
      case 'activeAccounts':
        return [value, 'Active Accounts'];
      case 'volume':
        return [value, 'Volume (USD)'];
      default:
        return [value, name];
    }
  };

  const formatTooltipLabel = (label) => {
    try {
      return format(new Date(label), 'MMM dd, yyyy HH:mm');
    } catch {
      return label;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-muted-foreground ${className}`}>
        No activity data available
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

          <XAxis
            dataKey="formattedTime"
            className="text-muted-foreground text-xs"
            interval="preserveStartEnd"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            yAxisId="left"
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(value)
            }
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(value)
            }
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipLabel}
          />

          <Legend />

          {/* Transactions Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="transactions"
            stroke="#5626D0"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#5626D0' }}
            name="Transactions"
          />

          {/* Active Accounts Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="activeAccounts"
            stroke="#0000FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#0000FF' }}
            name="Active Accounts"
          />

          {/* Volume Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="volume"
            stroke="#E6007A"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#E6007A' }}
            name="Volume (USD)"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart Summary */}
      {chartData.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-6">
            <span>
              Latest: {chartData[chartData.length - 1]?.formattedTransactions} txns
            </span>
            <span>
              Peak: {Math.max(...chartData.map(d => d.transactions || 0)).toLocaleString()} txns
            </span>
          </div>
          <span>
            {chartData.length} data points
          </span>
        </div>
      )}
    </div>
  );
};

export { ActivityChart };
