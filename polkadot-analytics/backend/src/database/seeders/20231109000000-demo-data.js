'use strict';

const { v4: uuidv4 } = require('uuid');
const { hash } = require('../../utils/crypto');

// Generate a random Polkadot address (not a real one, just for testing)
const generateRandomAddress = () => {
  const chars = '0123456789abcdef';
  let result = '5';
  for (let i = 0; i < 47; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a random block hash
const generateBlockHash = () => {
  return '0x' + Array(64).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const timestamp = Date.now();
    
    // Create test accounts
    const accounts = Array(10).fill().map((_, i) => ({
      address: generateRandomAddress(),
      nonce: 0,
      freeBalance: (Math.random() * 10000).toFixed(0),
      reservedBalance: '0',
      isValidator: i < 3, // First 3 accounts are validators
      isNominator: i >= 3 && i < 7, // Next 4 are nominators
      stashAddress: i < 3 ? generateRandomAddress() : null,
      identity: {
        display: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        twitter: `@user${i + 1}`
      },
      lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now
    }));

    // Insert accounts
    await queryInterface.bulkInsert('accounts', accounts);

    // Create validators
    const validators = accounts
      .filter(acc => acc.isValidator)
      .map((acc, i) => ({
        stashAddress: acc.stashAddress,
        controllerAddress: acc.address,
        commission: [5, 7.5, 10][i],
        totalStake: (100000 + Math.random() * 900000).toFixed(0),
        ownStake: (10000 + Math.random() * 10000).toFixed(0),
        nominatorCount: Math.floor(Math.random() * 50) + 10,
        isActive: true,
        isElected: i < 2, // First 2 validators are elected
        isWaiting: i === 2, // 3rd validator is waiting
        rank: i + 1,
        rewards: {
          total: (1000 + Math.random() * 10000).toFixed(0),
          lastEra: 1000 + i
        },
        slashes: {},
        preferences: {
          commission: [5, 7.5, 10][i],
          blocked: false
        },
        createdAt: now,
        updatedAt: now
      }));

    // Insert validators
    await queryInterface.bulkInsert('validators', validators);

    // Update accounts with validator info
    await Promise.all(validators.map(validator => 
      queryInterface.bulkUpdate('accounts', 
        { stashAddress: validator.stashAddress },
        { address: validator.controllerAddress }
      )
    ));

    // Create blocks
    const blocks = Array(100).fill().map((_, i) => {
      const blockNumber = 1000000 + i;
      const blockHash = generateBlockHash();
      const blockTime = Date.now() - (99 - i) * 6000; // 6 seconds between blocks
      
      return {
        id: blockHash,
        number: blockNumber,
        hash: blockHash,
        parentHash: i > 0 ? blocks[i - 1]?.hash || generateBlockHash() : '0x' + '0'.repeat(64),
        stateRoot: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        extrinsicsRoot: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: Math.floor(blockTime / 1000),
        validator: validators[Math.floor(Math.random() * validators.length)].stashAddress,
        blockTime: 6000,
        extrinsicsCount: Math.floor(Math.random() * 10) + 1,
        eventsCount: Math.floor(Math.random() * 20) + 5,
        specVersion: 100,
        finalized: i < 50, // First 50 blocks are finalized
        createdAt: new Date(blockTime),
        updatedAt: new Date(blockTime)
      };
    });

    // Insert blocks
    await queryInterface.bulkInsert('blocks', blocks);

    // Create extrinsics and events
    const extrinsics = [];
    const events = [];
    let eventId = 0;
    
    blocks.forEach((block, blockIndex) => {
      const txCount = Math.min(block.extrinsicsCount, 10);
      
      for (let i = 0; i < txCount; i++) {
        const isTransfer = Math.random() > 0.5;
        const section = isTransfer ? 'balances' : ['system', 'staking', 'utility'][Math.floor(Math.random() * 3)];
        const method = isTransfer ? 'transfer' : 
          section === 'staking' ? ['bond', 'nominate', 'payoutStakers'][Math.floor(Math.random() * 3)] :
          section === 'utility' ? ['batch', 'batchAll', 'asDerivative'][Math.floor(Math.random() * 3)] : 'remark';
        
        const signer = accounts[Math.floor(Math.random() * accounts.length)].address;
        const extrinsic = {
          id: `0x${hash(block.number + '-' + i).substring(0, 64)}`,
          blockNumber: block.number,
          blockHash: block.hash,
          indexInBlock: i,
          version: 4,
          signer,
          signature: '0x' + Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          era: { isMortalEra: true, asMortalEra: { period: 64, phase: 0 } },
          nonce: Math.floor(Math.random() * 10),
          tip: (Math.random() * 10).toFixed(0),
          section,
          method,
          args: isTransfer ? {
            dest: accounts[Math.floor(Math.random() * accounts.length)].address,
            value: (Math.random() * 1000).toFixed(0)
          } : {},
          hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          isSigned: true,
          success: Math.random() > 0.1, // 90% success rate
          timestamp: block.timestamp * 1000,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt
        };
        
        extrinsics.push(extrinsic);

        // Create events for this extrinsic
        const eventCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < eventCount; j++) {
          events.push({
            id: `event-${eventId++}`,
            blockNumber: block.number,
            blockHash: block.hash,
            phase: { isApplyExtrinsic: true, asApplyExtrinsic: i },
            section,
            method: isTransfer ? 'Transfer' : `${section}.${method}`.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(''),
            data: {
              from: signer,
              to: accounts[Math.floor(Math.random() * accounts.length)].address,
              amount: (Math.random() * 1000).toFixed(0)
            },
            indexInBlock: eventId,
            extrinsicIdx: i,
            timestamp: block.timestamp * 1000,
            createdAt: block.createdAt,
            updatedAt: block.updatedAt
          });
        }
      }
    });

    // Insert extrinsics and events
    await queryInterface.bulkInsert('extrinsics', extrinsics);
    await queryInterface.bulkInsert('events', events);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('events', null, {});
    await queryInterface.bulkDelete('extrinsics', null, {});
    await queryInterface.bulkDelete('blocks', null, {});
    await queryInterface.bulkDelete('validators', null, {});
    await queryInterface.bulkDelete('accounts', null, {});
  }
};
