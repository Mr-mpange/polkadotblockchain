'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiActivity, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';

export default function ActivityPage() {
  const [timeRange, setTimeRange] = useState('24h');

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity', timeRange],
    queryFn: async () => {
      const response = await api.get('/activity', { params: { period: timeRange } });
      return response;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading activity data...</p>
          </div>
        </div>
      </div>
    );
  }

  const activity = activityData?.data || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Network Activity</h1>
          <p className="text-gray-600">Real-time activity across the Polkadot ecosystem</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            onClick={() => setTimeRange('24h')}
          >
            24H
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FiActivity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.total_transactions?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500">Across all parachains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <FiUsers className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.active_accounts?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500">Unique addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Block Time</CardTitle>
            <FiZap className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.avg_block_time || '6.0s'}
            </div>
            <p className="text-xs text-gray-500">Network performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Utilization</CardTitle>
            <FiTrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.network_utilization || '0%'}
            </div>
            <p className="text-xs text-gray-500">Current capacity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions across the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.recent_activity && activity.recent_activity.length > 0 ? (
              activity.recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FiActivity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{item.type}</p>
                      <p className="text-sm text-gray-500">{item.parachain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.amount}</p>
                    <p className="text-sm text-gray-500">{item.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
