'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blocks', {
      id: {
        type: Sequelize.STRING(66),
        primaryKey: true,
        allowNull: false
      },
      number: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false
      },
      hash: {
        type: Sequelize.STRING(66),
        unique: true,
        allowNull: false
      },
      parentHash: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      stateRoot: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      extrinsicsRoot: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      validator: {
        type: Sequelize.STRING(48),
        allowNull: true
      },
      blockTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      extrinsicsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      eventsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      specVersion: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      finalized: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('accounts', {
      address: {
        type: Sequelize.STRING(48),
        primaryKey: true,
        allowNull: false
      },
      nonce: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      freeBalance: {
        type: Sequelize.STRING,
        defaultValue: '0'
      },
      reservedBalance: {
        type: Sequelize.STRING,
        defaultValue: '0'
      },
      isValidator: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isNominator: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      stashAddress: {
        type: Sequelize.STRING(48),
        allowNull: true,
        references: {
          model: 'validators',
          key: 'stashAddress'
        },
        onDelete: 'SET NULL'
      },
      identity: {
        type: Sequelize.JSON,
        allowNull: true
      },
      activeEras: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: []
      },
      lastActive: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      isContract: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      contractCodeHash: {
        type: Sequelize.STRING(66),
        allowNull: true
      },
      contractDeployedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      contractTxCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('validators', {
      stashAddress: {
        type: Sequelize.STRING(48),
        primaryKey: true,
        allowNull: false
      },
      controllerAddress: {
        type: Sequelize.STRING(48),
        allowNull: false
      },
      commission: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      totalStake: {
        type: Sequelize.STRING,
        defaultValue: '0'
      },
      ownStake: {
        type: Sequelize.STRING,
        defaultValue: '0'
      },
      nominatorCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastEra: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      identity: {
        type: Sequelize.JSON,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isElected: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isWaiting: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rewards: {
        type: Sequelize.JSON,
        allowNull: true
      },
      slashes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('extrinsics', {
      id: {
        type: Sequelize.STRING(66),
        primaryKey: true,
        allowNull: false
      },
      blockNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      blockHash: {
        type: Sequelize.STRING(66),
        allowNull: false,
        references: {
          model: 'blocks',
          key: 'hash'
        },
        onDelete: 'CASCADE'
      },
      indexInBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      signer: {
        type: Sequelize.STRING(48),
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'address'
        },
        onDelete: 'SET NULL'
      },
      signature: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      era: {
        type: Sequelize.JSON,
        allowNull: true
      },
      nonce: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      section: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      method: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      args: {
        type: Sequelize.JSON,
        allowNull: true
      },
      hash: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      isSigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      success: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      error: {
        type: Sequelize.JSON,
        allowNull: true
      },
      fee: {
        type: Sequelize.STRING,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.STRING(66),
        primaryKey: true,
        allowNull: false
      },
      blockNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      blockHash: {
        type: Sequelize.STRING(66),
        allowNull: false,
        references: {
          model: 'blocks',
          key: 'hash'
        },
        onDelete: 'CASCADE'
      },
      phase: {
        type: Sequelize.JSON,
        allowNull: false
      },
      section: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      method: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      indexInBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      extrinsicIdx: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'extrinsics',
          key: 'indexInBlock'
        },
        onDelete: 'SET NULL'
      },
      timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes
    await queryInterface.addIndex('blocks', ['number']);
    await queryInterface.addIndex('blocks', ['hash']);
    await queryInterface.addIndex('blocks', ['timestamp']);
    await queryInterface.addIndex('blocks', ['validator']);

    await queryInterface.addIndex('accounts', ['isValidator']);
    await queryInterface.addIndex('accounts', ['isNominator']);
    await queryInterface.addIndex('accounts', ['stashAddress']);
    await queryInterface.addIndex('accounts', ['lastActive']);

    await queryInterface.addIndex('validators', ['controllerAddress']);
    await queryInterface.addIndex('validators', ['isActive']);
    await queryInterface.addIndex('validators', ['isElected']);
    await queryInterface.addIndex('validators', ['commission']);
    await queryInterface.addIndex('validators', ['totalStake']);

    await queryInterface.addIndex('extrinsics', ['blockNumber']);
    await queryInterface.addIndex('extrinsics', ['blockHash']);
    await queryInterface.addIndex('extrinsics', ['signer']);
    await queryInterface.addIndex('extrinsics', ['section', 'method']);
    await queryInterface.addIndex('extrinsics', ['hash']);
    await queryInterface.addIndex('extrinsics', ['timestamp']);

    await queryInterface.addIndex('events', ['blockNumber']);
    await queryInterface.addIndex('events', ['blockHash']);
    await queryInterface.addIndex('events', ['section', 'method']);
    await queryInterface.addIndex('events', ['extrinsicIdx']);
    await queryInterface.addIndex('events', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('extrinsics');
    await queryInterface.dropTable('validators');
    await queryInterface.dropTable('accounts');
    await queryInterface.dropTable('blocks');
  }
};
