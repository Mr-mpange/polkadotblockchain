const { sequelize } = require('../src/config/database');
const { initializeModels, getInitializedModels } = require('../src/models');

async function testRelationships() {
  try {
    console.log('🔍 Testing database relationships...');
    
    // Initialize models
    await initializeModels(sequelize);
    const models = getInitializedModels();
    
    // Test Block and Transaction relationship
    console.log('\n🔗 Testing Block -> Transaction relationship...');
    const block = await models.Block.create({
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      number: 1,
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      extrinsicsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: Date.now(),
      specVersion: 1
    });
    
    const transaction = await models.Transaction.create({
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc123',
      blockHash: block.hash,
      blockNumber: 1,
      section: 'balances',
      method: 'transfer',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc123',
      indexInBlock: 0,
      success: true,
      timestamp: Date.now()
    });
    
    console.log('✅ Successfully created block and transaction');
    
    // Test the association
    const blockWithTransactions = await models.Block.findOne({
      where: { hash: block.hash },
      include: [{
        model: models.Transaction,
        as: 'transactions'
      }]
    });
    
    console.log('\n📦 Block with transactions:', {
      blockHash: blockWithTransactions.hash,
      transactionCount: blockWithTransactions.transactions?.length || 0
    });
    
    console.log('\n✅ All relationship tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing relationships:', error);
    process.exit(1);
  }
}

testRelationships();
