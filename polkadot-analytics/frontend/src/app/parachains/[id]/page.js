'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AIInsights } from '@/components/AIInsights';
import { AIPredictions } from '@/components/AIPredictions';
import { api } from '../../../services/api';

export default function ParachainDetailPage() {
  const params = useParams();
  const parachainId = params.id;

  const { data: parachain, isLoading } = useQuery({
    queryKey: ['parachain', parachainId],
    queryFn: () => api.getParachainById(parachainId),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!parachain) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Parachain not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{parachain.name}</h1>
          <Badge variant="secondary">{parachain.category || 'Other'}</Badge>
        </div>
        <p className="text-gray-600">
          Parachain ID: {parachainId} • {parachain.tokenSymbol}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parachain.tvl?.toLocaleString() || '0'}
            </div>
            {parachain.tvl_change_24h && (
              <p className={`text-sm mt-1 ${parachain.tvl_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parachain.tvl_change_24h >= 0 ? '+' : ''}{parachain.tvl_change_24h.toFixed(2)}% (24h)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">24h Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parachain.transactions_24h?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={parachain.isActive ? 'default' : 'secondary'}>
              {parachain.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* AI Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsights parachainId={parachainId} />
        <AIPredictions parachainId={parachainId} />
      </div>
    </div>
  );
}
