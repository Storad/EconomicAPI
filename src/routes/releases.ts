import { Router, Request, Response } from 'express';
import db from '../config/database';

const router = Router();

// GET /api/releases/latest - Get latest release for each indicator
router.get('/latest', (req: Request, res: Response) => {
  try {
    const { country, category, importance } = req.query;

    let query = `
      SELECT
        e.name,
        e.slug,
        e.category,
        e.country,
        e.importance,
        r.release_date,
        r.release_time,
        r.actual,
        r.forecast,
        r.previous,
        r.unit,
        r.source_url
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date <= date('now')
      AND r.actual IS NOT NULL
      AND r.id = (
        SELECT r2.id FROM releases r2
        WHERE r2.event_id = e.id
        AND r2.release_date <= date('now')
        AND r2.actual IS NOT NULL
        ORDER BY r2.release_date DESC
        LIMIT 1
      )
    `;

    const params: string[] = [];

    if (country) {
      query += ' AND e.country = ?';
      params.push(country as string);
    }

    if (category) {
      query += ' AND e.category = ?';
      params.push(category as string);
    }

    if (importance) {
      query += ' AND e.importance = ?';
      params.push(importance as string);
    }

    query += ' ORDER BY e.importance DESC, e.name ASC';

    const releases = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: releases.length,
      data: releases,
    });
  } catch (error) {
    console.error('Error fetching latest releases:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/releases/upcoming - Get upcoming releases
router.get('/upcoming', (req: Request, res: Response) => {
  try {
    const { days = '7', country, importance } = req.query;

    let query = `
      SELECT
        e.name,
        e.slug,
        e.category,
        e.country,
        e.importance,
        e.description,
        r.release_date,
        r.release_time,
        r.timezone,
        r.forecast,
        r.previous,
        r.unit,
        r.period,
        r.source_url
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date >= date('now')
      AND r.release_date <= date('now', '+' || ? || ' days')
    `;

    const params: (string | number)[] = [parseInt(days as string)];

    if (country) {
      query += ' AND e.country = ?';
      params.push(country as string);
    }

    if (importance) {
      query += ' AND e.importance = ?';
      params.push(importance as string);
    }

    query += ' ORDER BY r.release_date ASC, r.release_time ASC';

    const releases = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: releases.length,
      data: releases,
    });
  } catch (error) {
    console.error('Error fetching upcoming releases:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/releases/high-impact - Get high impact events
router.get('/high-impact', (req: Request, res: Response) => {
  try {
    const { days = '7' } = req.query;

    const releases = db.prepare(`
      SELECT
        e.name,
        e.slug,
        e.category,
        e.country,
        e.description,
        r.release_date,
        r.release_time,
        r.timezone,
        r.actual,
        r.forecast,
        r.previous,
        r.unit,
        r.source_url
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE e.importance = 'high'
      AND r.release_date >= date('now')
      AND r.release_date <= date('now', '+' || ? || ' days')
      ORDER BY r.release_date ASC, r.release_time ASC
    `).all(parseInt(days as string));

    res.json({
      success: true,
      count: releases.length,
      data: releases,
    });
  } catch (error) {
    console.error('Error fetching high-impact releases:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
