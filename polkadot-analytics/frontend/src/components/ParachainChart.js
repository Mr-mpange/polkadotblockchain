'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = [
  '#E6007A', // Polkadot Pink
  '#5626D0', // Polkadot Purple
  '#0000FF', // Blue
  '#FF6B35', // Orange
  '#00D4AA', // Teal
  '#FF0080', // Hot Pink
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
];

const ParachainChart = ({ data = [], type = 'tvl', isLoading = false, className = '' }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    switch (type) {
      case 'tvl':
        return data.map((item, index) => ({
          name: item.parachainName || `Parachain #${item.parachainId}`,
          value: item.totalValueLockedUSD || item.tvl || 0,
          parachainId: item.parachainId,
          fill: COLORS[index % COLORS.length],
        }));
      case 'activity':
        return data.map((item, index) => ({
          name: item.parachainName || `Parachain #${item.parachainId}`,
          value: item.totalTransactions || item.activityScore || 0,
          parachainId: item.parachainId,
          fill: COLORS[index % COLORS.length],
        }));
      default:
        return [];
    }
  }, [data, type]);

  const formatTooltipValue = (value, name, props) => {
    if (type === 'tvl') {
      return [
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value),
        'TVL'
      ];
    } else {
      return [
        new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value),
        'Transactions'
      ];
    }
  };

  const formatTooltipLabel = (label, payload) => {
    if (payload && payload[0]) {
      const parachainId = payload[0].payload.parachainId;
      return `${label} (#${parachainId})`;
    }
    return label;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{formatTooltipLabel(label, payload)}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {formatTooltipValue(entry.value, entry.dataKey, entry.payload)[0]}
              {' '}{formatTooltipValue(entry.value, entry.dataKey, entry.payload)[1]}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-muted-foreground ${className}`}>
        No data available
      </div>
    );
  }

  // For small datasets, use pie chart
  if (data.length <= 8) {
    return (
      <div className={`w-full ${className}`}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Total: {type === 'tvl'
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(chartData.reduce((sum, item) => sum + item.value, 0))
              : new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(chartData.reduce((sum, item) => sum + item.value, 0))
            }</span>
            <span>{chartData.length} parachains</span>
          </div>
        </div>
      </div>
    );
  }

  // For larger datasets, use bar chart
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              type === 'tvl'
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value)
                : new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Top {Math.min(data.length, 10)} parachains</span>
          <span>{data.length} total parachains</span>
        </div>
      </div>
    </div>
  );
};

export { ParachainChart };
