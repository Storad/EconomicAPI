/**
 * Database Migration Script
 *
 * Adds new columns to the events table for enrichment data.
 */

import db from '../config/database';

function migrate() {
  console.log('Running database migration...');
  console.log('='.repeat(60));

  // Check existing columns
  const tableInfo = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
  const existingColumns = new Set(tableInfo.map(col => col.name));

  console.log('Existing columns:', Array.from(existingColumns).join(', '));

  // New columns to add
  const newColumns = [
    { name: 'currency', sql: 'ALTER TABLE events ADD COLUMN currency TEXT' },
    { name: 'why_it_matters', sql: 'ALTER TABLE events ADD COLUMN why_it_matters TEXT' },
    { name: 'release_time', sql: 'ALTER TABLE events ADD COLUMN release_time TEXT' },
    { name: 'typical_reaction_higher', sql: 'ALTER TABLE events ADD COLUMN typical_reaction_higher TEXT' },
    { name: 'typical_reaction_lower', sql: 'ALTER TABLE events ADD COLUMN typical_reaction_lower TEXT' },
    { name: 'typical_reaction_hawkish', sql: 'ALTER TABLE events ADD COLUMN typical_reaction_hawkish TEXT' },
    { name: 'typical_reaction_dovish', sql: 'ALTER TABLE events ADD COLUMN typical_reaction_dovish TEXT' },
    { name: 'related_assets', sql: 'ALTER TABLE events ADD COLUMN related_assets TEXT' },
    { name: 'historical_volatility', sql: 'ALTER TABLE events ADD COLUMN historical_volatility TEXT' },
  ];

  let added = 0;
  let skipped = 0;

  for (const column of newColumns) {
    if (existingColumns.has(column.name)) {
      console.log(`  [SKIP] Column '${column.name}' already exists`);
      skipped++;
    } else {
      try {
        db.exec(column.sql);
        console.log(`  [ADD] Added column '${column.name}'`);
        added++;
      } catch (error: any) {
        console.error(`  [ERROR] Failed to add column '${column.name}':`, error.message);
      }
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Migration complete: ${added} columns added, ${skipped} already existed`);

  // Verify
  const newTableInfo = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
  console.log('\nFinal columns:', newTableInfo.map(col => col.name).join(', '));
}

migrate();
