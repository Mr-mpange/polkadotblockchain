import axios from 'axios';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 15000, // Increased timeout for better reliability
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      withCredentials: true
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      (config) => {
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
      (response) => response,
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
            data: error.response.data
          });
          
          // Handle specific status codes
          if (error.response.status === 401) {
            // Handle unauthorized
            // window.location.href = '/login';
          } else if (error.response.status === 404) {
            // Handle not found
          } else if (error.response.status >= 500) {
            // Handle server errors
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('API Request Error:', {
            message: 'No response received',
            url: error.config?.url,
            method: error.config?.method
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('API Setup Error:', error.message);
        }
        
        return Promise.reject(error);
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
      
      const response = await this.client.get('/dashboard', {
        params: { period },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Dashboard data received:', response.data);
      return response.data;
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
      const response = await this.client.get('/parachains', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching parachains:', error);
      throw error;
    }
  }

  async getParachainById(id) {
    try {
      const response = await this.client.get(`/parachains/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching parachain ${id}:`, error);
      throw error;
    }
  }

  async getParachainMetrics(id, period = '24h') {
    try {
      const response = await this.client.get(`/parachains/${id}/metrics`, {
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
      const response = await this.client.get(`/parachains/${id}/tvl`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TVL for parachain ${id}:`, error);
      throw error;
    }
  }

  async getParachainActivity(id, params = {}) {
    try {
      const response = await this.client.get(`/parachains/${id}/activity`, { params });
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
      const response = await this.client.get('/tvl', { 
        params,
        // Enable caching for better performance
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('TVL response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getTVL:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data || 'No response data'
      });
      
      // Return a default response structure on error
      return {
        status: 'error',
        message: 'Failed to fetch TVL data',
        data: {
          total_tvl: '0',
          chains: []
        },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  async getTVLHistory(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/tvl/${parachainId}/history`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TVL history for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  // Activity endpoints
  async getActivity(params = {}) {
    try {
      const response = await this.client.get('/activity', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }

  async getActivityHistory(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/activity/${parachainId}/history`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity history for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  // History endpoints
  async getHistory(params = {}) {
    try {
      const response = await this.client.get('/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching history data:', error);
      throw error;
    }
  }

  // Alerts endpoints
  async getAlerts(params = {}) {
    try {
      const response = await this.client.get('/alerts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId, userId) {
    try {
      const response = await this.client.put(`/alerts/${alertId}/acknowledge`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error acknowledging alert ${alertId}:`, error);
      throw error;
    }
  }

  async resolveAlert(alertId, userId) {
    try {
      const response = await this.client.put(`/alerts/${alertId}/resolve`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error resolving alert ${alertId}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    try {
      const response = await this.client.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.client.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await this.client.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await this.client.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      const response = await this.client.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Polkadot API endpoints
  async getChainInfo() {
    try {
      const response = await this.client.get('/polkadot/chain-info');
      return response.data;
    } catch (error) {
      console.error('Error fetching chain info:', error);
      throw error;
    }
  }

  async getBlockMetrics() {
    try {
      const response = await this.client.get('/polkadot/block-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching block metrics:', error);
      throw error;
    }
  }

  async getValidatorInfo() {
    try {
      const response = await this.client.get('/polkadot/validators');
      return response.data;
    } catch (error) {
      console.error('Error fetching validator info:', error);
      throw error;
    }
  }

  // Analytics endpoints (for AI insights)
  async getAnalyticsInsights(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/analytics/insights/${parachainId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching analytics for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  async getPredictions(parachainId, params = {}) {
    try {
      const response = await this.client.get(`/analytics/predictions/${parachainId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching predictions for parachain ${parachainId}:`, error);
      throw error;
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
}

export const api = new ApiService();
