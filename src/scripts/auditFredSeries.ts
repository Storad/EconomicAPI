/**
 * FRED Series Audit Script
 *
 * Tests all FRED series IDs to identify broken/deprecated ones
 * and suggests replacements.
 */

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

// Collect all FRED series from our scrapers
const ALL_FRED_SERIES: { source: string; slug: string; seriesId: string; name: string }[] = [];

// Japan indicators
import { JAPAN_INDICATORS } from '../scrapers/japan';
for (const [key, ind] of Object.entries(JAPAN_INDICATORS)) {
  if (ind.source === 'FRED') {
    ALL_FRED_SERIES.push({ source: 'Japan', slug: ind.slug, seriesId: ind.seriesId, name: ind.name });
  }
}

// China indicators
import { CHINA_INDICATORS } from '../scrapers/china';
for (const [key, ind] of Object.entries(CHINA_INDICATORS)) {
  ALL_FRED_SERIES.push({ source: 'China', slug: ind.slug, seriesId: ind.seriesId, name: ind.name });
}

// Other countries
import { CANADA_INDICATORS, AUSTRALIA_INDICATORS, SWITZERLAND_INDICATORS, NZ_INDICATORS } from '../scrapers/otherCountries';
for (const [key, ind] of Object.entries(CANADA_INDICATORS)) {
  ALL_FRED_SERIES.push({ source: 'Canada', slug: ind.slug, seriesId: ind.seriesId, name: ind.name });
}
for (const [key, ind] of Object.entries(AUSTRALIA_INDICATORS)) {
  ALL_FRED_SERIES.push({ source: 'Australia', slug: ind.slug, seriesId: ind.seriesId, name: ind.name });
}
for (const [key, ind] of Object.entries(SWITZERLAND_INDICATORS)) {
  ALL_FRED_SERIES.push({ source: 'Switzerland', slug: ind.slug, seriesId: ind.seriesId, name: ind.name });
}
for (const [key, ind] of Object.entries(NZ_INDICATORS)) {
  ALL_FRED_SERIES.push({ source: 'New Zealand', slug: ind.slug, seriesId: ind.seriesId, name: ind.name });
}

// EU/UK FRED backup series (hardcoded in those files)
const EU_FRED_BACKUP = [
  { source: 'EU-Backup', slug: 'ecb-main-rate', seriesId: 'ECBMRRFR', name: 'ECB Main Rate' },
  { source: 'EU-Backup', slug: 'ecb-deposit-rate', seriesId: 'ECBDFR', name: 'ECB Deposit Rate' },
  { source: 'EU-Backup', slug: 'ea-hicp', seriesId: 'EA19CPALTT01GYM', name: 'EA HICP' },
  { source: 'EU-Backup', slug: 'ea-core-hicp', seriesId: 'EA19CPGRLE01GYM', name: 'EA Core HICP' },
  { source: 'EU-Backup', slug: 'ea-gdp', seriesId: 'CLVMNACSCAB1GQEA19', name: 'EA GDP' },
  { source: 'EU-Backup', slug: 'ea-gdp-growth', seriesId: 'NAEXKP01EZQ657S', name: 'EA GDP Growth' },
  { source: 'EU-Backup', slug: 'ea-unemployment', seriesId: 'LRHUTTTTEZM156S', name: 'EA Unemployment' },
  { source: 'EU-Backup', slug: 'eur-usd', seriesId: 'DEXUSEU', name: 'EUR/USD' },
  { source: 'EU-Backup', slug: 'ea-m3', seriesId: 'MABMM301EZM189S', name: 'EA M3' },
  { source: 'EU-Backup', slug: 'de-gdp', seriesId: 'CLVMNACSCAB1GQDE', name: 'Germany GDP' },
  { source: 'EU-Backup', slug: 'de-cpi', seriesId: 'DEUCPIALLMINMEI', name: 'Germany CPI' },
  { source: 'EU-Backup', slug: 'de-unemployment', seriesId: 'LMUNRRTTDEM156S', name: 'Germany Unemployment' },
  { source: 'EU-Backup', slug: 'de-ifo', seriesId: 'BSCICP02DEM460S', name: 'Germany IFO' },
];

const UK_FRED_BACKUP = [
  { source: 'UK-Backup', slug: 'uk-gdp', seriesId: 'CLVMNACSCAB1GQUK', name: 'UK GDP' },
  { source: 'UK-Backup', slug: 'uk-gdp-growth', seriesId: 'UKNGDP', name: 'UK GDP Growth' },
  { source: 'UK-Backup', slug: 'uk-cpi', seriesId: 'GBRCPIALLMINMEI', name: 'UK CPI' },
  { source: 'UK-Backup', slug: 'uk-core-cpi', seriesId: 'GBRCPICORMINMEI', name: 'UK Core CPI' },
  { source: 'UK-Backup', slug: 'uk-unemployment', seriesId: 'LMUNRRTTGBM156S', name: 'UK Unemployment' },
  { source: 'UK-Backup', slug: 'boe-bank-rate', seriesId: 'INTDSRGBM193N', name: 'BoE Bank Rate' },
  { source: 'UK-Backup', slug: 'uk-gilt-10y', seriesId: 'IRLTLT01GBM156N', name: 'UK 10Y Gilt' },
  { source: 'UK-Backup', slug: 'gbp-usd', seriesId: 'DEXUSUK', name: 'GBP/USD' },
  { source: 'UK-Backup', slug: 'uk-retail-sales', seriesId: 'GBRSLRTTO01GPSAM', name: 'UK Retail Sales' },
  { source: 'UK-Backup', slug: 'uk-industrial-production', seriesId: 'GBRPROINDMISMEI', name: 'UK Industrial Prod' },
  { source: 'UK-Backup', slug: 'uk-house-prices', seriesId: 'QGBR628BIS', name: 'UK House Prices' },
  { source: 'UK-Backup', slug: 'uk-m4', seriesId: 'MABMM301GBM189S', name: 'UK M4' },
];

ALL_FRED_SERIES.push(...EU_FRED_BACKUP, ...UK_FRED_BACKUP);

async function testFredSeries(seriesId: string): Promise<{ valid: boolean; error?: string; lastDate?: string }> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY not set');

  try {
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit: 1,
      },
    });

    const obs = response.data.observations;
    if (obs && obs.length > 0 && obs[0].value !== '.') {
      return { valid: true, lastDate: obs[0].date };
    }
    return { valid: false, error: 'No valid data' };
  } catch (error: any) {
    return { valid: false, error: error.response?.status === 400 ? 'Series not found' : error.message };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('FRED SERIES AUDIT');
  console.log('='.repeat(70));
  console.log(`Testing ${ALL_FRED_SERIES.length} series...\n`);

  const results: {
    source: string;
    slug: string;
    seriesId: string;
    name: string;
    valid: boolean;
    error?: string;
    lastDate?: string;
  }[] = [];

  for (const series of ALL_FRED_SERIES) {
    const result = await testFredSeries(series.seriesId);
    results.push({ ...series, ...result });

    const status = result.valid ? '✓' : '✗';
    const info = result.valid ? `(last: ${result.lastDate})` : `(${result.error})`;
    console.log(`${status} ${series.source.padEnd(12)} ${series.seriesId.padEnd(22)} ${info}`);

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);

  console.log(`\nWorking: ${valid.length}/${results.length}`);
  console.log(`Broken: ${invalid.length}/${results.length}`);

  if (invalid.length > 0) {
    console.log('\n--- BROKEN SERIES (need replacement) ---\n');
    for (const r of invalid) {
      console.log(`${r.source}: ${r.name}`);
      console.log(`  Current: ${r.seriesId}`);
      console.log(`  Slug: ${r.slug}`);
      console.log(`  Error: ${r.error}`);
      console.log('');
    }
  }

  // Group by source
  console.log('\n--- BY SOURCE ---\n');
  const bySource: Record<string, { valid: number; invalid: number }> = {};
  for (const r of results) {
    if (!bySource[r.source]) bySource[r.source] = { valid: 0, invalid: 0 };
    if (r.valid) bySource[r.source].valid++;
    else bySource[r.source].invalid++;
  }
  for (const [source, counts] of Object.entries(bySource)) {
    console.log(`${source}: ${counts.valid} working, ${counts.invalid} broken`);
  }
}

main().catch(console.error);
