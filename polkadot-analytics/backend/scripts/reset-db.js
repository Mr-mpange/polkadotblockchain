const { sequelize } = require('../src/config/database');
const { initializeModels } = require('../src/models');

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Initialize models first to get all table names
    await initializeModels(sequelize);
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all table names
    const [tables] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = '${sequelize.config.database}'`
    );
    
    // Drop all tables
    for (const table of tables) {
      const tableName = table.TABLE_NAME || table.table_name;
      console.log(`🗑️  Dropping table: ${tableName}`);
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Database reset complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
