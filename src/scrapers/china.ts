import axios from 'axios';
import db from '../config/database';

/**
 * China Economic Data Sources
 *
 * Official Sources:
 * 1. National Bureau of Statistics (NBS) - http://www.stats.gov.cn/
 * 2. People's Bank of China (PBOC) - http://www.pbc.gov.cn/
 *
 * Note: Chinese government APIs are often unreliable or require registration.
 * Best approach: Use FRED which has official Chinese data from various sources.
 * FRED gets Chinese data from: IMF, World Bank, OECD, and direct submissions.
 */

// Chinese economic indicators (via FRED - most reliable)
export const CHINA_INDICATORS: Record<string, {
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
  'CN_GDP': {
    seriesId: 'MKTGDPCNA646NWDB',
    name: 'China GDP',
    slug: 'cn-gdp',
    category: 'Economy',
    importance: 'high',
    unit: 'Billions USD',
    description: 'China Gross Domestic Product',
    frequency: 'Annual',
  },
  'CN_GDP_GROWTH': {
    seriesId: 'NAEXKP01CNA657S',
    name: 'China GDP Growth',
    slug: 'cn-gdp-growth',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'China Real GDP growth rate',
    frequency: 'Annual',
  },

  // Inflation
  'CN_CPI': {
    seriesId: 'CHNCPIALLMINMEI',
    name: 'China CPI',
    slug: 'cn-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: 'Index',
    description: 'China Consumer Price Index',
    frequency: 'Monthly',
  },
  'CN_CPI_YOY': {
    seriesId: 'FPCPITOTLZGCHN',
    name: 'China CPI YoY',
    slug: 'cn-cpi-yoy',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'China CPI annual inflation rate',
    frequency: 'Monthly',
  },
  'CN_PPI': {
    seriesId: 'CHNPIEATI01GYM',
    name: 'China PPI',
    slug: 'cn-ppi',
    category: 'Inflation',
    importance: 'medium',
    unit: '%',
    description: 'China Producer Price Index YoY',
    frequency: 'Monthly',
  },

  // Interest Rates
  'PBOC_LOAN_RATE': {
    seriesId: 'INTDSRCNM193N',
    name: 'China Loan Prime Rate',
    slug: 'cn-loan-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'PBOC 1-Year Loan Prime Rate',
    frequency: 'Monthly',
  },

  // Trade
  'CN_TRADE_BALANCE': {
    seriesId: 'XTNTVA01CNM667S',
    name: 'China Trade Balance',
    slug: 'cn-trade-balance',
    category: 'Trade',
    importance: 'high',
    unit: 'Millions USD',
    description: 'China trade balance',
    frequency: 'Monthly',
  },
  'CN_EXPORTS': {
    seriesId: 'XTEXVA01CNM667S',
    name: 'China Exports',
    slug: 'cn-exports',
    category: 'Trade',
    importance: 'high',
    unit: '%',
    description: 'China exports value YoY change',
    frequency: 'Monthly',
  },
  'CN_IMPORTS': {
    seriesId: 'XTIMVA01CNM667S',
    name: 'China Imports',
    slug: 'cn-imports',
    category: 'Trade',
    importance: 'medium',
    unit: '%',
    description: 'China imports value YoY change',
    frequency: 'Monthly',
  },

  // Industrial Production
  'CN_INDUSTRIAL_PROD': {
    seriesId: 'CHNPRINTO01IXPYM',
    name: 'China Industrial Production',
    slug: 'cn-industrial-production',
    category: 'Manufacturing',
    importance: 'high',
    unit: 'Index',
    description: 'China industrial production index',
    frequency: 'Monthly',
  },

  // Retail Sales
  'CN_RETAIL_SALES': {
    seriesId: 'CHNSLRTTO02MLM',
    name: 'China Retail Sales',
    slug: 'cn-retail-sales',
    category: 'Consumer',
    importance: 'high',
    unit: 'Index',
    description: 'China retail sales value',
    frequency: 'Monthly',
  },

  // Employment
  'CN_UNEMPLOYMENT': {
    seriesId: 'LMUNRRTTCNQ156S',
    name: 'China Unemployment Rate',
    slug: 'cn-unemployment',
    category: 'Employment',
    importance: 'medium',
    unit: '%',
    description: 'China registered unemployment rate',
    frequency: 'Quarterly',
  },

  // Money Supply
  'CN_M2': {
    seriesId: 'MANMM101CNM189S',
    name: 'China M2 Money Supply',
    slug: 'cn-m2',
    category: 'Money Supply',
    importance: 'high',
    unit: 'Index',
    description: 'China M2 money supply',
    frequency: 'Monthly',
  },

  // Exchange Rate
  'USD_CNY': {
    seriesId: 'DEXCHUS',
    name: 'USD/CNY Exchange Rate',
    slug: 'usd-cny',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'CNY',
    description: 'US Dollar to Chinese Yuan',
    frequency: 'Daily',
  },

  // Foreign Reserves
  'CN_FX_RESERVES': {
    seriesId: 'TRESEGCNM052N',
    name: 'China Foreign Reserves',
    slug: 'cn-fx-reserves',
    category: 'Reserves',
    importance: 'medium',
    unit: 'Billions USD',
    description: 'China total foreign exchange reserves',
    frequency: 'Monthly',
  },

  // Housing
  'CN_HOUSE_PRICES': {
    seriesId: 'QCNR628BIS',
    name: 'China House Price Index',
    slug: 'cn-house-prices',
    category: 'Housing',
    importance: 'medium',
    unit: 'Index',
    description: 'China residential property price index',
    frequency: 'Quarterly',
  },
};

// Fetch China data from FRED
export async function fetchChinaDataFromFRED(seriesId: string): Promise<{
  value: number;
  date: string;
  previous?: number;
} | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('FRED_API_KEY not set');
    return null;
  }

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

    const observations = response.data.observations;
    if (!observations || observations.length === 0) return null;

    // Filter out missing values
    const validObs = observations.filter((o: any) => o.value !== '.');

    if (validObs.length === 0) return null;

    const latest = validObs[0];
    const previous = validObs.length > 1 ? validObs[1] : undefined;

    return {
      value: parseFloat(latest.value),
      date: latest.date,
      previous: previous ? parseFloat(previous.value) : undefined,
    };
  } catch (error: any) {
    console.error(`Error fetching China data from FRED (${seriesId}):`, error.message);
    return null;
  }
}

// Sync China data to database
export async function syncChinaDataToDb(): Promise<void> {
  console.log('Syncing China data to database...');
  console.log('='.repeat(60));

  if (!process.env.FRED_API_KEY) {
    console.warn('FRED_API_KEY not set - skipping China data sync');
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

  for (const [key, indicator] of Object.entries(CHINA_INDICATORS)) {
    try {
      const result = await fetchChinaDataFromFRED(indicator.seriesId);

      if (result && !isNaN(result.value)) {
        console.log(`  ${indicator.name}: ${result.value} ${indicator.unit}`);
        updateRelease.run(
          result.value,
          result.previous || null,
          indicator.unit,
          indicator.slug
        );
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error syncing ${indicator.name}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('China data sync complete');
}

// Ensure China events exist in database
export async function ensureChinaEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'CN', ?, 'FRED/NBS', 'https://fred.stlouisfed.org/', ?, ?)
  `);

  for (const indicator of Object.values(CHINA_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.description,
      indicator.importance,
      indicator.frequency
    );
  }

  console.log('China events ensured in database');
}
