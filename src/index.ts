import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { createServer } from 'http';

import { initializeDatabase } from './config/database';
import calendarRoutes from './routes/calendar';
import eventsRoutes from './routes/events';
import releasesRoutes from './routes/releases';
import sessionsRoutes from './routes/sessions';
import { syncBLSEvents } from './scrapers/bls';
import { updateReleaseActuals } from './scrapers/fred';
import { initializeInternationalEvents, syncAllInternationalData, COUNTRY_COVERAGE, getInternationalIndicatorCount } from './scrapers/international';
import { wsServer } from './services/websocket';
import { populateCalendar } from './scripts/populateCalendar';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket stats
app.get('/api/ws/stats', (_req, res) => {
  res.json({
    success: true,
    data: wsServer.getStats(),
  });
});

// Manual data sync endpoint (for initial production setup)
// Protected by a simple key check - set SYNC_KEY in environment
app.post('/api/sync', async (req, res) => {
  const syncKey = req.headers['x-sync-key'] || req.query.key;
  const expectedKey = process.env.SYNC_KEY || 'initial-sync-key';

  if (syncKey !== expectedKey) {
    res.status(401).json({ success: false, error: 'Invalid sync key' });
    return;
  }

  console.log('Manual sync triggered...');
  res.json({ success: true, message: 'Sync started, check server logs for progress' });

  try {
    // US data
    console.log('Syncing US data...');
    await syncBLSEvents();
    await updateReleaseActuals();

    // International data
    console.log('Syncing international data...');
    await initializeInternationalEvents();
    await syncAllInternationalData();

    // Populate calendar releases (December 2025 - January 2026)
    console.log('Populating calendar releases...');
    await populateCalendar();

    console.log('Manual sync completed successfully');
  } catch (error) {
    console.error('Manual sync failed:', error);
  }
});

// API Info
app.get('/api', (_req, res) => {
  res.json({
    name: 'Economic Data API',
    version: '1.0.0',
    description: 'Free aggregated economic data from government sources',
    endpoints: {
      calendar: {
        '/api/calendar/today': 'Get today\'s economic events',
        '/api/calendar/week': 'Get this week\'s economic events',
        '/api/calendar/range?start=YYYY-MM-DD&end=YYYY-MM-DD': 'Get events in date range',
        '/api/calendar/econtimeline': 'Get events in Econtimeline-compatible format',
      },
      events: {
        '/api/events': 'List all economic indicators',
        '/api/events/categories': 'List all categories',
        '/api/events/:slug': 'Get specific indicator details',
        '/api/events/:slug/history': 'Get historical data',
      },
      releases: {
        '/api/releases/latest': 'Get latest value for each indicator',
        '/api/releases/upcoming': 'Get upcoming releases',
        '/api/releases/high-impact': 'Get high impact events',
      },
      sessions: {
        '/api/sessions': 'Get all market sessions',
        '/api/sessions/active': 'Get currently active sessions',
      },
      websocket: {
        'ws://localhost:PORT/ws': 'WebSocket connection for real-time updates',
        '/api/ws/stats': 'Get WebSocket connection statistics',
      },
    },
    websocket_usage: {
      description: 'Connect to ws://host:port/ws for real-time release updates',
      subscribe: '{"action":"subscribe","channels":["country:US","importance:high"]}',
      unsubscribe: '{"action":"unsubscribe","channels":["country:US"]}',
      channels: [
        'all - all updates',
        'country:XX - updates for specific country (US, EU, UK, JP, CN, etc)',
        'category:Name - updates for category (Inflation, Employment, etc)',
        'importance:level - updates by importance (high, medium, low)',
        'event:slug - updates for specific event (us-cpi, fed-funds-rate, etc)',
      ],
    },
    query_params: {
      country: 'Filter by country (e.g., US, EU, UK)',
      importance: 'Filter by importance (high, medium, low)',
      category: 'Filter by category (e.g., Inflation, Employment)',
    },
    sources: {
      US: [
        'Bureau of Labor Statistics (BLS)',
        'Federal Reserve Economic Data (FRED)',
        'Bureau of Economic Analysis (BEA)',
        'U.S. Treasury',
        'U.S. Census Bureau',
        'Energy Information Administration (EIA)',
      ],
      international: [
        'European Central Bank (ECB)',
        'Eurostat',
        'UK Office for National Statistics (ONS)',
        'Bank of England',
        'Bank of Japan (via FRED)',
        'PBOC/NBS (via FRED)',
        'Bank of Canada (via FRED)',
        'Reserve Bank of Australia (via FRED)',
        'Swiss National Bank (via FRED)',
        'Reserve Bank of New Zealand (via FRED)',
      ],
    },
    countries: Object.entries(COUNTRY_COVERAGE).map(([code, info]) => ({
      code,
      name: info.name,
      flag: info.flag,
      indicatorCount: info.indicatorCount,
    })),
  });
});

// Routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/releases', releasesRoutes);
app.use('/api/sessions', sessionsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Initialize database and start server
async function start() {
  try {
    // Initialize database
    initializeDatabase();

    // Run initial data sync (in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running initial data sync...');

      // US data
      await syncBLSEvents();
      await updateReleaseActuals();

      // International data
      console.log(`\nInitializing ${getInternationalIndicatorCount()} international indicators...`);
      await initializeInternationalEvents();
      await syncAllInternationalData();
    }

    // Schedule daily full sync (6 AM ET - before markets open)
    cron.schedule('0 6 * * 1-5', async () => {
      console.log('Running daily data sync...');
      try {
        // US data
        await syncBLSEvents();
        await updateReleaseActuals();

        // International data
        await initializeInternationalEvents();
        await syncAllInternationalData();

        console.log('Daily sync completed');
      } catch (error) {
        console.error('Daily sync failed:', error);
      }
    }, {
      timezone: 'America/New_York',
    });

    // Sync actuals every hour during trading hours (8 AM - 5 PM ET, weekdays)
    // This catches releases shortly after they're published
    cron.schedule('0 8-17 * * 1-5', async () => {
      console.log('Running hourly actuals sync...');
      try {
        await updateReleaseActuals();
        await syncAllInternationalData();
        console.log('Hourly sync completed');
      } catch (error) {
        console.error('Hourly sync failed:', error);
      }
    }, {
      timezone: 'America/New_York',
    });

    // European data sync (9 AM CET / 3 AM ET - before European markets)
    cron.schedule('0 3 * * 1-5', async () => {
      console.log('Running European data sync...');
      try {
        await syncAllInternationalData();
        console.log('European sync completed');
      } catch (error) {
        console.error('European sync failed:', error);
      }
    }, {
      timezone: 'America/New_York',
    });

    // Asian data sync (9 AM JST / 7 PM ET previous day)
    cron.schedule('0 19 * * 0-4', async () => {
      console.log('Running Asian data sync...');
      try {
        await syncAllInternationalData();
        console.log('Asian sync completed');
      } catch (error) {
        console.error('Asian sync failed:', error);
      }
    }, {
      timezone: 'America/New_York',
    });

    // Initialize WebSocket server
    wsServer.initialize(httpServer);

    // Check for release updates every minute (for WebSocket broadcasting)
    cron.schedule('* * * * *', async () => {
      try {
        await wsServer.checkForUpdates();
      } catch (error) {
        console.error('WebSocket update check failed:', error);
      }
    });

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Economic Data API running on http://localhost:${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
      console.log(`API docs available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wsServer.shutdown();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

start();
