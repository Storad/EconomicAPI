/**
 * International Economic Data - Unified Scraper
 *
 * This module aggregates all international economic data sources.
 * Countries covered: EU, UK, Japan, China, Canada, Australia, Switzerland, New Zealand
 *
 * Data Sources:
 * - ECB (European Central Bank)
 * - Eurostat
 * - ONS (UK Office for National Statistics)
 * - Bank of England
 * - FRED (Federal Reserve) - primary source for most international data
 */

import { ensureEurozoneEvents, syncEurozoneDataToDb, ECB_INDICATORS, EUROSTAT_INDICATORS, GERMANY_INDICATORS } from './eurozone';
import { ensureUKEvents, syncUKDataToDb, ONS_INDICATORS, BOE_INDICATORS } from './uk';
import { ensureJapanEvents, syncJapanDataToDb, JAPAN_INDICATORS } from './japan';
import { ensureChinaEvents, syncChinaDataToDb, CHINA_INDICATORS } from './china';
import { ensureOtherCountriesEvents, syncOtherCountriesDataToDb, CANADA_INDICATORS, AUSTRALIA_INDICATORS, SWITZERLAND_INDICATORS, NZ_INDICATORS } from './otherCountries';

// Country coverage summary
export const COUNTRY_COVERAGE = {
  US: {
    name: 'United States',
    flag: '🇺🇸',
    sources: ['FRED', 'BLS', 'BEA', 'Census', 'Treasury', 'EIA'],
    indicatorCount: 150, // Approximate
  },
  EU: {
    name: 'Eurozone',
    flag: '🇪🇺',
    sources: ['ECB', 'Eurostat'],
    indicatorCount: Object.keys(ECB_INDICATORS).length + Object.keys(EUROSTAT_INDICATORS).length,
  },
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    sources: ['Eurostat'],
    indicatorCount: Object.keys(GERMANY_INDICATORS).length,
  },
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    sources: ['ONS', 'Bank of England'],
    indicatorCount: Object.keys(ONS_INDICATORS).length + Object.keys(BOE_INDICATORS).length,
  },
  JP: {
    name: 'Japan',
    flag: '🇯🇵',
    sources: ['FRED', 'BOJ', 'e-Stat'],
    indicatorCount: Object.keys(JAPAN_INDICATORS).length,
  },
  CN: {
    name: 'China',
    flag: '🇨🇳',
    sources: ['FRED', 'NBS'],
    indicatorCount: Object.keys(CHINA_INDICATORS).length,
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    sources: ['FRED', 'Statistics Canada'],
    indicatorCount: Object.keys(CANADA_INDICATORS).length,
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    sources: ['FRED', 'ABS', 'RBA'],
    indicatorCount: Object.keys(AUSTRALIA_INDICATORS).length,
  },
  CH: {
    name: 'Switzerland',
    flag: '🇨🇭',
    sources: ['FRED', 'SNB'],
    indicatorCount: Object.keys(SWITZERLAND_INDICATORS).length,
  },
  NZ: {
    name: 'New Zealand',
    flag: '🇳🇿',
    sources: ['FRED', 'RBNZ'],
    indicatorCount: Object.keys(NZ_INDICATORS).length,
  },
};

// Get total international indicator count
export function getInternationalIndicatorCount(): number {
  return Object.values(COUNTRY_COVERAGE)
    .filter(c => c.name !== 'United States') // US is handled separately
    .reduce((sum, c) => sum + c.indicatorCount, 0);
}

// Initialize all international events
export async function initializeInternationalEvents(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('INITIALIZING INTERNATIONAL ECONOMIC EVENTS');
  console.log('='.repeat(60) + '\n');

  console.log('Countries covered:');
  for (const [code, country] of Object.entries(COUNTRY_COVERAGE)) {
    if (code !== 'US') {
      console.log(`  ${country.flag} ${country.name} (${code}): ${country.indicatorCount} indicators`);
    }
  }
  console.log(`\nTotal: ${getInternationalIndicatorCount()} international indicators\n`);

  await ensureEurozoneEvents();
  await ensureUKEvents();
  await ensureJapanEvents();
  await ensureChinaEvents();
  await ensureOtherCountriesEvents();

  console.log('\n' + '='.repeat(60));
  console.log('International events initialized');
  console.log('='.repeat(60));
}

// Sync all international data
export async function syncAllInternationalData(): Promise<{
  success: boolean;
  regions: { name: string; status: 'success' | 'error' | 'skipped'; message?: string }[];
}> {
  console.log('\n' + '='.repeat(60));
  console.log('SYNCING INTERNATIONAL ECONOMIC DATA');
  console.log('='.repeat(60) + '\n');

  const results: { name: string; status: 'success' | 'error' | 'skipped'; message?: string }[] = [];

  // 1. Eurozone (ECB + Eurostat)
  try {
    console.log('\n[EU] Syncing Eurozone data...');
    await syncEurozoneDataToDb();
    results.push({ name: 'Eurozone', status: 'success' });
  } catch (error: any) {
    results.push({ name: 'Eurozone', status: 'error', message: error.message });
  }

  // 2. UK (ONS + BoE)
  try {
    console.log('\n[UK] Syncing United Kingdom data...');
    await syncUKDataToDb();
    results.push({ name: 'United Kingdom', status: 'success' });
  } catch (error: any) {
    results.push({ name: 'United Kingdom', status: 'error', message: error.message });
  }

  // 3. Japan
  try {
    if (process.env.FRED_API_KEY) {
      console.log('\n[JP] Syncing Japan data...');
      await syncJapanDataToDb();
      results.push({ name: 'Japan', status: 'success' });
    } else {
      results.push({ name: 'Japan', status: 'skipped', message: 'FRED_API_KEY required' });
    }
  } catch (error: any) {
    results.push({ name: 'Japan', status: 'error', message: error.message });
  }

  // 4. China
  try {
    if (process.env.FRED_API_KEY) {
      console.log('\n[CN] Syncing China data...');
      await syncChinaDataToDb();
      results.push({ name: 'China', status: 'success' });
    } else {
      results.push({ name: 'China', status: 'skipped', message: 'FRED_API_KEY required' });
    }
  } catch (error: any) {
    results.push({ name: 'China', status: 'error', message: error.message });
  }

  // 5. Other countries (Canada, Australia, Switzerland, NZ)
  try {
    if (process.env.FRED_API_KEY) {
      console.log('\n[CA/AU/CH/NZ] Syncing other countries...');
      await syncOtherCountriesDataToDb();
      results.push({ name: 'Other Countries', status: 'success' });
    } else {
      results.push({ name: 'Other Countries', status: 'skipped', message: 'FRED_API_KEY required' });
    }
  } catch (error: any) {
    results.push({ name: 'Other Countries', status: 'error', message: error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('INTERNATIONAL SYNC COMPLETE');
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
    regions: results,
  };
}

// Export all country indicators for reference
export {
  ECB_INDICATORS,
  EUROSTAT_INDICATORS,
  GERMANY_INDICATORS,
  ONS_INDICATORS,
  BOE_INDICATORS,
  JAPAN_INDICATORS,
  CHINA_INDICATORS,
  CANADA_INDICATORS,
  AUSTRALIA_INDICATORS,
  SWITZERLAND_INDICATORS,
  NZ_INDICATORS,
};

// Export sync functions
export {
  syncEurozoneDataToDb,
  syncUKDataToDb,
  syncJapanDataToDb,
  syncChinaDataToDb,
  syncOtherCountriesDataToDb,
};
