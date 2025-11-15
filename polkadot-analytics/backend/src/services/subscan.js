const axios = require('axios');
const { logger } = require('../utils/logger');

class SubscanService {
  constructor() {
    this.baseURL = 'https://polkadot.api.subscan.io';
    this.apiKey = process.env.SUBSCAN_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Subscan API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get account information
   */
  async getAccount(address) {
    try {
      const response = await this.client.post('/api/v2/scan/search', {
        key: address
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching account ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address) {
    try {
      const response = await this.client.post('/api/scan/account/tokens', {
        address: address
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching balance for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(address, page = 0, row = 20) {
    try {
      const response = await this.client.post('/api/scan/transfers', {
        address: address,
        page: page,
        row: row
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching transactions for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber) {
    try {
      const response = await this.client.post('/api/scan/block', {
        block_num: blockNumber
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching block ${blockNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get extrinsic information
   */
  async getExtrinsic(extrinsicHash) {
    try {
      const response = await this.client.post('/api/scan/extrinsic', {
        hash: extrinsicHash
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching extrinsic ${extrinsicHash}:`, error);
      throw error;
    }
  }

  /**
   * Get runtime metadata
   */
  async getMetadata() {
    try {
      const response = await this.client.post('/api/scan/metadata');
      return response.data;
    } catch (error) {
      logger.error('Error fetching metadata:', error);
      throw error;
    }
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(start, end) {
    try {
      const response = await this.client.post('/api/scan/daily', {
        start: start,
        end: end
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching daily stats:', error);
      throw error;
    }
  }

  /**
   * Get parachain information
   */
  async getParachainInfo(parachainId) {
    try {
      const response = await this.client.post('/api/scan/parachain/info', {
        para_id: parachainId
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching parachain ${parachainId}:`, error);
      throw error;
    }
  }

  /**
   * Get validator information
   */
  async getValidators() {
    try {
      const response = await this.client.post('/api/scan/staking/validators');
      return response.data;
    } catch (error) {
      logger.error('Error fetching validators:', error);
      throw error;
    }
  }

  /**
   * Get staking information for an account
   */
  async getStakingInfo(address) {
    try {
      const response = await this.client.post('/api/scan/account/reward_slash', {
        address: address,
        page: 0,
        row: 20
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching staking info for ${address}:`, error);
      throw error;
    }
  }
}

module.exports = new SubscanService();
