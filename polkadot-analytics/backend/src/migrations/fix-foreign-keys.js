'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Fixing foreign key constraints...');
    
    // 1. First, ensure all the necessary columns exist with the correct types
    await queryInterface.sequelize.query(`
      -- Add missing columns if they don't exist
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS stash_address VARCHAR(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      ADD COLUMN IF NOT EXISTS validator_stash VARCHAR(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      ADD INDEX IF NOT EXISTS idx_accounts_stash_address (stash_address),
      ADD INDEX IF NOT EXISTS idx_accounts_validator_stash (validator_stash);
      
      ALTER TABLE validators
      MODIFY COLUMN stash_address VARCHAR(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      ADD INDEX IF NOT EXISTS idx_validators_stash_address (stash_address);
    `);

    // 2. Now add the foreign key constraints
    try {
      // Remove existing foreign key constraints if they exist
      await queryInterface.sequelize.query(`
        ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_stashAddress;
        ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_validatorStash;
        ALTER TABLE validators DROP FOREIGN KEY IF EXISTS fk_validators_stashAddress;
      `);

      // Add new foreign key constraints
      await queryInterface.sequelize.query(`
        -- Link accounts to validators (for validators)
        ALTER TABLE accounts 
        ADD CONSTRAINT fk_accounts_stashAddress 
        FOREIGN KEY (stash_address) 
        REFERENCES validators(stash_address) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- Link accounts to validators (for nominators)
        ALTER TABLE accounts 
        ADD CONSTRAINT fk_accounts_validatorStash 
        FOREIGN KEY (validator_stash) 
        REFERENCES validators(stash_address) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- Link validators to accounts
        ALTER TABLE validators 
        ADD CONSTRAINT fk_validators_stashAddress 
        FOREIGN KEY (stash_address) 
        REFERENCES accounts(stash_address) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
      `);
      
      console.log('✅ Successfully fixed foreign key constraints');
    } catch (error) {
      console.error('❌ Error fixing foreign key constraints:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the foreign key constraints if needed
    await queryInterface.sequelize.query(`
      ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_stashAddress;
      ALTER TABLE accounts DROP FOREIGN KEY IF EXISTS fk_accounts_validatorStash;
      ALTER TABLE validators DROP FOREIGN KEY IF EXISTS fk_validators_stashAddress;
    `);
  }
};
