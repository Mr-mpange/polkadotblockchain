/**
 * Check Foreign Keys in Database
 * Verifies all table relationships are correctly set up
 */

const path = require('path');
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));
const fs = require('fs');

// Load environment
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

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

async function checkForeignKeys() {
  console.log('\n' + '='.repeat(70));
  console.log('  Foreign Key Relationship Check');
  console.log('='.repeat(70) + '\n');

  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'polkadot_analytics'
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`${colors.cyan}Database: ${config.database}${colors.reset}`);
    console.log(`${colors.cyan}Tables found: ${tables.length}${colors.reset}\n`);

    // Check each table for foreign keys
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      
      // Get table structure
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      
      // Get foreign keys for this table
      const [foreignKeys] = await connection.query(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [config.database, tableName]);

      console.log(`${colors.blue}Table: ${tableName}${colors.reset}`);
      console.log(`  Columns: ${columns.length}`);
      
      if (foreignKeys.length > 0) {
        console.log(`  ${colors.green}Foreign Keys: ${foreignKeys.length}${colors.reset}`);
        foreignKeys.forEach(fk => {
          console.log(`    ${colors.green}✓${colors.reset} ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
      } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} No foreign keys`);
      }
      
      // Show important columns
      const importantCols = columns.filter(col => 
        col.Field.includes('id') || 
        col.Field.includes('hash') || 
        col.Field.includes('address') ||
        col.Field.includes('stash')
      );
      
      if (importantCols.length > 0) {
        console.log(`  Key columns:`);
        importantCols.forEach(col => {
          const keyInfo = col.Key === 'PRI' ? ' (PRIMARY)' : 
                         col.Key === 'MUL' ? ' (INDEX)' : 
                         col.Key === 'UNI' ? ' (UNIQUE)' : '';
          console.log(`    - ${col.Field}${keyInfo}`);
        });
      }
      
      console.log('');
    }

    // Summary
    console.log('='.repeat(70));
    console.log(`${colors.cyan}Summary${colors.reset}\n`);
    
    const [totalFKs] = await connection.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [config.database]);
    
    console.log(`Total Foreign Keys: ${totalFKs[0].count}`);
    
    // Expected relationships
    const expectedRelationships = [
      'extrinsics.blockHash → blocks.hash',
      'events.blockHash → blocks.hash',
      'events.extrinsicIdx → extrinsics.indexInBlock'
    ];
    
    console.log(`\n${colors.cyan}Expected Key Relationships:${colors.reset}`);
    
    for (const rel of expectedRelationships) {
      const [table, rest] = rel.split('.');
      const [column, target] = rest.split(' → ');
      
      const [exists] = await connection.query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [config.database, table, column]);
      
      if (exists[0].count > 0) {
        console.log(`  ${colors.green}✓${colors.reset} ${rel}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${rel} - MISSING!`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (totalFKs[0].count >= 3) {
      console.log(`${colors.green}✓ Database relationships are properly configured!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Some relationships may be missing${colors.reset}`);
    }
    
    console.log('='.repeat(70) + '\n');
    
    await connection.end();
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}\n`);
    process.exit(1);
  }
}

checkForeignKeys();
