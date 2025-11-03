#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up lead sources...');

try {
  // Run the seed script
  execSync('npx tsx prisma/seed-lead-sources.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('✅ Lead sources setup completed successfully!');
} catch (error) {
  console.error('❌ Error setting up lead sources:', error.message);
  console.log('\n📝 Note: Make sure your database is running and accessible.');
  console.log('You can run this script later when your database is ready:');
  console.log('npm run setup-lead-sources');
  process.exit(1);
}
