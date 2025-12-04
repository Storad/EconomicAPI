import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from '../config/database';
import { syncBLSEvents } from '../scrapers/bls';
import { syncAllFREDData, updateReleaseActuals, FRED_SERIES_MAP } from '../scrapers/fred';
import { syncTreasuryAuctions } from '../scrapers/treasury';
import { syncKnownFOMCSchedule } from '../scrapers/fomc';
import { syncKnownCensusSchedule, ensureCensusEvents } from '../scrapers/census';

async function main() {
  const startTime = Date.now();
  console.log('Starting comprehensive data sync...');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Initialize database
  initializeDatabase();

  // 1. Sync BLS events and schedule
  console.log('\n[1/6] Syncing BLS events...');
  try {
    await syncBLSEvents();
  } catch (error) {
    console.error('BLS sync failed:', error);
  }

  // 2. Sync FOMC schedule
  console.log('\n[2/6] Syncing FOMC schedule...');
  try {
    await syncKnownFOMCSchedule();
  } catch (error) {
    console.error('FOMC sync failed:', error);
  }

  // 3. Sync Census events
  console.log('\n[3/6] Syncing Census events...');
  try {
    await ensureCensusEvents();
    await syncKnownCensusSchedule();
  } catch (error) {
    console.error('Census sync failed:', error);
  }

  // 4. Sync Treasury auctions
  console.log('\n[4/6] Syncing Treasury auctions...');
  try {
    await syncTreasuryAuctions();
  } catch (error) {
    console.error('Treasury sync failed:', error);
  }

  // 5. Update release actuals from FRED
  console.log('\n[5/6] Updating release actuals from FRED...');
  try {
    await updateReleaseActuals();
  } catch (error) {
    console.error('FRED actuals sync failed:', error);
  }

  // 6. Sync all FRED historical data
  console.log('\n[6/6] Syncing FRED historical data...');
  try {
    await syncAllFREDData(100); // Get 100 data points for each series
  } catch (error) {
    console.error('FRED historical sync failed:', error);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log(`Scraper run completed in ${elapsed}s`);
  console.log('='.repeat(60));
}

main().catch(console.error);
