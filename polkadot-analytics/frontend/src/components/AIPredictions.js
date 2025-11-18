'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FiActivity, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

export function AIPredictions({ parachainId }) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['ai-predictions', parachainId],
    queryFn: () => api.getAIPredictions(parachainId),
    enabled: !!parachainId,
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiActivity className="h-5 w-5" />
            AI Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!predictions || !predictions.data) {
    return null;
  }

  const predData = predictions.data;
  
  // Debug: log the predictions data
  console.log('AI Predictions Data:', predData);
  
  // Map predictions to chart data format
  const chartData = predData.predictions?.map((pred, index) => {
    const predictedValue = pred.predicted_value || pred.value || 0;
    const currentValue = pred.current_value || predictedValue;
    const changePercent = pred.change_percent || 0;
    
    // Calculate confidence intervals if not provided
    const confidenceMargin = Math.abs(predictedValue * 0.15); // 15% margin
    
    return {
      period: pred.timeframe || `+${index + 1}d`,
      predicted: predictedValue,
      confidence_high: pred.confidence_interval?.high || (predictedValue + confidenceMargin),
      confidence_low: pred.confidence_interval?.low || (predictedValue - confidenceMargin),
    };
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiTrendingUp className="h-5 w-5 text-blue-600" />
          AI Predictions (Next 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value?.toLocaleString()}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Predicted Value"
                dot={{ fill: '#3b82f6' }}
              />
              <Line 
                type="monotone" 
                dataKey="confidence_high" 
                stroke="#93c5fd" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Upper Bound"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="confidence_low" 
                stroke="#93c5fd" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Lower Bound"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No prediction data available
          </div>
        )}
        
        {predData.accuracy && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Model Accuracy:</span> {(predData.accuracy * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
