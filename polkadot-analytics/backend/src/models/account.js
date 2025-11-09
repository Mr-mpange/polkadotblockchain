module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    address: {
      type: DataTypes.STRING(48),
      primaryKey: true,
      allowNull: false
    },
    nonce: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    freeBalance: {
      type: DataTypes.STRING,
      defaultValue: '0'
    },
    reservedBalance: {
      type: DataTypes.STRING,
      defaultValue: '0'
    },
    totalBalance: {
      type: DataTypes.STRING,
      defaultValue: '0',
      get() {
        const free = BigInt(this.getDataValue('freeBalance') || '0');
        const reserved = BigInt(this.getDataValue('reservedBalance') || '0');
        return (free + reserved).toString();
      }
    },
    isValidator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isNominator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stashAddress: {
      type: DataTypes.STRING(48),
      allowNull: true,
      references: {
        model: 'validators',  // This references the table name, not the model name
        key: 'stashAddress'
      },
      onDelete: 'SET NULL'
    },
    identity: {
      type: DataTypes.JSON,
      allowNull: true
    },
    activeEras: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isContract: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    contractCodeHash: {
      type: DataTypes.STRING(66),
      allowNull: true
    },
    contractDeployedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractTxCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['isValidator'] },
      { fields: ['isNominator'] },
      { fields: ['stashAddress'] },
      { fields: ['totalBalance'] },
      { fields: ['lastActive'] },
      { 
        fields: [
          sequelize.literal("((metadata->>'display')::text)"),
          sequelize.literal("((metadata->>'email')::text)"),
          sequelize.literal("((metadata->>'twitter')::text)")
        ],
        name: 'account_metadata_search_idx'
      }
    ]
  });

  Account.associate = (models) => {
    Account.belongsTo(models.Validator, {
      foreignKey: 'stashAddress',
      targetKey: 'stashAddress',
      as: 'validatorInfo'
    });
  };

  return Account;
};
