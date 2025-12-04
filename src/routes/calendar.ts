import { Router, Request, Response } from 'express';
import db from '../config/database';
import { CalendarEvent, EcontimelineEvent } from '../types';
import { getIndicatorMetadata, getCurrencyForCountry } from '../data/indicators';

const router = Router();

// Helper function to enrich an event with metadata
function enrichEvent(event: any): CalendarEvent {
  const metadata = getIndicatorMetadata(event.name);
  const currency = getCurrencyForCountry(event.country);

  return {
    ...event,
    currency,
    why_it_matters: metadata?.whyItMatters,
    typical_reaction: metadata?.typicalReaction,
    related_assets: metadata?.relatedAssets,
    historical_volatility: metadata?.historicalVolatility,
  };
}

// Helper to convert to Econtimeline format
function toEcontimelineFormat(event: any): EcontimelineEvent {
  const metadata = getIndicatorMetadata(event.name);
  const currency = getCurrencyForCountry(event.country);

  // Format values with units
  const formatValue = (val: number | null, unit: string | null): string | null => {
    if (val === null || val === undefined) return null;
    return unit ? `${val}${unit}` : `${val}`;
  };

  return {
    id: `event-${event.id}`,
    date: event.release_date,
    time: event.release_time || '00:00',
    currency,
    event: event.name,
    impact: event.importance,
    forecast: formatValue(event.forecast, event.unit),
    previous: formatValue(event.previous, event.unit),
    actual: formatValue(event.actual, event.unit),
    category: event.category,
    country: event.country,
    source: event.source || 'FRED',
    sourceUrl: event.source_url,
    description: metadata?.description || event.description,
    whyItMatters: metadata?.whyItMatters,
    frequency: metadata?.frequency || event.frequency,
    typicalReaction: metadata?.typicalReaction,
    relatedAssets: metadata?.relatedAssets,
    historicalVolatility: metadata?.historicalVolatility,
  };
}

// GET /api/calendar/today - Get today's economic events
router.get('/today', (req: Request, res: Response) => {
  try {
    const { country, importance, format } = req.query;

    let query = `
      SELECT
        r.id,
        e.name,
        e.slug,
        e.category,
        e.country,
        e.importance,
        e.description,
        e.source,
        e.source_url,
        e.frequency,
        r.release_date,
        r.release_time,
        r.timezone,
        r.actual,
        r.forecast,
        r.previous,
        r.unit,
        r.period
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date = date('now')
    `;

    const params: string[] = [];

    if (country) {
      query += ' AND e.country = ?';
      params.push(country as string);
    }

    if (importance) {
      query += ' AND e.importance = ?';
      params.push(importance as string);
    }

    query += ' ORDER BY r.release_time ASC';

    const events = db.prepare(query).all(...params) as any[];

    // Return Econtimeline format if requested
    if (format === 'econtimeline') {
      const formattedEvents = events.map(toEcontimelineFormat);
      res.json({
        events: formattedEvents,
        lastUpdated: new Date().toISOString(),
        isRealData: true,
        meta: {
          totalEvents: formattedEvents.length,
          dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
        },
      });
      return;
    }

    // Default enriched format
    const enrichedEvents = events.map(enrichEvent);

    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      count: enrichedEvents.length,
      data: enrichedEvents,
    });
  } catch (error) {
    console.error('Error fetching today\'s calendar:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calendar/week - Get this week's economic events
router.get('/week', (req: Request, res: Response) => {
  try {
    const { country, importance, format } = req.query;

    let query = `
      SELECT
        r.id,
        e.name,
        e.slug,
        e.category,
        e.country,
        e.importance,
        e.description,
        e.source,
        e.source_url,
        e.frequency,
        r.release_date,
        r.release_time,
        r.timezone,
        r.actual,
        r.forecast,
        r.previous,
        r.unit,
        r.period
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date >= date('now')
      AND r.release_date <= date('now', '+7 days')
    `;

    const params: string[] = [];

    if (country) {
      query += ' AND e.country = ?';
      params.push(country as string);
    }

    if (importance) {
      query += ' AND e.importance = ?';
      params.push(importance as string);
    }

    query += ' ORDER BY r.release_date ASC, r.release_time ASC';

    const events = db.prepare(query).all(...params) as any[];

    // Return Econtimeline format if requested
    if (format === 'econtimeline') {
      const formattedEvents = events.map(toEcontimelineFormat);
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      res.json({
        events: formattedEvents,
        lastUpdated: new Date().toISOString(),
        isRealData: true,
        meta: {
          totalEvents: formattedEvents.length,
          dateRange: { start: startDate, end: endDate },
        },
      });
      return;
    }

    // Default: Group by date with enrichment
    const enrichedEvents = events.map(enrichEvent);
    const groupedEvents = enrichedEvents.reduce((acc, event) => {
      const date = event.release_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);

    res.json({
      success: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: enrichedEvents.length,
      data: groupedEvents,
    });
  } catch (error) {
    console.error('Error fetching week calendar:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calendar/range - Get events in a date range
router.get('/range', (req: Request, res: Response) => {
  try {
    const { start, end, country, importance, category, currency, format } = req.query;

    if (!start || !end) {
      res.status(400).json({
        success: false,
        error: 'start and end query parameters are required',
      });
      return;
    }

    let query = `
      SELECT
        r.id,
        e.name,
        e.slug,
        e.category,
        e.country,
        e.importance,
        e.description,
        e.source,
        e.source_url,
        e.frequency,
        r.release_date,
        r.release_time,
        r.timezone,
        r.actual,
        r.forecast,
        r.previous,
        r.unit,
        r.period
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date >= ? AND r.release_date <= ?
    `;

    const params: string[] = [start as string, end as string];

    if (country) {
      query += ' AND e.country = ?';
      params.push(country as string);
    }

    if (importance) {
      query += ' AND e.importance = ?';
      params.push(importance as string);
    }

    if (category) {
      query += ' AND e.category = ?';
      params.push(category as string);
    }

    query += ' ORDER BY r.release_date ASC, r.release_time ASC';

    let events = db.prepare(query).all(...params) as any[];

    // Filter by currency if specified (post-query since currency is derived)
    if (currency && currency !== 'all') {
      events = events.filter(e => getCurrencyForCountry(e.country) === (currency as string).toUpperCase());
    }

    // Return Econtimeline format if requested
    if (format === 'econtimeline') {
      const formattedEvents = events.map(toEcontimelineFormat);
      res.json({
        events: formattedEvents,
        lastUpdated: new Date().toISOString(),
        isRealData: true,
        meta: {
          totalEvents: formattedEvents.length,
          dateRange: { start: start as string, end: end as string },
        },
      });
      return;
    }

    // Default enriched format
    const enrichedEvents = events.map(enrichEvent);

    res.json({
      success: true,
      start_date: start,
      end_date: end,
      count: enrichedEvents.length,
      data: enrichedEvents,
    });
  } catch (error) {
    console.error('Error fetching calendar range:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calendar/econtimeline - Econtimeline-compatible endpoint
// This is a convenience endpoint that matches Econtimeline's expected format exactly
router.get('/econtimeline', (req: Request, res: Response) => {
  try {
    const { currency, impact, category, start, end } = req.query;

    // Default to 30 days range
    const startDate = start as string || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `
      SELECT
        r.id,
        e.name,
        e.slug,
        e.category,
        e.country,
        e.importance,
        e.description,
        e.source,
        e.source_url,
        e.frequency,
        r.release_date,
        r.release_time,
        r.timezone,
        r.actual,
        r.forecast,
        r.previous,
        r.unit,
        r.period
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date >= ? AND r.release_date <= ?
    `;

    const params: string[] = [startDate, endDate];

    if (impact && impact !== 'all') {
      query += ' AND e.importance = ?';
      params.push(impact as string);
    }

    if (category && category !== 'all') {
      query += ' AND e.category = ?';
      params.push(category as string);
    }

    query += ' ORDER BY r.release_date ASC, r.release_time ASC';

    let events = db.prepare(query).all(...params) as any[];

    // Filter by currency if specified
    if (currency && currency !== 'all') {
      events = events.filter(e => getCurrencyForCountry(e.country) === (currency as string).toUpperCase());
    }

    const formattedEvents = events.map(toEcontimelineFormat);

    // Sort by date and time
    formattedEvents.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    res.json({
      events: formattedEvents,
      lastUpdated: new Date().toISOString(),
      isRealData: true,
      meta: {
        totalEvents: formattedEvents.length,
        dateRange: { start: startDate, end: endDate },
      },
    });
  } catch (error) {
    console.error('Error fetching econtimeline calendar:', error);
    res.status(500).json({
      events: [],
      lastUpdated: new Date().toISOString(),
      isRealData: false,
      error: 'Internal server error',
    });
  }
});

export default router;
