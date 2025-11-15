'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

/**
 * DataCard - A reusable card component for displaying data
 * Can be used for displaying various types of information like stats, metrics, etc.
 */
export const DataCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading = false,
  trend,
  trendLabel,
  className = '',
  onClick
}) => {
  const cardContent = (
    <Card className={`hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            {subtitle && <Skeleton className="h-4 w-24" />}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default DataCard;
