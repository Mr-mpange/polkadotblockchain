'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiExternalLink, FiClock } from 'react-icons/fi';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDistance } from 'date-fns';

/**
 * TransactionCard - Display transaction information
 */
export const TransactionCard = ({ 
  transaction, 
  index = 0,
  onClick 
}) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    // Convert from planck to DOT (1 DOT = 10^10 planck)
    const dot = (parseInt(amount) / 10000000000).toFixed(4);
    return `${dot} DOT`;
  };

  const getStatusColor = (success) => {
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* From/To Addresses */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">From</span>
                <span className="font-mono text-sm font-medium">
                  {formatAddress(transaction.from)}
                </span>
              </div>
              
              <FiArrowRight className="text-muted-foreground" />
              
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">To</span>
                <span className="font-mono text-sm font-medium">
                  {formatAddress(transaction.to)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col items-end gap-2">
              <span className="font-bold text-lg">
                {formatAmount(transaction.amount)}
              </span>
              
              {/* Status Badge */}
              <Badge 
                variant="outline" 
                className={getStatusColor(transaction.success)}
              >
                {transaction.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FiClock className="h-3 w-3" />
              <span>
                {transaction.timestamp 
                  ? formatDistance(new Date(transaction.timestamp * 1000), new Date(), { addSuffix: true })
                  : 'Unknown time'
                }
              </span>
            </div>

            {transaction.hash && (
              <a
                href={`https://polkadot.subscan.io/extrinsic/${transaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <span>View on Subscan</span>
                <FiExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransactionCard;
