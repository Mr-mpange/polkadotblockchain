'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiSearch, FiGrid, FiList, FiFilter } from 'react-icons/fi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';

export default function ParachainsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: parachains, isLoading, error } = useQuery({
    queryKey: ['parachains', searchQuery, categoryFilter],
    queryFn: () => api.getParachains({ search: searchQuery, category: categoryFilter }),
  });

  const categories = ['all', 'DeFi', 'Smart Contracts', 'Infrastructure', 'Gaming', 'NFT'];

  const filteredParachains = parachains?.data?.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading parachains: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Parachains</h1>
        <p className="text-gray-600 mt-1">
          Explore all parachains in the Polkadot ecosystem
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search parachains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View Mode */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <FiGrid />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <FiList />
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={categoryFilter === category ? 'default' : 'outline'}
            className="cursor-pointer capitalize"
            onClick={() => setCategoryFilter(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Parachains Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredParachains?.map((parachain, index) => (
            <motion.div
              key={parachain.parachain_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{parachain.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {parachain.parachain_id}
                      </p>
                    </div>
                    <Badge variant="secondary">{parachain.category || 'Other'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {parachain.description || 'No description available'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <div className="text-xs text-gray-500">TVL</div>
                        <div className="text-lg font-semibold">
                          ${parachain.tvl?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">24h Txns</div>
                        <div className="text-lg font-semibold">
                          {parachain.transactions_24h?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>

                    <Button className="w-full mt-4" variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredParachains?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No parachains found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
