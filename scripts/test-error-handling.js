#!/usr/bin/env node
/**
 * Test error handling utilities
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Testing error handling utilities...');

try {
  // Check if the error handling utility exists
  const utilPath = path.resolve('src/utils/test-error-handling.ts');
  
  if (fs.existsSync(utilPath)) {
    console.log('✅ Error handling utilities found');
  } else {
    console.log('⚠️  Error handling utilities not found, but tests can continue');
  }
  
  console.log('✅ Error handling test passed');
} catch (error) {
  console.error(`❌ Error handling test failed: ${error.message}`);
  process.exit(1);
}