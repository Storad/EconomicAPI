import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../config/database';
import { BLSReleaseSchedule, EconomicEvent } from '../types';

const BLS_SCHEDULE_URL = 'https://www.bls.gov/schedule/news_release/';

// Mapping of BLS release names to our standardized format
const BLS_INDICATORS: Record<string, Partial<EconomicEvent>> = {
  'Consumer Price Index': {
    slug: 'cpi',
    name: 'Consumer Price Index (CPI)',
    category: 'Inflation',
    importance: 'high',
    description: 'Measures the average change in prices paid by consumers for goods and services',
    frequency: 'Monthly',
  },
  'Employment Situation': {
    slug: 'employment-situation',
    name: 'Employment Situation (NFP)',
    category: 'Employment',
    importance: 'high',
    description: 'Non-farm payrolls and unemployment rate',
    frequency: 'Monthly',
  },
  'Producer Price Index': {
    slug: 'ppi',
    name: 'Producer Price Index (PPI)',
    category: 'Inflation',
    importance: 'medium',
    description: 'Measures average change in selling prices received by domestic producers',
    frequency: 'Monthly',
  },
  'Job Openings and Labor Turnover': {
    slug: 'jolts',
    name: 'JOLTS Job Openings',
    category: 'Employment',
    importance: 'high',
    description: 'Job openings, hires, and separations',
    frequency: 'Monthly',
  },
  'Real Earnings': {
    slug: 'real-earnings',
    name: 'Real Earnings',
    category: 'Employment',
    importance: 'low',
    description: 'Real average hourly and weekly earnings',
    frequency: 'Monthly',
  },
  'Productivity and Costs': {
    slug: 'productivity',
    name: 'Productivity and Costs',
    category: 'Economy',
    importance: 'medium',
    description: 'Labor productivity and unit labor costs',
    frequency: 'Quarterly',
  },
  'Import and Export Price Indexes': {
    slug: 'import-export-prices',
    name: 'Import/Export Price Index',
    category: 'Inflation',
    importance: 'low',
    description: 'Price changes for imports and exports',
    frequency: 'Monthly',
  },
  'Employment Cost Index': {
    slug: 'eci',
    name: 'Employment Cost Index',
    category: 'Employment',
    importance: 'medium',
    description: 'Measures changes in labor costs',
    frequency: 'Quarterly',
  },
};

export async function scrapeBLSSchedule(): Promise<BLSReleaseSchedule[]> {
  try {
    console.log('Scraping BLS release schedule...');
    const response = await axios.get(BLS_SCHEDULE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    const $ = cheerio.load(response.data);
    const releases: BLSReleaseSchedule[] = [];

    // BLS schedule page has a table with release dates
    $('table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const releaseName = $(cells[0]).text().trim();
        const releaseInfo = $(cells[1]).text().trim();

        // Parse the date from the release info
        // Format is typically "Month Day, Year at Time"
        const dateMatch = releaseInfo.match(/(\w+ \d+, \d{4})/);
        const timeMatch = releaseInfo.match(/(\d{1,2}:\d{2} [AP]M)/i);

        if (dateMatch && releaseName) {
          releases.push({
            name: releaseName,
            date: dateMatch[1],
            time: timeMatch ? timeMatch[1] : '8:30 AM',
          });
        }
      }
    });

    console.log(`Found ${releases.length} BLS releases`);
    return releases;
  } catch (error) {
    console.error('Error scraping BLS schedule:', error);
    return [];
  }
}

export async function syncBLSEvents(): Promise<void> {
  // First, ensure all BLS indicators are in the events table
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, ?, 'US', ?, 'BLS', 'https://www.bls.gov', ?, ?)
  `);

  for (const [_, indicator] of Object.entries(BLS_INDICATORS)) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.description,
      indicator.importance,
      indicator.frequency
    );
  }

  // Scrape the schedule and add releases
  const schedule = await scrapeBLSSchedule();

  const getEventByName = db.prepare('SELECT id FROM events WHERE name LIKE ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, source_url)
    VALUES (?, ?, ?, 'America/New_York', ?)
  `);

  for (const release of schedule) {
    // Find matching indicator
    for (const [blsName, indicator] of Object.entries(BLS_INDICATORS)) {
      if (release.name.includes(blsName) || blsName.includes(release.name.split('(')[0].trim())) {
        const event = getEventByName.get(`%${indicator.name}%`) as { id: number } | undefined;
        if (event) {
          try {
            const releaseDate = new Date(release.date).toISOString().split('T')[0];
            insertRelease.run(
              event.id,
              releaseDate,
              release.time,
              BLS_SCHEDULE_URL
            );
          } catch (err) {
            console.error(`Error parsing date for ${release.name}:`, err);
          }
        }
        break;
      }
    }
  }

  console.log('BLS events synced successfully');
}
