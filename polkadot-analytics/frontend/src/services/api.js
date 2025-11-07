import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: process.env.NODE_ENV === 'production' ? 30000 : 8000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
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
      const response = await this.client.get('/dashboard', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
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
  async getTVL(params = {}) {
    try {
      const response = await this.client.get('/tvl', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching TVL data:', error);
      throw error;
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
