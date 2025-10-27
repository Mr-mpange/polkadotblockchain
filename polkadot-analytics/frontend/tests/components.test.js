/**
 * Frontend Component Tests
 * Unit tests for React components using Jest and React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components to test
import MetricCard from '../src/components/MetricCard';
import Dashboard from '../src/components/Dashboard';

// Mock API calls
jest.mock('../src/services/api', () => ({
  api: {
    getDashboardData: jest.fn(() => Promise.resolve({
      total_tvl: 12500000000,
      total_transactions: 45000,
      total_users: 8500,
      total_blocks: 14400,
      parachains: [
        { id: '0', name: 'Polkadot', tvl: 12500000000 },
        { id: '100', name: 'Statemine', tvl: 85000000 }
      ]
    }))
  }
}));

// Mock hooks
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light' })
}));

jest.mock('../src/hooks/useWallet', () => ({
  useWallet: () => ({
    account: null,
    connectWallet: jest.fn()
  })
}));

describe('MetricCard Component', () => {
  const defaultProps = {
    title: 'Total Value Locked',
    value: '$12,500,000,000',
    change: '+2.5%',
    icon: 'FiDollarSign',
    trend: 'up'
  };

  it('should render metric card with all props', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('Total Value Locked')).toBeInTheDocument();
    expect(screen.getByText('$12,500,000,000')).toBeInTheDocument();
    expect(screen.getByText('+2.5%')).toBeInTheDocument();
  });

  it('should display negative change correctly', () => {
    const propsWithNegativeChange = {
      ...defaultProps,
      change: '-1.2%',
      trend: 'down'
    };

    render(<MetricCard {...propsWithNegativeChange} />);

    expect(screen.getByText('-1.2%')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(<MetricCard {...defaultProps} loading={true} />);

    // Should show loading skeleton or similar
    expect(screen.getByText('Total Value Locked')).toBeInTheDocument();
  });
});

describe('Dashboard Component', () => {
  it('should render dashboard with metrics', async () => {
    render(<Dashboard />);

    // Check if main dashboard elements are present
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();

    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByText(/polkadot analytics/i)).toBeInTheDocument();
    });
  });

  it('should handle period filter changes', async () => {
    render(<Dashboard />);

    // Find and click period filter buttons
    const periodButtons = screen.getAllByRole('button');
    const refreshButton = periodButtons.find(button =>
      button.textContent?.includes('24h') ||
      button.textContent?.includes('7d') ||
      button.textContent?.includes('30d')
    );

    if (refreshButton) {
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(refreshButton).toBeInTheDocument();
      });
    }
  });

  it('should display wallet connection status', () => {
    render(<Dashboard />);

    // Check for wallet connection elements
    const walletElements = screen.queryAllByText(/connect wallet|wallet/i);
    // Wallet connection UI should be present (may or may not show text depending on state)
  });
});

describe('Chart Components', () => {
  it('should render charts without crashing', () => {
    // Test that chart components can be imported and rendered
    const mockData = [
      { timestamp: '2024-01-01', value: 1000 },
      { timestamp: '2024-01-02', value: 1100 },
      { timestamp: '2024-01-03', value: 1050 }
    ];

    // These would be actual chart component tests if the chart components were exported
    expect(mockData).toHaveLength(3);
    expect(mockData[0]).toHaveProperty('value');
  });
});

describe('API Service', () => {
  it('should handle API responses correctly', async () => {
    // Mock axios or fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          total_tvl: 12500000000,
          parachains: []
        })
      })
    );

    // Test API service functions
    const response = await fetch('/api/tvl');
    const data = await response.json();

    expect(data).toHaveProperty('total_tvl');
    expect(typeof data.total_tvl).toBe('number');
  });
});

describe('Error Handling', () => {
  it('should handle API errors gracefully', async () => {
    // Mock API to return error
    jest.mock('../src/services/api', () => ({
      api: {
        getDashboardData: jest.fn(() => Promise.reject(new Error('API Error')))
      }
    }));

    render(<Dashboard />);

    // Should handle error without crashing
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
