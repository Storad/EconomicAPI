import axios from 'axios';
import db from '../config/database';

// Treasury APIs
// 1. Treasury Direct API for auctions: https://www.treasurydirect.gov/TA_WS/
// 2. Treasury.gov for yield curve data
// 3. FRED for Treasury rates (backup)

const TREASURY_DIRECT_URL = 'https://www.treasurydirect.gov/TA_WS/securities';
const TREASURY_YIELDS_URL = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv';

// Treasury yield maturities
export const TREASURY_YIELDS: Record<string, {
  name: string;
  slug: string;
  fredSeries: string;
  importance: 'high' | 'medium' | 'low';
  description: string;
}> = {
  '1M': {
    name: '1-Month Treasury Bill',
    slug: '1m-treasury',
    fredSeries: 'DGS1MO',
    importance: 'low',
    description: '1-month Treasury bill rate',
  },
  '3M': {
    name: '3-Month Treasury Bill',
    slug: '3m-treasury',
    fredSeries: 'DGS3MO',
    importance: 'medium',
    description: '3-month Treasury bill rate (short-term benchmark)',
  },
  '6M': {
    name: '6-Month Treasury Bill',
    slug: '6m-treasury',
    fredSeries: 'DGS6MO',
    importance: 'low',
    description: '6-month Treasury bill rate',
  },
  '1Y': {
    name: '1-Year Treasury',
    slug: '1y-treasury',
    fredSeries: 'DGS1',
    importance: 'low',
    description: '1-year Treasury constant maturity rate',
  },
  '2Y': {
    name: '2-Year Treasury Note',
    slug: '2y-treasury',
    fredSeries: 'DGS2',
    importance: 'high',
    description: '2-year Treasury note rate (Fed expectations indicator)',
  },
  '5Y': {
    name: '5-Year Treasury Note',
    slug: '5y-treasury',
    fredSeries: 'DGS5',
    importance: 'medium',
    description: '5-year Treasury note rate',
  },
  '10Y': {
    name: '10-Year Treasury Note',
    slug: '10y-treasury',
    fredSeries: 'DGS10',
    importance: 'high',
    description: '10-year Treasury note rate (benchmark rate)',
  },
  '20Y': {
    name: '20-Year Treasury Bond',
    slug: '20y-treasury',
    fredSeries: 'DGS20',
    importance: 'low',
    description: '20-year Treasury bond rate',
  },
  '30Y': {
    name: '30-Year Treasury Bond',
    slug: '30y-treasury',
    fredSeries: 'DGS30',
    importance: 'high',
    description: '30-year Treasury bond rate (long-term benchmark)',
  },
};

// Treasury auction types
export const TREASURY_AUCTIONS: Record<string, {
  name: string;
  slug: string;
  securityType: string;
  securityTerm: string;
  importance: 'high' | 'medium' | 'low';
  frequency: string;
}> = {
  '4W_BILL': {
    name: '4-Week Bill Auction',
    slug: '4-week-bill-auction',
    securityType: 'Bill',
    securityTerm: '4-Week',
    importance: 'low',
    frequency: 'Weekly',
  },
  '8W_BILL': {
    name: '8-Week Bill Auction',
    slug: '8-week-bill-auction',
    securityType: 'Bill',
    securityTerm: '8-Week',
    importance: 'low',
    frequency: 'Weekly',
  },
  '13W_BILL': {
    name: '13-Week Bill Auction',
    slug: '13-week-bill-auction',
    securityType: 'Bill',
    securityTerm: '13-Week',
    importance: 'low',
    frequency: 'Weekly',
  },
  '26W_BILL': {
    name: '26-Week Bill Auction',
    slug: '26-week-bill-auction',
    securityType: 'Bill',
    securityTerm: '26-Week',
    importance: 'low',
    frequency: 'Weekly',
  },
  '52W_BILL': {
    name: '52-Week Bill Auction',
    slug: '52-week-bill-auction',
    securityType: 'Bill',
    securityTerm: '52-Week',
    importance: 'low',
    frequency: 'Every 4 weeks',
  },
  '2Y_NOTE': {
    name: '2-Year Note Auction',
    slug: '2y-note-auction',
    securityType: 'Note',
    securityTerm: '2-Year',
    importance: 'medium',
    frequency: 'Monthly',
  },
  '3Y_NOTE': {
    name: '3-Year Note Auction',
    slug: '3y-note-auction',
    securityType: 'Note',
    securityTerm: '3-Year',
    importance: 'medium',
    frequency: 'Monthly',
  },
  '5Y_NOTE': {
    name: '5-Year Note Auction',
    slug: '5y-note-auction',
    securityType: 'Note',
    securityTerm: '5-Year',
    importance: 'medium',
    frequency: 'Monthly',
  },
  '7Y_NOTE': {
    name: '7-Year Note Auction',
    slug: '7y-note-auction',
    securityType: 'Note',
    securityTerm: '7-Year',
    importance: 'medium',
    frequency: 'Monthly',
  },
  '10Y_NOTE': {
    name: '10-Year Note Auction',
    slug: '10y-note-auction',
    securityType: 'Note',
    securityTerm: '10-Year',
    importance: 'high',
    frequency: 'Monthly',
  },
  '20Y_BOND': {
    name: '20-Year Bond Auction',
    slug: '20y-bond-auction',
    securityType: 'Bond',
    securityTerm: '20-Year',
    importance: 'medium',
    frequency: 'Monthly',
  },
  '30Y_BOND': {
    name: '30-Year Bond Auction',
    slug: '30y-bond-auction',
    securityType: 'Bond',
    securityTerm: '30-Year',
    importance: 'high',
    frequency: 'Monthly',
  },
  'TIPS': {
    name: 'TIPS Auction',
    slug: 'tips-auction',
    securityType: 'TIPS',
    securityTerm: '',
    importance: 'medium',
    frequency: 'Monthly',
  },
};

// Yield curve spread calculations
export const YIELD_SPREADS: Record<string, {
  name: string;
  slug: string;
  long: string;
  short: string;
  importance: 'high' | 'medium' | 'low';
  description: string;
}> = {
  '10Y_2Y': {
    name: '10Y-2Y Treasury Spread',
    slug: '10y-2y-spread',
    long: '10Y',
    short: '2Y',
    importance: 'high',
    description: 'Yield curve slope indicator (recession predictor)',
  },
  '10Y_3M': {
    name: '10Y-3M Treasury Spread',
    slug: '10y-3m-spread',
    long: '10Y',
    short: '3M',
    importance: 'high',
    description: 'Near-term yield curve (Fed policy indicator)',
  },
};

interface TreasuryDirectAuction {
  cusip: string;
  securityType: string;
  securityTerm: string;
  auctionDate: string;
  issueDate: string;
  maturityDate: string;
  highYield?: string;
  highDiscountRate?: string;
  allocationPercentage?: string;
  totalAccepted?: string;
  bidToCoverRatio?: string;
}

// Fetch upcoming and recent Treasury auctions from Treasury Direct
export async function fetchTreasuryAuctions(
  type: 'upcoming' | 'recent' = 'upcoming',
  days: number = 60
): Promise<TreasuryDirectAuction[]> {
  try {
    const endpoint = type === 'upcoming' ? 'upcoming' : 'search';

    const params: any = {
      format: 'json',
    };

    if (type === 'recent') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
      params.type = 'Auction';
    }

    const response = await axios.get(`${TREASURY_DIRECT_URL}/${endpoint}`, {
      params,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data.map((auction: any) => ({
      cusip: auction.cusip || '',
      securityType: auction.securityType || '',
      securityTerm: auction.securityTerm || '',
      auctionDate: auction.auctionDate || '',
      issueDate: auction.issueDate || '',
      maturityDate: auction.maturityDate || '',
      highYield: auction.highYield,
      highDiscountRate: auction.highDiscountRate,
      allocationPercentage: auction.allocationPercentage,
      totalAccepted: auction.totalAccepted,
      bidToCoverRatio: auction.bidToCoverRatio,
    }));
  } catch (error: any) {
    console.error('Error fetching Treasury auctions:', error.message);
    return [];
  }
}

// Fetch daily Treasury yield curve from Treasury.gov XML feed
export async function fetchTreasuryYields(): Promise<Record<string, number> | null> {
  try {
    // Treasury publishes yield curve data via XML
    const response = await axios.get(
      'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml',
      {
        params: {
          data: 'daily_treasury_yield_curve',
          field_tdr_date_value: new Date().getFullYear(),
        },
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
        },
      }
    );

    // Parse XML response - this is simplified, would need proper XML parsing
    const xmlData = response.data;

    // For now, use FRED as the primary source (more reliable)
    return null;
  } catch (error) {
    console.error('Error fetching Treasury yields:', error);
    return null;
  }
}

// Get auction result for a specific security
export async function getAuctionResult(cusip: string): Promise<TreasuryDirectAuction | null> {
  try {
    const response = await axios.get(`${TREASURY_DIRECT_URL}/search`, {
      params: {
        cusip,
        format: 'json',
      },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching auction result:', error);
    return null;
  }
}

// Sync Treasury auction data to database
export async function syncTreasuryAuctions(): Promise<void> {
  console.log('Syncing Treasury auction data...');
  console.log('='.repeat(60));

  // Fetch upcoming auctions
  const upcomingAuctions = await fetchTreasuryAuctions('upcoming');
  console.log(`Found ${upcomingAuctions.length} upcoming Treasury auctions`);

  // Fetch recent auctions for results
  const recentAuctions = await fetchTreasuryAuctions('recent', 30);
  console.log(`Found ${recentAuctions.length} recent Treasury auctions`);

  const getEventBySlug = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, actual, source_url)
    VALUES (?, ?, '11:30 AM', 'America/New_York', ?, 'https://www.treasurydirect.gov')
  `);

  // Map auctions to our event slugs
  const mapAuctionToSlug = (auction: TreasuryDirectAuction): string | null => {
    const { securityType, securityTerm } = auction;

    if (securityType === 'Bill') {
      if (securityTerm.includes('4-Week')) return '4-week-bill-auction';
      if (securityTerm.includes('8-Week')) return '8-week-bill-auction';
      if (securityTerm.includes('13-Week')) return '13-week-bill-auction';
      if (securityTerm.includes('26-Week')) return '26-week-bill-auction';
      if (securityTerm.includes('52-Week')) return '52-week-bill-auction';
    } else if (securityType === 'Note') {
      if (securityTerm.includes('2-Year')) return '2y-note-auction';
      if (securityTerm.includes('3-Year')) return '3y-note-auction';
      if (securityTerm.includes('5-Year')) return '5y-note-auction';
      if (securityTerm.includes('7-Year')) return '7y-note-auction';
      if (securityTerm.includes('10-Year')) return '10y-note-auction';
    } else if (securityType === 'Bond') {
      if (securityTerm.includes('20-Year')) return '20y-bond-auction';
      if (securityTerm.includes('30-Year')) return '30y-bond-auction';
    } else if (securityType === 'TIPS' || securityType.includes('TIPS')) {
      return 'tips-auction';
    }

    return null;
  };

  // Process upcoming auctions
  for (const auction of upcomingAuctions) {
    const slug = mapAuctionToSlug(auction);
    if (!slug) continue;

    const event = getEventBySlug.get(slug) as { id: number } | undefined;
    if (!event || !auction.auctionDate) continue;

    try {
      const releaseDate = new Date(auction.auctionDate).toISOString().split('T')[0];
      insertRelease.run(event.id, releaseDate, null);
    } catch (err) {
      // Skip invalid dates
    }
  }

  // Process recent auctions (with results)
  for (const auction of recentAuctions) {
    const slug = mapAuctionToSlug(auction);
    if (!slug) continue;

    const event = getEventBySlug.get(slug) as { id: number } | undefined;
    if (!event || !auction.auctionDate) continue;

    try {
      const releaseDate = new Date(auction.auctionDate).toISOString().split('T')[0];
      const yield_ = auction.highYield ? parseFloat(auction.highYield) : null;
      insertRelease.run(event.id, releaseDate, yield_);

      if (yield_) {
        console.log(`  ${slug}: ${yield_}%`);
      }
    } catch (err) {
      // Skip invalid dates
    }
  }

  console.log('='.repeat(60));
  console.log('Treasury auction sync complete');
}

// Ensure Treasury events exist in database
export async function ensureTreasuryEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, 'Interest Rates', 'US', ?, 'Treasury', 'https://www.treasurydirect.gov', ?, ?)
  `);

  // Add yield events
  for (const yield_ of Object.values(TREASURY_YIELDS)) {
    insertEvent.run(
      yield_.name,
      yield_.slug,
      yield_.description,
      yield_.importance,
      'Daily'
    );
  }

  // Add auction events
  for (const auction of Object.values(TREASURY_AUCTIONS)) {
    insertEvent.run(
      auction.name,
      auction.slug,
      `U.S. Treasury ${auction.name}`,
      auction.importance,
      auction.frequency
    );
  }

  // Add spread events
  for (const spread of Object.values(YIELD_SPREADS)) {
    insertEvent.run(
      spread.name,
      spread.slug,
      spread.description,
      spread.importance,
      'Daily'
    );
  }

  console.log('Treasury events ensured in database');
}
