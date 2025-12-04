import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../config/database';

// Treasury Direct API for auction data
const TREASURY_AUCTIONS_URL = 'https://www.treasurydirect.gov/TA_WS/securities/search';

// Treasury.gov for yield curve data
const TREASURY_YIELDS_URL = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv';

interface TreasuryAuction {
  securityType: string;
  securityTerm: string;
  auctionDate: string;
  issueDate: string;
  maturityDate: string;
  highYield: number | null;
  allocationPercentage: number | null;
  totalAccepted: number | null;
  cusip: string;
}

// Fetch upcoming Treasury auctions
export async function fetchTreasuryAuctions(days: number = 30): Promise<TreasuryAuction[]> {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const response = await axios.get(TREASURY_AUCTIONS_URL, {
      params: {
        format: 'json',
        type: 'Auction',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    if (!response.data || !Array.isArray(response.data)) {
      console.log('No auction data returned');
      return [];
    }

    return response.data.map((auction: any) => ({
      securityType: auction.securityType || '',
      securityTerm: auction.securityTerm || '',
      auctionDate: auction.auctionDate || '',
      issueDate: auction.issueDate || '',
      maturityDate: auction.maturityDate || '',
      highYield: auction.highYield ? parseFloat(auction.highYield) : null,
      allocationPercentage: auction.allocationPercentage ? parseFloat(auction.allocationPercentage) : null,
      totalAccepted: auction.totalAccepted ? parseFloat(auction.totalAccepted) : null,
      cusip: auction.cusip || '',
    }));
  } catch (error) {
    console.error('Error fetching Treasury auctions:', error);
    return [];
  }
}

// Treasury auction schedule mapping to events
const TREASURY_EVENT_MAP: Record<string, string> = {
  'Bill': 'treasury-bill-auction',
  '4-Week Bill': '4-week-bill-auction',
  '8-Week Bill': '8-week-bill-auction',
  '13-Week Bill': '13-week-bill-auction',
  '26-Week Bill': '26-week-bill-auction',
  '52-Week Bill': '52-week-bill-auction',
  'Note': 'treasury-note-auction',
  '2-Year Note': '2y-note-auction',
  '3-Year Note': '3y-note-auction',
  '5-Year Note': '5y-note-auction',
  '7-Year Note': '7y-note-auction',
  '10-Year Note': '10y-note-auction',
  'Bond': 'treasury-bond-auction',
  '20-Year Bond': '20y-bond-auction',
  '30-Year Bond': '30y-bond-auction',
  'TIPS': 'tips-auction',
  'FRN': 'frn-auction',
};

// Sync Treasury auction schedule to releases
export async function syncTreasuryAuctions(): Promise<void> {
  console.log('Fetching Treasury auction schedule...');

  const auctions = await fetchTreasuryAuctions(60);
  console.log(`Found ${auctions.length} Treasury auctions`);

  // First, ensure we have Treasury auction events in the database
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, 'Interest Rates', 'US', ?, 'Treasury', 'https://www.treasurydirect.gov', ?, ?)
  `);

  const treasuryEvents = [
    { name: '4-Week Bill Auction', slug: '4-week-bill-auction', importance: 'low', frequency: 'Weekly' },
    { name: '8-Week Bill Auction', slug: '8-week-bill-auction', importance: 'low', frequency: 'Weekly' },
    { name: '13-Week Bill Auction', slug: '13-week-bill-auction', importance: 'low', frequency: 'Weekly' },
    { name: '26-Week Bill Auction', slug: '26-week-bill-auction', importance: 'low', frequency: 'Weekly' },
    { name: '52-Week Bill Auction', slug: '52-week-bill-auction', importance: 'low', frequency: 'Every 4 weeks' },
    { name: '2-Year Note Auction', slug: '2y-note-auction', importance: 'medium', frequency: 'Monthly' },
    { name: '3-Year Note Auction', slug: '3y-note-auction', importance: 'medium', frequency: 'Monthly' },
    { name: '5-Year Note Auction', slug: '5y-note-auction', importance: 'medium', frequency: 'Monthly' },
    { name: '7-Year Note Auction', slug: '7y-note-auction', importance: 'medium', frequency: 'Monthly' },
    { name: '10-Year Note Auction', slug: '10y-note-auction', importance: 'high', frequency: 'Monthly' },
    { name: '20-Year Bond Auction', slug: '20y-bond-auction', importance: 'medium', frequency: 'Monthly' },
    { name: '30-Year Bond Auction', slug: '30y-bond-auction', importance: 'high', frequency: 'Monthly' },
    { name: 'TIPS Auction', slug: 'tips-auction', importance: 'medium', frequency: 'Monthly' },
  ];

  for (const event of treasuryEvents) {
    insertEvent.run(
      event.name,
      event.slug,
      `U.S. Treasury ${event.name}`,
      event.importance,
      event.frequency
    );
  }

  // Now add releases for each auction
  const getEventBySlug = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, actual, source_url)
    VALUES (?, ?, '11:30 AM', 'America/New_York', ?, 'https://www.treasurydirect.gov')
  `);

  for (const auction of auctions) {
    // Map auction to event slug
    let slug = '';
    const term = auction.securityTerm;
    const type = auction.securityType;

    if (type === 'Bill') {
      if (term.includes('4-Week')) slug = '4-week-bill-auction';
      else if (term.includes('8-Week')) slug = '8-week-bill-auction';
      else if (term.includes('13-Week')) slug = '13-week-bill-auction';
      else if (term.includes('26-Week')) slug = '26-week-bill-auction';
      else if (term.includes('52-Week')) slug = '52-week-bill-auction';
    } else if (type === 'Note') {
      if (term.includes('2-Year')) slug = '2y-note-auction';
      else if (term.includes('3-Year')) slug = '3y-note-auction';
      else if (term.includes('5-Year')) slug = '5y-note-auction';
      else if (term.includes('7-Year')) slug = '7y-note-auction';
      else if (term.includes('10-Year')) slug = '10y-note-auction';
    } else if (type === 'Bond') {
      if (term.includes('20-Year')) slug = '20y-bond-auction';
      else if (term.includes('30-Year')) slug = '30y-bond-auction';
    } else if (type === 'TIPS') {
      slug = 'tips-auction';
    }

    if (slug) {
      const event = getEventBySlug.get(slug) as { id: number } | undefined;
      if (event && auction.auctionDate) {
        try {
          const releaseDate = new Date(auction.auctionDate).toISOString().split('T')[0];
          insertRelease.run(event.id, releaseDate, auction.highYield);
        } catch (err) {
          // Skip invalid dates
        }
      }
    }
  }

  console.log('Treasury auctions synced successfully');
}

// Scrape Treasury yield curve data (daily rates page)
export async function scrapeTreasuryYields(): Promise<void> {
  try {
    console.log('Scraping Treasury yield data...');

    // Treasury publishes daily yield curve rates
    const response = await axios.get('https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView', {
      params: {
        type: 'daily_treasury_yield_curve',
        field_tdr_date_value: new Date().getFullYear(),
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    const $ = cheerio.load(response.data);

    // Parse the table (this is a backup in case FRED doesn't have latest data)
    // The page has a table with columns for each maturity
    const rows = $('table.views-table tbody tr');

    if (rows.length === 0) {
      console.log('No yield data found on Treasury page');
      return;
    }

    // Get the most recent row (first row is usually most recent)
    const latestRow = rows.first();
    const date = latestRow.find('td:first-child').text().trim();

    console.log(`Found Treasury yield data for ${date}`);

  } catch (error) {
    console.error('Error scraping Treasury yields:', error);
  }
}
