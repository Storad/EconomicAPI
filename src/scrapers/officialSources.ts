/**
 * Official Government Data Sources
 *
 * This module aggregates all official government API scrapers for economic data.
 * These are the reliable, legal sources for a commercial API.
 *
 * Sources included:
 * - FRED (Federal Reserve Economic Data) - Primary source for most indicators
 * - BLS (Bureau of Labor Statistics) - Employment, inflation, wages
 * - BEA (Bureau of Economic Analysis) - GDP, PCE, trade
 * - Census Bureau - Retail, housing, manufacturing
 * - Treasury - Yields, auctions
 * - EIA (Energy Information Administration) - Oil, gas, energy
 *
 * All APIs are free with registration (API keys).
 */

import { syncAllFREDData, updateReleaseActuals, FRED_SERIES_MAP } from './fred';
import { syncBLSDataToDb, ensureBLSEvents, BLS_SERIES_MAP } from './blsApi';
import { syncBEADataToDb, ensureBEAEvents, BEA_INDICATORS } from './beaApi';
import { syncCensusDataToDb, ensureCensusEvents, CENSUS_INDICATORS } from './censusApi';
import { syncTreasuryAuctions, ensureTreasuryEvents, TREASURY_YIELDS, TREASURY_AUCTIONS } from './treasuryApi';
import { syncEIADataToDb, ensureEIAEvents, EIA_INDICATORS } from './eiaApi';

// API key requirements
export const API_KEYS_REQUIRED = {
  FRED_API_KEY: {
    description: 'Federal Reserve Economic Data',
    getKey: 'https://fred.stlouisfed.org/docs/api/api_key.html',
    required: true,
  },
  BLS_API_KEY: {
    description: 'Bureau of Labor Statistics (optional, increases rate limit)',
    getKey: 'https://data.bls.gov/registrationEngine/',
    required: false,
  },
  BEA_API_KEY: {
    description: 'Bureau of Economic Analysis',
    getKey: 'https://apps.bea.gov/api/signup/',
    required: true,
  },
  CENSUS_API_KEY: {
    description: 'Census Bureau (optional)',
    getKey: 'https://api.census.gov/data/key_signup.html',
    required: false,
  },
  EIA_API_KEY: {
    description: 'Energy Information Administration',
    getKey: 'https://www.eia.gov/opendata/register.php',
    required: true,
  },
};

// Check which API keys are configured
export function checkApiKeys(): { configured: string[]; missing: string[] } {
  const configured: string[] = [];
  const missing: string[] = [];

  for (const [key, info] of Object.entries(API_KEYS_REQUIRED)) {
    if (process.env[key]) {
      configured.push(key);
    } else if (info.required) {
      missing.push(key);
    }
  }

  return { configured, missing };
}

// Data source coverage summary
export function getDataSourceCoverage(): {
  source: string;
  indicators: number;
  categories: string[];
}[] {
  return [
    {
      source: 'FRED',
      indicators: Object.keys(FRED_SERIES_MAP).length,
      categories: ['Inflation', 'Employment', 'GDP', 'Housing', 'Manufacturing', 'Rates', 'Trade', 'Energy'],
    },
    {
      source: 'BLS',
      indicators: Object.keys(BLS_SERIES_MAP).length,
      categories: ['Employment', 'Inflation', 'Wages'],
    },
    {
      source: 'BEA',
      indicators: Object.keys(BEA_INDICATORS).length,
      categories: ['GDP', 'PCE', 'Trade', 'Income'],
    },
    {
      source: 'Census',
      indicators: Object.keys(CENSUS_INDICATORS).length,
      categories: ['Retail', 'Housing', 'Manufacturing'],
    },
    {
      source: 'Treasury',
      indicators: Object.keys(TREASURY_YIELDS).length + Object.keys(TREASURY_AUCTIONS).length,
      categories: ['Yields', 'Auctions'],
    },
    {
      source: 'EIA',
      indicators: Object.keys(EIA_INDICATORS).length,
      categories: ['Oil', 'Gas', 'Energy'],
    },
  ];
}

// Initialize all events in database
export async function initializeAllEvents(): Promise<void> {
  console.log('Initializing all economic indicator events...');
  console.log('='.repeat(60));

  await ensureBLSEvents();
  await ensureBEAEvents();
  await ensureCensusEvents();
  await ensureTreasuryEvents();
  await ensureEIAEvents();

  console.log('='.repeat(60));
  console.log('All events initialized');
}

// Sync all data from official sources
export async function syncAllOfficialData(): Promise<{
  success: boolean;
  sources: { name: string; status: 'success' | 'error' | 'skipped'; message?: string }[];
}> {
  console.log('\n' + '='.repeat(60));
  console.log('SYNCING DATA FROM OFFICIAL GOVERNMENT SOURCES');
  console.log('='.repeat(60) + '\n');

  const results: { name: string; status: 'success' | 'error' | 'skipped'; message?: string }[] = [];
  const { configured, missing } = checkApiKeys();

  if (missing.length > 0) {
    console.warn('Missing required API keys:', missing.join(', '));
    console.warn('Some data sources will be skipped.\n');
  }

  // 1. FRED (Primary source - covers most indicators)
  try {
    if (process.env.FRED_API_KEY) {
      console.log('\n[FRED] Syncing Federal Reserve Economic Data...');
      await syncAllFREDData(24); // Last 24 observations
      await updateReleaseActuals();
      results.push({ name: 'FRED', status: 'success' });
    } else {
      results.push({ name: 'FRED', status: 'skipped', message: 'FRED_API_KEY not set' });
    }
  } catch (error: any) {
    results.push({ name: 'FRED', status: 'error', message: error.message });
  }

  // 2. BLS (Employment, Inflation)
  try {
    console.log('\n[BLS] Syncing Bureau of Labor Statistics data...');
    await syncBLSDataToDb();
    results.push({ name: 'BLS', status: 'success' });
  } catch (error: any) {
    results.push({ name: 'BLS', status: 'error', message: error.message });
  }

  // 3. BEA (GDP, PCE, Trade)
  try {
    if (process.env.BEA_API_KEY) {
      console.log('\n[BEA] Syncing Bureau of Economic Analysis data...');
      await syncBEADataToDb();
      results.push({ name: 'BEA', status: 'success' });
    } else {
      results.push({ name: 'BEA', status: 'skipped', message: 'BEA_API_KEY not set' });
    }
  } catch (error: any) {
    results.push({ name: 'BEA', status: 'error', message: error.message });
  }

  // 4. Census (Retail, Housing)
  try {
    console.log('\n[Census] Syncing Census Bureau data...');
    await syncCensusDataToDb();
    results.push({ name: 'Census', status: 'success' });
  } catch (error: any) {
    results.push({ name: 'Census', status: 'error', message: error.message });
  }

  // 5. Treasury (Auctions, Yields)
  try {
    console.log('\n[Treasury] Syncing Treasury auction data...');
    await syncTreasuryAuctions();
    results.push({ name: 'Treasury', status: 'success' });
  } catch (error: any) {
    results.push({ name: 'Treasury', status: 'error', message: error.message });
  }

  // 6. EIA (Energy)
  try {
    if (process.env.EIA_API_KEY) {
      console.log('\n[EIA] Syncing Energy Information Administration data...');
      await syncEIADataToDb();
      results.push({ name: 'EIA', status: 'success' });
    } else {
      results.push({ name: 'EIA', status: 'skipped', message: 'EIA_API_KEY not set' });
    }
  } catch (error: any) {
    results.push({ name: 'EIA', status: 'error', message: error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  console.log(`Success: ${successCount} | Errors: ${errorCount} | Skipped: ${skippedCount}`);

  results.forEach(r => {
    const icon = r.status === 'success' ? '✓' : r.status === 'error' ? '✗' : '○';
    console.log(`  ${icon} ${r.name}: ${r.status}${r.message ? ` (${r.message})` : ''}`);
  });

  return {
    success: errorCount === 0,
    sources: results,
  };
}

// Quick sync - just update actuals from FRED (fastest)
export async function quickSync(): Promise<void> {
  console.log('Quick sync - updating actuals from FRED...');
  await updateReleaseActuals();
  console.log('Quick sync complete');
}

// Get total indicator count
export function getTotalIndicatorCount(): number {
  return (
    Object.keys(FRED_SERIES_MAP).length +
    Object.keys(BLS_SERIES_MAP).length +
    Object.keys(BEA_INDICATORS).length +
    Object.keys(CENSUS_INDICATORS).length +
    Object.keys(TREASURY_YIELDS).length +
    Object.keys(TREASURY_AUCTIONS).length +
    Object.keys(EIA_INDICATORS).length
  );
}

// Export all for easy access
export {
  syncAllFREDData,
  updateReleaseActuals,
  syncBLSDataToDb,
  syncBEADataToDb,
  syncCensusDataToDb,
  syncTreasuryAuctions,
  syncEIADataToDb,
};
