import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../config/database';

// Census Bureau release schedule page
const CENSUS_SCHEDULE_URL = 'https://www.census.gov/economic-indicators/calendar-listview.html';

interface CensusRelease {
  name: string;
  date: string;
  time: string;
  description: string;
}

// Map Census releases to our event slugs
const CENSUS_EVENT_MAP: Record<string, { slug: string; importance: 'high' | 'medium' | 'low' }> = {
  'Advance Monthly Sales for Retail and Food Services': { slug: 'retail-sales', importance: 'high' },
  'Monthly Retail Trade': { slug: 'retail-sales', importance: 'high' },
  'Retail Sales': { slug: 'retail-sales', importance: 'high' },
  'New Residential Construction': { slug: 'housing-starts', importance: 'medium' },
  'Housing Starts': { slug: 'housing-starts', importance: 'medium' },
  'Building Permits': { slug: 'building-permits', importance: 'medium' },
  'New Residential Sales': { slug: 'new-home-sales', importance: 'medium' },
  'New Home Sales': { slug: 'new-home-sales', importance: 'medium' },
  'Manufacturers\' Shipments, Inventories, and Orders': { slug: 'durable-goods', importance: 'medium' },
  'Durable Goods': { slug: 'durable-goods', importance: 'medium' },
  'Advance Durable Goods': { slug: 'durable-goods', importance: 'medium' },
  'Construction Spending': { slug: 'construction-spending', importance: 'low' },
  'Wholesale Trade': { slug: 'wholesale-trade', importance: 'low' },
  'Business Inventories': { slug: 'business-inventories', importance: 'low' },
  'International Trade in Goods and Services': { slug: 'trade-balance', importance: 'medium' },
  'Trade Balance': { slug: 'trade-balance', importance: 'medium' },
};

// Scrape Census Bureau economic indicator release schedule
export async function scrapeCensusSchedule(): Promise<CensusRelease[]> {
  try {
    console.log('Scraping Census Bureau release schedule...');

    const response = await axios.get(CENSUS_SCHEDULE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    const $ = cheerio.load(response.data);
    const releases: CensusRelease[] = [];

    // Census calendar typically has a list or table format
    $('.calendar-list-item, .release-item, tr').each((_, element) => {
      const text = $(element).text();

      // Try to extract date and release name
      // Format varies but often includes dates like "January 15, 2025"
      const dateMatch = text.match(/(\w+\s+\d{1,2},?\s+\d{4})/);
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/);

      if (dateMatch) {
        // Find which release this is
        for (const [releaseName, mapping] of Object.entries(CENSUS_EVENT_MAP)) {
          if (text.toLowerCase().includes(releaseName.toLowerCase())) {
            releases.push({
              name: releaseName,
              date: dateMatch[1],
              time: timeMatch ? timeMatch[1] : '8:30 AM',
              description: text.trim().slice(0, 200),
            });
            break;
          }
        }
      }
    });

    console.log(`Found ${releases.length} Census releases`);
    return releases;
  } catch (error) {
    console.error('Error scraping Census schedule:', error);
    return [];
  }
}

// Ensure Census-related events exist in database
export async function ensureCensusEvents(): Promise<void> {
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'US', ?, 'Census Bureau', 'https://www.census.gov', ?, 'Monthly')
  `);

  const censusEvents = [
    {
      name: 'Retail Sales',
      slug: 'retail-sales',
      category: 'Consumer',
      description: 'Advance Monthly Sales for Retail and Food Services',
      importance: 'high',
    },
    {
      name: 'Retail Sales Ex-Auto',
      slug: 'retail-sales-ex-auto',
      category: 'Consumer',
      description: 'Retail sales excluding automobiles',
      importance: 'high',
    },
    {
      name: 'Housing Starts',
      slug: 'housing-starts',
      category: 'Housing',
      description: 'New residential construction starts',
      importance: 'medium',
    },
    {
      name: 'Building Permits',
      slug: 'building-permits',
      category: 'Housing',
      description: 'New privately-owned housing units authorized by building permits',
      importance: 'medium',
    },
    {
      name: 'New Home Sales',
      slug: 'new-home-sales',
      category: 'Housing',
      description: 'Sales of new single-family houses',
      importance: 'medium',
    },
    {
      name: 'Existing Home Sales',
      slug: 'existing-home-sales',
      category: 'Housing',
      description: 'Sales of existing homes (from NAR)',
      importance: 'medium',
    },
    {
      name: 'Durable Goods Orders',
      slug: 'durable-goods',
      category: 'Manufacturing',
      description: 'New orders for manufactured durable goods',
      importance: 'medium',
    },
    {
      name: 'Factory Orders',
      slug: 'factory-orders',
      category: 'Manufacturing',
      description: 'Manufacturers\' shipments, inventories, and orders',
      importance: 'medium',
    },
    {
      name: 'Construction Spending',
      slug: 'construction-spending',
      category: 'Housing',
      description: 'Value of construction put in place',
      importance: 'low',
    },
    {
      name: 'Business Inventories',
      slug: 'business-inventories',
      category: 'Economy',
      description: 'Business inventories and sales',
      importance: 'low',
    },
    {
      name: 'Wholesale Trade',
      slug: 'wholesale-trade',
      category: 'Economy',
      description: 'Monthly wholesale trade data',
      importance: 'low',
    },
  ];

  for (const event of censusEvents) {
    insertEvent.run(event.name, event.slug, event.category, event.description, event.importance);
  }

  console.log('Census events ensured in database');
}

// Sync Census releases to database
export async function syncCensusEvents(): Promise<void> {
  await ensureCensusEvents();

  const releases = await scrapeCensusSchedule();

  const getEventBySlug = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, source_url)
    VALUES (?, ?, ?, 'America/New_York', 'https://www.census.gov/economic-indicators/')
  `);

  for (const release of releases) {
    const mapping = Object.entries(CENSUS_EVENT_MAP).find(([name]) =>
      release.name.toLowerCase().includes(name.toLowerCase())
    );

    if (mapping) {
      const event = getEventBySlug.get(mapping[1].slug) as { id: number } | undefined;
      if (event) {
        try {
          const releaseDate = new Date(release.date).toISOString().split('T')[0];
          insertRelease.run(event.id, releaseDate, release.time);
        } catch (err) {
          // Skip invalid dates
        }
      }
    }
  }

  console.log('Census events synced');
}

// Known Census release schedule (as backup)
export const CENSUS_SCHEDULE_2025 = [
  // Retail Sales (typically mid-month)
  { slug: 'retail-sales', dates: ['2025-01-16', '2025-02-14', '2025-03-14', '2025-04-15', '2025-05-15', '2025-06-17', '2025-07-16', '2025-08-14', '2025-09-16', '2025-10-16', '2025-11-14', '2025-12-16'] },
  // Housing Starts (typically mid-month)
  { slug: 'housing-starts', dates: ['2025-01-17', '2025-02-19', '2025-03-18', '2025-04-17', '2025-05-16', '2025-06-18', '2025-07-17', '2025-08-19', '2025-09-18', '2025-10-17', '2025-11-19', '2025-12-17'] },
  // New Home Sales (typically end of month)
  { slug: 'new-home-sales', dates: ['2025-01-27', '2025-02-26', '2025-03-25', '2025-04-23', '2025-05-23', '2025-06-25', '2025-07-24', '2025-08-26', '2025-09-25', '2025-10-24', '2025-11-25', '2025-12-23'] },
  // Durable Goods (typically late month)
  { slug: 'durable-goods', dates: ['2025-01-28', '2025-02-27', '2025-03-26', '2025-04-24', '2025-05-27', '2025-06-26', '2025-07-25', '2025-08-27', '2025-09-26', '2025-10-28', '2025-11-26', '2025-12-24'] },
];

// Sync known Census schedule (use as backup)
export async function syncKnownCensusSchedule(): Promise<void> {
  console.log('Syncing known Census schedule...');

  await ensureCensusEvents();

  const getEventBySlug = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, source_url)
    VALUES (?, ?, '8:30 AM', 'America/New_York', 'https://www.census.gov/economic-indicators/')
  `);

  for (const schedule of CENSUS_SCHEDULE_2025) {
    const event = getEventBySlug.get(schedule.slug) as { id: number } | undefined;
    if (event) {
      for (const date of schedule.dates) {
        insertRelease.run(event.id, date);
      }
    }
  }

  console.log('Known Census schedule synced');
}
