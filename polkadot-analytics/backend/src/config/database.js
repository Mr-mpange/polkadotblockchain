console.log('🔌 Loading database configuration...');

const { Sequelize } = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'polkadot_analytics_db', // Changed from polkadot_analytics to polkadot_analytics_db
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const createDatabaseIfNotExists = async () => {
  // Create a connection without specifying the database
  const tempSequelize = new Sequelize('', process.env.DB_USER || 'root', process.env.DB_PASS || '', {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false
  });

  const dbName = process.env.DB_NAME || 'polkadot_analytics_db';
  
  try {
    // Check if database exists
    const [results] = await tempSequelize.query(`SHOW DATABASES LIKE '${dbName}'`);
    
    if (results.length === 0) {
      console.log(`🔄 Database '${dbName}' does not exist. Creating...`);
      await tempSequelize.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await tempSequelize.close();
  }
};

const connectDB = async () => {
  console.log('🔄 Attempting to connect to database...');
  
  try {
    // First ensure the database exists
    await createDatabaseIfNotExists();
    
    // Now connect to the specific database
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Import models
    const models = require('../models');
    
    // In development, drop and recreate all tables
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Resetting database in development mode...');
      
      // Disable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Drop all tables
      await sequelize.dropAllSchemas();
      
      // Define the exact order of table creation to respect foreign key dependencies
      // Tables with no dependencies first
      const syncOrder = [
        'Block',      // No dependencies
        'Account',    // No dependencies
        'Validator',  // Depends on Account
        'Parachain',  // No dependencies
        'Extrinsic',  // Depends on Block
        'Transaction', // Depends on Block
        'Event'       // Depends on Block and Transaction
      ];
      
      console.log('🔄 Sync order:', syncOrder.join(' → '));
      
      // Disable foreign key checks during table creation
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      // First, sync all models without any foreign key constraints
      for (const modelName of syncOrder) {
        if (models[modelName] && typeof models[modelName].sync === 'function') {
          const model = models[modelName];
          
          try {
            console.log(`🔄 Creating ${modelName} table...`);
            
            // Temporarily disable associations to prevent automatic FK creation
            const originalAssociate = model.associate;
            if (typeof originalAssociate === 'function') {
              model.associate = () => {}; // No-op the associate function
            }
            
            // Sync the model with force: true to drop and recreate
            await model.sync({ 
              force: true,
              logging: (sql) => {
                console.log(`  SQL: ${sql.substring(0, 150)}${sql.length > 150 ? '...' : ''}`);
              }
            });
            
            // Restore the original associate function if it exists
            if (typeof originalAssociate === 'function') {
              model.associate = originalAssociate;
            }
            
            console.log(`✅ ${modelName} table created successfully`);
            
            // Verify the table exists
            const [tables] = await sequelize.query(`SHOW TABLES LIKE '${model.tableName || model.name.toLowerCase() + 's'}'`);
            if (tables.length === 0) {
              throw new Error(`Table ${model.tableName || model.name} was not created`);
            }
            
          } catch (error) {
            console.error(`❌ Error creating ${modelName} table:`, error.message);
            if (error.sql) {
              console.error('SQL:', error.sql);
            }
            throw error;
          }
        }
      }

      // Now add all foreign key constraints manually
      try {
        console.log('🔄 Adding foreign key constraints...');
        
        // Helper function to add foreign key with better error handling
        const addForeignKey = async (table, constraintName, columns, refTable, refColumns, onDelete = 'CASCADE', onUpdate = 'CASCADE') => {
          try {
            // First, ensure the referenced column has an index
            const [results] = await sequelize.query(`
              SHOW INDEX FROM \`${refTable}\` WHERE Column_name = '${refColumns.split('(')[0]}';
            `);
            
            if (results.length === 0) {
              console.log(`🔄 Creating index on ${refTable}.${refColumns}...`);
              await sequelize.query(`
                CREATE INDEX idx_${refTable}_${refColumns.replace(/[()]/g, '')} 
                ON \`${refTable}\`(${refColumns});
              `);
            }
            
            // Drop the constraint if it exists
            await sequelize.query(`
              ALTER TABLE \`${table}\` 
              DROP FOREIGN KEY IF EXISTS \`${constraintName}\`;
            `);
            
            // Add the constraint
            await sequelize.query(`
              ALTER TABLE \`${table}\` 
              ADD CONSTRAINT \`${constraintName}\` 
              FOREIGN KEY (\`${columns}\`) 
              REFERENCES \`${refTable}\`(\`${refColumns}\`) 
              ON DELETE ${onDelete} 
              ON UPDATE ${onUpdate};
            `);
            
            console.log(`✅ Added ${constraintName} (${table}.${columns} -> ${refTable}.${refColumns})`);
            return true;
          } catch (error) {
            console.error(`❌ Error adding ${constraintName}:`, error.message);
            if (error.sql) {
              console.error('SQL:', error.sql);
            }
            // Don't throw the error, just log it and continue
            return false;
          }
        };

        // Add foreign keys in the correct order
        await addForeignKey('transactions', 'fk_transaction_block', 'blockHash', 'blocks', 'hash');
        await addForeignKey('extrinsics', 'fk_extrinsic_block', 'blockHash', 'blocks', 'hash');
        
        // For the event -> extrinsic reference, ensure the index exists first
        await addForeignKey('events', 'fk_event_extrinsic', 'extrinsicIdx', 'extrinsics', 'indexInBlock', 'SET NULL');
        
        // Add block hash reference for events
        await addForeignKey('events', 'fk_event_block', 'blockHash', 'blocks', 'hash');

        console.log('✅ All foreign key constraints added successfully');
      } catch (error) {
        console.error('❌ Error adding foreign key constraints:', error.message);
        if (error.sql) {
          console.error('SQL:', error.sql);
        }
        // Don't throw the error, just log it and continue
      } finally {
        // Always re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      }
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Database reset complete');
    }
    
    // Set up associations after all tables are created
    Object.values(models).forEach(model => {
      if (model.associate) {
        model.associate(models);
      }
    });
    
    // Final sync to ensure everything is up to date
    await sequelize.sync();
    console.log('✅ Database synchronized');

    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Handle database connection events
const setupDatabaseEvents = () => {
  sequelize.connectionManager.on('connect', () => {
    logger.info('Database connection established');
  });

  sequelize.connectionManager.on('disconnect', () => {
    logger.warn('Database connection lost');
  });

  sequelize.connectionManager.on('error', (err) => {
    logger.error('Database connection error:', err);
  });
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await closeDatabase();
  process.exit(1);
});

// Export the sequelize instance and connectDB function
module.exports = {
  sequelize,
  Sequelize,
  connectDB,
  closeDatabase,
  setupDatabaseEvents
};
