import { Router, Request, Response } from 'express';
import db from '../config/database';
import { MarketSession } from '../types';

const router = Router();

// GET /api/sessions - Get all market sessions
router.get('/', (_req: Request, res: Response) => {
  try {
    const sessions = db.prepare('SELECT * FROM market_sessions ORDER BY id').all() as MarketSession[];

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/active - Get currently active market sessions
router.get('/active', (_req: Request, res: Response) => {
  try {
    const sessions = db.prepare('SELECT * FROM market_sessions').all() as MarketSession[];

    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

    const activeSessions = sessions
      .filter((session) => {
        const daysActive = session.days_active?.split(',') || [];
        return daysActive.includes(currentDay);
      })
      .map((session) => {
        // Calculate if session is currently open
        // This is simplified - in production you'd use a proper timezone library
        const isOpen = isSessionOpen(session, now);
        return {
          ...session,
          is_open: isOpen,
        };
      });

    res.json({
      success: true,
      current_time: now.toISOString(),
      data: activeSessions,
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Helper function to check if session is open
function isSessionOpen(session: MarketSession, now: Date): boolean {
  // Simplified check - in production use a timezone library like date-fns-tz
  // This is just a placeholder that returns a rough estimate
  const utcHour = now.getUTCHours();

  const sessionTimes: Record<string, { openUTC: number; closeUTC: number }> = {
    'Sydney': { openUTC: 22, closeUTC: 7 }, // Previous day 22:00 to 07:00 UTC
    'Tokyo': { openUTC: 0, closeUTC: 6 },
    'London': { openUTC: 8, closeUTC: 16 },
    'New York': { openUTC: 14, closeUTC: 21 },
  };

  const times = sessionTimes[session.name];
  if (!times) return false;

  if (times.openUTC > times.closeUTC) {
    // Session spans midnight
    return utcHour >= times.openUTC || utcHour < times.closeUTC;
  }

  return utcHour >= times.openUTC && utcHour < times.closeUTC;
}

export default router;
