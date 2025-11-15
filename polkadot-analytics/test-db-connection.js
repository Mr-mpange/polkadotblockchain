/**
 * Simple Database Connection Test
 * Run from project root
 */

const path = require('path');
const fs = require('fs');

// Load environment from backend
const envPath = path.join(__dirname, 'backend', 'config', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const mysql = require('./backend/node_modules/mysql2/promise');
const { Sequelize } = require('./backend/node_modules/sequelize');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('  Database Connection Test');
  console.log('='.repeat(60) + '\n');
  
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'polkadot_analytics'
  };
  
  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`  Host:     ${config.host}`);
  console.log(`  Port:     ${config.port}`);
  console.log(`  User:     ${config.user}`);
  console.log(`  Database: ${config.database}\n`);
  
  // Test 1: Raw MySQL Connection
  console.log(`${colors.cyan}Test 1: MySQL Connection${colors.reset}`);
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    console.log(`${colors.green}✓${colors.reset} MySQL server is running`);
    
    const [version] = await connection.query('SELECT VERSION() as version');
    console.log(`${colors.green}✓${colors.reset} MySQL version: ${version[0].version}`);
    
    // Check if database exists
    const [databases] = await connection.query(`SHOW DATABASES LIKE '${config.database}'`);
    if (databases.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Database '${config.database}' exists`);
      
      await connection.query(`USE ${config.database}`);
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`${colors.green}✓${colors.reset} Found ${tables.length} tables`);
      
      if (tables.length > 0) {
        console.log('\n  Tables:');
        tables.forEach(table => {
          console.log(`    - ${Object.values(table)[0]}`);
        });
      }
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Database '${config.database}' does not exist yet`);
    }
    
    await connection.end();
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} MySQL connection failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.red}✗${colors.reset} Make sure MySQL/XAMPP is running!`);
    }
    return false;
  }
  
  // Test 2: Sequelize Connection
  console.log(`\n${colors.cyan}Test 2: Backend (Sequelize) Connection${colors.reset}`);
  try {
    const sequelize = new Sequelize(
      config.database,
      config.user,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: 'mysql',
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Sequelize connection successful`);
    
    await sequelize.close();
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Sequelize connection failed: ${error.message}`);
    return false;
  }
  
  // Test 3: Check AI Analytics Config
  console.log(`\n${colors.cyan}Test 3: AI Analytics Configuration${colors.reset}`);
  const aiEnvPath = path.join(__dirname, 'ai-analytics', '.env');
  if (fs.existsSync(aiEnvPath)) {
    const aiEnv = fs.readFileSync(aiEnvPath, 'utf8');
    if (aiEnv.includes('DATABASE_URI=mysql://')) {
      console.log(`${colors.green}✓${colors.reset} AI Analytics configured for MySQL`);
      const match = aiEnv.match(/DATABASE_URI=(.+)/);
      if (match) {
        console.log(`  URI: ${match[1]}`);
      }
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} AI Analytics may need configuration update`);
    }
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} AI Analytics .env not found`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.green}✓ All database connections are working!${colors.reset}`);
  console.log('='.repeat(60) + '\n');
  
  console.log('Next steps:');
  console.log('  1. cd backend && npm run dev');
  console.log('  2. cd frontend && npm run dev');
  console.log('  3. cd ai-analytics && python app.py\n');
  
  return true;
}

testConnection().catch(error => {
  console.error(`\n${colors.red}Error:${colors.reset} ${error.message}\n`);
  process.exit(1);
});
