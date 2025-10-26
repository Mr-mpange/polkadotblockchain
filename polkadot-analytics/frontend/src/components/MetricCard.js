import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Skeleton } from './skeleton';

const MetricCard = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  className = '',
  isLoading = false
}) => {
  const formatChange = (change) => {
    if (change === null || change === undefined) return null;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <FiTrendingUp className="h-4 w-4" />;
      case 'down':
        return <FiTrendingDown className="h-4 w-4" />;
      default:
        return <FiMinus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'down':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`transition-all duration-200 hover:shadow-lg ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="text-muted-foreground">{title}</div>
                {icon && <div className="text-muted-foreground">{icon}</div>}
              </div>

              <div className="text-2xl font-bold tracking-tight">
                {value}
              </div>

              {change !== null && change !== undefined && (
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>{formatChange(change)}</span>
                </div>
              )}
            </div>

            <div className={`p-2 rounded-lg ${getTrendColor()}`}>
              {icon || getTrendIcon()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export { MetricCard };
