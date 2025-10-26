const { ApiPromise, WsProvider } = require('@polkadot/api');
const { logger, performanceLogger } = require('../utils/logger');

class PolkadotService {
  constructor() {
    this.api = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  async connect() {
    const startTime = Date.now();
    try {
      const rpcUrl = process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io';

      logger.info(`Connecting to Polkadot RPC: ${rpcUrl}`);

      const provider = new WsProvider(rpcUrl, {
        timeout: 30000,
        reconnect: {
          delay: 1000,
          maxAttempts: 5
        }
      });

      this.api = await ApiPromise.create({ provider });

      // Wait for connection
      await this.api.isReady;

      this.isConnected = true;
      this.reconnectAttempts = 0;

      logger.info(`Polkadot API connected successfully in ${Date.now() - startTime}ms`);
      performanceLogger('Polkadot API Connection', startTime);

      // Set up connection event handlers
      this.setupEventHandlers();

      return this.api;
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Polkadot API:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.api) return;

    this.api.on('connected', () => {
      logger.info('Polkadot API connected');
      this.isConnected = true;
    });

    this.api.on('disconnected', () => {
      logger.warn('Polkadot API disconnected');
      this.isConnected = false;
    });

    this.api.on('error', (error) => {
      logger.error('Polkadot API error:', error);
      this.isConnected = false;
    });

    this.api.on('ready', () => {
      logger.info('Polkadot API ready');
      this.isConnected = true;
    });
  }

  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return false;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      if (this.api) {
        await this.api.disconnect();
      }

      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));

      await this.connect();
      return true;
    } catch (error) {
      logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      return false;
    }
  }

  async getChainInfo() {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const [chain, nodeName, nodeVersion, chainType] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
        this.api.rpc.system.chainType()
      ]);

      return {
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        chainType: chainType.toString()
      };
    } catch (error) {
      logger.error('Failed to get chain info:', error);
      throw error;
    }
  }

  async getParachains() {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const parachains = await this.api.query.paras.parachains();
      return parachains.map(paraId => ({
        parachainId: paraId.toNumber(),
        status: 'Active'
      }));
    } catch (error) {
      logger.error('Failed to get parachains:', error);
      throw error;
    }
  }

  async getParachainInfo(parachainId) {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const [heads, lifecycle, pastLifecycle] = await Promise.all([
        this.api.query.paras.heads(parachainId),
        this.api.query.paras.lifecycle(parachainId),
        this.api.query.paras.pastLifecycle(parachainId)
      ]);

      return {
        parachainId,
        currentHead: heads.toString(),
        lifecycle: lifecycle.toString(),
        pastLifecycle: pastLifecycle.toString()
      };
    } catch (error) {
      logger.error(`Failed to get parachain info for ${parachainId}:`, error);
      throw error;
    }
  }

  async getBlockMetrics() {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const [currentHeader, currentBlock, validatorCount] = await Promise.all([
        this.api.rpc.chain.getHeader(),
        this.api.rpc.chain.getBlock(),
        this.api.query.staking.validatorCount()
      ]);

      const blockNumber = currentHeader.number.toNumber();
      const blockHash = currentHeader.hash.toString();
      const blockTime = await this.getAverageBlockTime();

      return {
        blockNumber,
        blockHash,
        blockTime,
        validatorCount: validatorCount.toNumber(),
        extrinsicsCount: currentBlock.block.extrinsics.length,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Failed to get block metrics:', error);
      throw error;
    }
  }

  async getAverageBlockTime() {
    if (!this.isConnected || !this.api) {
      return 6000; // Default 6 seconds
    }

    try {
      const currentBlockNumber = (await this.api.rpc.chain.getHeader()).number.toNumber();
      const pastBlockNumber = Math.max(1, currentBlockNumber - 100);

      const [currentBlock, pastBlock] = await Promise.all([
        this.api.rpc.chain.getBlockHash(currentBlockNumber),
        this.api.rpc.chain.getBlockHash(pastBlockNumber)
      ]);

      const [currentBlockHeader, pastBlockHeader] = await Promise.all([
        this.api.rpc.chain.getHeader(currentBlock),
        this.api.rpc.chain.getHeader(pastBlock)
      ]);

      const timeDiff = currentBlockHeader.birthTime - pastBlockHeader.birthTime;
      const blockDiff = currentBlockNumber - pastBlockNumber;

      return timeDiff / blockDiff;
    } catch (error) {
      logger.error('Failed to calculate average block time:', error);
      return 6000; // Default 6 seconds
    }
  }

  async getAccountBalance(address) {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const account = await this.api.query.system.account(address);
      return {
        free: account.data.free.toString(),
        reserved: account.data.reserved.toString(),
        miscFrozen: account.data.miscFrozen.toString(),
        feeFrozen: account.data.feeFrozen.toString(),
        total: account.data.free.add(account.data.reserved).toString()
      };
    } catch (error) {
      logger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  async getTransferEvents(blockHash, blockNumber) {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const events = await this.api.query.system.events.at(blockHash);

      const transfers = events.filter(({ event }) => {
        return event.section === 'balances' && event.method === 'Transfer';
      }).map(({ event }) => ({
        from: event.data[0].toString(),
        to: event.data[1].toString(),
        amount: event.data[2].toString(),
        blockNumber
      }));

      return transfers;
    } catch (error) {
      logger.error('Failed to get transfer events:', error);
      throw error;
    }
  }

  async getValidatorInfo() {
    if (!this.isConnected || !this.api) {
      throw new Error('Not connected to Polkadot API');
    }

    try {
      const [validatorCount, validators, currentEra] = await Promise.all([
        this.api.query.staking.validatorCount(),
        this.api.query.staking.validators.keys(),
        this.api.query.staking.currentEra()
      ]);

      return {
        validatorCount: validatorCount.toNumber(),
        activeValidators: validators.length,
        currentEra: currentEra.toNumber()
      };
    } catch (error) {
      logger.error('Failed to get validator info:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
      this.isConnected = false;
      logger.info('Polkadot API disconnected');
    }
  }

  // Health check method
  async healthCheck() {
    if (!this.isConnected || !this.api) {
      return {
        status: 'disconnected',
        timestamp: Date.now()
      };
    }

    try {
      await this.api.rpc.system.chain();
      return {
        status: 'connected',
        timestamp: Date.now()
      };
    } catch (error) {
      this.isConnected = false;
      return {
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

module.exports = new PolkadotService();
