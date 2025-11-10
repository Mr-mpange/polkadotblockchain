console.log('🔌 Loading database configuration...');

const { Sequelize } = require('sequelize');
const path = require('path');

// Import models initialization from models/index.js
const { initializeModels, getInitializedModels } = require('../models');

// This will be populated when models are initialized
let models = {};

// First create a connection without specifying the database
const sequelizeWithoutDB = new Sequelize('', process.env.MYSQL_USER || 'root', process.env.MYSQL_PASSWORD || '', {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
});

// Function to ensure the database exists
const ensureDatabaseExists = async () => {
  const databaseName = process.env.MYSQL_DATABASE || 'polkadot_analytics';
  
  try {
    // Check if database exists
    const [results] = await sequelizeWithoutDB.query(`SHOW DATABASES LIKE '${databaseName}'`);
    
    if (results.length === 0) {
      console.log(`🔄 Database '${databaseName}' does not exist. Creating...`);
      await sequelizeWithoutDB.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`✅ Database '${databaseName}' created successfully`);
    } else {
      console.log(`✅ Database '${databaseName}' already exists`);
    }
    
    // Close the temporary connection
    await sequelizeWithoutDB.close();
  } catch (error) {
    console.error('❌ Error ensuring database exists:', error.message);
    throw error;
  }
};

// Create the main sequelize instance with the database
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'polkadot_analytics',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
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
    await ensureDatabaseExists();
    
    // Then authenticate with the database
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Initialize models with the sequelize instance
    models = initializeModels(sequelize);
    console.log('✅ Models initialized successfully');
    
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
        'Parachain',  // No dependencies
        'Validator',  // Depends on Account
        'Extrinsic',  // Depends on Block
        'Transaction', // Depends on Block
        'Event'       // Depends on Block and Transaction
      ];
      
      console.log('🔄 Sync order:', syncOrder.join(' → '));
      
      // Disable foreign key checks during table creation
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Create accounts table first with proper schema
      console.log('🔄 Creating accounts table with proper schema...');
      const createAccountsTableSQL = `
        CREATE TABLE IF NOT EXISTS \`accounts\` (
          \`address\` VARCHAR(255) PRIMARY KEY,
          \`nonce\` INT NULL DEFAULT 0,
          \`free_balance\` VARCHAR(100) NULL DEFAULT '0',
          \`reserved_balance\` VARCHAR(100) NULL DEFAULT '0',
          \`total_balance\` VARCHAR(100) NULL,
          \`is_validator\` TINYINT(1) NULL DEFAULT 0,
          \`is_nominator\` TINYINT(1) NULL DEFAULT 0,
          \`stash_address\` VARCHAR(255) NULL,
          \`validator_stash\` VARCHAR(255) NULL,
          \`identity\` JSON NULL,
          \`active_eras\` JSON NULL DEFAULT (JSON_OBJECT()),
          \`last_active\` DATETIME NULL,
          \`metadata\` JSON NULL,
          \`is_contract\` TINYINT(1) NULL DEFAULT 0,
          \`contract_code_hash\` VARCHAR(255) NULL,
          \`contract_deployed_at\` DATETIME NULL,
          \`contract_tx_count\` INT NULL DEFAULT 0,
          \`created_at\` DATETIME NOT NULL,
          \`updated_at\` DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      try {
        await sequelize.query(createAccountsTableSQL);
        console.log('✅ Created/Updated accounts table with proper schema');
      } catch (error) {
        console.error('❌ Error creating accounts table:', error.message);
        throw error;
      }
      
      // Create other tables
      for (const modelName of syncOrder) {
        if (!models[modelName] || modelName === 'Account') {
          console.log(`ℹ️  Model ${modelName} not found or already created, skipping...`);
          continue;
        }
        
        const model = models[modelName];
        const tableName = model.tableName || model.name.toLowerCase() + 's';
        
        try {
          // Drop table if it exists
          await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
          
          // Create table using raw SQL
          console.log(`🔄 Creating ${tableName} table...`);
          
          // Generate column definitions
          const columns = [];
          for (const [attr, options] of Object.entries(model.rawAttributes)) {
            const type = options.type.key.toLowerCase();
            let columnDef = `\`${options.field || attr}\``;
            
            // Special handling for Block model
            if (modelName === 'Block') {
              if (attr === 'id') {
                columns.push('`id` VARCHAR(66) PRIMARY KEY');
                continue;
              } else if (attr === 'number') {
                columns.push('`number` INT UNIQUE NOT NULL');
                continue;
              } else if (attr === 'hash') {
                columns.push('`hash` VARCHAR(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL');
                continue;
              } else if (attr === 'parentHash' || attr === 'stateRoot' || attr === 'extrinsicsRoot') {
                columns.push(`\`${attr}\` VARCHAR(66) NOT NULL`);
                continue;
              } else if (attr === 'validator') {
                columns.push('`validator` VARCHAR(48) NULL');
                continue;
              } else if (attr === 'timestamp') {
                columns.push('`timestamp` BIGINT NOT NULL');
                continue;
              } else if (attr === 'blockTime') {
                columns.push('`blockTime` INT NULL');
                continue;
              } else if (attr === 'extrinsicsCount' || attr === 'eventsCount' || attr === 'specVersion') {
                columns.push(`\`${attr}\` INT NOT NULL DEFAULT 0`);
                continue;
              } else if (attr === 'finalized') {
                columns.push('`finalized` TINYINT(1) DEFAULT 0');
                continue;
              }
            }
            
            // Default type mapping for other models/columns
            let sqlType = type.toUpperCase();
            if (type.includes('varchar')) {
              sqlType = `VARCHAR(${options.type.options.length || 255})`;
              if (options.charset) {
                sqlType += ` CHARACTER SET ${options.charset}`;
              }
              if (options.collate) {
                sqlType += ` COLLATE ${options.collate}`;
              }
            } else if (type === 'text') {
              sqlType = 'TEXT';
              if (options.charset) {
                sqlType += ` CHARACTER SET ${options.charset}`;
              }
              if (options.collate) {
                sqlType += ` COLLATE ${options.collate}`;
              }
            } else if (type === 'integer') {
              sqlType = 'INT';
              if (options.autoIncrement) sqlType += ' AUTO_INCREMENT';
            } else if (type === 'bigint') {
              sqlType = 'BIGINT';
            } else if (type === 'boolean') {
              sqlType = 'TINYINT(1)';
            } else if (type === 'date' || type === 'dateonly') {
              sqlType = 'DATETIME';
            } else if (type === 'json') {
              sqlType = 'JSON';
            }
            
            columnDef += ` ${sqlType}`;
            
            // Handle primary key
            if (options.primaryKey) {
              columnDef += ' PRIMARY KEY';
              if (options.autoIncrement) {
                columnDef += ' AUTO_INCREMENT';
              }
            } else {
              columnDef += options.allowNull === false ? ' NOT NULL' : ' NULL';
              
              // Handle unique constraint
              if (options.unique) {
                columnDef += ' UNIQUE';
              }
              
              // Handle default values
              if (options.defaultValue !== undefined) {
                let defaultValue = options.defaultValue;
                if (typeof defaultValue === 'string') {
                  // Escape single quotes in string defaults
                  defaultValue = `'${defaultValue.replace(/'/g, "''")}'`;
                } else if (defaultValue === null) {
                  defaultValue = 'NULL';
                } else if (defaultValue === true) {
                  defaultValue = '1';
                } else if (defaultValue === false) {
                  defaultValue = '0';
                } else if (defaultValue instanceof Date) {
                  defaultValue = `'${defaultValue.toISOString().slice(0, 19).replace('T', ' ')}'`;
                }
                columnDef += ` DEFAULT ${defaultValue}`;
              }
            }
            
            columns.push(columnDef);
          }
          
          // Add any model options that affect the table definition
          const tableOptions = [];
          
          // Special handling for Block model
          if (modelName === 'Block') {
            tableOptions.push('ENGINE=InnoDB');
            tableOptions.push('DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
          } else {
            if (model.options.engine) {
              tableOptions.push(`ENGINE=${model.options.engine}`);
            } else {
              tableOptions.push('ENGINE=InnoDB');
            }
            
            if (model.options.charset) {
              tableOptions.push(`DEFAULT CHARSET=${model.options.charset}`);
              if (model.options.collate) {
                tableOptions.push(`COLLATE=${model.options.collate}`);
              }
            } else {
              tableOptions.push('DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
            }
          }
          
          // Create the table
          const createTableSQL = `
            CREATE TABLE \`${tableName}\` (
              ${columns.join(',\n              ')}
            ) ${tableOptions.join(' ')};`;
          
          await sequelize.query(createTableSQL);
          console.log(`✅ Created ${tableName} table`);
          
        } catch (error) {
          console.error(`❌ Error creating ${tableName} table:`, error.message);
          if (error.sql) console.error('SQL:', error.sql);
          throw error;
        }
      }
      
      // Now that all tables are created, add indexes and foreign keys
      console.log('\n🔄 Adding indexes and foreign keys...');
      
      // Function to add indexes to a model
      const addIndexes = async (modelName) => {
        if (!models[modelName]) {
          console.log(`ℹ️  Model ${modelName} not found, skipping...`);
          return;
        }

        const model = models[modelName];
        const tableName = model.tableName || model.name.toLowerCase() + 's';
        
        try {
          // Verify table exists first
          const [tables] = await sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
          if (tables.length === 0) {
            console.error(`❌ Table ${tableName} does not exist`);
            return;
          }
          
          console.log(`🔄 Processing indexes for ${tableName}...`);
          
          // Get existing indexes
          let existingIndexes = [];
          try {
            [existingIndexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
          } catch (error) {
            console.log(`  ℹ️  Could not get indexes for ${tableName}:`, error.message);
          }
          
          const existingIndexNames = new Set(
            existingIndexes.map(idx => idx.Key_name).filter(Boolean)
          );
          
          // Special handling for Block model indexes
          if (modelName === 'Block') {
            const blockIndexes = [
              { name: 'blocks_hash', fields: ['hash'], unique: true },
              { name: 'blocks_number', fields: ['number'], unique: true },
              { name: 'blocks_parentHash', fields: ['parentHash'] },
              { name: 'blocks_validator', fields: ['validator'] },
              { name: 'blocks_timestamp', fields: ['timestamp'] }
            ];
            
            for (const index of blockIndexes) {
              const fieldList = index.fields.map(f => `\`${f}\``).join(', ');
              const unique = index.unique ? 'UNIQUE' : '';
              
              try {
                await sequelize.query(`
                  CREATE ${unique} INDEX \`${index.name}\` 
                  ON \`${tableName}\` (${fieldList})
                `);
                console.log(`  ✅ Added ${unique ? unique + ' ' : ''}index ${index.name} on (${fieldList})`);
              } catch (error) {
                if (!error.message.includes('already exists')) {
                  console.error(`  ❌ Error adding index ${index.name}:`, error.message);
                  if (error.sql) console.error('  SQL:', error.sql);
                } else {
                  console.log(`  ℹ️  Index ${index.name} already exists`);
                }
              }
            }
          } 
          // Handle indexes for other models
          else if (model.options.indexes && model.options.indexes.length > 0) {
            for (const index of model.options.indexes) {
              if (!index.fields || !Array.isArray(index.fields)) {
                console.error(`  ❌ Invalid index definition in ${modelName}:`, index);
                continue;
              }
              
              const fields = index.fields.map(field => 
                typeof field === 'string' ? field : field[0]
              );
              const fieldList = fields.map(f => `\`${f}\``).join(', ');
              const unique = index.unique ? 'UNIQUE' : '';
              const indexName = index.name || `idx_${tableName}_${fields.join('_')}`;
              
              // Skip if index already exists
              if (existingIndexNames.has(indexName)) {
                console.log(`  ℹ️  Index ${indexName} already exists`);
                continue;
              }
              
              try {
                await sequelize.query(`
                  CREATE ${unique} INDEX \`${indexName}\` 
                  ON \`${tableName}\` (${fieldList})
                `);
                console.log(`  ✅ Added ${unique ? unique + ' ' : ''}index ${indexName} on (${fieldList})`);
              } catch (error) {
                if (!error.message.includes('already exists')) {
                  console.error(`  ❌ Error adding index ${indexName}:`, error.message);
                  if (error.sql) console.error('  SQL:', error.sql);
                } else {
                  console.log(`  ℹ️  Index ${indexName} already exists`);
                }
              }
              
              // Skip if index already exists
              if (existingIndexNames.has(indexName)) {
                console.log(`  ℹ️  Index ${indexName} already exists`);
                continue;
              }
              
              try {
                await sequelize.query(`
                  CREATE ${unique} INDEX \`${indexName}\` 
                  ON \`${tableName}\` (${fieldList})
                `);
                console.log(`  ✅ Added ${unique ? unique + ' ' : ''}index ${indexName} on (${fieldList})`);
              } catch (error) {
                console.error(`  ❌ Error adding index ${indexName}:`, error.message);
                if (error.sql) console.error('  SQL:', error.sql);
              }
            }
          } else {
            console.log(`  ℹ️  No indexes defined for ${tableName}`);
          }
          
          // Add any missing columns for the Parachain model
          if (tableName === 'parachains') {
            try {
              const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
              const columnNames = columns.map(col => col.Field);
              
              // Add parachain_id if it doesn't exist
              if (!columnNames.includes('parachain_id')) {
                await sequelize.query(`
                  ALTER TABLE \`${tableName}\`
                  ADD COLUMN \`parachain_id\` INT NOT NULL UNIQUE
                `);
                console.log('  ✅ Added parachain_id column with UNIQUE constraint');
              }
              
              // Add other required columns if they don't exist
              const requiredColumns = [
                'name', 'symbol', 'description', 'website', 'logo_url',
                'category', 'status', 'launch_date', 'total_supply', 'decimals',
                'relay_chain', 'is_parachain', 'twitter', 'telegram', 'github', 'discord'
              ];
              
              for (const col of requiredColumns) {
                if (!columnNames.includes(col)) {
                  let columnType = 'VARCHAR(255)';
                  if (col === 'description') {
                    columnType = 'TEXT';
                  } else if (col === 'decimals' || col === 'is_parachain') {
                    columnType = 'INT';
                  } else if (col === 'launch_date') {
                    columnType = 'DATETIME';
                  } else if (col === 'total_supply') {
                    columnType = 'VARCHAR(100)';
                  }
                  
                  await sequelize.query(`
                    ALTER TABLE \`${tableName}\`
                    ADD COLUMN \`${col}\` ${columnType} NULL
                  `);
                  console.log(`  ✅ Added column ${col} to ${tableName}`);
                }
              }
              
              // Add indexes for Parachain model
              const parachainIndexes = [
                { name: 'idx_parachains_name', fields: ['name'], unique: false },
                { name: 'idx_parachains_status', fields: ['status'], unique: false },
                { name: 'idx_parachains_relay_chain', fields: ['relay_chain'], unique: false }
              ];
              
              for (const idx of parachainIndexes) {
                if (!existingIndexNames.has(idx.name)) {
                  await sequelize.query(`
                    CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX \`${idx.name}\` 
                    ON \`${tableName}\` (\`${idx.fields[0]}\`)
                  `);
                  console.log(`  ✅ Added index ${idx.name} on ${idx.fields[0]}`);
                }
              }
              
            } catch (error) {
              console.error(`  ❌ Error updating ${tableName} table:`, error.message);
              if (error.sql) console.error('  SQL:', error.sql);
            }
          }
          if (modelName === 'Account') {
            await sequelize.query(`
              CREATE INDEX IF NOT EXISTS \`idx_accounts_stash_address\` 
              ON \`accounts\` (\`stash_address\`);
            `);
            console.log('  ✅ Added index idx_accounts_stash_address on stash_address');
            
            await sequelize.query(`
              CREATE INDEX IF NOT EXISTS \`idx_accounts_is_validator\` 
              ON \`accounts\` (\`is_validator\`);
            `);
            console.log('  ✅ Added index idx_accounts_is_validator on is_validator');
            
            await sequelize.query(`
              CREATE INDEX IF NOT EXISTS \`idx_accounts_is_nominator\` 
              ON \`accounts\` (\`is_nominator\`);
            `);
            console.log('  ✅ Added index idx_accounts_is_nominator on is_nominator');
            
            await sequelize.query(`
              CREATE INDEX IF NOT EXISTS \`idx_accounts_is_contract\` 
              ON \`accounts\` (\`is_contract\`);
            `);
            console.log('  ✅ Added index idx_accounts_is_contract on is_contract');
          }
          
          // Add indexes from model definition
          for (const index of originalIndexes) {
            try {
              // Skip if index is for a different table (shouldn't happen but just in case)
              if (index.table && index.table !== tableName) {
                console.log(`  ⚠️  Skipping index for different table: ${index.table}`);
                continue;
              }
              
              // Handle different index formats
              let fields = [];
              if (Array.isArray(index.fields)) {
                fields = index.fields;
              } else if (typeof index.fields === 'string') {
                fields = [index.fields];
              } else if (index.attributes) {
                fields = index.attributes.map(attr => typeof attr === 'string' ? attr : attr.name);
              }
              
              if (fields.length === 0) {
                console.log('  ⚠️  No fields defined for index, skipping');
                continue;
              }
              
              const fieldList = fields.join('`, `');
              const unique = index.unique ? 'UNIQUE' : '';
              const name = index.name || `idx_${tableName}_${fields.join('_')}`;
              
              // Check if index already exists
              const [existingIndexes] = await sequelize.query(`
                SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${name}';
              `);
              
              if (existingIndexes.length === 0) {
                await sequelize.query(`
                  CREATE ${unique} INDEX \`${name}\` 
                  ON \`${tableName}\` (\`${fieldList}\`);
                `);
                console.log(`  ✅ Added ${unique ? unique + ' ' : ''}index ${name} on (${fieldList})`);
              } else {
                console.log(`  ℹ️  Index ${name} already exists, skipping`);
              }
            } catch (error) {
              console.error(`  ❌ Error adding index to ${modelName}:`, error.message);
              if (error.sql) {
                console.error('  SQL:', error.sql);
              }
              // Continue with other indexes even if one fails
            }
          }
        } catch (error) {
          console.error(`❌ Error adding indexes to ${modelName}:`, error.message);
          throw error;
        }
      };
      
      // Create all tables in order
      for (const modelName of syncOrder) {
        await createTableWithIndexes(modelName);
      }

      // Now add all foreign key constraints manually
      try {
        console.log('🔄 Adding foreign key constraints...');
        
        // First, ensure the blocks.hash column has a unique index
        try {
          await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_blocks_hash ON blocks(hash);
          `);
          console.log('✅ Created index on blocks.hash');
        } catch (error) {
          console.error('❌ Error creating index on blocks.hash:', error.message);
        }
          
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
