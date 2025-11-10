console.log('✅ Basic Node.js test is working!');
console.log('Node.js version:', process.version);

// Try to require the main application
try {
  console.log('Trying to require app.js...');
  require('./src/app');
  console.log('✅ app.js required successfully');
} catch (error) {
  console.error('❌ Error requiring app.js:');
  console.error(error);
  process.exit(1);
}
