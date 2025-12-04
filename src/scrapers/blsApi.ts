import axios from 'axios';
import db from '../config/database';

// BLS Public Data API v2
// Documentation: https://www.bls.gov/developers/
const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// BLS Series IDs for major economic indicators
export const BLS_SERIES_MAP: Record<string, {
  seriesId: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
}> = {
  // Employment Situation (Monthly)
  'PAYEMS': {
    seriesId: 'CES0000000001',
    name: 'Nonfarm Payrolls',
    slug: 'nonfarm-payrolls',
    category: 'Employment',
    importance: 'high',
    unit: 'Thousands',
    description: 'Total nonfarm employment, seasonally adjusted',
  },
  'UNRATE': {
    seriesId: 'LNS14000000',
    name: 'Unemployment Rate',
    slug: 'unemployment-rate',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'Civilian unemployment rate, seasonally adjusted',
  },
  'LFPR': {
    seriesId: 'LNS11300000',
    name: 'Labor Force Participation Rate',
    slug: 'labor-force-participation',
    category: 'Employment',
    importance: 'medium',
    unit: '%',
    description: 'Civilian labor force participation rate',
  },
  'AHE': {
    seriesId: 'CES0500000003',
    name: 'Average Hourly Earnings',
    slug: 'average-hourly-earnings',
    category: 'Employment',
    importance: 'high',
    unit: '$',
    description: 'Average hourly earnings of all private employees',
  },
  'AWH': {
    seriesId: 'CES0500000002',
    name: 'Average Weekly Hours',
    slug: 'average-weekly-hours',
    category: 'Employment',
    importance: 'low',
    unit: 'Hours',
    description: 'Average weekly hours of all private employees',
  },

  // Consumer Price Index (Monthly)
  'CPI_ALL': {
    seriesId: 'CUSR0000SA0',
    name: 'CPI All Items',
    slug: 'cpi',
    category: 'Inflation',
    importance: 'high',
    unit: 'Index',
    description: 'Consumer Price Index for All Urban Consumers: All Items',
  },
  'CPI_CORE': {
    seriesId: 'CUSR0000SA0L1E',
    name: 'Core CPI',
    slug: 'core-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: 'Index',
    description: 'CPI for All Urban Consumers: All Items Less Food and Energy',
  },

  // Producer Price Index (Monthly)
  'PPI_FD': {
    seriesId: 'WPSFD4',
    name: 'PPI Final Demand',
    slug: 'ppi',
    category: 'Inflation',
    importance: 'medium',
    unit: 'Index',
    description: 'Producer Price Index: Final Demand',
  },

  // Import/Export Prices (Monthly)
  'IMPORT_PRICES': {
    seriesId: 'EIUIR',
    name: 'Import Price Index',
    slug: 'import-prices',
    category: 'Inflation',
    importance: 'low',
    unit: 'Index',
    description: 'Import Price Index: All Imports',
  },
  'EXPORT_PRICES': {
    seriesId: 'EIUIQ',
    name: 'Export Price Index',
    slug: 'export-prices',
    category: 'Inflation',
    importance: 'low',
    unit: 'Index',
    description: 'Export Price Index: All Exports',
  },

  // JOLTS (Monthly)
  'JOLTS_OPENINGS': {
    seriesId: 'JTS000000000000000JOL',
    name: 'JOLTS Job Openings',
    slug: 'jolts',
    category: 'Employment',
    importance: 'high',
    unit: 'Thousands',
    description: 'Job Openings: Total Nonfarm',
  },
  'JOLTS_HIRES': {
    seriesId: 'JTS000000000000000HIL',
    name: 'JOLTS Hires',
    slug: 'jolts-hires',
    category: 'Employment',
    importance: 'medium',
    unit: 'Thousands',
    description: 'Hires: Total Nonfarm',
  },
  'JOLTS_QUITS': {
    seriesId: 'JTS000000000000000QUL',
    name: 'JOLTS Quits',
    slug: 'jolts-quits',
    category: 'Employment',
    importance: 'medium',
    unit: 'Thousands',
    description: 'Quits: Total Nonfarm',
  },

  // Employment Cost Index (Quarterly)
  'ECI': {
    seriesId: 'CIU1010000000000A',
    name: 'Employment Cost Index',
    slug: 'employment-cost-index',
    category: 'Employment',
    importance: 'medium',
    unit: 'Index',
    description: 'Employment Cost Index: Total Compensation',
  },

  // Productivity (Quarterly)
  'PRODUCTIVITY': {
    seriesId: 'PRS85006092',
    name: 'Nonfarm Productivity',
    slug: 'nonfarm-productivity',
    category: 'Economy',
    importance: 'medium',
    unit: 'Index',
    description: 'Nonfarm Business Sector: Labor Productivity',
  },
  'UNIT_LABOR_COSTS': {
    seriesId: 'PRS85006112',
    name: 'Unit Labor Costs',
    slug: 'unit-labor-costs',
    category: 'Economy',
    importance: 'medium',
    unit: 'Index',
    description: 'Nonfarm Business Sector: Unit Labor Costs',
  },
};

interface BLSApiResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;
        periodName: string;
        value: string;
        footnotes: Array<{ code: string; text: string }>;
        latest?: string;
        calculations?: {
          net_changes?: { [key: string]: string };
          pct_changes?: { [key: string]: string };
        };
      }>;
    }>;
  };
}

// Fetch data from BLS API
export async function fetchBLSData(
  seriesIds: string[],
  startYear?: number,
  endYear?: number,
  calculations: boolean = true
): Promise<BLSApiResponse | null> {
  const apiKey = process.env.BLS_API_KEY;

  // Default to last 3 years if not specified
  const currentYear = new Date().getFullYear();
  const start = startYear || currentYear - 2;
  const end = endYear || currentYear;

  try {
    const payload: any = {
      seriesid: seriesIds,
      startyear: start.toString(),
      endyear: end.toString(),
      calculations,
      annualaverage: false,
    };

    // API key is optional but allows more requests (500/day vs 25/day)
    if (apiKey) {
      payload.registrationkey = apiKey;
    }

    const response = await axios.post<BLSApiResponse>(BLS_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.status !== 'REQUEST_SUCCEEDED') {
      console.error('BLS API error:', response.data.message);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching BLS data:', error);
    return null;
  }
}

// Get latest value for a specific series
export async function getBLSLatestValue(seriesKey: string): Promise<{
  value: number;
  date: string;
  periodName: string;
  change1m?: number;
  change12m?: number;
} | null> {
  const mapping = BLS_SERIES_MAP[seriesKey];
  if (!mapping) {
    console.error(`Unknown BLS series: ${seriesKey}`);
    return null;
  }

  const response = await fetchBLSData([mapping.seriesId]);
  if (!response || !response.Results.series[0]?.data[0]) {
    return null;
  }

  const latestData = response.Results.series[0].data[0];
  const value = parseFloat(latestData.value);

  return {
    value,
    date: `${latestData.year}-${latestData.period.replace('M', '')}`,
    periodName: latestData.periodName,
    change1m: latestData.calculations?.net_changes?.['1']
      ? parseFloat(latestData.calculations.net_changes['1'])
      : undefined,
    change12m: latestData.calculations?.net_changes?.['12']
      ? parseFloat(latestData.calculations.net_changes['12'])
      : undefined,
  };
}

// Calculate YoY change for CPI and other indices
export function calculateYoYChange(current: number, previous: number): number {
  return ((current - previous) / previous) * 100;
}

// Sync BLS data to database
export async function syncBLSDataToDb(): Promise<void> {
  console.log('Syncing BLS data to database...');
  console.log('='.repeat(60));

  // Get all BLS series IDs
  const seriesIds = Object.values(BLS_SERIES_MAP).map(m => m.seriesId);

  // BLS API allows up to 50 series per request
  const batchSize = 25;
  const batches = [];
  for (let i = 0; i < seriesIds.length; i += batchSize) {
    batches.push(seriesIds.slice(i, i + batchSize));
  }

  const updateRelease = db.prepare(`
    UPDATE releases
    SET actual = ?, previous = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = (
      SELECT r.id FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE e.slug = ?
      AND r.release_date <= date('now')
      ORDER BY r.release_date DESC
      LIMIT 1
    )
  `);

  const insertHistorical = db.prepare(`
    INSERT OR REPLACE INTO historical_data (event_id, date, value, period)
    SELECT e.id, ?, ?, ?
    FROM events e WHERE e.slug = ?
  `);

  for (const batch of batches) {
    const response = await fetchBLSData(batch);
    if (!response) continue;

    for (const series of response.Results.series) {
      // Find which indicator this series belongs to
      const mapping = Object.values(BLS_SERIES_MAP).find(m => m.seriesId === series.seriesID);
      if (!mapping) continue;

      const data = series.data;
      if (data.length === 0) continue;

      // Get latest and previous values
      const latest = data[0];
      const previous = data[1];

      const latestValue = parseFloat(latest.value);
      const previousValue = previous ? parseFloat(previous.value) : null;

      // Update the most recent release
      updateRelease.run(latestValue, previousValue, mapping.unit, mapping.slug);
      console.log(`  ${mapping.name}: ${latestValue} ${mapping.unit}`);

      // Store historical data
      for (const point of data) {
        const month = point.period.replace('M', '').padStart(2, '0');
        const date = `${point.year}-${month}-01`;
        insertHistorical.run(date, parseFloat(point.value), 'monthly', mapping.slug);
      }
    }

    // Rate limit between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('='.repeat(60));
  console.log('BLS data sync complete');
}

// Get BLS release schedule
// BLS publishes releases on a fixed schedule, typically 8:30 AM ET
export const BLS_RELEASE_SCHEDULE = {
  'employment-situation': { day: 'first-friday', time: '08:30' },
  'cpi': { day: 'mid-month', time: '08:30' },
  'ppi': { day: 'mid-month', time: '08:30' },
  'jolts': { day: 'last-week-tuesday', time: '10:00' },
  'import-prices': { day: 'mid-month', time: '08:30' },
  'employment-cost-index': { day: 'end-quarter', time: '08:30' },
  'nonfarm-productivity': { day: 'early-quarter', time: '08:30' },
};

// Ensure all BLS events exist in database
export async function ensureBLSEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'US', ?, 'BLS', ?, ?, ?)
  `);

  for (const mapping of Object.values(BLS_SERIES_MAP)) {
    const sourceUrl = `https://www.bls.gov/news.release/${mapping.slug.replace(/-/g, '')}.htm`;
    const frequency = mapping.slug.includes('productivity') || mapping.slug.includes('cost-index')
      ? 'Quarterly'
      : 'Monthly';

    insertEvent.run(
      mapping.name,
      mapping.slug,
      mapping.category,
      mapping.description,
      sourceUrl,
      mapping.importance,
      frequency
    );
  }

  console.log('BLS events ensured in database');
}
