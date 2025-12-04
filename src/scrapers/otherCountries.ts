import axios from 'axios';
import db from '../config/database';

/**
 * Other Major Economies Data Sources
 *
 * Canada, Australia, Switzerland, and other G20 countries
 * Using FRED as primary source for reliability
 */

// Canada indicators
export const CANADA_INDICATORS: Record<string, {
  seriesId: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  // GDP
  'CA_GDP': {
    seriesId: 'NGDPRSAXDCCAQ',
    name: 'Canada GDP',
    slug: 'ca-gdp',
    category: 'Economy',
    importance: 'high',
    unit: 'Billions CAD',
    description: 'Canada Real GDP',
    frequency: 'Quarterly',
  },
  'CA_GDP_GROWTH': {
    seriesId: 'NAEXKP01CAQ657S',
    name: 'Canada GDP Growth',
    slug: 'ca-gdp-growth',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'Canada Real GDP growth rate',
    frequency: 'Quarterly',
  },

  // Inflation
  'CA_CPI': {
    seriesId: 'CPALCY01CAM661N',
    name: 'Canada CPI YoY',
    slug: 'ca-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Canada CPI annual inflation',
    frequency: 'Monthly',
  },
  'CA_CORE_CPI': {
    seriesId: 'CPALTT01CAM657N',
    name: 'Canada Core CPI',
    slug: 'ca-core-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Canada Core CPI (Bank of Canada measure)',
    frequency: 'Monthly',
  },

  // Interest Rates
  'BOC_RATE': {
    seriesId: 'INTDSRCAM193N',
    name: 'Bank of Canada Rate',
    slug: 'boc-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'Bank of Canada overnight target rate',
    frequency: 'Monthly',
  },
  'CA_BOND_10Y': {
    seriesId: 'IRLTLT01CAM156N',
    name: 'Canada 10-Year Bond',
    slug: 'ca-bond-10y',
    category: 'Interest Rates',
    importance: 'medium',
    unit: '%',
    description: 'Canada 10-year government bond yield',
    frequency: 'Monthly',
  },

  // Employment
  'CA_UNEMPLOYMENT': {
    seriesId: 'LRUNTTTTCAM156S',
    name: 'Canada Unemployment Rate',
    slug: 'ca-unemployment',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'Canada unemployment rate',
    frequency: 'Monthly',
  },
  'CA_EMPLOYMENT_CHANGE': {
    seriesId: 'LREM64TTCAM156S',
    name: 'Canada Employment Change',
    slug: 'ca-employment-change',
    category: 'Employment',
    importance: 'high',
    unit: 'Thousands',
    description: 'Canada employment level change',
    frequency: 'Monthly',
  },

  // Trade
  'CA_TRADE_BALANCE': {
    seriesId: 'XTNTVA01CAM667S',
    name: 'Canada Trade Balance',
    slug: 'ca-trade-balance',
    category: 'Trade',
    importance: 'medium',
    unit: 'Millions USD',
    description: 'Canada trade balance',
    frequency: 'Monthly',
  },

  // Retail Sales
  'CA_RETAIL_SALES': {
    seriesId: 'CANSLRTTO02MLSAM',
    name: 'Canada Retail Sales',
    slug: 'ca-retail-sales',
    category: 'Consumer',
    importance: 'medium',
    unit: 'Index',
    description: 'Canada retail sales value',
    frequency: 'Monthly',
  },

  // Housing
  'CA_HOUSE_PRICES': {
    seriesId: 'QCAR628BIS',
    name: 'Canada House Price Index',
    slug: 'ca-house-prices',
    category: 'Housing',
    importance: 'medium',
    unit: 'Index',
    description: 'Canada residential property prices',
    frequency: 'Quarterly',
  },

  // Exchange Rate
  'USD_CAD': {
    seriesId: 'DEXCAUS',
    name: 'USD/CAD Exchange Rate',
    slug: 'usd-cad',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'CAD',
    description: 'US Dollar to Canadian Dollar',
    frequency: 'Daily',
  },

};

// Australia indicators
export const AUSTRALIA_INDICATORS: Record<string, {
  seriesId: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  // GDP
  'AU_GDP': {
    seriesId: 'NAEXKP01AUQ657S',
    name: 'Australia GDP Growth',
    slug: 'au-gdp',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'Australia Real GDP growth rate',
    frequency: 'Quarterly',
  },

  // Inflation
  'AU_CPI': {
    seriesId: 'AUSCPIALLQINMEI',
    name: 'Australia CPI',
    slug: 'au-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: 'Index',
    description: 'Australia Consumer Price Index',
    frequency: 'Quarterly',
  },
  'AU_CPI_YOY': {
    seriesId: 'FPCPITOTLZGAUS',
    name: 'Australia CPI YoY',
    slug: 'au-cpi-yoy',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Australia CPI annual inflation',
    frequency: 'Quarterly',
  },

  // Interest Rates
  'RBA_RATE': {
    seriesId: 'INTDSRAUM193N',
    name: 'RBA Cash Rate',
    slug: 'rba-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'Reserve Bank of Australia discount rate',
    frequency: 'Monthly',
  },
  'AU_BOND_10Y': {
    seriesId: 'IRLTLT01AUM156N',
    name: 'Australia 10-Year Bond',
    slug: 'au-bond-10y',
    category: 'Interest Rates',
    importance: 'medium',
    unit: '%',
    description: 'Australia 10-year government bond yield',
    frequency: 'Monthly',
  },

  // Employment
  'AU_UNEMPLOYMENT': {
    seriesId: 'LRUNTTTTAUM156S',
    name: 'Australia Unemployment Rate',
    slug: 'au-unemployment',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'Australia unemployment rate',
    frequency: 'Monthly',
  },
  'AU_EMPLOYMENT_CHANGE': {
    seriesId: 'LREM64TTAUM156S',
    name: 'Australia Employment Change',
    slug: 'au-employment-change',
    category: 'Employment',
    importance: 'high',
    unit: 'Thousands',
    description: 'Australia employment change',
    frequency: 'Monthly',
  },
  'AU_PARTICIPATION_RATE': {
    seriesId: 'LRAC64TTAUM156S',
    name: 'Australia Participation Rate',
    slug: 'au-participation-rate',
    category: 'Employment',
    importance: 'medium',
    unit: '%',
    description: 'Australia labor force participation rate',
    frequency: 'Monthly',
  },

  // Trade
  'AU_TRADE_BALANCE': {
    seriesId: 'XTNTVA01AUM667S',
    name: 'Australia Trade Balance',
    slug: 'au-trade-balance',
    category: 'Trade',
    importance: 'medium',
    unit: 'Millions USD',
    description: 'Australia trade balance',
    frequency: 'Monthly',
  },

  // Retail Sales
  'AU_RETAIL_SALES': {
    seriesId: 'AUSSARTMDSMEI',
    name: 'Australia Retail Sales',
    slug: 'au-retail-sales',
    category: 'Consumer',
    importance: 'medium',
    unit: 'Index',
    description: 'Australia retail sales value',
    frequency: 'Monthly',
  },

  // Housing
  'AU_HOUSE_PRICES': {
    seriesId: 'QAUR628BIS',
    name: 'Australia House Price Index',
    slug: 'au-house-prices',
    category: 'Housing',
    importance: 'medium',
    unit: 'Index',
    description: 'Australia residential property prices',
    frequency: 'Quarterly',
  },

  // Exchange Rate
  'AUD_USD': {
    seriesId: 'DEXUSAL',
    name: 'AUD/USD Exchange Rate',
    slug: 'aud-usd',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'USD',
    description: 'Australian Dollar to US Dollar',
    frequency: 'Daily',
  },
};

// Switzerland indicators
export const SWITZERLAND_INDICATORS: Record<string, {
  seriesId: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  'CH_CPI': {
    seriesId: 'FPCPITOTLZGCHE',
    name: 'Switzerland CPI YoY',
    slug: 'ch-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Switzerland CPI annual inflation',
    frequency: 'Annual',
  },
  'CH_UNEMPLOYMENT': {
    seriesId: 'LMUNRRTTCHM156S',
    name: 'Switzerland Unemployment',
    slug: 'ch-unemployment',
    category: 'Employment',
    importance: 'medium',
    unit: '%',
    description: 'Switzerland unemployment rate',
    frequency: 'Monthly',
  },
  'USD_CHF': {
    seriesId: 'DEXSZUS',
    name: 'USD/CHF Exchange Rate',
    slug: 'usd-chf',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'CHF',
    description: 'US Dollar to Swiss Franc',
    frequency: 'Daily',
  },
};

// New Zealand indicators
export const NZ_INDICATORS: Record<string, {
  seriesId: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  'NZ_CPI': {
    seriesId: 'FPCPITOTLZGNZL',
    name: 'New Zealand CPI YoY',
    slug: 'nz-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'New Zealand CPI annual inflation',
    frequency: 'Annual',
  },
  'NZ_UNEMPLOYMENT': {
    seriesId: 'LRUNTTTTNZQ156S',
    name: 'New Zealand Unemployment',
    slug: 'nz-unemployment',
    category: 'Employment',
    importance: 'medium',
    unit: '%',
    description: 'New Zealand unemployment rate',
    frequency: 'Quarterly',
  },
  'NZD_USD': {
    seriesId: 'DEXUSNZ',
    name: 'NZD/USD Exchange Rate',
    slug: 'nzd-usd',
    category: 'Exchange Rates',
    importance: 'medium',
    unit: 'USD',
    description: 'New Zealand Dollar to US Dollar',
    frequency: 'Daily',
  },
};

// Fetch data from FRED
async function fetchFromFRED(seriesId: string): Promise<{
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
    console.error(`Error fetching FRED data (${seriesId}):`, error.message);
    return null;
  }
}

// Sync all other countries data
export async function syncOtherCountriesDataToDb(): Promise<void> {
  console.log('Syncing Canada/Australia/Switzerland/NZ data...');
  console.log('='.repeat(60));

  if (!process.env.FRED_API_KEY) {
    console.warn('FRED_API_KEY not set - skipping');
    return;
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

  const allIndicators = [
    ...Object.values(CANADA_INDICATORS),
    ...Object.values(AUSTRALIA_INDICATORS),
    ...Object.values(SWITZERLAND_INDICATORS),
    ...Object.values(NZ_INDICATORS),
  ];

  for (const indicator of allIndicators) {
    try {
      const result = await fetchFromFRED(indicator.seriesId);
      if (result && !isNaN(result.value)) {
        console.log(`  ${indicator.name}: ${result.value} ${indicator.unit}`);
        updateRelease.run(result.value, result.previous || null, indicator.unit, indicator.slug);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error syncing ${indicator.name}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('Other countries sync complete');
}

// Ensure events exist
export async function ensureOtherCountriesEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, ?, ?, 'FRED', 'https://fred.stlouisfed.org/', ?, ?)
  `);

  // Canada
  for (const ind of Object.values(CANADA_INDICATORS)) {
    insertEvent.run(ind.name, ind.slug, ind.category, 'CA', ind.description, ind.importance, ind.frequency);
  }
  // Australia
  for (const ind of Object.values(AUSTRALIA_INDICATORS)) {
    insertEvent.run(ind.name, ind.slug, ind.category, 'AU', ind.description, ind.importance, ind.frequency);
  }
  // Switzerland
  for (const ind of Object.values(SWITZERLAND_INDICATORS)) {
    insertEvent.run(ind.name, ind.slug, ind.category, 'CH', ind.description, ind.importance, ind.frequency);
  }
  // New Zealand
  for (const ind of Object.values(NZ_INDICATORS)) {
    insertEvent.run(ind.name, ind.slug, ind.category, 'NZ', ind.description, ind.importance, ind.frequency);
  }

  console.log('Other countries events ensured in database');
}
