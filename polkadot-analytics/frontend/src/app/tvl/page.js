'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiFilter } from 'react-icons/fi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TVLChart } from '@/components/TVLChart';
import { api } from '@/services/api';

export default function TVLPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedParachain, setSelectedParachain] = useState('all');

  // Fetch TVL data
  const { data: tvlData, isLoading, error } = useQuery({
    queryKey: ['tvl', selectedPeriod, selectedParachain],
    queryFn: () => api.getTVLData({ period: selectedPeriod, parachain: selectedParachain }),
    refetchInterval: 60000,
  });

  // Fetch parachains for filter
  const { data: parachains } = useQuery({
    queryKey: ['parachains'],
    queryFn: () => api.getParachains(),
  });

  const periods = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading TVL data: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Total Value Locked (TVL)</h1>
          <p className="text-gray-600 mt-1">
            Track the total value locked across Polkadot parachains
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
            <FiDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${tvlData?.summary?.total?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {tvlData?.summary?.change >= 0 ? (
                    <>
                      <FiTrendingUp className="text-green-500" />
                      <span className="text-green-500">
                        +{tvlData?.summary?.change?.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <FiTrendingDown className="text-red-500" />
                      <span className="text-red-500">
                        {tvlData?.summary?.change?.toFixed(2)}%
                      </span>
                    </>
                  )}
                  <span className="ml-1">from last period</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Parachains</CardTitle>
            <FiFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {tvlData?.summary?.activeParachains || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  With TVL &gt; $1M
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <FiTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${tvlData?.summary?.volume24h?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Trading volume
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parachain Filter */}
      {parachains && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filter by Parachain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedParachain === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedParachain('all')}
              >
                All Parachains
              </Badge>
              {parachains?.data?.slice(0, 10).map((parachain) => (
                <Badge
                  key={parachain.parachain_id}
                  variant={selectedParachain === parachain.parachain_id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedParachain(parachain.parachain_id)}
                >
                  {parachain.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TVL Chart */}
      <Card>
        <CardHeader>
          <CardTitle>TVL Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <TVLChart data={tvlData?.chartData} period={selectedPeriod} />
          )}
        </CardContent>
      </Card>

      {/* Top Parachains by TVL */}
      <Card>
        <CardHeader>
          <CardTitle>Top Parachains by TVL</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tvlData?.topParachains?.map((parachain, index) => (
                <motion.div
                  key={parachain.parachain_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{parachain.name}</div>
                      <div className="text-sm text-gray-600">
                        ID: {parachain.parachain_id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ${parachain.tvl?.toLocaleString()}
                    </div>
                    <div className="text-sm flex items-center justify-end gap-1">
                      {parachain.change >= 0 ? (
                        <>
                          <FiTrendingUp className="text-green-500" />
                          <span className="text-green-500">
                            +{parachain.change?.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <FiTrendingDown className="text-red-500" />
                          <span className="text-red-500">
                            {parachain.change?.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
