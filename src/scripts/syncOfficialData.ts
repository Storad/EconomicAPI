/**
 * Sync Official Government Data
 *
 * This script fetches economic data from official government sources:
 * - FRED (Federal Reserve)
 * - BLS (Bureau of Labor Statistics)
 * - BEA (Bureau of Economic Analysis)
 * - Census Bureau
 * - Treasury
 * - EIA (Energy Information Administration)
 *
 * Usage:
 *   npx ts-node src/scripts/syncOfficialData.ts [--full|--quick|--init]
 *
 * Options:
 *   --full   Full sync from all sources (default)
 *   --quick  Quick sync - just update actuals from FRED
 *   --init   Initialize events only (no data sync)
 *   --check  Check API key configuration
 */

import dotenv from 'dotenv';
dotenv.config();

import {
  syncAllOfficialData,
  quickSync,
  initializeAllEvents,
  checkApiKeys,
  getDataSourceCoverage,
  getTotalIndicatorCount,
  API_KEYS_REQUIRED,
} from '../scrapers/officialSources';

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--full';

  console.log('\n' + '='.repeat(60));
  console.log('ECONOMIC DATA API - OFFICIAL SOURCE SYNC');
  console.log('='.repeat(60));

  // Check API keys
  const { configured, missing } = checkApiKeys();

  console.log('\nAPI Key Status:');
  for (const [key, info] of Object.entries(API_KEYS_REQUIRED)) {
    const status = process.env[key] ? '✓' : (info.required ? '✗ REQUIRED' : '○ optional');
    console.log(`  ${status} ${key} - ${info.description}`);
  }

  if (mode === '--check') {
    console.log('\nTo get API keys:');
    for (const [key, info] of Object.entries(API_KEYS_REQUIRED)) {
      if (!process.env[key]) {
        console.log(`  ${key}: ${info.getKey}`);
      }
    }
    return;
  }

  // Show coverage
  console.log('\nData Source Coverage:');
  const coverage = getDataSourceCoverage();
  for (const source of coverage) {
    console.log(`  ${source.source}: ${source.indicators} indicators (${source.categories.join(', ')})`);
  }
  console.log(`\nTotal: ${getTotalIndicatorCount()} indicators`);

  console.log('\n' + '-'.repeat(60));

  switch (mode) {
    case '--init':
      console.log('Initializing events only...');
      await initializeAllEvents();
      break;

    case '--quick':
      console.log('Running quick sync (FRED actuals only)...');
      await quickSync();
      break;

    case '--full':
    default:
      console.log('Running full sync from all official sources...');
      const result = await syncAllOfficialData();

      if (!result.success) {
        console.log('\nSome sources had errors. Check the logs above.');
        process.exit(1);
      }
      break;
  }

  console.log('\n' + '='.repeat(60));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('Sync failed:', error);
  process.exit(1);
});
