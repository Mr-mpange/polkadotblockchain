'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiDollarSign, FiActivity, FiTrendingUp, FiClock, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '../../services/api';

export default function PortfolioPage() {
  const [connectedAccount, setConnectedAccount] = useState(null);

  // Check for connected wallet
  React.useEffect(() => {
    const storedAccount = localStorage.getItem('polkadot-account');
    if (storedAccount) {
      setConnectedAccount(JSON.parse(storedAccount));
    }
  }, []);

  // Fetch account info
  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['account-info', connectedAccount?.address],
    queryFn: () => api.getAccountInfo(connectedAccount.address),
    enabled: !!connectedAccount?.address,
  });

  // Fetch account balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['account-balance', connectedAccount?.address],
    queryFn: () => api.getAccountBalance(connectedAccount.address),
    enabled: !!connectedAccount?.address,
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['account-transactions', connectedAccount?.address],
    queryFn: () => api.getAccountTransactions(connectedAccount.address, 0, 10),
    enabled: !!connectedAccount?.address,
  });

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.0000';
    return (parseInt(balance) / 10000000000).toFixed(4);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!connectedAccount) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto mt-20">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Wallet Not Connected
                  </h3>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    Please connect your wallet to view your portfolio and transaction history.
                  </p>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-foreground">My Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            {connectedAccount.meta?.name || formatAddress(connectedAccount.address)}
          </p>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FiDollarSign className="h-4 w-4" />
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatBalance(balanceData?.data?.data?.balance)} DOT
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ ${((parseFloat(formatBalance(balanceData?.data?.data?.balance)) * 7.5).toFixed(2))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FiActivity className="h-4 w-4" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {accountData?.data?.data?.count_extrinsic || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FiTrendingUp className="h-4 w-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-sm">
                Active
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FiClock className="h-5 w-5" />
              Recent Transactions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://polkadot.subscan.io/account/${connectedAccount.address}`, '_blank')}
            >
              <FiExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactionsData?.data?.data?.transfers?.length > 0 ? (
            <div className="space-y-3">
              {transactionsData.data.data.transfers.map((tx, index) => (
                <motion.div
                  key={tx.hash || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={tx.from === connectedAccount.address ? 'destructive' : 'default'}>
                        {tx.from === connectedAccount.address ? 'Sent' : 'Received'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(tx.block_timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {tx.from === connectedAccount.address ? 'To: ' : 'From: '}
                      </span>
                      <span className="font-mono">
                        {formatAddress(tx.from === connectedAccount.address ? tx.to : tx.from)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {tx.from === connectedAccount.address ? '-' : '+'}
                      {formatBalance(tx.amount)} DOT
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://polkadot.subscan.io/extrinsic/${tx.hash}`, '_blank')}
                    >
                      <FiExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Account Details */}
        <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Address</span>
              <span className="font-mono text-sm text-foreground">{connectedAccount.address}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Account Name</span>
              <span className="text-foreground">{connectedAccount.meta?.name || 'Unnamed Account'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Network</span>
              <Badge>Polkadot</Badge>
            </div>
            {accountData?.data?.data?.nonce !== undefined && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Nonce</span>
                <span className="text-foreground">{accountData.data.data.nonce}</span>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
