import axios from 'axios';
import db from '../config/database';

/**
 * Japan Economic Data Sources
 *
 * Official Sources:
 * 1. Bank of Japan (BOJ) - https://www.boj.or.jp/
 * 2. e-Stat (Statistics Bureau of Japan) - https://www.e-stat.go.jp/
 * 3. Cabinet Office - https://www.cao.go.jp/
 *
 * Note: Japanese government APIs can be challenging - data is often in Japanese
 * Alternative: Use FRED which has many Japanese series
 */

// BOJ Time-Series Data Search API
const BOJ_API_URL = 'https://www.stat-search.boj.or.jp/ssi/mtshtml';

// e-Stat API
const ESTAT_API_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json';

// Japanese economic indicators (with FRED backup series)
export const JAPAN_INDICATORS: Record<string, {
  source: 'BOJ' | 'ESTAT' | 'FRED';
  seriesId: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
  frequency: string;
}> = {
  // Interest Rates (BOJ)
  'BOJ_POLICY_RATE': {
    source: 'FRED',
    seriesId: 'IRSTCB01JPM156N',
    name: 'BOJ Policy Rate',
    slug: 'boj-policy-rate',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: 'Bank of Japan policy rate',
    frequency: 'Monthly',
  },
  'JGB_10Y': {
    source: 'FRED',
    seriesId: 'IRLTLT01JPM156N',
    name: 'Japan 10-Year JGB',
    slug: 'jgb-10y',
    category: 'Interest Rates',
    importance: 'high',
    unit: '%',
    description: '10-year Japanese Government Bond yield',
    frequency: 'Monthly',
  },
  'JGB_2Y': {
    source: 'FRED',
    seriesId: 'IR3TIB01JPM156N',
    name: 'Japan 2-Year JGB',
    slug: 'jgb-2y',
    category: 'Interest Rates',
    importance: 'medium',
    unit: '%',
    description: '2-year Japanese Government Bond yield',
    frequency: 'Monthly',
  },

  // Inflation (Note: Japan CPI index series discontinued on FRED, using YoY instead)
  'JP_CPI_YOY': {
    source: 'FRED',
    seriesId: 'FPCPITOTLZGJPN',
    name: 'Japan CPI YoY',
    slug: 'jp-cpi-yoy',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Japan CPI annual change',
    frequency: 'Annual',
  },
  'JP_CORE_CPI': {
    source: 'FRED',
    seriesId: 'JPNCPALTT01CTGYM',
    name: 'Japan Core CPI',
    slug: 'jp-core-cpi',
    category: 'Inflation',
    importance: 'high',
    unit: '%',
    description: 'Japan CPI Growth Rate YoY',
    frequency: 'Monthly',
  },
  'JP_PPI': {
    source: 'FRED',
    seriesId: 'PITGCG01JPM661N',
    name: 'Japan PPI',
    slug: 'jp-ppi',
    category: 'Inflation',
    importance: 'medium',
    unit: '%',
    description: 'Japan Producer Price Index YoY',
    frequency: 'Monthly',
  },

  // GDP
  'JP_GDP': {
    source: 'FRED',
    seriesId: 'JPNNGDP',
    name: 'Japan GDP',
    slug: 'jp-gdp',
    category: 'Economy',
    importance: 'high',
    unit: 'Billions JPY',
    description: 'Japan Nominal GDP',
    frequency: 'Quarterly',
  },
  'JP_GDP_GROWTH': {
    source: 'FRED',
    seriesId: 'JPNRGDPEXP',
    name: 'Japan GDP Growth',
    slug: 'jp-gdp-growth',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'Japan Real GDP growth rate',
    frequency: 'Quarterly',
  },

  // Employment
  'JP_UNEMPLOYMENT': {
    source: 'FRED',
    seriesId: 'LRUNTTTTJPM156S',
    name: 'Japan Unemployment Rate',
    slug: 'jp-unemployment',
    category: 'Employment',
    importance: 'high',
    unit: '%',
    description: 'Japan unemployment rate',
    frequency: 'Monthly',
  },
  // Trade
  'JP_TRADE_BALANCE': {
    source: 'FRED',
    seriesId: 'XTNTVA01JPM667S',
    name: 'Japan Trade Balance',
    slug: 'jp-trade-balance',
    category: 'Trade',
    importance: 'high',
    unit: 'Millions USD',
    description: 'Japan trade balance',
    frequency: 'Monthly',
  },

  // Industrial Production
  'JP_INDUSTRIAL_PROD': {
    source: 'FRED',
    seriesId: 'JPNPROINDMISMEI',
    name: 'Japan Industrial Production',
    slug: 'jp-industrial-production',
    category: 'Manufacturing',
    importance: 'high',
    unit: 'Index',
    description: 'Japan industrial production index',
    frequency: 'Monthly',
  },

  // Retail Sales
  'JP_RETAIL_SALES': {
    source: 'FRED',
    seriesId: 'JPNSLRTTO02IXOBSAM',
    name: 'Japan Retail Sales',
    slug: 'jp-retail-sales',
    category: 'Consumer',
    importance: 'medium',
    unit: 'Index',
    description: 'Japan retail sales value',
    frequency: 'Monthly',
  },

  // Exchange Rate
  'USD_JPY': {
    source: 'FRED',
    seriesId: 'DEXJPUS',
    name: 'USD/JPY Exchange Rate',
    slug: 'usd-jpy',
    category: 'Exchange Rates',
    importance: 'high',
    unit: 'JPY',
    description: 'US Dollar to Japanese Yen',
    frequency: 'Daily',
  },

  // Money Supply
  'JP_M2': {
    source: 'FRED',
    seriesId: 'MANMM101JPM189S',
    name: 'Japan M2 Money Supply',
    slug: 'jp-m2',
    category: 'Money Supply',
    importance: 'medium',
    unit: 'Index',
    description: 'Japan M2 money supply',
    frequency: 'Monthly',
  },
};

// Fetch Japan data from FRED (most reliable for Japan data)
export async function fetchJapanDataFromFRED(seriesId: string): Promise<{
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

    const latest = observations[0];
    const previous = observations.length > 1 ? observations[1] : undefined;

    return {
      value: parseFloat(latest.value),
      date: latest.date,
      previous: previous ? parseFloat(previous.value) : undefined,
    };
  } catch (error: any) {
    console.error(`Error fetching Japan data from FRED (${seriesId}):`, error.message);
    return null;
  }
}

// Fetch from e-Stat API (Japanese government statistics)
export async function fetchEstatData(appId: string, statsDataId: string): Promise<any> {
  try {
    const response = await axios.get(`${ESTAT_API_URL}/getStatsData`, {
      params: {
        appId,
        statsDataId,
        lang: 'E', // English
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching e-Stat data:`, error.message);
    return null;
  }
}

// Sync Japan data to database (primarily using FRED)
export async function syncJapanDataToDb(): Promise<void> {
  console.log('Syncing Japan data to database...');
  console.log('='.repeat(60));

  if (!process.env.FRED_API_KEY) {
    console.warn('FRED_API_KEY not set - skipping Japan data sync');
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

  for (const [key, indicator] of Object.entries(JAPAN_INDICATORS)) {
    try {
      if (indicator.source === 'FRED') {
        const result = await fetchJapanDataFromFRED(indicator.seriesId);

        if (result && !isNaN(result.value)) {
          console.log(`  ${indicator.name}: ${result.value} ${indicator.unit}`);
          updateRelease.run(
            result.value,
            result.previous || null,
            indicator.unit,
            indicator.slug
          );
        }
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error syncing ${indicator.name}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('Japan data sync complete');
}

// Ensure Japan events exist in database
export async function ensureJapanEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'JP', ?, ?, ?, ?, ?)
  `);

  const sourceUrls: Record<string, string> = {
    BOJ: 'https://www.boj.or.jp/en/',
    ESTAT: 'https://www.e-stat.go.jp/',
    FRED: 'https://fred.stlouisfed.org/',
  };

  for (const indicator of Object.values(JAPAN_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.description,
      indicator.source,
      sourceUrls[indicator.source],
      indicator.importance,
      indicator.frequency
    );
  }

  console.log('Japan events ensured in database');
}
