import axios from 'axios';
import db from '../config/database';

/**
 * UK Economic Data Sources
 *
 * Official Sources:
 * 1. ONS (Office for National Statistics) - https://www.ons.gov.uk/
 * 2. Bank of England - https://www.bankofengland.co.uk/
 * 3. FRED (backup) - https://fred.stlouisfed.org/
 *
 * Note: UK official APIs can be unreliable, so FRED is used as backup.
 */

// ONS API
const ONS_API_URL = 'https://api.ons.gov.uk/v1';

// Bank of England Statistical Interactive Database
const BOE_API_URL = 'https://www.bankofengland.co.uk/boeapps/iadb/fromshowcolumns.asp';

// FRED series IDs for UK data (backup source)
const UK_FRED_SERIES: Record<string, string> = {
  'uk-gdp': 'CLVMNACSCAB1GQUK',
  'uk-gdp-growth': 'UKNGDP',
  'uk-cpi': 'GBRCPIALLMINMEI',
  'uk-core-cpi': 'GBRCPICORMINMEI',
  'uk-unemployment': 'LMUNRRTTGBM156S',
  'boe-bank-rate': 'INTDSRGBM193N',
  'uk-gilt-10y': 'IRLTLT01GBM156N',
  'gbp-usd': 'DEXUSUK',
  'uk-retail-sales': 'GBRSLRTTO01GPSAM',
  'uk-industrial-production': 'GBRPROINDMISMEI',
  'uk-house-prices': 'QGBR628BIS',
  'uk-m4': 'MABMM301GBM189S',
};

// ONS Dataset IDs for key UK indicators
export const ONS_INDICATORS: Record<string, {
  datasetId: string;
  seriesId?: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  // GDP
  'UK_GDP': {
    datasetId: 'PGDP',
    seriesId: 'ABMI',
    name: 'UK GDP Growth',
    slug: 'uk-gdp',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'UK quarterly GDP growth rate',
    frequency: 'Quarterly',
  },
  'UK_GDP_MOM': {
    datasetId: 'GDP',
    seriesId: 'ECYY',
    name: 'UK Monthly GDP',
    slug: 'uk-gdp-monthly',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'UK monthly GDP estimate',
    frequency: 'Monthly',
  },

  // Inflation
  'UK_CPI': {
    datasetId: 'MM23',
    seriesId: 'D7G7',
    name: 'UK CPI Inflation',
    slug: 'uk-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Consumer Price Index annual rate',
    frequency: 'Monthly',
  },
  'UK_CORE_CPI': {
    datasetId: 'MM23',
    seriesId: 'DKO8',
    name: 'UK Core CPI',
    slug: 'uk-core-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'CPI excluding energy, food, alcohol & tobacco',
    frequency: 'Monthly',
  },
  'UK_RPI': {
    datasetId: 'MM23',
    seriesId: 'CZBH',
    name: 'UK RPI Inflation',
    slug: 'uk-rpi',
    category: 'Inflation',
    importance: 'medium',
    unit: '%',
    description: 'Retail Prices Index annual rate',
    frequency: 'Monthly',
  },
  'UK_PPI': {
    datasetId: 'MM22',
    seriesId: 'JVZ7',
    name: 'UK PPI Output',
    slug: 'uk-ppi',
    category: 'Inflation',
    importance: 'medium',
    unit: '%',
    description: 'Producer Price Index output annual rate',
    frequency: 'Monthly',
  },

  // Employment
  'UK_UNEMPLOYMENT': {
    datasetId: 'LMS',
    seriesId: 'MGSX',
    name: 'UK Unemployment Rate',
    slug: 'uk-unemployment',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'UK unemployment rate (ILO)',
    frequency: 'Monthly',
  },
  'UK_EMPLOYMENT_CHANGE': {
    datasetId: 'LMS',
    seriesId: 'MGRZ',
    name: 'UK Employment Change',
    slug: 'uk-employment-change',
    category: 'Employment',
    importance: 'high',
    unit: 'Thousands',
    description: 'Change in employment level',
    frequency: 'Monthly',
  },
  'UK_CLAIMANT_COUNT': {
    datasetId: 'LMS',
    seriesId: 'BCJD',
    name: 'UK Claimant Count',
    slug: 'uk-claimant-count',
    category: 'Employment',
    importance: 'medium',
    unit: 'Thousands',
    description: 'Claimant count (unemployment benefits)',
    frequency: 'Monthly',
  },
  'UK_EARNINGS': {
    datasetId: 'LMS',
    seriesId: 'KAC3',
    name: 'UK Average Earnings',
    slug: 'uk-average-earnings',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'Average weekly earnings growth (3m YoY)',
    frequency: 'Monthly',
  },

  // Retail Sales
  'UK_RETAIL_SALES': {
    datasetId: 'DRSI',
    seriesId: 'J5EK',
    name: 'UK Retail Sales',
    slug: 'uk-retail-sales',
    category: 'Consumer',
    importance: 'high',
    unit: '%',
    description: 'Retail sales volume MoM change',
    frequency: 'Monthly',
  },
  'UK_RETAIL_SALES_YOY': {
    datasetId: 'DRSI',
    seriesId: 'J5EO',
    name: 'UK Retail Sales YoY',
    slug: 'uk-retail-sales-yoy',
    category: 'Consumer',
    importance: 'medium',
    unit: '%',
    description: 'Retail sales volume YoY change',
    frequency: 'Monthly',
  },

  // Trade
  'UK_TRADE_BALANCE': {
    datasetId: 'MRET',
    seriesId: 'IKBJ',
    name: 'UK Trade Balance',
    slug: 'uk-trade-balance',
    category: 'Trade',
    importance: 'medium',
    unit: 'Millions GBP',
    description: 'UK total trade balance',
    frequency: 'Monthly',
  },

  // Manufacturing
  'UK_MANUFACTURING_PMI': {
    datasetId: 'TOPSI',
    name: 'UK Manufacturing Output',
    slug: 'uk-manufacturing',
    category: 'Manufacturing',
    importance: 'medium',
    unit: '%',
    description: 'Manufacturing output index',
    frequency: 'Monthly',
  },
  'UK_INDUSTRIAL_PROD': {
    datasetId: 'IOP',
    seriesId: 'K222',
    name: 'UK Industrial Production',
    slug: 'uk-industrial-production',
    category: 'Manufacturing',
    importance: 'medium',
    unit: '%',
    description: 'Industrial production MoM change',
    frequency: 'Monthly',
  },
  'UK_CONSTRUCTION': {
    datasetId: 'COUP',
    seriesId: 'K62N',
    name: 'UK Construction Output',
    slug: 'uk-construction',
    category: 'Construction',
    importance: 'low',
    unit: '%',
    description: 'Construction output MoM change',
    frequency: 'Monthly',
  },

  // Housing
  'UK_HOUSE_PRICES': {
    datasetId: 'HPI',
    seriesId: 'K2N4',
    name: 'UK House Price Index',
    slug: 'uk-house-prices',
    category: 'Housing',
    importance: 'medium',
    unit: '%',
    description: 'House price index annual change',
    frequency: 'Monthly',
  },

  // Consumer Confidence
  'UK_CONSUMER_CONFIDENCE': {
    datasetId: 'UKEA',
    name: 'UK Consumer Confidence',
    slug: 'uk-consumer-confidence',
    category: 'Sentiment',
    importance: 'medium',
    unit: 'Index',
    description: 'GfK Consumer Confidence Index',
    frequency: 'Monthly',
  },
};

// Bank of England indicators
export const BOE_INDICATORS: Record<string, {
  seriesCode: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  'BOE_BANK_RATE': {
    seriesCode: 'IUDBEDR',
    name: 'Bank of England Bank Rate',
    slug: 'boe-bank-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'Bank of England official bank rate',
    frequency: 'Daily',
  },
  'UK_GILT_2Y': {
    seriesCode: 'IUQAAJNB',
    name: 'UK 2-Year Gilt',
    slug: 'uk-gilt-2y',
    category: 'Interest Rates',
    importance: 'medium',
    unit: '%',
    description: '2-year gilt yield',
    frequency: 'Daily',
  },
  'UK_GILT_10Y': {
    seriesCode: 'IUQAMNPY',
    name: 'UK 10-Year Gilt',
    slug: 'uk-gilt-10y',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: '10-year gilt yield',
    frequency: 'Daily',
  },
  'UK_GILT_30Y': {
    seriesCode: 'IUQAMQIY',
    name: 'UK 30-Year Gilt',
    slug: 'uk-gilt-30y',
    category: 'Interest Rates',
    importance: 'medium',
    unit: '%',
    description: '30-year gilt yield',
    frequency: 'Daily',
  },
  'GBP_USD': {
    seriesCode: 'XUDLUSS',
    name: 'GBP/USD Exchange Rate',
    slug: 'gbp-usd',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'USD',
    description: 'Sterling to US Dollar spot rate',
    frequency: 'Daily',
  },
  'GBP_EUR': {
    seriesCode: 'XUDLERS',
    name: 'GBP/EUR Exchange Rate',
    slug: 'gbp-eur',
    category: 'Exchange Rates',
    importance: 'medium',
    unit: 'EUR',
    description: 'Sterling to Euro spot rate',
    frequency: 'Daily',
  },
  'UK_M4': {
    seriesCode: 'LPMAUYN',
    name: 'UK M4 Money Supply',
    slug: 'uk-m4',
    category: 'Money Supply',
    importance: 'medium',
    unit: '%',
    description: 'M4 money supply annual growth',
    frequency: 'Monthly',
  },
  'UK_MORTGAGE_APPROVALS': {
    seriesCode: 'LPMVTXL',
    name: 'UK Mortgage Approvals',
    slug: 'uk-mortgage-approvals',
    category: 'Housing',
    importance: 'medium',
    unit: 'Thousands',
    description: 'Mortgage approvals for house purchase',
    frequency: 'Monthly',
  },
  'UK_CONSUMER_CREDIT': {
    seriesCode: 'LPMVZRL',
    name: 'UK Consumer Credit',
    slug: 'uk-consumer-credit',
    category: 'Consumer',
    importance: 'low',
    unit: 'Millions GBP',
    description: 'Net consumer credit',
    frequency: 'Monthly',
  },
};

// Fetch data from ONS API
export async function fetchONSData(datasetId: string, seriesId?: string): Promise<any> {
  try {
    let url = `${ONS_API_URL}/datasets/${datasetId}`;

    if (seriesId) {
      url = `${ONS_API_URL}/timeseries/${seriesId}/dataset/${datasetId}/data`;
    } else {
      url = `${ONS_API_URL}/datasets/${datasetId}/editions/time-series/versions`;
    }

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching ONS data for ${datasetId}/${seriesId}:`, error.message);
    return null;
  }
}

// Fetch data from Bank of England
export async function fetchBOEData(seriesCode: string): Promise<any> {
  try {
    // BoE uses a different format - get CSV and parse
    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, ' ');
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0].replace(/-/g, ' ');

    const url = `https://www.bankofengland.co.uk/boeapps/database/fromshowcolumns.asp`;

    const response = await axios.get(url, {
      params: {
        'Travel': 'NIx',
        'FromSeries': '1',
        'ToSeries': '1',
        'DAession': 'Earliest',
        'Freq': 'A',
        'SeriesCodes': seriesCode,
        'UsingCodes': 'Y',
        'CSVF': 'TN',
        'VFD': 'Y',
        'html.x': '66',
        'html.y': '26',
      },
      headers: {
        'Accept': 'text/csv',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching BoE data for ${seriesCode}:`, error.message);
    return null;
  }
}

// Alternative: Fetch BoE data via their JSON API
export async function fetchBOEDataJSON(seriesCode: string): Promise<{
  value: number;
  date: string;
} | null> {
  try {
    const url = `https://www.bankofengland.co.uk/boeapps/iadb/Repo.ashx`;

    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const response = await axios.get(url, {
      params: {
        SeriesCodes: seriesCode,
        CSVF: 'F',
        DateFrom: startDate.toISOString().split('T')[0].split('-').reverse().join('/'),
        DateTo: endDate.toISOString().split('T')[0].split('-').reverse().join('/'),
      },
    });

    // Parse the response (it's XML or CSV)
    const data = response.data;

    if (typeof data === 'string' && data.includes(',')) {
      const lines = data.trim().split('\n');
      if (lines.length >= 2) {
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.split(',');
        if (parts.length >= 2) {
          return {
            date: parts[0],
            value: parseFloat(parts[1]),
          };
        }
      }
    }

    return null;
  } catch (error: any) {
    console.error(`Error fetching BoE JSON data for ${seriesCode}:`, error.message);
    return null;
  }
}

// Fetch UK data from FRED (backup source)
async function fetchUKDataFromFRED(seriesId: string): Promise<{
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
    console.error(`Error fetching UK data from FRED (${seriesId}):`, error.message);
    return null;
  }
}

// Sync UK data to database
export async function syncUKDataToDb(): Promise<void> {
  console.log('Syncing UK data to database...');
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

  // Use FRED as primary source (more reliable)
  if (process.env.FRED_API_KEY) {
    console.log('Using FRED as primary data source for UK...');

    // Build a map of all indicators by slug
    const allIndicators: { slug: string; name: string; unit: string }[] = [
      ...Object.values(ONS_INDICATORS).map(i => ({ slug: i.slug, name: i.name, unit: i.unit })),
      ...Object.values(BOE_INDICATORS).map(i => ({ slug: i.slug, name: i.name, unit: i.unit })),
    ];

    for (const indicator of allIndicators) {
      const fredSeriesId = UK_FRED_SERIES[indicator.slug];
      if (fredSeriesId) {
        try {
          const result = await fetchUKDataFromFRED(fredSeriesId);
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
  } else {
    // Fall back to official UK APIs (less reliable)
    console.log('FRED_API_KEY not set - trying official UK APIs...');

    // Sync BoE data (interest rates, FX)
    for (const [key, indicator] of Object.entries(BOE_INDICATORS)) {
      try {
        const result = await fetchBOEDataJSON(indicator.seriesCode);

        if (result) {
          console.log(`  ${indicator.name}: ${result.value} ${indicator.unit}`);
          updateRelease.run(result.value, null, indicator.unit, indicator.slug);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error syncing ${indicator.name}:`, error);
      }
    }

    // Sync ONS data
    for (const [key, indicator] of Object.entries(ONS_INDICATORS)) {
      try {
        if (indicator.seriesId) {
          const data = await fetchONSData(indicator.datasetId, indicator.seriesId);

          if (data?.months || data?.quarters) {
            const periods = data.months || data.quarters;
            if (periods.length > 0) {
              const latest = periods[periods.length - 1];
              console.log(`  ${indicator.name}: ${latest.value} ${indicator.unit}`);
              updateRelease.run(
                parseFloat(latest.value),
                periods.length > 1 ? parseFloat(periods[periods.length - 2].value) : null,
                indicator.unit,
                indicator.slug
              );
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error syncing ${indicator.name}:`, error);
      }
    }
  }

  console.log('='.repeat(60));
  console.log('UK data sync complete');
}

// Ensure UK events exist in database
export async function ensureUKEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'GB', ?, ?, ?, ?, ?)
  `);

  // ONS indicators
  for (const indicator of Object.values(ONS_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.description,
      'ONS',
      'https://www.ons.gov.uk/',
      indicator.importance,
      indicator.frequency
    );
  }

  // BoE indicators
  for (const indicator of Object.values(BOE_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.description,
      'Bank of England',
      'https://www.bankofengland.co.uk/',
      indicator.importance,
      indicator.frequency
    );
  }

  console.log('UK events ensured in database');
}
