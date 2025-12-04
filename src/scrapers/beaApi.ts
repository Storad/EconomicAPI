import axios from 'axios';
import db from '../config/database';

// Bureau of Economic Analysis (BEA) API
// Documentation: https://apps.bea.gov/api/_pdf/bea_web_service_api_user_guide.pdf
const BEA_API_URL = 'https://apps.bea.gov/api/data';

// BEA datasets and table IDs
export const BEA_INDICATORS: Record<string, {
  dataset: string;
  tableName: string;
  frequency: string;
  lineNumber?: string;
  name: string;
  slug: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  unit: string;
  description: string;
}> = {
  // GDP (Quarterly)
  'GDP': {
    dataset: 'NIPA',
    tableName: 'T10101',
    frequency: 'Q',
    lineNumber: '1',
    name: 'Gross Domestic Product',
    slug: 'gdp',
    category: 'Economy',
    importance: 'high',
    unit: 'Billions $',
    description: 'Gross domestic product (current dollars)',
  },
  'GDP_GROWTH': {
    dataset: 'NIPA',
    tableName: 'T10101',
    frequency: 'Q',
    lineNumber: '1',
    name: 'GDP Growth Rate',
    slug: 'gdp-growth',
    category: 'Economy',
    importance: 'high',
    unit: '%',
    description: 'Real GDP percent change from preceding period',
  },
  'REAL_GDP': {
    dataset: 'NIPA',
    tableName: 'T10106',
    frequency: 'Q',
    lineNumber: '1',
    name: 'Real GDP',
    slug: 'real-gdp',
    category: 'Economy',
    importance: 'high',
    unit: 'Billions $',
    description: 'Real gross domestic product (2017 dollars)',
  },
  'GDP_DEFLATOR': {
    dataset: 'NIPA',
    tableName: 'T10104',
    frequency: 'Q',
    lineNumber: '1',
    name: 'GDP Price Deflator',
    slug: 'gdp-deflator',
    category: 'Inflation',
    importance: 'medium',
    unit: 'Index',
    description: 'Gross domestic product implicit price deflator',
  },

  // Personal Income and Outlays (Monthly)
  'PERSONAL_INCOME': {
    dataset: 'NIPA',
    tableName: 'T20100',
    frequency: 'M',
    lineNumber: '1',
    name: 'Personal Income',
    slug: 'personal-income',
    category: 'Consumer',
    importance: 'medium',
    unit: 'Billions $',
    description: 'Personal income',
  },
  'PERSONAL_SPENDING': {
    dataset: 'NIPA',
    tableName: 'T20100',
    frequency: 'M',
    lineNumber: '2',
    name: 'Personal Consumption Expenditures',
    slug: 'personal-spending',
    category: 'Consumer',
    importance: 'medium',
    unit: 'Billions $',
    description: 'Personal consumption expenditures',
  },
  'SAVINGS_RATE': {
    dataset: 'NIPA',
    tableName: 'T20100',
    frequency: 'M',
    lineNumber: '34',
    name: 'Personal Savings Rate',
    slug: 'personal-savings-rate',
    category: 'Consumer',
    importance: 'low',
    unit: '%',
    description: 'Personal saving as a percentage of disposable income',
  },

  // PCE Price Index (Monthly)
  'PCE': {
    dataset: 'NIPA',
    tableName: 'T20804',
    frequency: 'M',
    lineNumber: '1',
    name: 'PCE Price Index',
    slug: 'pce',
    category: 'Inflation',
    importance: 'high',
    unit: 'Index',
    description: 'Personal consumption expenditures price index',
  },
  'CORE_PCE': {
    dataset: 'NIPA',
    tableName: 'T20804',
    frequency: 'M',
    lineNumber: '13',
    name: 'Core PCE Price Index',
    slug: 'core-pce',
    category: 'Inflation',
    importance: 'high',
    unit: 'Index',
    description: 'PCE excluding food and energy',
  },

  // International Trade (Monthly)
  'TRADE_BALANCE': {
    dataset: 'ITA',
    tableName: 'ITA',
    frequency: 'M',
    name: 'Trade Balance',
    slug: 'trade-balance',
    category: 'Trade',
    importance: 'medium',
    unit: 'Billions $',
    description: 'Balance on goods and services',
  },
  'EXPORTS': {
    dataset: 'ITA',
    tableName: 'ITA',
    frequency: 'M',
    name: 'Exports',
    slug: 'exports',
    category: 'Trade',
    importance: 'low',
    unit: 'Billions $',
    description: 'Exports of goods and services',
  },
  'IMPORTS': {
    dataset: 'ITA',
    tableName: 'ITA',
    frequency: 'M',
    name: 'Imports',
    slug: 'imports',
    category: 'Trade',
    importance: 'low',
    unit: 'Billions $',
    description: 'Imports of goods and services',
  },

  // Current Account (Quarterly)
  'CURRENT_ACCOUNT': {
    dataset: 'ITA',
    tableName: 'ITA',
    frequency: 'Q',
    name: 'Current Account Balance',
    slug: 'current-account',
    category: 'Trade',
    importance: 'medium',
    unit: 'Billions $',
    description: 'Balance on current account',
  },
};

interface BEAApiResponse {
  BEAAPI: {
    Results: {
      Data?: Array<{
        TableName: string;
        SeriesCode: string;
        LineNumber: string;
        LineDescription: string;
        TimePeriod: string;
        METRIC_NAME: string;
        CL_UNIT: string;
        UNIT_MULT: string;
        DataValue: string;
        NoteRef?: string;
      }>;
      Dimensions?: Array<{
        Name: string;
        DataType: string;
        IsValue: string;
      }>;
      Error?: {
        APIErrorCode: string;
        APIErrorDescription: string;
      };
    };
  };
}

// Fetch data from BEA API
export async function fetchBEAData(
  dataset: string,
  tableName: string,
  frequency: string = 'Q',
  year?: string
): Promise<BEAApiResponse | null> {
  const apiKey = process.env.BEA_API_KEY;

  if (!apiKey) {
    console.warn('BEA_API_KEY not set. Get one at: https://apps.bea.gov/api/signup/');
    return null;
  }

  const currentYear = new Date().getFullYear();
  const yearParam = year || `${currentYear - 2},${currentYear - 1},${currentYear}`;

  try {
    const params: any = {
      UserID: apiKey,
      method: 'GetData',
      DataSetName: dataset,
      ResultFormat: 'JSON',
    };

    if (dataset === 'NIPA') {
      params.TableName = tableName;
      params.Frequency = frequency;
      params.Year = yearParam;
    } else if (dataset === 'ITA') {
      // International Trade
      params.Indicator = 'BalGds,BalServ,BalGdsServ,ExpGds,ExpServ,ImpGds,ImpServ';
      params.AreaOrCountry = 'AllCountries';
      params.Frequency = frequency;
      params.Year = yearParam;
    }

    const response = await axios.get<BEAApiResponse>(BEA_API_URL, { params });

    if (response.data.BEAAPI.Results.Error) {
      console.error('BEA API error:', response.data.BEAAPI.Results.Error.APIErrorDescription);
      return null;
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching BEA data:', error.message);
    return null;
  }
}

// Get latest GDP data
export async function getLatestGDP(): Promise<{
  gdp: number;
  gdpGrowth: number;
  realGdp: number;
  period: string;
} | null> {
  const response = await fetchBEAData('NIPA', 'T10101', 'Q');

  if (!response || !response.BEAAPI.Results.Data) {
    return null;
  }

  const data = response.BEAAPI.Results.Data;

  // Find the latest period
  const latestData = data
    .filter(d => d.LineNumber === '1')
    .sort((a, b) => b.TimePeriod.localeCompare(a.TimePeriod))[0];

  if (!latestData) return null;

  return {
    gdp: parseFloat(latestData.DataValue.replace(',', '')),
    gdpGrowth: 0, // Would need additional calculation
    realGdp: 0,
    period: latestData.TimePeriod,
  };
}

// Get latest PCE data
export async function getLatestPCE(): Promise<{
  pce: number;
  corePce: number;
  pceYoY: number;
  corePceYoY: number;
  period: string;
} | null> {
  const response = await fetchBEAData('NIPA', 'T20804', 'M');

  if (!response || !response.BEAAPI.Results.Data) {
    return null;
  }

  const data = response.BEAAPI.Results.Data;

  // Get latest PCE and Core PCE values
  const sortedData = data.sort((a, b) => b.TimePeriod.localeCompare(a.TimePeriod));

  const latestPCE = sortedData.find(d => d.LineNumber === '1');
  const latestCorePCE = sortedData.find(d => d.LineNumber === '13');

  if (!latestPCE) return null;

  return {
    pce: parseFloat(latestPCE.DataValue.replace(',', '')),
    corePce: latestCorePCE ? parseFloat(latestCorePCE.DataValue.replace(',', '')) : 0,
    pceYoY: 0, // Would need YoY calculation
    corePceYoY: 0,
    period: latestPCE.TimePeriod,
  };
}

// Sync BEA data to database
export async function syncBEADataToDb(): Promise<void> {
  console.log('Syncing BEA data to database...');
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

  // Fetch NIPA data (GDP, PCE, Personal Income)
  const nipaResponse = await fetchBEAData('NIPA', 'T10101', 'Q');
  if (nipaResponse?.BEAAPI.Results.Data) {
    const data = nipaResponse.BEAAPI.Results.Data
      .filter(d => d.LineNumber === '1')
      .sort((a, b) => b.TimePeriod.localeCompare(a.TimePeriod));

    if (data.length >= 2) {
      const latest = parseFloat(data[0].DataValue.replace(',', ''));
      const previous = parseFloat(data[1].DataValue.replace(',', ''));
      updateRelease.run(latest, previous, 'Billions $', 'gdp');
      console.log(`  GDP: ${latest} Billions $`);

      // Store historical
      for (const point of data) {
        const value = parseFloat(point.DataValue.replace(',', ''));
        insertHistorical.run(point.TimePeriod, value, 'quarterly', 'gdp');
      }
    }
  }

  // Fetch PCE data
  const pceResponse = await fetchBEAData('NIPA', 'T20804', 'M');
  if (pceResponse?.BEAAPI.Results.Data) {
    // PCE (line 1)
    const pceData = pceResponse.BEAAPI.Results.Data
      .filter(d => d.LineNumber === '1')
      .sort((a, b) => b.TimePeriod.localeCompare(a.TimePeriod));

    if (pceData.length >= 2) {
      const latest = parseFloat(pceData[0].DataValue.replace(',', ''));
      const previous = parseFloat(pceData[1].DataValue.replace(',', ''));
      updateRelease.run(latest, previous, 'Index', 'pce');
      console.log(`  PCE: ${latest}`);
    }

    // Core PCE (line 13)
    const corePceData = pceResponse.BEAAPI.Results.Data
      .filter(d => d.LineNumber === '13')
      .sort((a, b) => b.TimePeriod.localeCompare(a.TimePeriod));

    if (corePceData.length >= 2) {
      const latest = parseFloat(corePceData[0].DataValue.replace(',', ''));
      const previous = parseFloat(corePceData[1].DataValue.replace(',', ''));
      updateRelease.run(latest, previous, 'Index', 'core-pce');
      console.log(`  Core PCE: ${latest}`);
    }
  }

  // Fetch Personal Income & Outlays
  const incomeResponse = await fetchBEAData('NIPA', 'T20100', 'M');
  if (incomeResponse?.BEAAPI.Results.Data) {
    // Personal Income (line 1)
    const incomeData = incomeResponse.BEAAPI.Results.Data
      .filter(d => d.LineNumber === '1')
      .sort((a, b) => b.TimePeriod.localeCompare(a.TimePeriod));

    if (incomeData.length >= 2) {
      const latest = parseFloat(incomeData[0].DataValue.replace(',', ''));
      const previous = parseFloat(incomeData[1].DataValue.replace(',', ''));
      updateRelease.run(latest, previous, 'Billions $', 'personal-income');
      console.log(`  Personal Income: ${latest} Billions $`);
    }
  }

  console.log('='.repeat(60));
  console.log('BEA data sync complete');
}

// Ensure all BEA events exist in database
export async function ensureBEAEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'US', ?, 'BEA', ?, ?, ?)
  `);

  for (const indicator of Object.values(BEA_INDICATORS)) {
    const sourceUrl = 'https://www.bea.gov/news/glance';
    const frequency = indicator.frequency === 'Q' ? 'Quarterly' : 'Monthly';

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

  console.log('BEA events ensured in database');
}
