import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { useTVLData } from '../../hooks/useApiQuery';

const TvlStatsCard = ({ className = '' }) => {
  const { data: currentData } = useTVLData({ days: 1 });
  const { data: previousDayData } = useTVLData({ days: 2, endDate: new Date(Date.now() - 86400000).toISOString() });
  const { data: weeklyData } = useTVLData({ days: 7 });
  const { data: monthlyData } = useTVLData({ days: 30 });

  const currentTVL = currentData?.totalTVL || '0';
  const previousDayTVL = previousDayData?.totalTVL || '0';
  const weeklyTVL = weeklyData?.totalTVL || '0';
  const monthlyTVL = monthlyData?.totalTVL || '0';

  const calculateChange = (current, previous) => {
    if (!current || !previous || parseFloat(previous) === 0) return 0;
    return ((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100;
  };

  const dailyChange = calculateChange(currentTVL, previousDayTVL);
  const weeklyChange = calculateChange(currentTVL, weeklyTVL);
  const monthlyChange = calculateChange(currentTVL, monthlyTVL);

  const renderChangeIndicator = (value) => {
    if (value > 0) {
      return (
        <span className="inline-flex items-center text-green-600 dark:text-green-400">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          {formatPercentage(Math.abs(value))}
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="inline-flex items-center text-red-600 dark:text-red-400">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          {formatPercentage(Math.abs(value))}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-gray-500">
        <MinusIcon className="h-4 w-4 mr-1" />
        {formatPercentage(0)}
      </span>
    );
  };

  return (
    <div className={`${className} bg-white dark:bg-gray-800 rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value Locked</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(currentTVL, 2)}
          </h3>
        </div>
        <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">24h Change</span>
          <span className="text-sm font-medium">
            {renderChangeIndicator(dailyChange)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">7d Change</span>
          <span className="text-sm font-medium">
            {renderChangeIndicator(weeklyChange)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">30d Change</span>
          <span className="text-sm font-medium">
            {renderChangeIndicator(monthlyChange)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TvlStatsCard;
