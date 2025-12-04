/**
 * International Data Sync Script
 *
 * Manually initialize and sync international economic data.
 * Run with: npx ts-node src/scripts/syncInternational.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from '../config/database';
import {
  initializeInternationalEvents,
  syncAllInternationalData,
  COUNTRY_COVERAGE,
  getInternationalIndicatorCount,
} from '../scrapers/international';

async function main() {
  console.log('=' .repeat(70));
  console.log('INTERNATIONAL ECONOMIC DATA SYNC');
  console.log('='.repeat(70));

  // Initialize database
  initializeDatabase();

  // Show coverage summary
  console.log('\nCountry Coverage:');
  console.log('-'.repeat(50));
  for (const [code, country] of Object.entries(COUNTRY_COVERAGE)) {
    if (code !== 'US') {
      console.log(`  ${country.flag} ${country.name.padEnd(20)} ${country.indicatorCount.toString().padStart(3)} indicators`);
      console.log(`     Sources: ${country.sources.join(', ')}`);
    }
  }
  console.log('-'.repeat(50));
  console.log(`Total: ${getInternationalIndicatorCount()} international indicators\n`);

  // Check for required API keys
  console.log('API Key Status:');
  console.log(`  FRED_API_KEY: ${process.env.FRED_API_KEY ? '✓ Set' : '✗ Missing (required for JP, CN, CA, AU, CH, NZ)'}`);
  console.log();

  // Initialize events
  console.log('Step 1: Initializing international events in database...');
  await initializeInternationalEvents();

  // Sync data
  console.log('\nStep 2: Syncing international data from APIs...');
  const result = await syncAllInternationalData();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(70));
  console.log(`Overall Status: ${result.success ? '✓ SUCCESS' : '✗ PARTIAL FAILURE'}`);
  console.log('\nRegion Results:');
  result.regions.forEach(r => {
    const icon = r.status === 'success' ? '✓' : r.status === 'error' ? '✗' : '○';
    console.log(`  ${icon} ${r.name}: ${r.status}${r.message ? ` (${r.message})` : ''}`);
  });
}

main().catch(console.error);
