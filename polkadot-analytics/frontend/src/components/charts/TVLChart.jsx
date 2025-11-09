import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import { useTVLData } from '../../hooks/useApiQuery';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TVLChart = ({ className = '', days = 30 }) => {
  const { data, isLoading, error } = useTVLData(
    { days },
    { 
      refetchInterval: 300000, // 5 minutes
      select: (response) => {
        if (!response?.data?.history) return [];
        
        return response.data.history.map(item => ({
          date: new Date(item.timestamp),
          value: parseFloat(item.value) || 0,
        }));
      }
    }
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'TVL',
            data: [],
            borderColor: 'rgba(79, 70, 229, 1)',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    const sortedData = [...data].sort((a, b) => a.date - b.date);
    
    return {
      labels: sortedData.map(item => format(item.date, 'MMM d')),
      datasets: [
        {
          label: 'Total Value Locked (TVL)',
          data: sortedData.map(item => item.value),
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
            gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
            return gradient;
          },
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(79, 70, 229, 1)',
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => {
            if (value >= 1000000) {
              return `$${(value / 1000000).toFixed(1)}M`;
            }
            if (value >= 1000) {
              return `$${(value / 1000).toFixed(1)}K`;
            }
            return `$${value}`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (isLoading) {
    return (
      <div className={`${className} p-4 bg-white dark:bg-gray-800 rounded-lg shadow`}>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading TVL data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-4 bg-white dark:bg-gray-800 rounded-lg shadow`}>
        <div className="h-64 flex flex-col items-center justify-center text-red-500">
          <div>Error loading TVL data</div>
          <div className="text-sm text-gray-500 mt-2">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-4 bg-white dark:bg-gray-800 rounded-lg shadow`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Total Value Locked (TVL)
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.search = '?days=7'}
            className={`px-3 py-1 text-sm rounded-md ${
              days === 7
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            7D
          </button>
          <button
            onClick={() => window.location.search = '?days=30'}
            className={`px-3 py-1 text-sm rounded-md ${
              days === 30
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => window.location.search = '?days=90'}
            className={`px-3 py-1 text-sm rounded-md ${
              days === 90
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            90D
          </button>
        </div>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TVLChart;
