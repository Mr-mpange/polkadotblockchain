const mysql = require('./backend/node_modules/mysql2/promise');
const fs = require('fs');

const envPath = './backend/config/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

async function check() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'polkadot_analytics'
  });

  console.log('\n=== FOREIGN KEYS CHECK ===\n');

  const [fks] = await conn.query(`
    SELECT 
      TABLE_NAME,
      COLUMN_NAME,
      REFERENCED_TABLE_NAME,
      REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'polkadot_analytics'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  if (fks.length === 0) {
    console.log('❌ NO FOREIGN KEYS FOUND!\n');
    console.log('This means table relationships are NOT set up.\n');
  } else {
    console.log(`✓ Found ${fks.length} foreign keys:\n`);
    fks.forEach(fk => {
      console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    console.log('');
  }

  // Check specific important relationships
  console.log('=== CHECKING CRITICAL RELATIONSHIPS ===\n');
  
  const checks = [
    ['extrinsics', 'blockHash', 'Should reference blocks.hash'],
    ['events', 'blockHash', 'Should reference blocks.hash'],
    ['events', 'extrinsicIdx', 'Should reference extrinsics.indexInBlock'],
    ['transactions', 'block_hash', 'Should reference blocks.hash']
  ];

  for (const [table, column, desc] of checks) {
    const found = fks.find(fk => fk.TABLE_NAME === table && fk.COLUMN_NAME === column);
    if (found) {
      console.log(`✓ ${table}.${column} → ${found.REFERENCED_TABLE_NAME}.${found.REFERENCED_COLUMN_NAME}`);
    } else {
      console.log(`✗ ${table}.${column} - MISSING! (${desc})`);
    }
  }

  console.log('\n=== CONCLUSION ===\n');
  
  if (fks.length >= 3) {
    console.log('✓ Database relationships are working!\n');
  } else {
    console.log('⚠ WARNING: Missing foreign keys may cause data integrity issues!\n');
  }

  await conn.end();
}

check().catch(console.error);
