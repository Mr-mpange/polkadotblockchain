const { ApiPromise, WsProvider } = require('@polkadot/api');
const { logger } = require('../utils/logger');

class DataAggregator {
  constructor() {
    this.api = null;
    this.isConnected = false;
    this.lastBlockNumber = 0;
  }

  async connect() {
    try {
      const rpcUrl = process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io';
      const provider = new WsProvider(rpcUrl);

      this.api = await ApiPromise.create({ provider });
      await this.api.isReady;

      this.isConnected = true;
      logger.info('Data aggregator connected to Polkadot API');

      return this.api;
    } catch (error) {
      logger.error('Failed to connect data aggregator:', error);
      throw error;
    }
  }

  async getParachainData(parachainId) {
    if (!this.isConnected || !this.api) {
      throw new Error('Data aggregator not connected');
    }

    try {
      const [
        currentBlock,
        parachainHead,
        lifecycle,
        validatorCount
      ] = await Promise.all([
        this.api.rpc.chain.getHeader(),
        this.api.query.paras.heads(parachainId),
        this.api.query.paras.lifecycle(parachainId),
        this.api.query.staking.validatorCount()
      ]);

      return {
        parachainId,
        blockNumber: currentBlock.number.toNumber(),
        blockHash: currentBlock.hash.toString(),
        parachainHead: parachainHead.toString(),
        lifecycle: lifecycle.toString(),
        validatorCount: validatorCount.toNumber(),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error fetching data for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  async getTransferData(parachainId, blockRange) {
    if (!this.isConnected || !this.api) {
      throw new Error('Data aggregator not connected');
    }

    try {
      const transfers = [];

      for (let blockNumber = blockRange.start; blockNumber <= blockRange.end; blockNumber++) {
        const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
        const events = await this.api.query.system.events.at(blockHash);

        const blockTransfers = events.filter(({ event }) => {
          return event.section === 'balances' && event.method === 'Transfer';
        }).map(({ event }) => ({
          parachainId,
          from: event.data[0].toString(),
          to: event.data[1].toString(),
          amount: event.data[2].toString(),
          blockNumber,
          blockHash: blockHash.toString(),
          timestamp: new Date()
        }));

        transfers.push(...blockTransfers);

        // Add small delay to avoid overwhelming the API
        if (blockNumber % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return transfers;
    } catch (error) {
      logger.error(`Error fetching transfer data for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  async getStakingData(parachainId) {
    if (!this.isConnected || !this.api) {
      throw new Error('Data aggregator not connected');
    }

    try {
      const [
        validatorCount,
        currentEra,
        activeEra,
        totalStake,
        totalIssuance
      ] = await Promise.all([
        this.api.query.staking.validatorCount(),
        this.api.query.staking.currentEra(),
        this.api.query.staking.activeEra(),
        this.api.query.staking.erasTotalStake(currentEra),
        this.api.query.balances.totalIssuance()
      ]);

      return {
        parachainId,
        validatorCount: validatorCount.toNumber(),
        currentEra: currentEra.toNumber(),
        activeEra: activeEra.unwrap().index.toNumber(),
        totalStake: totalStake.toString(),
        totalIssuance: totalIssuance.toString(),
        stakingRatio: (parseInt(totalStake.toString()) / parseInt(totalIssuance.toString())) * 100,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error fetching staking data for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  async getAccountActivity(parachainId, accountAddress, blockRange) {
    if (!this.isConnected || !this.api) {
      throw new Error('Data aggregator not connected');
    }

    try {
      const activities = [];

      for (let blockNumber = blockRange.start; blockNumber <= blockRange.end; blockNumber++) {
        const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
        const events = await this.api.query.system.events.at(blockHash);

        const accountEvents = events.filter(({ event }) => {
          const isRelevantEvent = ['balances', 'staking', 'democracy', 'council'].includes(event.section);
          const involvesAccount = event.data.some(data =>
            data.toString() === accountAddress
          );
          return isRelevantEvent && involvesAccount;
        }).map(({ event }) => ({
          parachainId,
          accountAddress,
          eventSection: event.section,
          eventMethod: event.method,
          blockNumber,
          blockHash: blockHash.toString(),
          timestamp: new Date()
        }));

        activities.push(...accountEvents);
      }

      return activities;
    } catch (error) {
      logger.error(`Error fetching account activity for ${accountAddress}:`, error);
      throw error;
    }
  }

  async calculateTVL(parachainId) {
    if (!this.isConnected || !this.api) {
      throw new Error('Data aggregator not connected');
    }

    try {
      // Get total issuance as a proxy for TVL
      // In a real implementation, you'd aggregate from DeFi protocols
      const totalIssuance = await this.api.query.balances.totalIssuance();

      // Get current DOT price (this would come from an oracle)
      const dotPrice = await this.getDOTPrice();

      const tvlInDOT = parseInt(totalIssuance.toString()) / 10000000000; // Convert from planck
      const tvlInUSD = tvlInDOT * dotPrice;

      return {
        parachainId,
        totalValueLocked: totalIssuance.toString(),
        totalValueLockedUSD: tvlInUSD,
        tokenCount: 1, // Simplified
        protocolCount: 1, // Simplified
        dominantToken: {
          symbol: 'DOT',
          amount: totalIssuance.toString(),
          percentage: 100
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error calculating TVL for parachain ${parachainId}:`, error);
      throw error;
    }
  }

  async getDOTPrice() {
    try {
      // This would typically call a price oracle API
      // For now, return a mock price
      return 5.5; // USD per DOT
    } catch (error) {
      logger.error('Error fetching DOT price:', error);
      return 5.5; // Fallback price
    }
  }

  async disconnect() {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
      this.isConnected = false;
      logger.info('Data aggregator disconnected');
    }
  }
}

module.exports = new DataAggregator();
