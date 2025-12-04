import axios from 'axios';
import db from '../config/database';

/**
 * Eurozone Economic Data Sources
 *
 * Official Sources:
 * 1. ECB Statistical Data Warehouse (SDW) - https://sdw.ecb.europa.eu/
 * 2. Eurostat - https://ec.europa.eu/eurostat/
 * 3. FRED (backup) - https://fred.stlouisfed.org/
 *
 * Note: ECB/Eurostat APIs can be blocked by DNS, so FRED is used as backup.
 */

// ECB Statistical Data Warehouse API
const ECB_API_URL = 'https://sdw-wsrest.ecb.europa.eu/service/data';

// Eurostat API
const EUROSTAT_API_URL = 'https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data';

// FRED series IDs for Eurozone data (backup source)
const EU_FRED_SERIES: Record<string, string> = {
  'ecb-main-rate': 'ECBMRRFR',
  'ecb-deposit-rate': 'ECBDFR',
  'ea-hicp': 'EA19CPALTT01GYM',
  'ea-core-hicp': 'EA19CPGRLE01GYM',
  'ea-gdp': 'CLVMNACSCAB1GQEA19',
  'ea-gdp-growth': 'NAEXKP01EZQ657S',
  'ea-unemployment': 'LRHUTTTTEZM156S',
  'eur-usd': 'DEXUSEU',
  'ea-m3': 'MABMM301EZM189S',
  'de-gdp': 'CLVMNACSCAB1GQDE',
  'de-cpi': 'DEUCPIALLMINMEI',
  'de-unemployment': 'LMUNRRTTDEM156S',
  'de-ifo': 'BSCICP02DEM460S',
};

// ECB Series IDs for key Eurozone indicators
export const ECB_INDICATORS: Record<string, {
  flowRef: string;
  key: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  // Interest Rates
  'ECB_MAIN_RATE': {
    flowRef: 'FM',
    key: 'D.U2.EUR.4F.KR.MRR_FR.LEV',
    name: 'ECB Main Refinancing Rate',
    slug: 'ecb-main-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'ECB main refinancing operations rate',
    frequency: 'Daily',
  },
  'ECB_DEPOSIT_RATE': {
    flowRef: 'FM',
    key: 'D.U2.EUR.4F.KR.DFR.LEV',
    name: 'ECB Deposit Facility Rate',
    slug: 'ecb-deposit-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'ECB deposit facility rate',
    frequency: 'Daily',
  },
  'EURIBOR_3M': {
    flowRef: 'FM',
    key: 'D.U2.EUR.RT.MM.EURIBOR3MD_.HSTA',
    name: 'Euribor 3-Month',
    slug: 'euribor-3m',
    category: 'Interest Rates',
    importance: 'medium',
    unit: '%',
    description: '3-month Euro Interbank Offered Rate',
    frequency: 'Daily',
  },

  // Inflation
  'EA_HICP': {
    flowRef: 'ICP',
    key: 'M.U2.N.000000.4.ANR',
    name: 'Eurozone HICP Inflation',
    slug: 'ea-hicp',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Harmonised Index of Consumer Prices (YoY)',
    frequency: 'Monthly',
  },
  'EA_CORE_HICP': {
    flowRef: 'ICP',
    key: 'M.U2.N.XEF000.4.ANR',
    name: 'Eurozone Core HICP',
    slug: 'ea-core-hicp',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Core HICP excluding energy, food, alcohol & tobacco',
    frequency: 'Monthly',
  },

  // Money Supply
  'EA_M3': {
    flowRef: 'BSI',
    key: 'M.U2.Y.V.M30.X.I.U2.2300.Z01.A',
    name: 'Eurozone M3 Money Supply',
    slug: 'ea-m3',
    category: 'Money Supply',
    importance: 'medium',
    unit: '%',
    description: 'M3 money supply annual growth rate',
    frequency: 'Monthly',
  },

  // Exchange Rates
  'EUR_USD': {
    flowRef: 'EXR',
    key: 'D.USD.EUR.SP00.A',
    name: 'EUR/USD Exchange Rate',
    slug: 'eur-usd',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'USD',
    description: 'Euro to US Dollar exchange rate',
    frequency: 'Daily',
  },
  'EUR_GBP': {
    flowRef: 'EXR',
    key: 'D.GBP.EUR.SP00.A',
    name: 'EUR/GBP Exchange Rate',
    slug: 'eur-gbp',
    category: 'Exchange Rates',
    importance: 'medium',
    unit: 'GBP',
    description: 'Euro to British Pound exchange rate',
    frequency: 'Daily',
  },
  'EUR_JPY': {
    flowRef: 'EXR',
    key: 'D.JPY.EUR.SP00.A',
    name: 'EUR/JPY Exchange Rate',
    slug: 'eur-jpy',
    category: 'Exchange Rates',
    importance: 'medium',
    unit: 'JPY',
    description: 'Euro to Japanese Yen exchange rate',
    frequency: 'Daily',
  },
};

// Eurostat indicators
export const EUROSTAT_INDICATORS: Record<string, {
  dataset: string;
  filters: Record<string, string>;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  // GDP
  'EA_GDP': {
    dataset: 'namq_10_gdp',
    filters: { geo: 'EA20', unit: 'CLV_PCH_PRE', s_adj: 'SCA', na_item: 'B1GQ' },
    name: 'Eurozone GDP Growth',
    slug: 'ea-gdp',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'Eurozone quarterly GDP growth rate',
    frequency: 'Quarterly',
  },

  // Unemployment
  'EA_UNEMPLOYMENT': {
    dataset: 'une_rt_m',
    filters: { geo: 'EA20', s_adj: 'SA', age: 'TOTAL', sex: 'T', unit: 'PC_ACT' },
    name: 'Eurozone Unemployment Rate',
    slug: 'ea-unemployment',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'Eurozone harmonised unemployment rate',
    frequency: 'Monthly',
  },

  // Industrial Production
  'EA_INDUSTRIAL_PROD': {
    dataset: 'sts_inpr_m',
    filters: { geo: 'EA20', s_adj: 'SCA', unit: 'PCH_PRE', nace_r2: 'B-D' },
    name: 'Eurozone Industrial Production',
    slug: 'ea-industrial-production',
    category: 'Manufacturing',
    importance: 'medium',
    unit: '%',
    description: 'Industrial production index MoM change',
    frequency: 'Monthly',
  },

  // Retail Sales
  'EA_RETAIL_SALES': {
    dataset: 'sts_trtu_m',
    filters: { geo: 'EA20', s_adj: 'SCA', unit: 'PCH_PRE', nace_r2: 'G47' },
    name: 'Eurozone Retail Sales',
    slug: 'ea-retail-sales',
    category: 'Consumer',
    importance: 'medium',
    unit: '%',
    description: 'Retail trade volume MoM change',
    frequency: 'Monthly',
  },

  // Trade Balance
  'EA_TRADE_BALANCE': {
    dataset: 'ext_lt_maineu',
    filters: { geo: 'EA20', partner: 'EXT_EU27_2020', stk_flow: 'BAL', sitc06: 'TOTAL' },
    name: 'Eurozone Trade Balance',
    slug: 'ea-trade-balance',
    category: 'Trade',
    importance: 'medium',
    unit: 'Millions EUR',
    description: 'Eurozone external trade balance',
    frequency: 'Monthly',
  },

  // Consumer Confidence
  'EA_CONSUMER_CONFIDENCE': {
    dataset: 'ei_bsco_m',
    filters: { geo: 'EA20', s_adj: 'SA', indic: 'BS-CSMCI' },
    name: 'Eurozone Consumer Confidence',
    slug: 'ea-consumer-confidence',
    category: 'Sentiment',
    importance: 'medium',
    unit: 'Index',
    description: 'Consumer confidence indicator',
    frequency: 'Monthly',
  },

  // Business Confidence
  'EA_BUSINESS_CONFIDENCE': {
    dataset: 'ei_bsin_m_r2',
    filters: { geo: 'EA20', s_adj: 'SA', indic: 'BS-ICI' },
    name: 'Eurozone Business Confidence',
    slug: 'ea-business-confidence',
    category: 'Sentiment',
    importance: 'medium',
    unit: 'Index',
    description: 'Industrial confidence indicator',
    frequency: 'Monthly',
  },

  // PMI (from Eurostat composite)
  'EA_PMI_COMPOSITE': {
    dataset: 'ei_bssi_m_r2',
    filters: { geo: 'EA20', s_adj: 'SA', indic: 'BS-ESI-I' },
    name: 'Eurozone Economic Sentiment',
    slug: 'ea-economic-sentiment',
    category: 'Sentiment',
    importance: 'high',
    unit: 'Index',
    description: 'Economic Sentiment Indicator',
    frequency: 'Monthly',
  },
};

// German-specific indicators (largest Eurozone economy)
export const GERMANY_INDICATORS: Record<string, {
  dataset: string;
  filters: Record<string, string>;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  'DE_GDP': {
    dataset: 'namq_10_gdp',
    filters: { geo: 'DE', unit: 'CLV_PCH_PRE', s_adj: 'SCA', na_item: 'B1GQ' },
    name: 'Germany GDP Growth',
    slug: 'de-gdp',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'German quarterly GDP growth rate',
    frequency: 'Quarterly',
  },
  'DE_HICP': {
    dataset: 'prc_hicp_manr',
    filters: { geo: 'DE', coicop: 'CP00' },
    name: 'Germany HICP Inflation',
    slug: 'de-hicp',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'German harmonised inflation rate',
    frequency: 'Monthly',
  },
  'DE_UNEMPLOYMENT': {
    dataset: 'une_rt_m',
    filters: { geo: 'DE', s_adj: 'SA', age: 'TOTAL', sex: 'T', unit: 'PC_ACT' },
    name: 'Germany Unemployment Rate',
    slug: 'de-unemployment',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'German unemployment rate',
    frequency: 'Monthly',
  },
  'DE_IFO': {
    dataset: 'ei_bsci_m_r2',
    filters: { geo: 'DE', s_adj: 'SA', indic: 'BS-ICI' },
    name: 'Germany IFO Business Climate',
    slug: 'de-ifo',
    category: 'Sentiment',
    importance: 'high',
    unit: 'Index',
    description: 'IFO Business Climate Index',
    frequency: 'Monthly',
  },
  'DE_ZEW': {
    dataset: 'ei_bssi_m_r2',
    filters: { geo: 'DE', s_adj: 'SA', indic: 'BS-FS-LY' },
    name: 'Germany ZEW Economic Sentiment',
    slug: 'de-zew',
    category: 'Sentiment',
    importance: 'high',
    unit: 'Index',
    description: 'ZEW Financial Market Survey',
    frequency: 'Monthly',
  },
};

// Fetch data from ECB SDW
export async function fetchECBData(
  flowRef: string,
  key: string,
  startPeriod?: string
): Promise<any> {
  try {
    const start = startPeriod || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `${ECB_API_URL}/${flowRef}/${key}`;
    const response = await axios.get(url, {
      params: {
        startPeriod: start,
        format: 'jsondata',
      },
      headers: {
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching ECB data for ${flowRef}/${key}:`, error.message);
    return null;
  }
}

// Fetch data from Eurostat
export async function fetchEurostatData(
  dataset: string,
  filters: Record<string, string>
): Promise<any> {
  try {
    // Build filter string
    const filterStr = Object.entries(filters)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const url = `${EUROSTAT_API_URL}/${dataset}?${filterStr}&format=JSON&lang=en`;

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching Eurostat data for ${dataset}:`, error.message);
    return null;
  }
}

// Parse ECB JSON response to get latest value
export function parseECBResponse(data: any): { value: number; date: string } | null {
  try {
    if (!data?.dataSets?.[0]?.series) return null;

    const series = Object.values(data.dataSets[0].series)[0] as any;
    if (!series?.observations) return null;

    const observations = series.observations;
    const timeKeys = Object.keys(observations).sort((a, b) => parseInt(b) - parseInt(a));

    if (timeKeys.length === 0) return null;

    const latestKey = timeKeys[0];
    const value = observations[latestKey][0];

    // Get date from structure
    const timeDimension = data.structure?.dimensions?.observation?.find(
      (d: any) => d.id === 'TIME_PERIOD'
    );
    const date = timeDimension?.values?.[parseInt(latestKey)]?.id || 'unknown';

    return { value, date };
  } catch (error) {
    return null;
  }
}

// Fetch Eurozone data from FRED (backup source)
async function fetchEUDataFromFRED(seriesId: string): Promise<{
  value: number;
  date: string;
  previous?: number;
} | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit: 5,
      },
    });

    const observations = response.data.observations?.filter((o: any) => o.value !== '.');
    if (!observations || observations.length === 0) return null;

    return {
      value: parseFloat(observations[0].value),
      date: observations[0].date,
      previous: observations.length > 1 ? parseFloat(observations[1].value) : undefined,
    };
  } catch (error: any) {
    console.error(`Error fetching EU data from FRED (${seriesId}):`, error.message);
    return null;
  }
}

// Sync Eurozone data to database
export async function syncEurozoneDataToDb(): Promise<void> {
  console.log('Syncing Eurozone data to database...');
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

  // Build a map of all indicators
  const allIndicators: { slug: string; name: string; unit: string }[] = [
    ...Object.values(ECB_INDICATORS).map(i => ({ slug: i.slug, name: i.name, unit: i.unit })),
    ...Object.values(EUROSTAT_INDICATORS).map(i => ({ slug: i.slug, name: i.name, unit: i.unit })),
    ...Object.values(GERMANY_INDICATORS).map(i => ({ slug: i.slug, name: i.name, unit: i.unit })),
  ];

  // Use FRED as primary source (more reliable than ECB/Eurostat APIs)
  if (process.env.FRED_API_KEY) {
    console.log('Using FRED as primary data source for Eurozone...');

    for (const indicator of allIndicators) {
      const fredSeriesId = EU_FRED_SERIES[indicator.slug];
      if (fredSeriesId) {
        try {
          const result = await fetchEUDataFromFRED(fredSeriesId);
          if (result && !isNaN(result.value)) {
            console.log(`  ${indicator.name}: ${result.value} ${indicator.unit}`);
            updateRelease.run(result.value, result.previous || null, indicator.unit, indicator.slug);
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error syncing ${indicator.name}:`, error);
        }
      }
    }
  }

  // Try ECB API as fallback
  console.log('Trying ECB API for remaining indicators...');
  for (const [key, indicator] of Object.entries(ECB_INDICATORS)) {
    // Skip if already fetched from FRED
    if (EU_FRED_SERIES[indicator.slug] && process.env.FRED_API_KEY) continue;

    try {
      const data = await fetchECBData(indicator.flowRef, indicator.key);
      const parsed = parseECBResponse(data);

      if (parsed) {
        console.log(`  ${indicator.name}: ${parsed.value} ${indicator.unit}`);
        updateRelease.run(parsed.value, null, indicator.unit, indicator.slug);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error syncing ${indicator.name}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('Eurozone data sync complete');
}

// Ensure Eurozone events exist in database
export async function ensureEurozoneEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ECB indicators
  for (const indicator of Object.values(ECB_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      'EU',
      indicator.description,
      'ECB',
      'https://sdw.ecb.europa.eu/',
      indicator.importance,
      indicator.frequency
    );
  }

  // Eurostat indicators
  for (const indicator of Object.values(EUROSTAT_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      'EU',
      indicator.description,
      'Eurostat',
      'https://ec.europa.eu/eurostat/',
      indicator.importance,
      indicator.frequency
    );
  }

  // Germany indicators
  for (const indicator of Object.values(GERMANY_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      'DE',
      indicator.description,
      'Eurostat',
      'https://ec.europa.eu/eurostat/',
      indicator.importance,
      indicator.frequency
    );
  }

  console.log('Eurozone events ensured in database');
}
