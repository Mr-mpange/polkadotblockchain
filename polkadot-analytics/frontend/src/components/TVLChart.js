'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';

const TVLChart = ({ data = [], period = '24h', className = '' }) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedTime: format(new Date(item.timestamp), 'MMM dd, HH:mm'),
      formattedValue: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(item.value),
    }));
  }, [data]);

  const formatTooltipValue = (value, name) => {
    if (name === 'value') {
      return [
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value),
        'TVL'
      ];
    }
    return [value, name];
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
        No TVL data available
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E6007A" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#E6007A" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

          <XAxis
            dataKey="formattedTime"
            className="text-muted-foreground text-xs"
            interval="preserveStartEnd"
            tick={{ fontSize: 12 }}
          />

          <YAxis
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

          <Area
            type="monotone"
            dataKey="value"
            stroke="#E6007A"
            strokeWidth={2}
            fill="url(#tvlGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#E6007A' }}
          />

          {/* Reference line for average */}
          {chartData.length > 0 && (
            <ReferenceLine
              y={chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{ value: "Average", position: "insideTopRight" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Chart Summary */}
      {chartData.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>
              Current: {chartData[chartData.length - 1]?.formattedValue}
            </span>
            {chartData.length > 1 && (
              <span className={`flex items-center space-x-1 ${
                chartData[chartData.length - 1].change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>
                  {chartData[chartData.length - 1].change >= 0 ? '↗' : '↘'}
                  {Math.abs(chartData[chartData.length - 1].change || 0).toFixed(2)}%
                </span>
              </span>
            )}
          </div>
          <span>
            {chartData.length} data points
          </span>
        </div>
      )}
    </div>
  );
};

export { TVLChart };
