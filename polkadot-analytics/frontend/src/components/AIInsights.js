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
  
  // Debug: log the insights data
  console.log('AI Insights Data:', insightsData);

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
          {(!insightsData.insights || insightsData.insights.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <p>No insights available at this time.</p>
              <p className="text-sm mt-2">The AI is analyzing parachain data...</p>
            </div>
          ) : (
            insightsData.insights?.map((insight, index) => {
              // Handle both string and object formats
              const isString = typeof insight === 'string';
              const message = isString ? insight : insight.message;
              const type = isString ? 'neutral' : insight.type;
              const confidence = isString ? insightsData.confidence : insight.confidence;
              
              // Determine icon based on message content if type is neutral
              let IconComponent = FiCpu;
              let iconColor = 'text-blue-600';
              
              if (type === 'positive' || message.toLowerCase().includes('increase') || message.toLowerCase().includes('growth')) {
                IconComponent = FiTrendingUp;
                iconColor = 'text-green-600';
              } else if (type === 'negative' || message.toLowerCase().includes('decrease') || message.toLowerCase().includes('decline')) {
                IconComponent = FiTrendingDown;
                iconColor = 'text-red-600';
              } else if (type === 'warning' || message.toLowerCase().includes('volatile') || message.toLowerCase().includes('unstable')) {
                IconComponent = FiAlertTriangle;
                iconColor = 'text-yellow-600';
              }
              
              return (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 ${iconColor} mt-1 flex-shrink-0`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {message}
                      </p>
                      {confidence && (
                        <Badge variant="outline" className="mt-2">
                          Confidence: {(confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
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
