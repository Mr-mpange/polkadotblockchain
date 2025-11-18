'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FiCpu, FiTrendingUp, FiTrendingDown, FiAlertTriangle } from 'react-icons/fi';
import { api } from '../services/api';

export function AIInsights({ parachainId }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', parachainId],
    queryFn: () => api.getAIInsights(parachainId),
    enabled: !!parachainId,
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiCpu className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || !insights.data) {
    return null;
  }

  const insightsData = insights.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiCpu className="h-5 w-5 text-purple-600" />
          AI-Powered Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insightsData.insights?.map((insight, index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-start gap-3">
                {insight.type === 'positive' && (
                  <FiTrendingUp className="h-5 w-5 text-green-600 mt-1" />
                )}
                {insight.type === 'negative' && (
                  <FiTrendingDown className="h-5 w-5 text-red-600 mt-1" />
                )}
                {insight.type === 'warning' && (
                  <FiAlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {insight.message}
                  </p>
                  {insight.confidence && (
                    <Badge variant="outline" className="mt-2">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {insightsData.summary && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {insightsData.summary}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
