/**
 * Verify Foreign Keys After Fix
 * Run this after restarting the backend to verify all foreign keys are set up
 */

const mysql = require('./backend/node_modules/mysql2/promise');
const fs = require('fs');

const envPath = './backend/config/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function verify() {
  console.log('\n' + '='.repeat(70));
  console.log('  Foreign Keys Verification');
  console.log('='.repeat(70) + '\n');

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'polkadot_analytics'
  });

  // Get all foreign keys
  const [fks] = await conn.query(`
    SELECT 
      TABLE_NAME,
      COLUMN_NAME,
      REFERENCED_TABLE_NAME,
      REFERENCED_COLUMN_NAME,
      CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'polkadot_analytics'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME, COLUMN_NAME
  `);

  console.log(`${colors.cyan}Total Foreign Keys Found: ${fks.length}${colors.reset}\n`);

  if (fks.length > 0) {
    console.log('Current Foreign Keys:\n');
    fks.forEach(fk => {
      console.log(`  ${colors.green}✓${colors.reset} ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    console.log('');
  }

  // Expected foreign keys
  const expected = [
    { table: 'extrinsics', column: 'blockHash', refTable: 'blocks', refColumn: 'hash' },
    { table: 'events', column: 'blockHash', refTable: 'blocks', refColumn: 'hash' },
    { table: 'events', column: 'extrinsicIdx', refTable: 'extrinsics', refColumn: 'indexInBlock' },
    { table: 'transactions', column: 'block_hash', refTable: 'blocks', refColumn: 'hash' }
  ];

  console.log('='.repeat(70));
  console.log(`${colors.cyan}Expected Foreign Keys Check:${colors.reset}\n`);

  let allPresent = true;
  for (const exp of expected) {
    const found = fks.find(fk => 
      fk.TABLE_NAME === exp.table && 
      fk.COLUMN_NAME === exp.column &&
      fk.REFERENCED_TABLE_NAME === exp.refTable &&
      fk.REFERENCED_COLUMN_NAME === exp.refColumn
    );

    if (found) {
      console.log(`  ${colors.green}✓${colors.reset} ${exp.table}.${exp.column} → ${exp.refTable}.${exp.refColumn}`);
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${exp.table}.${exp.column} → ${exp.refTable}.${exp.refColumn} ${colors.red}MISSING!${colors.reset}`);
      allPresent = false;
    }
  }

  console.log('\n' + '='.repeat(70));
  
  if (allPresent && fks.length >= 4) {
    console.log(`${colors.green}✓ SUCCESS: All foreign keys are properly configured!${colors.reset}`);
  } else if (fks.length >= 3) {
    console.log(`${colors.yellow}⚠ PARTIAL: Most foreign keys are set up (${fks.length}/4)${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ ERROR: Missing critical foreign keys!${colors.reset}`);
  }
  
  console.log('='.repeat(70) + '\n');

  await conn.end();
}

verify().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error.message);
  process.exit(1);
});
