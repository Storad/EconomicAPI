import db from '../config/database';

const releases = db.prepare(`
  SELECT
    e.name,
    e.country,
    e.category,
    e.importance,
    r.release_date,
    r.actual,
    r.previous,
    r.forecast,
    r.unit
  FROM releases r
  JOIN events e ON r.event_id = e.id
  WHERE r.release_date >= date('now')
  ORDER BY r.release_date ASC
  LIMIT 30
`).all() as any[];

console.log('UPCOMING ECONOMIC EVENTS');
console.log('='.repeat(80));
console.log('');

let currentDate = '';
for (const r of releases) {
  if (r.release_date !== currentDate) {
    currentDate = r.release_date;
    console.log('--- ' + currentDate + ' ---');
  }
  const imp = r.importance === 'high' ? '***' : r.importance === 'medium' ? '**' : '*';
  const prev = r.previous !== null ? r.previous : 'N/A';
  const fcst = r.forecast !== null ? r.forecast : 'N/A';
  console.log(`  ${imp} [${r.country}] ${r.name}`);
  console.log(`       Category: ${r.category} | Previous: ${prev} ${r.unit || ''} | Forecast: ${fcst}`);
}

if (releases.length === 0) {
  console.log('No upcoming releases found in database.');
  console.log('');
  console.log('Checking total releases...');
  const total = db.prepare('SELECT COUNT(*) as count FROM releases').get() as any;
  console.log(`Total releases in DB: ${total.count}`);

  const recent = db.prepare(`
    SELECT e.name, e.country, r.release_date, r.actual
    FROM releases r
    JOIN events e ON r.event_id = e.id
    ORDER BY r.release_date DESC
    LIMIT 10
  `).all() as any[];
  console.log('\nMost recent releases:');
  for (const r of recent) {
    console.log(`  ${r.release_date} [${r.country}] ${r.name}: ${r.actual}`);
  }
}
