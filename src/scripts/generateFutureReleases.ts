/**
 * Generate Future Release Entries
 *
 * This script generates future release dates for all major economic indicators
 * based on their typical release schedules.
 */

import db from '../config/database';
import { ALL_RELEASE_SCHEDULES, generateFutureReleases } from '../data/releaseSchedules';
import { getIndicatorMetadata, getCurrencyForCountry } from '../data/indicators';

// Ensure events exist in database
function ensureEvent(schedule: typeof ALL_RELEASE_SCHEDULES[0]): number {
  const metadata = getIndicatorMetadata(schedule.name);

  // Check if event exists
  const existing = db.prepare('SELECT id FROM events WHERE slug = ?').get(schedule.slug) as { id: number } | undefined;

  if (existing) {
    return existing.id;
  }

  // Insert new event
  const result = db.prepare(`
    INSERT INTO events (
      name, slug, category, country, currency, description, why_it_matters,
      source, importance, frequency, release_time,
      typical_reaction_higher, typical_reaction_lower,
      typical_reaction_hawkish, typical_reaction_dovish,
      related_assets, historical_volatility
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    schedule.name,
    schedule.slug,
    schedule.category,
    schedule.country,
    getCurrencyForCountry(schedule.country),
    metadata?.description || `${schedule.name} economic indicator`,
    metadata?.whyItMatters || null,
    schedule.source,
    schedule.importance,
    metadata?.frequency || schedule.pattern,
    schedule.releaseTime,
    metadata?.typicalReaction?.higherThanExpected || null,
    metadata?.typicalReaction?.lowerThanExpected || null,
    metadata?.typicalReaction?.hawkish || null,
    metadata?.typicalReaction?.dovish || null,
    metadata?.relatedAssets?.join(', ') || null,
    metadata?.historicalVolatility || null
  );

  return result.lastInsertRowid as number;
}

// Insert release entry
function insertRelease(eventId: number, date: string, time: string, timezone: string): boolean {
  // Check if release already exists
  const existing = db.prepare(`
    SELECT id FROM releases WHERE event_id = ? AND release_date = ?
  `).get(eventId, date);

  if (existing) {
    return false; // Already exists
  }

  db.prepare(`
    INSERT INTO releases (event_id, release_date, release_time, timezone)
    VALUES (?, ?, ?, ?)
  `).run(eventId, date, time, timezone);

  return true;
}

async function generateFutureReleasesForAll() {
  console.log('Generating future release entries...');
  console.log('='.repeat(60));

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3); // Generate 3 months ahead

  console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log('');

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const schedule of ALL_RELEASE_SCHEDULES) {
    const eventId = ensureEvent(schedule);
    const releases = generateFutureReleases(schedule, startDate, endDate);

    let added = 0;
    let skipped = 0;

    for (const release of releases) {
      const wasAdded = insertRelease(eventId, release.date, release.time, schedule.timezone);
      if (wasAdded) {
        added++;
      } else {
        skipped++;
      }
    }

    if (added > 0 || releases.length > 0) {
      console.log(`${schedule.name} (${schedule.country}): ${added} added, ${skipped} existing`);
    }

    totalAdded += added;
    totalSkipped += skipped;
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Total: ${totalAdded} releases added, ${totalSkipped} already existed`);

  // Show upcoming releases
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

  let currentDate = '';
  for (const r of upcoming) {
    if (r.release_date !== currentDate) {
      currentDate = r.release_date;
      console.log(`\n--- ${currentDate} ---`);
    }
    const imp = r.importance === 'high' ? '***' : r.importance === 'medium' ? '**' : '*';
    console.log(`  ${r.release_time || '??:??'} ${imp} [${r.country}] ${r.name}`);
  }

  if (upcoming.length === 0) {
    console.log('No upcoming releases in the next 7 days.');
  }
}

// Run the script
generateFutureReleasesForAll().catch(console.error);
