import axios from 'axios';
import db from '../config/database';

// Census Bureau API
// Documentation: https://www.census.gov/data/developers/data-sets.html
const CENSUS_API_URL = 'https://api.census.gov/data/timeseries/eits';

// Census Economic Indicators
export const CENSUS_INDICATORS: Record<string, {
  program: string;
  category: string;
  dataName: string;
  geoLevel?: string;
  name: string;
  slug: string;
  indicatorCategory: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
}> = {
  // Retail Sales (MARTS - Monthly Retail Trade Survey)
  'RETAIL_SALES': {
    program: 'marts',
    category: 'RETAIL',
    dataName: 'MARTS',
    name: 'Retail Sales',
    slug: 'retail-sales',
    indicatorCategory: 'Consumer',
    importance: 'high',
    unit: 'Millions $',
    description: 'Advance monthly sales for retail and food services',
  },
  'RETAIL_SALES_EX_AUTO': {
    program: 'marts',
    category: 'RETAILXMV',
    dataName: 'MARTS',
    name: 'Retail Sales Ex-Auto',
    slug: 'retail-sales-ex-auto',
    indicatorCategory: 'Consumer',
    importance: 'high',
    unit: 'Millions $',
    description: 'Retail sales excluding motor vehicles and parts',
  },

  // Housing (NRC - New Residential Construction)
  'HOUSING_STARTS': {
    program: 'resconst',
    category: 'STARTS',
    dataName: 'resconst',
    name: 'Housing Starts',
    slug: 'housing-starts',
    indicatorCategory: 'Housing',
    importance: 'medium',
    unit: 'Thousands',
    description: 'New privately-owned housing units started',
  },
  'BUILDING_PERMITS': {
    program: 'resconst',
    category: 'PERMITS',
    dataName: 'resconst',
    name: 'Building Permits',
    slug: 'building-permits',
    indicatorCategory: 'Housing',
    importance: 'medium',
    unit: 'Thousands',
    description: 'New privately-owned housing units authorized',
  },
  'HOUSING_COMPLETIONS': {
    program: 'resconst',
    category: 'COMPLETIONS',
    dataName: 'resconst',
    name: 'Housing Completions',
    slug: 'housing-completions',
    indicatorCategory: 'Housing',
    importance: 'low',
    unit: 'Thousands',
    description: 'New privately-owned housing units completed',
  },

  // New Home Sales (RESSALES)
  'NEW_HOME_SALES': {
    program: 'ressales',
    category: 'SOLD',
    dataName: 'ressales',
    name: 'New Home Sales',
    slug: 'new-home-sales',
    indicatorCategory: 'Housing',
    importance: 'medium',
    unit: 'Thousands',
    description: 'New single-family houses sold',
  },

  // Durable Goods (M3 - Manufacturers Shipments, Inventories, and Orders)
  'DURABLE_GOODS': {
    program: 'advm3',
    category: 'NEWORDERDUR',
    dataName: 'advm3',
    name: 'Durable Goods Orders',
    slug: 'durable-goods',
    indicatorCategory: 'Manufacturing',
    importance: 'medium',
    unit: 'Millions $',
    description: 'New orders for manufactured durable goods',
  },
  'DURABLE_GOODS_EX_TRANS': {
    program: 'advm3',
    category: 'NEWORDERDURXTRAN',
    dataName: 'advm3',
    name: 'Durable Goods Ex-Transportation',
    slug: 'durable-goods-ex-trans',
    indicatorCategory: 'Manufacturing',
    importance: 'medium',
    unit: 'Millions $',
    description: 'Durable goods orders excluding transportation',
  },

  // Factory Orders (Full M3)
  'FACTORY_ORDERS': {
    program: 'm3',
    category: 'NEWORDER',
    dataName: 'm3',
    name: 'Factory Orders',
    slug: 'factory-orders',
    indicatorCategory: 'Manufacturing',
    importance: 'medium',
    unit: 'Millions $',
    description: 'Manufacturers new orders',
  },

  // Construction Spending (VIP)
  'CONSTRUCTION_SPENDING': {
    program: 'vip',
    category: 'TOTAL',
    dataName: 'vip',
    name: 'Construction Spending',
    slug: 'construction-spending',
    indicatorCategory: 'Housing',
    importance: 'low',
    unit: 'Millions $',
    description: 'Total construction spending',
  },

  // Wholesale Trade (MWTS)
  'WHOLESALE_SALES': {
    program: 'mwts',
    category: 'SALES',
    dataName: 'mwts',
    name: 'Wholesale Trade Sales',
    slug: 'wholesale-trade',
    indicatorCategory: 'Economy',
    importance: 'low',
    unit: 'Millions $',
    description: 'Merchant wholesalers sales',
  },
  'WHOLESALE_INVENTORIES': {
    program: 'mwts',
    category: 'INVENTORIES',
    dataName: 'mwts',
    name: 'Wholesale Inventories',
    slug: 'wholesale-inventories',
    indicatorCategory: 'Economy',
    importance: 'low',
    unit: 'Millions $',
    description: 'Merchant wholesalers inventories',
  },

  // Business Inventories (MTIS)
  'BUSINESS_INVENTORIES': {
    program: 'mtis',
    category: 'INVENTORIES',
    dataName: 'mtis',
    name: 'Business Inventories',
    slug: 'business-inventories',
    indicatorCategory: 'Economy',
    importance: 'low',
    unit: 'Millions $',
    description: 'Manufacturing and trade inventories',
  },
};

interface CensusApiResponse {
  data?: string[][];
  error?: string;
}

// Fetch data from Census API
export async function fetchCensusData(
  program: string,
  category: string,
  time?: string
): Promise<CensusApiResponse | null> {
  const apiKey = process.env.CENSUS_API_KEY;

  // Default to recent months
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build time parameter (format: from+YYYY-MM)
  const timeParam = time || `from+${year - 1}-01`;

  try {
    // Census EITS API structure
    const url = `${CENSUS_API_URL}/${program}`;

    const params: any = {
      get: 'cell_value,data_type_code,time_slot_id,seasonally_adj,category_code,error_data',
      category_code: category,
      data_type_code: 'SM', // SM = Seasonally adjusted monthly
      time: timeParam,
    };

    if (apiKey) {
      params.key = apiKey;
    }

    const response = await axios.get(url, { params });

    return { data: response.data };
  } catch (error: any) {
    // Try alternate endpoint for some indicators
    console.error(`Error fetching Census data for ${program}/${category}:`, error.message);
    return null;
  }
}

// Fetch using the simpler Census Data API
export async function fetchCensusIndicator(indicator: string): Promise<{
  value: number;
  period: string;
  previous?: number;
} | null> {
  const mapping = CENSUS_INDICATORS[indicator];
  if (!mapping) {
    console.error(`Unknown Census indicator: ${indicator}`);
    return null;
  }

  const response = await fetchCensusData(mapping.program, mapping.category);

  if (!response?.data || response.data.length < 2) {
    return null;
  }

  // Parse response (first row is headers)
  const headers = response.data[0];
  const dataRows = response.data.slice(1);

  // Find the cell_value column
  const valueIdx = headers.indexOf('cell_value');
  const timeIdx = headers.indexOf('time_slot_id');

  if (valueIdx === -1) {
    return null;
  }

  // Sort by time to get latest
  const sorted = dataRows.sort((a, b) => {
    const timeA = timeIdx >= 0 ? a[timeIdx] : '';
    const timeB = timeIdx >= 0 ? b[timeIdx] : '';
    return timeB.localeCompare(timeA);
  });

  const latest = sorted[0];
  const previousRow = sorted[1];

  return {
    value: parseFloat(latest[valueIdx]),
    period: timeIdx >= 0 ? latest[timeIdx] : 'unknown',
    previous: previousRow ? parseFloat(previousRow[valueIdx]) : undefined,
  };
}

// Alternative: Use Census JSON API for economic indicators
export async function fetchCensusEconomicIndicator(
  indicatorCode: string
): Promise<any[] | null> {
  // Census publishes JSON feeds for many economic indicators
  const jsonUrls: Record<string, string> = {
    'retail-sales': 'https://www.census.gov/retail/mrts/www/mrtsjsondata/retail.json',
    'housing-starts': 'https://www.census.gov/construction/nrc/json/newresconst.json',
    'new-home-sales': 'https://www.census.gov/construction/nrs/json/newressales.json',
  };

  const url = jsonUrls[indicatorCode];
  if (!url) {
    return null;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching Census JSON for ${indicatorCode}:`, error);
    return null;
  }
}

// Sync Census data to database
export async function syncCensusDataToDb(): Promise<void> {
  console.log('Syncing Census data to database...');
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

  for (const [key, indicator] of Object.entries(CENSUS_INDICATORS)) {
    try {
      const result = await fetchCensusIndicator(key);

      if (result) {
        updateRelease.run(result.value, result.previous || null, indicator.unit, indicator.slug);
        console.log(`  ${indicator.name}: ${result.value} ${indicator.unit}`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error syncing ${indicator.name}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('Census data sync complete');
}

// Ensure all Census events exist in database
export async function ensureCensusEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'US', ?, 'Census Bureau', ?, ?, 'Monthly')
  `);

  const sourceUrls: Record<string, string> = {
    'retail-sales': 'https://www.census.gov/retail/index.html',
    'retail-sales-ex-auto': 'https://www.census.gov/retail/index.html',
    'housing-starts': 'https://www.census.gov/construction/nrc/index.html',
    'building-permits': 'https://www.census.gov/construction/bps/',
    'housing-completions': 'https://www.census.gov/construction/nrc/index.html',
    'new-home-sales': 'https://www.census.gov/construction/nrs/index.html',
    'durable-goods': 'https://www.census.gov/manufacturing/m3/adv/index.html',
    'durable-goods-ex-trans': 'https://www.census.gov/manufacturing/m3/adv/index.html',
    'factory-orders': 'https://www.census.gov/manufacturing/m3/index.html',
    'construction-spending': 'https://www.census.gov/construction/c30/c30index.html',
    'wholesale-trade': 'https://www.census.gov/wholesale/index.html',
    'wholesale-inventories': 'https://www.census.gov/wholesale/index.html',
    'business-inventories': 'https://www.census.gov/mtis/index.html',
  };

  for (const indicator of Object.values(CENSUS_INDICATORS)) {
    const sourceUrl = sourceUrls[indicator.slug] || 'https://www.census.gov/economic-indicators/';

    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.indicatorCategory,
      indicator.description,
      sourceUrl,
      indicator.importance
    );
  }

  console.log('Census events ensured in database');
}

// Census release schedule (typically 8:30 AM ET)
export const CENSUS_RELEASE_SCHEDULE = {
  'retail-sales': { timing: 'mid-month', time: '08:30' },
  'housing-starts': { timing: 'mid-month', time: '08:30' },
  'building-permits': { timing: 'mid-month', time: '08:30' },
  'new-home-sales': { timing: 'late-month', time: '10:00' },
  'durable-goods': { timing: 'late-month', time: '08:30' },
  'factory-orders': { timing: 'early-month', time: '10:00' },
  'construction-spending': { timing: 'first-business-day', time: '10:00' },
  'wholesale-inventories': { timing: 'mid-month', time: '10:00' },
  'business-inventories': { timing: 'mid-month', time: '10:00' },
};
