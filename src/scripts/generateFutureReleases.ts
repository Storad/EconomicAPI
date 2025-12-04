/**
 * Generate Future Release Entries
 *
 * This script generates future release dates for major economic indicators.
 * Note: This is a utility script, not required for the API to function.
 */

import db from '../config/database';
import { RELEASE_SCHEDULES, generateFutureReleases } from '../data/releaseSchedules';

async function generateFutureReleasesForAll() {
  console.log('Generating future release entries...');
  console.log('='.repeat(60));

  // Show what schedules we have
  console.log('Available schedules:', Object.keys(RELEASE_SCHEDULES).join(', '));

  // Generate releases for each schedule
  for (const [slug, schedule] of Object.entries(RELEASE_SCHEDULES)) {
    const dates = generateFutureReleases(slug, 3);
    console.log(`${slug}: ${dates.length} future dates generated`);
  }

  // Show upcoming releases from database
  console.log('');
  console.log('UPCOMING RELEASES (next 7 days):');
  console.log('-'.repeat(60));

  const upcoming = db.prepare(`
    SELECT
      e.name,
      e.country,
      e.importance,
      r.release_date,
      r.release_time
    FROM releases r
    JOIN events e ON r.event_id = e.id
    WHERE r.release_date >= date('now')
    AND r.release_date <= date('now', '+7 days')
    ORDER BY r.release_date ASC, r.release_time ASC
  `).all() as any[];

  if (upcoming.length === 0) {
    console.log('No upcoming releases in the next 7 days.');
  } else {
    for (const r of upcoming) {
      console.log(`  ${r.release_date} ${r.release_time || '??:??'} [${r.country}] ${r.name}`);
    }
  }
}

generateFutureReleasesForAll().catch(console.error);
