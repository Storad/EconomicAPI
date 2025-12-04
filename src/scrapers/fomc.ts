import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../config/database';

const FOMC_CALENDAR_URL = 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';

interface FOMCMeeting {
  date: string;
  type: 'meeting' | 'minutes' | 'statement' | 'press-conference';
  description: string;
}

// Scrape FOMC calendar for meeting dates
export async function scrapeFOMCCalendar(): Promise<FOMCMeeting[]> {
  try {
    console.log('Scraping FOMC calendar...');

    const response = await axios.get(FOMC_CALENDAR_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicDataAPI/1.0)',
      },
    });

    const $ = cheerio.load(response.data);
    const meetings: FOMCMeeting[] = [];

    // The FOMC calendar page has panels for each year
    // Each panel contains meeting dates
    $('.panel').each((_, panel) => {
      const yearText = $(panel).find('.panel-heading').text();
      const yearMatch = yearText.match(/\d{4}/);
      if (!yearMatch) return;

      const year = yearMatch[0];

      // Find meeting rows
      $(panel).find('.fomc-meeting').each((_, meetingRow) => {
        const monthText = $(meetingRow).find('.fomc-meeting__month').text().trim();
        const dateText = $(meetingRow).find('.fomc-meeting__date').text().trim();

        // Parse the date (format: "January 28-29" or "January 29*")
        if (monthText && dateText) {
          // Extract the last day of the meeting (when statement is released)
          const dayMatch = dateText.match(/(\d+)(?:\*)?$/);
          if (dayMatch) {
            const day = dayMatch[1].padStart(2, '0');
            const month = getMonthNumber(monthText);
            if (month) {
              const meetingDate = `${year}-${month}-${day}`;
              meetings.push({
                date: meetingDate,
                type: 'meeting',
                description: `FOMC Meeting - ${monthText} ${dateText}`,
              });
            }
          }
        }
      });
    });

    // Alternative parsing for table format
    $('table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const dateCell = $(cells[0]).text().trim();
          const typeCell = $(cells[1]).text().trim();

          // Try to parse the date
          const dateMatch = dateCell.match(/(\w+)\s+(\d+)(?:-(\d+))?,?\s*(\d{4})?/);
          if (dateMatch) {
            const month = getMonthNumber(dateMatch[1]);
            const day = (dateMatch[3] || dateMatch[2]).padStart(2, '0');
            const year = dateMatch[4] || new Date().getFullYear().toString();

            if (month) {
              const meetingDate = `${year}-${month}-${day}`;

              if (typeCell.toLowerCase().includes('meeting')) {
                meetings.push({
                  date: meetingDate,
                  type: 'meeting',
                  description: typeCell,
                });
              } else if (typeCell.toLowerCase().includes('minutes')) {
                meetings.push({
                  date: meetingDate,
                  type: 'minutes',
                  description: typeCell,
                });
              }
            }
          }
        }
      });
    });

    console.log(`Found ${meetings.length} FOMC events`);
    return meetings;
  } catch (error) {
    console.error('Error scraping FOMC calendar:', error);
    return [];
  }
}

function getMonthNumber(monthName: string): string | null {
  const months: Record<string, string> = {
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09', 'sept': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12',
  };

  return months[monthName.toLowerCase()] || null;
}

// Sync FOMC events to database
export async function syncFOMCEvents(): Promise<void> {
  const meetings = await scrapeFOMCCalendar();

  // Ensure FOMC events exist
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, 'Central Bank', 'US', ?, 'Federal Reserve', 'https://www.federalreserve.gov', 'high', ?)
  `);

  const fomcEvents = [
    {
      name: 'FOMC Meeting',
      slug: 'fomc-meeting',
      description: 'Federal Open Market Committee interest rate decision and statement',
      frequency: 'Every 6 weeks',
    },
    {
      name: 'FOMC Minutes',
      slug: 'fomc-minutes',
      description: 'Detailed record of FOMC meeting discussions released 3 weeks after meeting',
      frequency: '3 weeks after meeting',
    },
    {
      name: 'Fed Chair Press Conference',
      slug: 'fed-press-conference',
      description: 'Federal Reserve Chair press conference following FOMC meeting',
      frequency: 'After select meetings',
    },
    {
      name: 'Fed Beige Book',
      slug: 'beige-book',
      description: 'Summary of economic conditions by Federal Reserve district',
      frequency: '8 times per year',
    },
  ];

  for (const event of fomcEvents) {
    insertEvent.run(event.name, event.slug, event.description, event.frequency);
  }

  // Add releases for meetings
  const getEventBySlug = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, source_url)
    VALUES (?, ?, ?, 'America/New_York', 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm')
  `);

  const fomcMeetingEvent = getEventBySlug.get('fomc-meeting') as { id: number } | undefined;
  const fomcMinutesEvent = getEventBySlug.get('fomc-minutes') as { id: number } | undefined;

  for (const meeting of meetings) {
    if (meeting.type === 'meeting' && fomcMeetingEvent) {
      insertRelease.run(fomcMeetingEvent.id, meeting.date, '2:00 PM');
    } else if (meeting.type === 'minutes' && fomcMinutesEvent) {
      insertRelease.run(fomcMinutesEvent.id, meeting.date, '2:00 PM');
    }
  }

  console.log('FOMC events synced successfully');
}

// Known FOMC meeting dates for 2024-2025 (as backup if scraping fails)
export const FOMC_SCHEDULE_2024_2025 = [
  // 2024
  { date: '2024-01-31', type: 'meeting' },
  { date: '2024-03-20', type: 'meeting' },
  { date: '2024-05-01', type: 'meeting' },
  { date: '2024-06-12', type: 'meeting' },
  { date: '2024-07-31', type: 'meeting' },
  { date: '2024-09-18', type: 'meeting' },
  { date: '2024-11-07', type: 'meeting' },
  { date: '2024-12-18', type: 'meeting' },
  // 2025
  { date: '2025-01-29', type: 'meeting' },
  { date: '2025-03-19', type: 'meeting' },
  { date: '2025-05-07', type: 'meeting' },
  { date: '2025-06-18', type: 'meeting' },
  { date: '2025-07-30', type: 'meeting' },
  { date: '2025-09-17', type: 'meeting' },
  { date: '2025-11-05', type: 'meeting' },
  { date: '2025-12-17', type: 'meeting' },
];

// Sync known FOMC schedule (use as backup)
export async function syncKnownFOMCSchedule(): Promise<void> {
  console.log('Syncing known FOMC schedule...');

  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, description, source, source_url, importance, frequency)
    VALUES (?, ?, 'Central Bank', 'US', ?, 'Federal Reserve', 'https://www.federalreserve.gov', 'high', ?)
  `);

  insertEvent.run(
    'FOMC Meeting',
    'fomc-meeting',
    'Federal Open Market Committee interest rate decision and statement',
    'Every 6 weeks'
  );

  const getEventBySlug = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, source_url)
    VALUES (?, ?, '2:00 PM', 'America/New_York', 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm')
  `);

  const fomcEvent = getEventBySlug.get('fomc-meeting') as { id: number } | undefined;

  if (fomcEvent) {
    for (const meeting of FOMC_SCHEDULE_2024_2025) {
      insertRelease.run(fomcEvent.id, meeting.date);
    }
  }

  console.log('Known FOMC schedule synced');
}
