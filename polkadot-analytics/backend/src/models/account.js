module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    address: {
      type: DataTypes.STRING(48),
      primaryKey: true,
      allowNull: false,
      field: 'address'
    },
    nonce: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'nonce'
    },
    freeBalance: {
      type: DataTypes.STRING,
      defaultValue: '0',
      field: 'free_balance'
    },
    reservedBalance: {
      type: DataTypes.STRING,
      defaultValue: '0',
      field: 'reserved_balance'
    },
    totalBalance: {
      type: DataTypes.VIRTUAL,
      get() {
        const free = BigInt(this.getDataValue('freeBalance') || '0');
        const reserved = BigInt(this.getDataValue('reservedBalance') || '0');
        return (free + reserved).toString();
      }
    },
    isValidator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_validator'
    },
    isNominator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_nominator'
    },
    stashAddress: {
      type: DataTypes.STRING(48),
      allowNull: true,
      field: 'stash_address'
    },
    identity: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'identity'
    },
    activeEras: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'active_eras',
      get() {
        const value = this.getDataValue('activeEras');
        return value || [];
      },
      set(value) {
        this.setDataValue('activeEras', Array.isArray(value) ? value : []);
      }
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_active'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'metadata'
    },
    isContract: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_contract'
    },
    contractCodeHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: 'contract_code_hash'
    },
    contractDeployedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'contract_deployed_at'
    },
    contractTxCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'contract_tx_count'
    }
  }, {
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['stash_address'] },
      { fields: ['is_validator'] },
      { fields: ['is_nominator'] },
      { fields: ['is_contract'] }
      // Note: Removed JSON index as it's not supported in MariaDB
      // If you need to search JSON fields, consider using a full-text search solution
      // or storing the searchable fields in dedicated columns
    ]
  });

  Account.associate = function(models) {
    Account.belongsTo(models.Validator, {
      foreignKey: 'stashAddress',
      targetKey: 'stashAddress',
      as: 'validatorInfo'
    });
  };

  return Account;
};
