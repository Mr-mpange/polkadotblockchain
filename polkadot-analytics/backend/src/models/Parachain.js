const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Parachain = sequelize.define('Parachain', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parachainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'parachain_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isUppercase: true
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    website: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    logoUrl: {
      type: DataTypes.STRING,
      field: 'logo_url',
      validate: {
        isUrl: true
      }
    },
    category: {
      type: DataTypes.ENUM('DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Privacy', 'Identity', 'Other'),
      defaultValue: 'Other'
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Coming Soon', 'Retired'),
      defaultValue: 'Active'
    },
    launchDate: {
      type: DataTypes.DATE,
      field: 'launch_date'
    },
    totalSupply: {
      type: DataTypes.STRING,
      defaultValue: '0',
      field: 'total_supply'
    },
    decimals: {
      type: DataTypes.INTEGER,
      defaultValue: 18
    },
    // Chain information
    relayChain: {
      type: DataTypes.STRING,
      defaultValue: 'Polkadot',
      field: 'relay_chain'
    },
    isParachain: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_parachain'
    },
    // Social links
    twitter: DataTypes.STRING,
    telegram: DataTypes.STRING,
    github: DataTypes.STRING,
    discord: DataTypes.STRING,
    // Additional metadata
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'parachains',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['parachain_id'], unique: true },
      { fields: ['name'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['relay_chain'] }
    ]
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
