const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the model with explicit SQL types for MariaDB
  const Parachain = sequelize.define('Parachain', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    parachain_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'parachain_id',
      comment: 'The actual parachain ID on the network'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: true
      }
    },
    symbol: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'symbol',
      validate: {
        notEmpty: true,
        isUppercase: true
      }
    },
    description: {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
      field: 'description'
    },
    website: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'website',
      validate: {
        isUrl: true
      }
    },
    logo_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'logo_url',
      validate: {
        isUrl: true
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Other',
      field: 'category',
      validate: {
        isIn: [['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Privacy', 'Identity', 'Other']]
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Active',
      field: 'status',
      validate: {
        isIn: [['Active', 'Inactive', 'Coming_Soon', 'Retired']]
      }
    },
    launch_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'launch_date'
    },
    total_supply: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '0',
      field: 'total_supply',
      comment: 'Stored as string to handle large numbers accurately'
    },
    decimals: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 18,
      field: 'decimals',
      validate: {
        min: 0,
        max: 38
      }
    },
    relay_chain: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Polkadot',
      field: 'relay_chain',
      comment: 'The relay chain this parachain is connected to'
    },
    is_parachain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_parachain',
      comment: 'True if this is a parachain, false if a parathread or other'
    },
    twitter: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'twitter',
      validate: {
        is: /^[a-zA-Z0-9_]{1,15}$/i
      }
    },
    telegram: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'telegram',
      validate: {
        is: /^[a-zA-Z0-9_]{5,32}$/i
      }
    },
    github: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'github',
      validate: {
        is: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
      }
    },
    discord: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'discord'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'metadata',
      comment: 'Additional flexible metadata in JSON format',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value || {}));
      },
      defaultValue: '{}'
    }
  }, {
    tableName: 'parachains',
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    // Disable automatic table modification
    freezeTableName: true,
    // Define indexes
    indexes: [
      {
        name: 'idx_parachain_id',
        unique: true,
        fields: ['parachain_id']
      },
      { 
        name: 'idx_parachain_name',
        fields: ['name'] 
      },
      { 
        name: 'idx_parachain_status',
        fields: ['status'] 
      },
      { 
        name: 'idx_parachain_category',
        fields: ['category'] 
      },
      { 
        name: 'idx_parachain_relay_chain',
        fields: ['relay_chain'] 
      },
      { 
        name: 'idx_parachain_is_parachain',
        fields: ['is_parachain'] 
      }
    ],
    // Add table comment
    comment: 'Stores information about parachains in the Polkadot ecosystem',
    // Define model-wide options
    define: {
      // Prevent sequelize from automatically adding timestamps
      timestamps: true,
      // Use snake_case for column names
      underscored: true,
      // Don't use camelcase for automatically added attributes but underscore style
      underscoredAll: true
    }
  });

  // Static methods
  Parachain.findActive = async function() {
    return this.findAll({
      where: { status: 'Active' },
      order: [['name', 'ASC']]
    });
  };

  Parachain.findByRelayChain = async function(relayChain) {
    return this.findAll({
      where: { relay_chain: relayChain },
      order: [['name', 'ASC']]
    });
  };

  // Instance methods
  Parachain.prototype.getLatestMetrics = async function() {
    // This would typically join with a metrics table
    // For now, return basic info
    return {
      id: this.id,
      name: this.name,
      symbol: this.symbol,
      status: this.status,
      updatedAt: this.updatedAt
    };
  };

  return Parachain;
};
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    website: {
      type: DataTypes.STRING(512),
      allowNull: true,
      validate: {
        isUrl: true
      },
      field: 'website'
    },
    logo_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
      validate: {
        isUrl: true
      },
      field: 'logo_url'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Other',
      field: 'category',
      validate: {
        isIn: [['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Privacy', 'Identity', 'Other']]
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Active',
      field: 'status',
      validate: {
        isIn: [['Active', 'Inactive', 'Coming_Soon', 'Retired']]
      }
    },
    launch_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'launch_date'
    },
    total_supply: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '0',
      field: 'total_supply',
      comment: 'Stored as string to handle large numbers accurately'
    },
    decimals: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 18,
      field: 'decimals',
      validate: {
        min: 0,
        max: 38
      }
    },
    relay_chain: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Polkadot',
      field: 'relay_chain',
      comment: 'The relay chain this parachain is connected to'
    },
    is_parachain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_parachain',
      comment: 'True if this is a parachain, false if a parathread or other'
    },
    twitter: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'twitter',
      validate: {
        is: /^[a-zA-Z0-9_]{1,15}$/i
      }
    },
    telegram: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'telegram',
      validate: {
        is: /^[a-zA-Z0-9_]{5,32}$/i
      }
    },
    github: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'github',
      validate: {
        is: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
      }
    },
    discord: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'discord'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'metadata',
      comment: 'Additional flexible metadata in JSON format',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value || {}));
      },
      defaultValue: '{}'
    }
  }, {
    tableName: 'parachains',
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    // Disable automatic table modification
    freezeTableName: true,
    // Define indexes
    indexes: [
      {
        name: 'idx_parachain_id',
        unique: true,
        fields: ['parachain_id']
      },
      { 
        name: 'idx_parachain_name',
        fields: ['name'] 
      },
      { 
        name: 'idx_parachain_status',
        fields: ['status'] 
      },
      { 
        name: 'idx_parachain_category',
        fields: ['category'] 
      },
      { 
        name: 'idx_parachain_relay_chain',
        fields: ['relay_chain'] 
      },
      { 
        name: 'idx_parachain_is_parachain',
        fields: ['is_parachain'] 
      }
    ],
    // Add table comment
    comment: 'Stores information about parachains in the Polkadot ecosystem',
    // Define model-wide options
    define: {
      // Prevent sequelize from automatically adding timestamps
      timestamps: true,
      // Use snake_case for column names
      underscored: true,
      // Don't use camelcase for automatically added attributes but underscore style
      underscoredAll: true
    }
  });

  // Static methods
  Parachain.findActive = async function() {
    return this.findAll({
      where: { status: 'Active' },
      order: [['name', 'ASC']]
    });
  };

  Parachain.findByRelayChain = async function(relayChain) {
    return this.findAll({
      where: { relayChain },
      order: [['name', 'ASC']]
    });
  };

  // Instance methods
  Parachain.prototype.getLatestMetrics = async function() {
    // This would typically join with a metrics table
    // For now, return basic info
    return {
      id: this.id,
      name: this.name,
      symbol: this.symbol,
      status: this.status,
      updatedAt: this.updatedAt
    };
  };

  return Parachain;
};
