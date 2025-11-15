module.exports = (sequelize, DataTypes) => {
  const Extrinsic = sequelize.define('Extrinsic', {
    id: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    blockHash: {
      type: DataTypes.STRING(66),
      allowNull: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    indexInBlock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    signer: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    signature: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    era: {
      type: DataTypes.JSON,
      allowNull: true
    },
    nonce: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    args: {
      type: DataTypes.JSON,
      allowNull: true
    },
    argsText: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const args = this.getDataValue('args');
        return args ? JSON.stringify(args) : null;
      }
    },
    hash: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    isSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    error: {
      type: DataTypes.JSON,
      allowNull: true
    },
    fee: {
      type: DataTypes.STRING,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    // Explicitly set table name to ensure consistency
    tableName: 'extrinsics',
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
    timestamps: true,
    // Add charset and collation to match the database
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // Define indexes for the table
    // We'll create them manually after the table is created
    indexes: [
      { fields: ['blockNumber'] },
      { fields: ['blockHash'] },
      { fields: ['signer'] },
      { fields: ['section', 'method'] },
      { fields: ['hash'] },
      { fields: ['timestamp'] },
      { fields: ['argsText'] },
      { 
        fields: ['indexInBlock'],
        unique: true  // Make indexInBlock unique for foreign key reference
      }
    ]
  });

  // Add a flag to track if associations have been set up
  if (!Extrinsic.associationsSetUp) {
    Extrinsic.associate = (models) => {
      console.log('🔗 Setting up associations for Extrinsic...');
      
      // Clear any existing associations
      if (Extrinsic.associations) {
        Object.keys(Extrinsic.associations).forEach(assoc => {
          delete Extrinsic.associations[assoc];
        });
      }
      
      try {
        Extrinsic.belongsTo(models.Block, {
          foreignKey: 'blockHash',
          targetKey: 'hash',
          as: 'block',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        
        Extrinsic.hasMany(models.Event, {
          foreignKey: 'extrinsicIdx',
          sourceKey: 'indexInBlock',
          as: 'events',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        
        // Mark associations as set up
        Extrinsic.associationsSetUp = true;
        console.log('✅ Successfully set up associations for Extrinsic');
      } catch (error) {
        console.error('❌ Error in Extrinsic.associate:', error);
        throw error;
      }
    };
  }

  // Add beforeSave hook to update argsText when args changes
  Extrinsic.beforeSave((extrinsic, options) => {
    if (extrinsic.changed('args')) {
      extrinsic.argsText = extrinsic.args ? JSON.stringify(extrinsic.args) : null;
    }
    return Promise.resolve();
  });

  return Extrinsic;
};
