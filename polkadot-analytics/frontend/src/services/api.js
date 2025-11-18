import axios from 'axios';

class ApiService {
  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('API Base URL:', baseURL);
    
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json'
      },
      withCredentials: true,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('Request:', config.method.toUpperCase(), config.url);
        // You can add auth tokens here if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config?.url,
          method: response.config?.method,
          data: response.data
        });
        return response;
      },
      (error) => {
        // Handle common errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('API Response Error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response.data,
            headers: error.response.headers
          });
          
          // Handle specific status codes
          if (error.response.status === 401) {
            // Handle unauthorized
            // window.location.href = '/login';
          } else if (error.response.status === 404) {
            console.error('Endpoint not found. Please check the API route.');
          } else if (error.response.status >= 500) {
            console.error('Server error. Please try again later.');
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('API Request Error:', {
            message: 'No response received from server',
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            timeout: error.config?.timeout,
            code: error.code,
            message: error.message
          });
          
          // Provide more specific error message based on error code
          if (error.code === 'ECONNABORTED') {
            console.error('Request timeout. The server took too long to respond.');
          } else if (error.code === 'ERR_NETWORK') {
            console.error('Network error. Please check your internet connection.');
          } else if (error.code === 'ERR_BAD_REQUEST') {
            console.error('Bad request. Please check your request parameters.');
          }
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('API Setup Error:', {
            message: error.message,
            stack: error.stack,
            config: error.config
          });
        }
        
        // Return a more user-friendly error message
        return Promise.reject({
          message: error.response?.data?.message || 
                  error.message || 
                  'An unexpected error occurred',
          status: error.response?.status,
          code: error.code,
          originalError: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    );
  }

  setupInterceptors() {
    // Request interceptor for auth tokens
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const token = window.localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          const apiKey = window.localStorage.getItem('api_key');
          if (apiKey) {
            config.headers['x-api-key'] = apiKey;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          if (typeof window !== 'undefined') {
            try {
              window.localStorage?.removeItem('auth_token');
            } catch (_) {}
            if (window.location) {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Dashboard endpoints
  async getDashboardData(period = '24h') {
    try {
      console.log(`Fetching dashboard data for period: ${period}`);
      console.log(`API Base URL: ${this.baseURL}`);
      
      const response = await this.client.get('/api/dashboard', {
        params: { period },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Dashboard data received:', response.data);
      // Extract the actual data from the wrapped response
      const data = response.data.data || response.data;
      
      // Generate mock chart data if not provided
      const generateMockTVLHistory = () => {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 24;
        return Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
          value: 1200000000 + Math.random() * 100000000,
          timestamp: new Date(Date.now() - (days - i) * 86400000).toISOString()
        }));
      };

      const generateMockActivityHistory = () => {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 24;
        return Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
          transactions: 100000 + Math.floor(Math.random() * 50000),
          activeAccounts: 20000 + Math.floor(Math.random() * 10000),
          timestamp: new Date(Date.now() - (days - i) * 86400000).toISOString()
        }));
      };
      
      // Generate mock parachain data if not provided
      const mockTopParachains = [
        { parachainId: '2000', parachainName: 'Acala', tvl: 500000000, totalValueLockedUSD: 500000000, percentage: 33.3, color: '#E6007A' },
        { parachainId: '2001', parachainName: 'Moonbeam', tvl: 750000000, totalValueLockedUSD: 750000000, percentage: 50.0, color: '#53CBC9' },
        { parachainId: '2004', parachainName: 'Astar', tvl: 250000000, totalValueLockedUSD: 250000000, percentage: 16.7, color: '#0070EB' }
      ];

      const mockMostActiveParachains = [
        { parachainId: '2000', parachainName: 'Acala', totalTransactions: 125000, activityScore: 125000, activeAccounts: 15000, color: '#E6007A' },
        { parachainId: '2001', parachainName: 'Moonbeam', totalTransactions: 180000, activityScore: 180000, activeAccounts: 22000, color: '#53CBC9' },
        { parachainId: '2004', parachainName: 'Astar', totalTransactions: 95000, activityScore: 95000, activeAccounts: 12000, color: '#0070EB' }
      ];
      
      // Transform snake_case to camelCase for frontend
      return {
        totalTVL: data.total_tvl,
        activeParachains: data.active_parachains,
        totalTransactions24h: data.total_transactions || 0,
        activeUsers: data.active_users || 0,
        tvlChange: data.tvl_change || 0,
        parachainsChange: data.parachains_change || 0,
        transactionsChange: data.transactions_change || 0,
        usersChange: data.users_change || 0,
        recentActivity: data.recent_activity || [],
        tvlHistory: data.tvl_history || generateMockTVLHistory(),
        activityHistory: data.activity_history || generateMockActivityHistory(),
        topParachains: data.top_parachains || mockTopParachains,
        mostActiveParachains: data.most_active_parachains || mockMostActiveParachains,
        period: period,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        },
        response: error.response?.data || 'No response data'
      });
      
      // Provide a fallback response for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock data due to API error');
        return this.getMockDashboardData(period);
      }
      
      throw error;
    }
  }
  
  // Mock data for development
  getMockDashboardData(period) {
    console.warn('Using mock dashboard data');
    return {
      totalValueLocked: 1250000000,
      activeParachains: 37,
      dailyTransactions: 125000,
      activeAccounts: 24500,
      recentTransactions: [],
      period: period || '24h',
      updatedAt: new Date().toISOString(),
      _isMock: true
    };
  }

  // Parachains endpoints
  async getParachains(params = {}) {
    try {
      console.log('Fetching parachains with params:', params);
      const response = await this.client.get('/api/parachains', { 
        params,
        // Add timeout and other options if needed
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Log the full response for debugging
      console.log('Parachains API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      // Handle different response formats and return wrapped format for consistency
      let parachainsArray = [];
      if (response.data && Array.isArray(response.data)) {
        parachainsArray = response.data; // Direct array response
      } else if (response.data && response.data.data) {
        parachainsArray = response.data.data; // Wrapped response
      } else if (response.data) {
        parachainsArray = [response.data]; // Single item response as array
      }
      
      // Return wrapped format for consistency across all pages
      return {
        data: parachainsArray,
        total: parachainsArray.length,
        status: 'success'
      };
    } catch (error) {
      console.error('Error in getParachains:', {
        message: error.message,
        config: error.config,
        response: error.response?.data
      });
      
      // Return mock data in case of error for development
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock parachains data due to error');
        return {
          data: [
            {
              id: '2000',
              name: 'Acala',
              isActive: true,
              tokenSymbol: 'ACA',
              tvl: 500000000,
              category: 'DeFi',
              lastUpdated: new Date().toISOString()
            },
            {
              id: '2001',
              name: 'Moonbeam',
              isActive: true,
              tokenSymbol: 'GLMR',
              tvl: 750000000,
              category: 'Smart Contracts',
              lastUpdated: new Date().toISOString()
            },
            {
              id: '2004',
              name: 'Astar',
              isActive: true,
              tokenSymbol: 'ASTR',
              tvl: 250000000,
              category: 'Smart Contracts',
              lastUpdated: new Date().toISOString()
            }
          ],
          total: 3,
          status: 'success'
        };
      }
      
      throw error;
    }
  }

  async getParachainById(id) {
    try {
      console.log(`Fetching parachain with ID: ${id}`);
      const response = await this.client.get(`/api/parachains/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Log the full response for debugging
      console.log('Parachain API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      // Handle different response formats
      if (response.data && response.data.data) {
        return response.data.data; // Wrapped response
      } else if (response.data) {
        return response.data; // Direct response
      }

      return null;
    } catch (error) {
      console.error(`Error in getParachainById:`, {
        id,
        message: error.message,
        config: error.config,
        response: error.response?.data
      });

      // Return mock data in case of error for development
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock parachain data due to error');
        return {
          id: id,
          name: 'Mock Parachain ' + id,
          isActive: true,
          tokenSymbol: 'MOCK',
          tvl: 100000000,
          lastUpdated: new Date().toISOString(),
          _isMock: true
        };
      }

      throw error;
    }
  }

  async getParachainMetrics(id, period = '24h') {
    try {
      const response = await this.client.get(`/api/parachains/${id}/metrics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching metrics for parachain ${id}:`, error);
      throw error;
    }
  }

  async getParachainTVL(id, params = {}) {
    try {
      const response = await this.client.get(`/api/parachains/${id}/tvl`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TVL for parachain ${id}:`, error);
      throw error;
    }
  }

  async getParachainActivity(id, params = {}) {
    try {
      const response = await this.client.get(`/api/parachains/${id}/activity`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity for parachain ${id}:`, error);
      throw error;
    }
  }

  // TVL endpoints
  /**
   * Get Total Value Locked (TVL) data
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days of history to fetch
   * @param {string} params.chainId - Optional chain ID to filter by
   * @returns {Promise<Object>} TVL data
   */
  async getTVL(params = {}) {
    try {
      console.log('Fetching TVL data with params:', params);
      const response = await this.client.get('/api/tvl', { 
        params,
        // Enable caching for better performance
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('TVL response received:', response.data);
      // Extract the actual data from the wrapped response
      const data = response.data.data || response.data;
      
      // Transform to match TVL page expectations
      const historyData = data.history || this.generateMockTVLHistory(params.period);
      
      return {
        summary: {
          total: parseInt(data.total_tvl) || 1500000000,
          change: data.tvl_change || 5.2,
          activeParachains: data.active_parachains || 3,
          volume24h: data.volume_24h || 125000000
        },
        chains: data.chains || [],
        history: historyData,
        chartData: historyData, // Add chartData for TVL page
        topParachains: data.top_parachains || [
          { parachainId: '2000', parachainName: 'Acala', tvl: 500000000, percentage: 33.3 },
          { parachainId: '2001', parachainName: 'Moonbeam', tvl: 750000000, percentage: 50.0 },
          { parachainId: '2004', parachainName: 'Astar', tvl: 250000000, percentage: 16.7 }
        ],
        period: params.period || '30d',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getTVL:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data || 'No response data'
      });
      
      // Return a default response structure on error
      return {
        summary: {
          total: 0,
          change: 0,
          activeParachains: 0,
          volume24h: 0
        },
        chains: [],
        history: [],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  generateMockTVLHistory(period = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
      value: 1200000000 + Math.random() * 300000000,
      timestamp: new Date(Date.now() - (days - i) * 86400000).toISOString()
    }));
  }

  async getTVLHistory(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/api/tvl/${parachainId}/history`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TVL history for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  // Activity endpoints
  async getActivity(params = {}) {
    try {
      const response = await this.client.get('/api/activity', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }

  async getActivityHistory(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/api/activity/${parachainId}/history`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity history for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  // History endpoints
  async getHistory(params = {}) {
    try {
      const response = await this.client.get('/api/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching history data:', error);
      throw error;
    }
  }

  // Alerts endpoints
  async getAlerts(params = {}) {
    try {
      const response = await this.client.get('/api/alerts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId, userId) {
    try {
      const response = await this.client.put(`/api/alerts/${alertId}/acknowledge`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error acknowledging alert ${alertId}:`, error);
      throw error;
    }
  }

  async resolveAlert(alertId, userId) {
    try {
      const response = await this.client.put(`/api/alerts/${alertId}/resolve`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error resolving alert ${alertId}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    try {
      const response = await this.client.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.client.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await this.client.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await this.client.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      const response = await this.client.put('/api/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Polkadot API endpoints
  async getChainInfo() {
    try {
      const response = await this.client.get('/api/polkadot/chain-info');
      return response.data;
    } catch (error) {
      console.error('Error fetching chain info:', error);
      throw error;
    }
  }

  async getBlockMetrics() {
    try {
      const response = await this.client.get('/api/polkadot/block-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching block metrics:', error);
      throw error;
    }
  }

  async getValidatorInfo() {
    try {
      const response = await this.client.get('/api/polkadot/validators');
      return response.data;
    } catch (error) {
      console.error('Error fetching validator info:', error);
      throw error;
    }
  }

  // AI Analytics endpoints
  async getAIInsights(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/api/ai-analytics/insights/${parachainId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching AI insights for parachain ${parachainId}:`, error);
      return null;
    }
  }

  async getAIPredictions(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/api/ai-analytics/predictions/${parachainId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching AI predictions for parachain ${parachainId}:`, error);
      return null;
    }
  }

  async getAIHealth() {
    try {
      const response = await this.client.get('/api/ai-analytics/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI health:', error);
      return null;
    }
  }

  // Utility methods
  setAuthToken(token) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_token', token);
    }
  }

  setApiKey(apiKey) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('api_key', apiKey);
    }
  }

  removeAuthToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('auth_token');
    }
  }

  removeApiKey() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('api_key');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('API health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Subscan API endpoints
  async getAccountInfo(address) {
    try {
      const response = await this.client.get(`/api/subscan/account/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching account info for ${address}:`, error);
      throw error;
    }
  }

  async getAccountBalance(address) {
    try {
      const response = await this.client.get(`/api/subscan/balance/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      throw error;
    }
  }

  async getAccountTransactions(address, page = 0, row = 20) {
    try {
      const response = await this.client.get(`/api/subscan/transactions/${address}`, {
        params: { page, row }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching transactions for ${address}:`, error);
      throw error;
    }
  }

  async getBlockInfo(blockNumber) {
    try {
      const response = await this.client.get(`/api/subscan/block/${blockNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching block ${blockNumber}:`, error);
      throw error;
    }
  }

  async getExtrinsicInfo(hash) {
    try {
      const response = await this.client.get(`/api/subscan/extrinsic/${hash}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching extrinsic ${hash}:`, error);
      throw error;
    }
  }

  async getSubscanMetadata() {
    try {
      const response = await this.client.get('/api/subscan/metadata');
      return response.data;
    } catch (error) {
      console.error('Error fetching Subscan metadata:', error);
      throw error;
    }
  }

  async getDailyStats(start, end) {
    try {
      const response = await this.client.get('/api/subscan/daily-stats', {
        params: { start, end }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw error;
    }
  }

  async getParachainInfoFromSubscan(parachainId) {
    try {
      const response = await this.client.get(`/api/subscan/parachain/${parachainId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching parachain ${parachainId} from Subscan:`, error);
      throw error;
    }
  }

  async getValidatorsFromSubscan() {
    try {
      const response = await this.client.get('/api/subscan/validators');
      return response.data;
    } catch (error) {
      console.error('Error fetching validators from Subscan:', error);
      throw error;
    }
  }

  async getStakingInfo(address) {
    try {
      const response = await this.client.get(`/api/subscan/staking/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching staking info for ${address}:`, error);
      throw error;
    }
  }
}

export const api = new ApiService();
