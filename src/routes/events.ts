import { Router, Request, Response } from 'express';
import db from '../config/database';
import { EconomicEvent, HistoricalData } from '../types';

const router = Router();

// GET /api/events - List all economic indicators
router.get('/', (req: Request, res: Response) => {
  try {
    const { country, category, importance } = req.query;

    let query = 'SELECT * FROM events WHERE 1=1';
    const params: string[] = [];

    if (country) {
      query += ' AND country = ?';
      params.push(country as string);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category as string);
    }

    if (importance) {
      query += ' AND importance = ?';
      params.push(importance as string);
    }

    query += ' ORDER BY importance DESC, name ASC';

    const events = db.prepare(query).all(...params) as EconomicEvent[];

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/events/categories - List all categories
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM events
      GROUP BY category
      ORDER BY count DESC
    `).all() as Array<{ category: string; count: number }>;

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/events/:slug - Get specific indicator details
router.get('/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const event = db.prepare('SELECT * FROM events WHERE slug = ?').get(slug) as EconomicEvent | undefined;

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // Get upcoming releases
    const upcomingReleases = db.prepare(`
      SELECT * FROM releases
      WHERE event_id = ? AND release_date >= date('now')
      ORDER BY release_date ASC
      LIMIT 5
    `).all(event.id);

    // Get recent releases with actuals
    const recentReleases = db.prepare(`
      SELECT * FROM releases
      WHERE event_id = ? AND release_date < date('now')
      ORDER BY release_date DESC
      LIMIT 12
    `).all(event.id);

    res.json({
      success: true,
      data: {
        ...event,
        upcoming_releases: upcomingReleases,
        recent_releases: recentReleases,
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/events/:slug/history - Get historical data for indicator
router.get('/:slug/history', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { limit = '60' } = req.query;

    const event = db.prepare('SELECT id FROM events WHERE slug = ?').get(slug) as { id: number } | undefined;

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    const history = db.prepare(`
      SELECT date, value, period
      FROM historical_data
      WHERE event_id = ?
      ORDER BY date DESC
      LIMIT ?
    `).all(event.id, parseInt(limit as string)) as HistoricalData[];

    res.json({
      success: true,
      slug,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
