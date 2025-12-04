import axios from 'axios';
import db from '../config/database';
import { FREDSeriesObservation } from '../types';

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// FRED series IDs mapped to our event slugs
export const FRED_SERIES_MAP: Record<string, { seriesId: string; unit: string; frequency: string }> = {
  // Inflation
  'cpi': { seriesId: 'CPIAUCSL', unit: 'Index', frequency: 'monthly' },
  'cpi-yoy': { seriesId: 'CPALTT01USM657N', unit: '%', frequency: 'monthly' },
  'core-cpi': { seriesId: 'CPILFESL', unit: 'Index', frequency: 'monthly' },
  'core-cpi-yoy': { seriesId: 'CPILFESL', unit: '%', frequency: 'monthly' },
  'ppi': { seriesId: 'PPIACO', unit: 'Index', frequency: 'monthly' },
  'pce': { seriesId: 'PCE', unit: 'Billions $', frequency: 'monthly' },
  'pce-yoy': { seriesId: 'PCEPI', unit: '%', frequency: 'monthly' },
  'core-pce': { seriesId: 'PCEPILFE', unit: 'Index', frequency: 'monthly' },
  'core-pce-yoy': { seriesId: 'JCXFE', unit: '%', frequency: 'monthly' },

  // Employment
  'unemployment-rate': { seriesId: 'UNRATE', unit: '%', frequency: 'monthly' },
  'nonfarm-payrolls': { seriesId: 'PAYEMS', unit: 'Thousands', frequency: 'monthly' },
  'initial-claims': { seriesId: 'ICSA', unit: 'Thousands', frequency: 'weekly' },
  'continuing-claims': { seriesId: 'CCSA', unit: 'Thousands', frequency: 'weekly' },
  'jolts': { seriesId: 'JTSJOL', unit: 'Thousands', frequency: 'monthly' },
  'jolts-quits': { seriesId: 'JTSQUL', unit: 'Thousands', frequency: 'monthly' },
  'jolts-hires': { seriesId: 'JTSHIL', unit: 'Thousands', frequency: 'monthly' },
  'labor-force-participation': { seriesId: 'CIVPART', unit: '%', frequency: 'monthly' },
  'average-hourly-earnings': { seriesId: 'CES0500000003', unit: '$', frequency: 'monthly' },
  'average-weekly-hours': { seriesId: 'AWHAETP', unit: 'Hours', frequency: 'monthly' },
  'employment-cost-index': { seriesId: 'ECIALLCIV', unit: 'Index', frequency: 'quarterly' },
  'unit-labor-costs': { seriesId: 'ULCNFB', unit: 'Index', frequency: 'quarterly' },
  'nonfarm-productivity': { seriesId: 'OPHNFB', unit: 'Index', frequency: 'quarterly' },

  // GDP & Growth
  'gdp': { seriesId: 'GDP', unit: 'Billions $', frequency: 'quarterly' },
  'gdp-growth': { seriesId: 'A191RL1Q225SBEA', unit: '%', frequency: 'quarterly' },
  'real-gdp': { seriesId: 'GDPC1', unit: 'Billions $', frequency: 'quarterly' },
  'gdp-deflator': { seriesId: 'GDPDEF', unit: 'Index', frequency: 'quarterly' },

  // Consumer & Retail
  'retail-sales': { seriesId: 'RSAFS', unit: 'Millions $', frequency: 'monthly' },
  'retail-sales-ex-auto': { seriesId: 'RSFSXMV', unit: 'Millions $', frequency: 'monthly' },
  'umich-sentiment': { seriesId: 'UMCSENT', unit: 'Index', frequency: 'monthly' },
  'cb-consumer-confidence': { seriesId: 'CSCICP03USM665S', unit: 'Index', frequency: 'monthly' },
  'umich-inflation-expectations': { seriesId: 'MICH', unit: '%', frequency: 'monthly' },
  'umich-5y-inflation': { seriesId: 'EXPINF5YR', unit: '%', frequency: 'monthly' },
  'consumer-spending': { seriesId: 'PCE', unit: 'Billions $', frequency: 'monthly' },
  'personal-spending': { seriesId: 'PCE', unit: 'Billions $', frequency: 'monthly' },
  'personal-income': { seriesId: 'PI', unit: 'Billions $', frequency: 'monthly' },
  'personal-savings-rate': { seriesId: 'PSAVERT', unit: '%', frequency: 'monthly' },

  // Housing
  'housing-starts': { seriesId: 'HOUST', unit: 'Thousands', frequency: 'monthly' },
  'building-permits': { seriesId: 'PERMIT', unit: 'Thousands', frequency: 'monthly' },
  'existing-home-sales': { seriesId: 'EXHOSLUSM495S', unit: 'Millions', frequency: 'monthly' },
  'new-home-sales': { seriesId: 'HSN1F', unit: 'Thousands', frequency: 'monthly' },
  'pending-home-sales': { seriesId: 'PHSI', unit: 'Index', frequency: 'monthly' },
  'nahb-housing': { seriesId: 'USHMI', unit: 'Index', frequency: 'monthly' },
  'case-shiller-home-price': { seriesId: 'CSUSHPINSA', unit: 'Index', frequency: 'monthly' },
  'mortgage-rate-30y': { seriesId: 'MORTGAGE30US', unit: '%', frequency: 'weekly' },
  'mortgage-rate-15y': { seriesId: 'MORTGAGE15US', unit: '%', frequency: 'weekly' },
  'construction-spending': { seriesId: 'TTLCONS', unit: 'Millions $', frequency: 'monthly' },

  // Manufacturing & Industry
  'industrial-production': { seriesId: 'INDPRO', unit: 'Index', frequency: 'monthly' },
  'capacity-utilization': { seriesId: 'TCU', unit: '%', frequency: 'monthly' },
  'ism-manufacturing': { seriesId: 'NAPM', unit: 'Index', frequency: 'monthly' },
  'ism-services': { seriesId: 'NMFCI', unit: 'Index', frequency: 'monthly' },
  'durable-goods': { seriesId: 'DGORDER', unit: 'Millions $', frequency: 'monthly' },
  'factory-orders': { seriesId: 'AMTMNO', unit: 'Millions $', frequency: 'monthly' },
  'empire-state': { seriesId: 'GAFDISA066MSFRBNY', unit: 'Index', frequency: 'monthly' },
  'philly-fed': { seriesId: 'GACDFSA066MSFRBPHI', unit: 'Index', frequency: 'monthly' },
  'richmond-fed': { seriesId: 'GACDFSA066MSFRBRI', unit: 'Index', frequency: 'monthly' },
  'dallas-fed': { seriesId: 'DALLCPIM', unit: 'Index', frequency: 'monthly' },
  'kc-fed': { seriesId: 'GACDFSA066MSFRBKC', unit: 'Index', frequency: 'monthly' },
  'chicago-pmi': { seriesId: 'BPMNVE', unit: 'Index', frequency: 'monthly' },

  // Interest Rates & Bonds
  'fed-funds-rate': { seriesId: 'FEDFUNDS', unit: '%', frequency: 'monthly' },
  'fed-funds-target-upper': { seriesId: 'DFEDTARU', unit: '%', frequency: 'daily' },
  'fed-funds-target-lower': { seriesId: 'DFEDTARL', unit: '%', frequency: 'daily' },
  '3m-treasury': { seriesId: 'DGS3MO', unit: '%', frequency: 'daily' },
  '6m-treasury': { seriesId: 'DGS6MO', unit: '%', frequency: 'daily' },
  '1y-treasury': { seriesId: 'DGS1', unit: '%', frequency: 'daily' },
  '2y-treasury': { seriesId: 'DGS2', unit: '%', frequency: 'daily' },
  '5y-treasury': { seriesId: 'DGS5', unit: '%', frequency: 'daily' },
  '10y-treasury': { seriesId: 'DGS10', unit: '%', frequency: 'daily' },
  '30y-treasury': { seriesId: 'DGS30', unit: '%', frequency: 'daily' },
  '10y-2y-spread': { seriesId: 'T10Y2Y', unit: '%', frequency: 'daily' },
  '10y-3m-spread': { seriesId: 'T10Y3M', unit: '%', frequency: 'daily' },

  // Money Supply & Credit
  'm1-money-supply': { seriesId: 'M1SL', unit: 'Billions $', frequency: 'monthly' },
  'm2-money-supply': { seriesId: 'M2SL', unit: 'Billions $', frequency: 'monthly' },
  'bank-credit': { seriesId: 'TOTBKCR', unit: 'Billions $', frequency: 'weekly' },
  'consumer-credit': { seriesId: 'TOTALSL', unit: 'Billions $', frequency: 'monthly' },

  // Trade & International
  'trade-balance': { seriesId: 'BOPGSTB', unit: 'Millions $', frequency: 'monthly' },
  'exports': { seriesId: 'BOPGEXP', unit: 'Millions $', frequency: 'monthly' },
  'imports': { seriesId: 'BOPGIMP', unit: 'Millions $', frequency: 'monthly' },
  'dollar-index': { seriesId: 'DTWEXBGS', unit: 'Index', frequency: 'daily' },
  'current-account': { seriesId: 'NETFI', unit: 'Billions $', frequency: 'quarterly' },
  'wholesale-inventories': { seriesId: 'WHLSLRIRSA', unit: 'Ratio', frequency: 'monthly' },
  'business-inventories': { seriesId: 'ISRATIO', unit: 'Ratio', frequency: 'monthly' },

  // Commodities & Energy
  'oil-price-wti': { seriesId: 'DCOILWTICO', unit: '$/barrel', frequency: 'daily' },
  'oil-price-brent': { seriesId: 'DCOILBRENTEU', unit: '$/barrel', frequency: 'daily' },
  'natural-gas-price': { seriesId: 'DHHNGSP', unit: '$/mmbtu', frequency: 'daily' },
  'gold-price': { seriesId: 'GOLDAMGBD228NLBM', unit: '$/oz', frequency: 'daily' },

  // Market Indicators
  'sp500': { seriesId: 'SP500', unit: 'Index', frequency: 'daily' },
  'vix': { seriesId: 'VIXCLS', unit: 'Index', frequency: 'daily' },
  'ted-spread': { seriesId: 'TEDRATE', unit: '%', frequency: 'daily' },

  // Business Indicators
  'leading-index': { seriesId: 'USSLIND', unit: 'Index', frequency: 'monthly' },
  'chicago-fed-activity': { seriesId: 'CFNAI', unit: 'Index', frequency: 'monthly' },
  'gdpnow': { seriesId: 'GDPNOW', unit: '%', frequency: 'weekly' },
  'fed-balance-sheet': { seriesId: 'WALCL', unit: 'Millions $', frequency: 'weekly' },

  // EIA Energy (weekly)
  'eia-crude-inventories': { seriesId: 'WCESTUS1', unit: 'Thousands Barrels', frequency: 'weekly' },
  'eia-natgas-storage': { seriesId: 'NGTHRWAW', unit: 'Bcf', frequency: 'weekly' },
};

export async function fetchFREDSeries(
  seriesId: string,
  limit: number = 12
): Promise<FREDSeriesObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('FRED_API_KEY not set. Skipping FRED data fetch.');
    return [];
  }

  try {
    const response = await axios.get(`${FRED_BASE_URL}/series/observations`, {
      params: {
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit,
      },
    });

    return response.data.observations || [];
  } catch (error) {
    console.error(`Error fetching FRED series ${seriesId}:`, error);
    return [];
  }
}

export async function fetchLatestValue(slug: string): Promise<{ value: number; date: string } | null> {
  const mapping = FRED_SERIES_MAP[slug];
  if (!mapping) return null;

  const observations = await fetchFREDSeries(mapping.seriesId, 1);
  if (observations.length === 0) return null;

  const latest = observations[0];
  const value = parseFloat(latest.value);

  if (isNaN(value)) return null;

  return {
    value,
    date: latest.date,
  };
}

export async function syncFREDHistoricalData(slug: string, limit: number = 60): Promise<void> {
  const mapping = FRED_SERIES_MAP[slug];
  if (!mapping) {
    console.warn(`No FRED mapping for slug: ${slug}`);
    return;
  }

  const getEvent = db.prepare('SELECT id FROM events WHERE slug = ?');
  const event = getEvent.get(slug) as { id: number } | undefined;

  if (!event) {
    console.warn(`No event found for slug: ${slug}`);
    return;
  }

  const observations = await fetchFREDSeries(mapping.seriesId, limit);

  const insertData = db.prepare(`
    INSERT OR REPLACE INTO historical_data (event_id, date, value, period)
    VALUES (?, ?, ?, ?)
  `);

  for (const obs of observations) {
    const value = parseFloat(obs.value);
    if (!isNaN(value)) {
      insertData.run(event.id, obs.date, value, mapping.frequency);
    }
  }

  console.log(`Synced ${observations.length} historical data points for ${slug}`);
}

// Sync all FRED series that have corresponding events in the database
export async function syncAllFREDData(limit: number = 60): Promise<void> {
  const allEvents = db.prepare('SELECT slug FROM events').all() as Array<{ slug: string }>;

  for (const event of allEvents) {
    if (FRED_SERIES_MAP[event.slug]) {
      await syncFREDHistoricalData(event.slug, limit);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

export async function updateReleaseActuals(): Promise<void> {
  // Get all releases from today and past 30 days that don't have actuals
  const releases = db.prepare(`
    SELECT r.id, r.event_id, r.release_date, e.slug
    FROM releases r
    JOIN events e ON r.event_id = e.id
    WHERE r.release_date <= date('now')
    AND r.release_date >= date('now', '-30 days')
    AND r.actual IS NULL
  `).all() as Array<{ id: number; event_id: number; release_date: string; slug: string }>;

  const updateRelease = db.prepare(`
    UPDATE releases SET actual = ?, previous = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  for (const release of releases) {
    const mapping = FRED_SERIES_MAP[release.slug];
    if (!mapping) continue;

    const observations = await fetchFREDSeries(mapping.seriesId, 2);
    if (observations.length >= 1) {
      const actual = parseFloat(observations[0].value);
      const previous = observations.length >= 2 ? parseFloat(observations[1].value) : null;

      if (!isNaN(actual)) {
        updateRelease.run(actual, previous, release.id);
        console.log(`Updated actual for release ${release.id}: ${actual}`);
      }
    }
  }
}
