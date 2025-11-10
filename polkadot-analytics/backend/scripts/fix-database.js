const { sequelize } = require('../src/config/database');
const migration = require('../src/migrations/fix-associations');

async function runMigration() {
  try {
    console.log('🚀 Starting database fix...');
    
    // Run the migration
    await migration.up(
      { 
        sequelize, 
        queryInterface: sequelize.getQueryInterface() 
      }, 
      require('sequelize')
    );
    
    console.log('✅ Database fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
