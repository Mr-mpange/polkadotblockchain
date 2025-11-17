/**
 * Database Connection Verification Script
 * Tests all database connections for the Polkadot Analytics platform
 */

const path = require('path');
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));
const { Sequelize } = require(path.join(__dirname, 'backend', 'node_modules', 'sequelize'));
require('dotenv').config({ path: './backend/config/.env' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`)
};

async function testMySQLConnection() {
  log.section('1. Testing MySQL Connection');
  
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
  };
  
  try {
    log.info(`Connecting to MySQL at ${config.host}:${config.port}...`);
    const connection = await mysql.createConnection(config);
    log.success('MySQL connection successful');
    
    // Check if database exists
    const dbName = process.env.MYSQL_DATABASE || 'polkadot_analytics';
    const [databases] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
    
    if (databases.length > 0) {
      log.success(`Database '${dbName}' exists`);
      
      // Check tables
      await connection.query(`USE ${dbName}`);
      const [tables] = await connection.query('SHOW TABLES');
      
      if (tables.length > 0) {
        log.success(`Found ${tables.length} tables:`);
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`  - ${tableName}`);
        });
      } else {
        log.warning('Database exists but has no tables');
      }
    } else {
      log.warning(`Database '${dbName}' does not exist - will be created on first run`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log.error(`MySQL connection failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      log.error('Make sure MySQL/XAMPP is running');
    }
    return false;
  }
}

async function testSequelizeConnection() {
  log.section('2. Testing Backend (Sequelize) Connection');
  
  const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'polkadot_analytics',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASSWORD || '',
    {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT) || 3306,
      dialect: 'mysql',
      logging: false
    }
  );
  
  try {
    await sequelize.authenticate();
    log.success('Backend Sequelize connection successful');
    
    const [results] = await sequelize.query('SELECT VERSION() as version');
    log.info(`MySQL Version: ${results[0].version}`);
    
    await sequelize.close();
    return true;
  } catch (error) {
    log.error(`Sequelize connection failed: ${error.message}`);
    return false;
  }
}

async function checkAIAnalyticsConfig() {
  log.section('3. Checking AI Analytics Configuration');
  
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, 'ai-analytics', '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('DATABASE_URI=mysql://')) {
      log.success('AI Analytics is configured for MySQL');
      
      const match = envContent.match(/DATABASE_URI=(.+)/);
      if (match) {
        log.info(`Connection string: ${match[1]}`);
      }
    } else if (envContent.includes('mongodb://')) {
      log.error('AI Analytics is still configured for MongoDB - needs update');
      return false;
    }
  } else {
    log.warning('AI Analytics .env file not found');
    return false;
  }
  
  return true;
}

async function displaySummary(mysqlOk, sequelizeOk, aiConfigOk) {
  log.section('Configuration Summary');
  
  console.log('Database Type: MySQL');
  console.log(`Host: ${process.env.MYSQL_HOST || '127.0.0.1'}`);
  console.log(`Port: ${process.env.MYSQL_PORT || 3306}`);
  console.log(`Database: ${process.env.MYSQL_DATABASE || 'polkadot_analytics'}`);
  console.log(`User: ${process.env.MYSQL_USER || 'root'}`);
  console.log('');
  
  console.log('Component Status:');
  console.log(`  MySQL Server:        ${mysqlOk ? colors.green + '✓ Running' : colors.red + '✗ Not Running'}${colors.reset}`);
  console.log(`  Backend (Sequelize): ${sequelizeOk ? colors.green + '✓ Connected' : colors.red + '✗ Failed'}${colors.reset}`);
  console.log(`  AI Analytics Config: ${aiConfigOk ? colors.green + '✓ Correct' : colors.red + '✗ Needs Fix'}${colors.reset}`);
  console.log('');
  
  if (mysqlOk && sequelizeOk && aiConfigOk) {
    log.success('All database connections are properly configured!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start backend:      cd backend && npm run dev');
    console.log('  2. Start frontend:     cd frontend && npm run dev');
    console.log('  3. Start AI analytics: cd ai-analytics && python app.py');
  } else {
    log.error('Some issues need to be fixed:');
    if (!mysqlOk) {
      console.log('  - Start MySQL/XAMPP');
    }
    if (!sequelizeOk) {
      console.log('  - Check backend database configuration');
    }
    if (!aiConfigOk) {
      console.log('  - Update AI Analytics .env file to use MySQL');
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  Polkadot Analytics - Database Verification');
  console.log('='.repeat(60));
  
  const mysqlOk = await testMySQLConnection();
  const sequelizeOk = await testSequelizeConnection();
  const aiConfigOk = await checkAIAnalyticsConfig();
  
  await displaySummary(mysqlOk, sequelizeOk, aiConfigOk);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  process.exit(mysqlOk && sequelizeOk && aiConfigOk ? 0 : 1);
}

main().catch(error => {
  log.error(`Script failed: ${error.message}`);
  process.exit(1);
});
