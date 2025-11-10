'use strict';

async function runQuery(sequelize, query, description) {
  try {
    console.log(`🔄 Running: ${description}`);
    await sequelize.query(query);
    console.log(`✅ Success: ${description}`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate key')) {
      console.log(`ℹ️  Skipped (already exists): ${description}`);
    } else {
      console.error(`❌ Error (${description}):`, error.message);
      throw error;
    }
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Fixing associations and foreign keys...');
    const { sequelize } = queryInterface;
    
    try {
      // 1. First, ensure all tables exist and have the correct structure
      // Accounts table modifications
      await runQuery(sequelize, 
        'ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stash_address VARCHAR(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'Adding stash_address to accounts table'
      );
      
      await runQuery(sequelize,
        'ALTER TABLE accounts ADD COLUMN IF NOT EXISTS validator_stash VARCHAR(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'Adding validator_stash to accounts table'
      );
      
      // Create indexes for accounts table
      await runQuery(sequelize,
        'CREATE INDEX IF NOT EXISTS idx_accounts_stash_address ON accounts(stash_address)',
        'Creating index on accounts.stash_address'
      );
      
      await runQuery(sequelize,
        'CREATE INDEX IF NOT EXISTS idx_accounts_validator_stash ON accounts(validator_stash)',
        'Creating index on accounts.validator_stash'
      );
      
      // Validators table modifications
      await runQuery(sequelize,
        'ALTER TABLE validators MODIFY COLUMN stash_address VARCHAR(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'Modifying stash_address in validators table'
      );
      
      await runQuery(sequelize,
        'CREATE INDEX IF NOT EXISTS idx_validators_stash_address ON validators(stash_address)',
        'Creating index on validators.stash_address'
      );
      
      // Blocks table modifications
      await runQuery(sequelize,
        'ALTER TABLE blocks MODIFY COLUMN hash VARCHAR(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL',
        'Modifying hash in blocks table'
      );
      
      // Transactions table modifications
      await runQuery(sequelize,
        'ALTER TABLE transactions MODIFY COLUMN block_hash VARCHAR(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'Modifying block_hash in transactions table'
      );
      
      await runQuery(sequelize,
        'CREATE INDEX IF NOT EXISTS idx_transactions_block_hash ON transactions(block_hash)',
        'Creating index on transactions.block_hash'
      );
      
      console.log('✅ Successfully updated table structures');
    } catch (error) {
      console.error('❌ Error updating table structures:', error.message);
      if (error.sql) console.error('SQL:', error.sql);
      throw error;
    }

    // 2. Remove any existing foreign key constraints that might cause issues
    try {
      console.log('\n🔄 Dropping existing foreign key constraints...');
      
      await runQuery(sequelize, 
        'ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_stashAddress',
        'Dropping foreign key fk_accounts_stashAddress'
      );
      
      await runQuery(sequelize,
        'ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_validatorStash',
        'Dropping foreign key fk_accounts_validatorStash'
      );
      
      await runQuery(sequelize,
        'ALTER TABLE validators DROP FOREIGN KEY IF EXISTS fk_validators_stashAddress',
        'Dropping foreign key fk_validators_stashAddress'
      );
      
      await runQuery(sequelize,
        'ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_transactions_blockHash',
        'Dropping foreign key fk_transactions_blockHash'
      );
      
      await runQuery(sequelize,
        'ALTER TABLE extrinsics DROP FOREIGN KEY IF EXISTS fk_extrinsics_blockHash',
        'Dropping foreign key fk_extrinsics_blockHash'
      );
      
      console.log('✅ Successfully dropped existing foreign key constraints');
    } catch (error) {
      console.warn('⚠️  Warning during foreign key cleanup:', error.message);
      // Continue even if dropping constraints fails
    }

    // 3. Add the correct foreign key constraints
    try {
      console.log('\n🔄 Adding foreign key constraints...');
      
      // Link accounts to validators (for validators)
      await runQuery(sequelize,
        `ALTER TABLE accounts 
         ADD CONSTRAINT fk_accounts_stashAddress 
         FOREIGN KEY (stash_address) 
         REFERENCES validators(stash_address) 
         ON DELETE SET NULL 
         ON UPDATE CASCADE`,
        'Adding foreign key fk_accounts_stashAddress from accounts to validators'
      );
      
      // Link accounts to validators (for nominators)
      await runQuery(sequelize,
        `ALTER TABLE accounts 
         ADD CONSTRAINT fk_accounts_validatorStash 
         FOREIGN KEY (validator_stash) 
         REFERENCES validators(stash_address) 
         ON DELETE SET NULL 
         ON UPDATE CASCADE`,
        'Adding foreign key fk_accounts_validatorStash from accounts to validators'
      );
      
      // Link validators to accounts
      await runQuery(sequelize,
        `ALTER TABLE validators 
         ADD CONSTRAINT fk_validators_stashAddress 
         FOREIGN KEY (stash_address) 
         REFERENCES accounts(address) 
         ON DELETE CASCADE 
         ON UPDATE CASCADE`,
        'Adding foreign key fk_validators_stashAddress from validators to accounts'
      );
      
      // Link transactions to blocks
      await runQuery(sequelize,
        `ALTER TABLE transactions
         ADD CONSTRAINT fk_transactions_blockHash
         FOREIGN KEY (block_hash)
         REFERENCES blocks(hash)
         ON DELETE CASCADE
         ON UPDATE CASCADE`,
        'Adding foreign key fk_transactions_blockHash from transactions to blocks'
      );
      
      // Link extrinsics to blocks
      await runQuery(sequelize,
        `ALTER TABLE extrinsics
         ADD CONSTRAINT fk_extrinsics_blockHash
         FOREIGN KEY (block_hash)
         REFERENCES blocks(hash)
         ON DELETE CASCADE
         ON UPDATE CASCADE`,
        'Adding foreign key fk_extrinsics_blockHash from extrinsics to blocks'
      );
      
      console.log('✅ Successfully added all foreign key constraints');
    } catch (error) {
      console.error('❌ Error adding foreign key constraints:', error.message);
      if (error.sql) console.error('SQL:', error.sql);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all foreign key constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_stashAddress;
      ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_validatorStash;
      ALTER TABLE validators DROP FOREIGN KEY IF EXISTS fk_validators_stashAddress;
      ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_transactions_blockHash;
      ALTER TABLE extrinsics DROP FOREIGN KEY IF EXISTS fk_extrinsics_blockHash;
    `);
  }
};
