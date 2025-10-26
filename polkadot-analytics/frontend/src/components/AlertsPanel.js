'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle,
  FiX,
  FiExternalLink,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiInfo
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const AlertsPanel = ({ alerts = [], isLoading = false, className = '' }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <FiXCircle className="h-4 w-4" />;
      case 'high':
        return <FiAlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <FiInfo className="h-4 w-4" />;
      case 'low':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiInfo className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tvl_drop':
        return '📉';
      case 'tvl_spike':
        return '📈';
      case 'activity_drop':
        return '🔻';
      case 'activity_spike':
        return '🔺';
      case 'xcm_anomaly':
        return '🔄';
      case 'new_parachain':
        return '🆕';
      case 'parachain_issue':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'tvl_drop':
        return 'TVL Drop';
      case 'tvl_spike':
        return 'TVL Spike';
      case 'activity_drop':
        return 'Activity Drop';
      case 'activity_spike':
        return 'Activity Spike';
      case 'xcm_anomaly':
        return 'XCM Anomaly';
      case 'new_parachain':
        return 'New Parachain';
      case 'parachain_issue':
        return 'Parachain Issue';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-muted-foreground ${className}`}>
        <div className="text-center">
          <FiCheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm">No active alerts</p>
          <p className="text-xs">All systems running smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 max-h-64 overflow-y-auto ${className}`}>
      <AnimatePresence>
        {alerts.slice(0, 5).map((alert, index) => (
          <motion.div
            key={alert._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              {/* Alert Icon */}
              <div className="flex-shrink-0">
                <span className="text-lg">{getTypeIcon(alert.type)}</span>
              </div>

              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm truncate">
                      {alert.title}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.severity)}
                      <span className="ml-1 capitalize">{alert.severity}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <FiClock className="h-3 w-3" />
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(alert.firstSeen), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {getTypeName(alert.type)}
                    </span>
                    {alert.parachainName && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {alert.parachainName}
                        </span>
                      </>
                    )}
                  </div>

                  {alert.currentValue && (
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {alert.type.includes('tvl')
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(alert.currentValue)
                        : new Intl.NumberFormat('en-US', {
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(alert.currentValue)
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {alerts.length > 5 && (
        <div className="text-center pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            +{alerts.length - 5} more alerts
          </span>
        </div>
      )}
    </div>
  );
};

export { AlertsPanel };
