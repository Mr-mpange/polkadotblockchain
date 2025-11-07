'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiAlertTriangle, FiPieChart, FiCheckCircle, FiClock, FiDollarSign, FiTrendingUp, FiTrendingDown, FiUsers } from 'react-icons/fi';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';

import { MetricCard } from './MetricCard';
import { ParachainChart } from './ParachainChart';
import { TVLChart } from './TVLChart';
import { ActivityChart } from './ActivityChart';
import { AlertsPanel } from './AlertsPanel';
import WalletConnect from './WalletConnect';

import { api } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet';

const Dashboard = () => {
  const { theme } = useTheme();
  const { account, connectWallet } = useWallet();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', selectedPeriod],
    queryFn: () => api.getDashboardData(selectedPeriod),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Fetch parachains data
  const { data: parachainsData } = useQuery({
    queryKey: ['parachains'],
    queryFn: () => api.getParachains(),
    staleTime: 60000,
  });

  // Fetch alerts data
  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.getAlerts(),
    staleTime: 15000,
  });

  const handleRefresh = async () => {
    setLastRefresh(new Date());
    await refetch();
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num?.toFixed(2) || '0';
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Alert className="max-w-2xl mx-auto">
          <FiAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-polkadot rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Polkadot Analytics</h1>
                  <p className="text-sm text-muted-foreground">
                    Cross-chain insights and metrics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Wallet Connect */}
              <WalletConnect />

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              {/* Last Updated */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <FiClock className="h-4 w-4" />
                <span>Updated {lastRefresh.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Time Period:</span>
            <div className="flex space-x-1">
              {['1h', '24h', '7d', '30d'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Alerts Indicator */}
          {alertsData?.data?.length > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <FiAlertTriangle className="h-3 w-3" />
              <span>{alertsData.data.length} Active Alerts</span>
            </Badge>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatePresence>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {/* Total TVL */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <MetricCard
                    title="Total TVL"
                    value={formatCurrency(dashboardData?.totalTVL)}
                    change={dashboardData?.tvlChange}
                    icon={<FiDollarSign className="h-5 w-5" />}
                    trend={dashboardData?.tvlChange >= 0 ? 'up' : 'down'}
                  />
                </motion.div>

                {/* Active Parachains */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MetricCard
                    title="Active Parachains"
                    value={dashboardData?.activeParachains || 0}
                    change={dashboardData?.parachainsChange}
                    icon={<FiActivity className="h-5 w-5" />}
                    trend={dashboardData?.parachainsChange >= 0 ? 'up' : 'down'}
                  />
                </motion.div>

                {/* 24h Transactions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <MetricCard
                    title="24h Transactions"
                    value={formatNumber(dashboardData?.totalTransactions24h)}
                    change={dashboardData?.transactionsChange}
                    icon={<FiBarChart3 className="h-5 w-5" />}
                    trend={dashboardData?.transactionsChange >= 0 ? 'up' : 'down'}
                  />
                </motion.div>

                {/* Active Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <MetricCard
                    title="Active Users"
                    value={formatNumber(dashboardData?.activeUsers24h)}
                    change={dashboardData?.usersChange}
                    icon={<FiUsers className="h-5 w-5" />}
                    trend={dashboardData?.usersChange >= 0 ? 'up' : 'down'}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* TVL Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiLineChart className="h-5 w-5" />
                  <span>Total Value Locked</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TVLChart data={dashboardData?.tvlHistory} period={selectedPeriod} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiActivity className="h-5 w-5" />
                  <span>Network Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityChart data={dashboardData?.activityHistory} period={selectedPeriod} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Parachains Overview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Top Parachains */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiPieChart className="h-5 w-5" />
                  <span>Top Parachains by TVL</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ParachainChart
                  data={dashboardData?.topParachains}
                  type="tvl"
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Most Active Parachains */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiTrendingUp className="h-5 w-5" />
                  <span>Most Active Parachains</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ParachainChart
                  data={dashboardData?.mostActiveParachains}
                  type="activity"
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiAlertTriangle className="h-5 w-5" />
                  <span>Active Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertsPanel
                  alerts={alertsData?.data || []}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Parachains Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>All Parachains</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Parachain</th>
                        <th className="text-left p-4 font-medium">TVL</th>
                        <th className="text-left p-4 font-medium">24h Change</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parachainsData?.data?.map((parachain) => (
                        <tr key={parachain.parachainId} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-polkadot rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {parachain.symbol?.[0] || 'P'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{parachain.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  #{parachain.parachainId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {formatCurrency(parachain.latestMetrics?.tvl?.totalValueLockedUSD)}
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center space-x-1 ${
                              (parachain.latestMetrics?.tvl?.change24h || 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {(parachain.latestMetrics?.tvl?.change24h || 0) >= 0 ? (
                                <FiTrendingUp className="h-4 w-4" />
                              ) : (
                                <FiTrendingDown className="h-4 w-4" />
                              )}
                              <span>
                                {Math.abs(parachain.latestMetrics?.tvl?.change24h || 0).toFixed(2)}%
                              </span>
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge variant={parachain.status === 'Active' ? 'default' : 'secondary'}>
                              {parachain.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{parachain.category}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
