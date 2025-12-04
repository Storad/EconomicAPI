import dotenv from 'dotenv';
dotenv.config();

import db from '../config/database';
import { FRED_SERIES_MAP, fetchFREDSeries } from '../scrapers/fred';

// Forecast and previous data for upcoming releases
// Sources: Investing.com, Trading Economics, Bloomberg consensus
const RELEASE_DATA: Record<string, { forecast?: number | null; previous?: number | null; unit?: string }> = {
  // Dec 1, 2025 releases
  'ism-manufacturing': { forecast: 47.5, previous: 46.5, unit: 'Index' },
  'ism-manufacturing-prices': { forecast: 55.0, previous: 54.8, unit: 'Index' },
  'construction-spending': { forecast: 0.3, previous: 0.1, unit: '% MoM' },
  'sp-manufacturing-pmi': { forecast: 48.8, previous: 48.5, unit: 'Index' },

  // Dec 2, 2025 releases
  'jolts': { forecast: 7450, previous: 7443, unit: 'K' },
  'tipp-economic-optimism': { forecast: 53.0, previous: 52.3, unit: 'Index' },
  'vehicle-sales': { forecast: 16.0, previous: 15.8, unit: 'M' },

  // Dec 3, 2025 releases
  'ism-services': { forecast: 55.5, previous: 56.0, unit: 'Index' },
  'adp-employment': { forecast: 150, previous: 233, unit: 'K' },
  'import-prices': { forecast: 0.1, previous: -0.4, unit: '% MoM' },
  'capacity-utilization': { forecast: 77.1, previous: 77.1, unit: '%' },
  'industrial-production': { forecast: -0.3, previous: -0.3, unit: '% MoM' },
  'sp-services-pmi': { forecast: 57.0, previous: 57.0, unit: 'Index' },

  // Dec 4, 2025 releases
  'factory-orders': { forecast: 0.2, previous: -0.5, unit: '% MoM' },
  'initial-claims': { forecast: 215, previous: 213, unit: 'K' },
  'continuing-claims': { forecast: 1910, previous: 1907, unit: 'K' },
  'trade-balance': { forecast: -75.0, previous: -84.4, unit: 'B' },
  'challenger-job-cuts': { forecast: null, previous: 55.6, unit: 'K' },

  // Dec 5, 2025 releases (NFP Friday)
  'nonfarm-payrolls': { forecast: 200, previous: 12, unit: 'K' },
  'unemployment-rate': { forecast: 4.1, previous: 4.1, unit: '%' },
  'average-hourly-earnings': { forecast: 0.3, previous: 0.4, unit: '% MoM' },
  'labor-force-participation': { forecast: 62.6, previous: 62.6, unit: '%' },
  'core-pce': { forecast: 0.3, previous: 0.3, unit: '% MoM' },
  'personal-income': { forecast: 0.3, previous: 0.3, unit: '% MoM' },
  'personal-spending': { forecast: 0.4, previous: 0.4, unit: '% MoM' },
  'umich-sentiment': { forecast: 71.8, previous: 71.8, unit: 'Index' },
  'umich-inflation-expectations': { forecast: 2.6, previous: 2.6, unit: '%' },
  'consumer-credit': { forecast: 10.0, previous: 6.0, unit: 'B' },

  // Weekly releases
  'eia-crude-inventories': { forecast: -1.5, previous: -1.8, unit: 'M bbl' },
  'eia-natgas-storage': { forecast: -25, previous: -2, unit: 'Bcf' },
  'api-crude-inventory': { forecast: -2.0, previous: -5.9, unit: 'M bbl' },
  'baker-hughes-oil-rigs': { forecast: null, previous: 479, unit: 'Count' },
};

async function populatePreviousFromFRED() {
  console.log('Fetching previous values from FRED API...');
  console.log('='.repeat(60));

  const releases = db.prepare(`
    SELECT r.id, r.event_id, e.slug, e.name
    FROM releases r
    JOIN events e ON r.event_id = e.id
    WHERE r.previous IS NULL
  `).all() as Array<{ id: number; event_id: number; slug: string; name: string }>;

  const updateRelease = db.prepare(`
    UPDATE releases SET previous = ?, unit = ? WHERE id = ?
  `);

  let updated = 0;

  for (const release of releases) {
    const mapping = FRED_SERIES_MAP[release.slug];
    if (!mapping) continue;

    try {
      const observations = await fetchFREDSeries(mapping.seriesId, 2);
      if (observations.length >= 2) {
        const previous = parseFloat(observations[1].value);
        if (!isNaN(previous)) {
          updateRelease.run(previous, mapping.unit, release.id);
          console.log(`  ${release.name}: previous = ${previous} ${mapping.unit}`);
          updated++;
        }
      }
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  Error fetching ${release.slug}:`, error);
    }
  }

  console.log(`\nUpdated ${updated} releases with previous values from FRED`);
}

async function populateForecastData() {
  console.log('\nPopulating forecast and previous data...');
  console.log('='.repeat(60));

  const updateRelease = db.prepare(`
    UPDATE releases
    SET forecast = COALESCE(?, forecast),
        previous = COALESCE(?, previous),
        unit = COALESCE(?, unit)
    WHERE id = ?
  `);

  const releases = db.prepare(`
    SELECT r.id, e.slug, e.name
    FROM releases r
    JOIN events e ON r.event_id = e.id
  `).all() as Array<{ id: number; slug: string; name: string }>;

  let updated = 0;

  for (const release of releases) {
    const data = RELEASE_DATA[release.slug];
    if (data) {
      updateRelease.run(
        data.forecast ?? null,
        data.previous ?? null,
        data.unit ?? null,
        release.id
      );
      console.log(`  ${release.name}: forecast=${data.forecast ?? 'N/A'}, previous=${data.previous ?? 'N/A'}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} releases with forecast/previous data`);
}

async function main() {
  console.log('Populating Forecast and Previous Data');
  console.log('='.repeat(60));

  // First try FRED for previous values
  await populatePreviousFromFRED();

  // Then overlay with hardcoded forecast data
  await populateForecastData();

  // Show summary
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN forecast IS NOT NULL THEN 1 ELSE 0 END) as with_forecast,
      SUM(CASE WHEN previous IS NOT NULL THEN 1 ELSE 0 END) as with_previous,
      SUM(CASE WHEN actual IS NOT NULL THEN 1 ELSE 0 END) as with_actual
    FROM releases
  `).get() as { total: number; with_forecast: number; with_previous: number; with_actual: number };

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  Total releases: ${summary.total}`);
  console.log(`  With forecast: ${summary.with_forecast}`);
  console.log(`  With previous: ${summary.with_previous}`);
  console.log(`  With actual: ${summary.with_actual}`);
  console.log('='.repeat(60));
  console.log('Done!');
}

main().catch(console.error);
