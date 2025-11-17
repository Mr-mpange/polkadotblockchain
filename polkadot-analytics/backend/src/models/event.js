module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
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
      type: DataTypes.STRING(66, 'utf8mb4'),
      allowNull: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    phase: {
      type: DataTypes.JSON,
      allowNull: false
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    data0: {
      type: DataTypes.STRING(255),
      allowNull: true,
      get() {
        const data = this.getDataValue('data');
        return data && data[0] ? String(data[0]) : null;
      }
    },
    data1: {
      type: DataTypes.STRING(255),
      allowNull: true,
      get() {
        const data = this.getDataValue('data');
        return data && data[1] ? String(data[1]) : null;
      }
    },
    indexInBlock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    extrinsicIdx: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    tableName: 'events',
    timestamps: true,
    indexes: [
      { fields: ['blockNumber'] },
      { fields: ['blockHash'] },
      { fields: ['section', 'method'] },
      { fields: ['extrinsicIdx'] },
      { fields: ['timestamp'] },
      { fields: ['data0'] },
      { fields: ['data1'] }
    ]
  });

  // Add a flag to track if associations have been set up
  if (!Event.associationsSetUp) {
    Event.associate = (models) => {
      console.log('🔗 Setting up associations for Event...');
      
      // Clear any existing associations
      if (Event.associations) {
        Object.keys(Event.associations).forEach(assoc => {
          delete Event.associations[assoc];
        });
      }
      
      try {
        Event.belongsTo(models.Extrinsic, {
          foreignKey: 'extrinsicIdx',
          targetKey: 'indexInBlock',
          as: 'extrinsic',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        
        Event.belongsTo(models.Block, {
          foreignKey: 'blockHash',
          targetKey: 'hash',
          as: 'block',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        
        // Mark associations as set up
        Event.associationsSetUp = true;
        console.log('✅ Successfully set up associations for Event');
      } catch (error) {
        console.error('❌ Error in Event.associate:', error);
        throw error;
      }
    };
  }

  // Add beforeSave hook to update data0 and data1 when data changes
  Event.beforeSave((event, options) => {
    if (event.changed('data')) {
      const data = event.data;
      event.data0 = data && data[0] ? String(data[0]) : null;
      event.data1 = data && data[1] ? String(data[1]) : null;
    }
    return Promise.resolve();
  });

  return Event;
};
