'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('parachains', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      para_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      token_symbol: {
        type: Sequelize.STRING(16),
        allowNull: true
      },
      token_decimals: {
        type: Sequelize.INTEGER,
        defaultValue: 12
      },
      website: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      logo_uri: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lease_period_start: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      lease_period_end: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      current_lease_period: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      total_stake: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      total_issuance: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      active_accounts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('metrics', {
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: true
      },
      parachain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'parachains',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      metric_name: {
        type: Sequelize.STRING(64),
        allowNull: false,
        primaryKey: true
      },
      value_int: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      value_float: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      value_str: {
        type: Sequelize.STRING(512),
        allowNull: true
      },
      metadata: {
        type: Sequelize.STRING(512),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      primaryKey: ['timestamp', 'parachain_id', 'metric_name']
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('metrics', ['parachain_id']);
    await queryInterface.addIndex('metrics', ['metric_name']);
    await queryInterface.addIndex('metrics', ['timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('metrics');
    await queryInterface.dropTable('parachains');
  }
};
