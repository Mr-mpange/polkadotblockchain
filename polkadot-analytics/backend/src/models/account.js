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
    // Virtual field for total balance (calculated, not stored in DB)
    totalBalance: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['freeBalance', 'reservedBalance']),
      get() {
        const free = BigInt(this.getDataValue('freeBalance') || '0');
        const reserved = BigInt(this.getDataValue('reservedBalance') || '0');
        return (free + reserved).toString();
      },
      set() {
        // This is a virtual field, so we don't store it
        throw new Error('Cannot set totalBalance directly');
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
    validatorStash: {
      type: DataTypes.STRING(48),
      allowNull: true,
      field: 'validator_stash',
      comment: 'Reference to the validator this account is nominating'
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
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
    timestamps: true,
    underscored: true,
    // We'll create indexes manually after table creation
    indexes: []
  });

  // Add a flag to track if associations have been set up
  if (!Account.associationsSetUp) {
    Account.associate = function(models) {
      console.log('🔗 Setting up associations for Account...');
      
      // Clear any existing associations
      if (Account.associations) {
        Object.keys(Account.associations).forEach(assoc => {
          delete Account.associations[assoc];
        });
      }
      
      try {
        // Association with Validator (for accounts that are validators)
        Account.belongsTo(models.Validator, {
          foreignKey: 'stashAddress',
          targetKey: 'stashAddress',
          as: 'validatorInfo',
          constraints: false
        });
        
        // Association for nominators to their validator
        Account.belongsTo(models.Validator, {
          foreignKey: 'validatorStash',
          targetKey: 'stashAddress',
          as: 'nominatedValidator',
          constraints: false
        });
        
        // Mark associations as set up
        Account.associationsSetUp = true;
        console.log('✅ Successfully set up associations for Account');
      } catch (error) {
        console.error('❌ Error in Account.associate:', error);
        throw error;
      }
    };
  }

  return Account;
};
