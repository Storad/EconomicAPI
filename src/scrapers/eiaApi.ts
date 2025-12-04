import axios from 'axios';
import db from '../config/database';

// EIA (Energy Information Administration) API v2
// Documentation: https://www.eia.gov/opendata/documentation.php
const EIA_API_URL = 'https://api.eia.gov/v2';

// EIA series for major energy data
export const EIA_INDICATORS: Record<string, {
  route: string;
  frequency: string;
  facets?: Record<string, string[]>;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
}> = {
  // Crude Oil Inventories (Weekly)
  'CRUDE_STOCKS': {
    route: 'petroleum/sum/sndw',
    frequency: 'weekly',
    facets: { product: ['EPC0'] },
    name: 'EIA Crude Oil Inventories',
    slug: 'eia-crude-inventories',
    category: 'Energy',
    importance: 'high',
    unit: 'Thousands Barrels',
    description: 'U.S. ending stocks of crude oil',
  },

  // Gasoline Inventories (Weekly)
  'GASOLINE_STOCKS': {
    route: 'petroleum/sum/sndw',
    frequency: 'weekly',
    facets: { product: ['EPM0F'] },
    name: 'EIA Gasoline Inventories',
    slug: 'eia-gasoline-inventories',
    category: 'Energy',
    importance: 'medium',
    unit: 'Thousands Barrels',
    description: 'U.S. ending stocks of total gasoline',
  },

  // Distillate Inventories (Weekly)
  'DISTILLATE_STOCKS': {
    route: 'petroleum/sum/sndw',
    frequency: 'weekly',
    facets: { product: ['EPD0'] },
    name: 'EIA Distillate Inventories',
    slug: 'eia-distillate-inventories',
    category: 'Energy',
    importance: 'medium',
    unit: 'Thousands Barrels',
    description: 'U.S. ending stocks of distillate fuel oil',
  },

  // Natural Gas Storage (Weekly)
  'NATGAS_STORAGE': {
    route: 'natural-gas/stor/wkly',
    frequency: 'weekly',
    name: 'EIA Natural Gas Storage',
    slug: 'eia-natgas-storage',
    category: 'Energy',
    importance: 'high',
    unit: 'Bcf',
    description: 'Weekly natural gas storage report',
  },

  // Crude Oil Production (Weekly)
  'CRUDE_PRODUCTION': {
    route: 'petroleum/sum/sndw',
    frequency: 'weekly',
    facets: { product: ['EPC0'], process: ['FPF'] },
    name: 'Crude Oil Production',
    slug: 'crude-oil-production',
    category: 'Energy',
    importance: 'medium',
    unit: 'Thousands Barrels/Day',
    description: 'U.S. field production of crude oil',
  },

  // WTI Crude Price (Daily)
  'WTI_PRICE': {
    route: 'petroleum/pri/spt',
    frequency: 'daily',
    facets: { product: ['EPCWTI'] },
    name: 'WTI Crude Oil Price',
    slug: 'oil-price-wti',
    category: 'Energy',
    importance: 'high',
    unit: '$/barrel',
    description: 'Cushing, OK WTI spot price FOB',
  },

  // Brent Crude Price (Daily)
  'BRENT_PRICE': {
    route: 'petroleum/pri/spt',
    frequency: 'daily',
    facets: { product: ['EPCBRENT'] },
    name: 'Brent Crude Oil Price',
    slug: 'oil-price-brent',
    category: 'Energy',
    importance: 'high',
    unit: '$/barrel',
    description: 'Europe Brent spot price FOB',
  },

  // Natural Gas Spot Price (Daily)
  'NATGAS_PRICE': {
    route: 'natural-gas/pri/sum',
    frequency: 'daily',
    name: 'Natural Gas Price',
    slug: 'natural-gas-price',
    category: 'Energy',
    importance: 'medium',
    unit: '$/MMBtu',
    description: 'Henry Hub natural gas spot price',
  },

  // US Oil Imports (Weekly)
  'CRUDE_IMPORTS': {
    route: 'petroleum/move/wkly',
    frequency: 'weekly',
    facets: { product: ['EPC0'], process: ['IM0'] },
    name: 'Crude Oil Imports',
    slug: 'crude-imports',
    category: 'Energy',
    importance: 'low',
    unit: 'Thousands Barrels/Day',
    description: 'U.S. imports of crude oil',
  },

  // Refinery Utilization (Weekly)
  'REFINERY_UTILIZATION': {
    route: 'petroleum/pnp/wiup',
    frequency: 'weekly',
    name: 'Refinery Utilization',
    slug: 'refinery-utilization',
    category: 'Energy',
    importance: 'low',
    unit: '%',
    description: 'Percent utilization of refinery operable capacity',
  },
};

interface EIAApiResponse {
  response: {
    total: number;
    data: Array<{
      period: string;
      value: number;
      'series-description'?: string;
      product?: string;
      process?: string;
      duoarea?: string;
      units?: string;
    }>;
  };
  request?: {
    command: string;
    params: Record<string, any>;
  };
}

// Fetch data from EIA API v2
export async function fetchEIAData(
  route: string,
  frequency: string = 'weekly',
  facets?: Record<string, string[]>,
  limit: number = 52
): Promise<EIAApiResponse | null> {
  const apiKey = process.env.EIA_API_KEY;

  if (!apiKey) {
    console.warn('EIA_API_KEY not set. Get one at: https://www.eia.gov/opendata/register.php');
    return null;
  }

  try {
    const url = `${EIA_API_URL}/${route}/data/`;

    const params: any = {
      api_key: apiKey,
      frequency,
      'data[0]': 'value',
      sort: [{ column: 'period', direction: 'desc' }],
      length: limit,
    };

    // Add facets if specified
    if (facets) {
      Object.entries(facets).forEach(([key, values]) => {
        values.forEach((value, index) => {
          params[`facets[${key}][${index}]`] = value;
        });
      });
    }

    const response = await axios.get<EIAApiResponse>(url, { params });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching EIA data for ${route}:`, error.message);
    return null;
  }
}

// Get latest value for a specific indicator
export async function getEIALatestValue(indicatorKey: string): Promise<{
  value: number;
  period: string;
  previous?: number;
  change?: number;
} | null> {
  const indicator = EIA_INDICATORS[indicatorKey];
  if (!indicator) {
    console.error(`Unknown EIA indicator: ${indicatorKey}`);
    return null;
  }

  const response = await fetchEIAData(
    indicator.route,
    indicator.frequency,
    indicator.facets,
    5
  );

  if (!response?.response?.data || response.response.data.length === 0) {
    return null;
  }

  const data = response.response.data;
  const latest = data[0];
  const previous = data.length > 1 ? data[1] : undefined;

  return {
    value: latest.value,
    period: latest.period,
    previous: previous?.value,
    change: previous ? latest.value - previous.value : undefined,
  };
}

// Sync EIA data to database
export async function syncEIADataToDb(): Promise<void> {
  console.log('Syncing EIA data to database...');
  console.log('='.repeat(60));

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

  for (const [key, indicator] of Object.entries(EIA_INDICATORS)) {
    try {
      const response = await fetchEIAData(
        indicator.route,
        indicator.frequency,
        indicator.facets,
        52
      );

      if (!response?.response?.data || response.response.data.length === 0) {
        continue;
      }

      const data = response.response.data;
      const latest = data[0];
      const previous = data[1];

      // Update the most recent release
      updateRelease.run(
        latest.value,
        previous?.value || null,
        indicator.unit,
        indicator.slug
      );
      console.log(`  ${indicator.name}: ${latest.value} ${indicator.unit}`);

      // Store historical data
      for (const point of data) {
        insertHistorical.run(point.period, point.value, indicator.frequency, indicator.slug);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error syncing ${indicator.name}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('EIA data sync complete');
}

// Ensure all EIA events exist in database
export async function ensureEIAEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'US', ?, 'EIA', ?, ?, ?)
  `);

  const sourceUrls: Record<string, string> = {
    'eia-crude-inventories': 'https://www.eia.gov/petroleum/supply/weekly/',
    'eia-gasoline-inventories': 'https://www.eia.gov/petroleum/supply/weekly/',
    'eia-distillate-inventories': 'https://www.eia.gov/petroleum/supply/weekly/',
    'eia-natgas-storage': 'https://www.eia.gov/naturalgas/storage/dashboard/',
    'crude-oil-production': 'https://www.eia.gov/petroleum/supply/weekly/',
    'oil-price-wti': 'https://www.eia.gov/petroleum/data.php',
    'oil-price-brent': 'https://www.eia.gov/petroleum/data.php',
    'natural-gas-price': 'https://www.eia.gov/naturalgas/data.php',
    'crude-imports': 'https://www.eia.gov/petroleum/supply/weekly/',
    'refinery-utilization': 'https://www.eia.gov/petroleum/supply/weekly/',
  };

  for (const indicator of Object.values(EIA_INDICATORS)) {
    const sourceUrl = sourceUrls[indicator.slug] || 'https://www.eia.gov/petroleum/';
    const frequency = indicator.frequency === 'daily' ? 'Daily' : 'Weekly';

    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.description,
      sourceUrl,
      indicator.importance,
      frequency
    );
  }

  console.log('EIA events ensured in database');
}

// EIA release schedule (all Eastern Time)
export const EIA_RELEASE_SCHEDULE = {
  'eia-crude-inventories': { day: 'Wednesday', time: '10:30' },
  'eia-gasoline-inventories': { day: 'Wednesday', time: '10:30' },
  'eia-distillate-inventories': { day: 'Wednesday', time: '10:30' },
  'eia-natgas-storage': { day: 'Thursday', time: '10:30' },
};

// Calculate weekly inventory change
export function calculateInventoryChange(current: number, previous: number): {
  change: number;
  changePercent: number;
} {
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  return { change, changePercent };
}
