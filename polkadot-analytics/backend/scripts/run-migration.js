const { sequelize } = require('../src/config/database');
const migration = require('../src/migrations/fix-foreign-keys');

async function runMigration() {
  try {
    console.log('🚀 Starting migration...');
    await migration.up({ sequelize, queryInterface: sequelize.getQueryInterface() }, require('sequelize'));
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
