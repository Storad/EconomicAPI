import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import db from '../config/database';

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  subscriptions: Set<string>;
  clientId: string;
}

interface ReleaseUpdate {
  type: 'release_update';
  data: {
    event_slug: string;
    event_name: string;
    country: string;
    category: string;
    importance: string;
    release_date: string;
    actual: number | null;
    previous: number | null;
    forecast: number | null;
    unit: string;
    updated_at: string;
  };
}

interface HeartbeatMessage {
  type: 'heartbeat';
  timestamp: string;
}

interface SubscriptionMessage {
  type: 'subscribed' | 'unsubscribed';
  channels: string[];
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

type WsMessage = ReleaseUpdate | HeartbeatMessage | SubscriptionMessage | ErrorMessage;

class WebSocketServer {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastReleaseStates: Map<string, string> = new Map();

  initialize(httpServer: HttpServer): void {
    this.wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as WebSocketClient;
      client.isAlive = true;
      client.subscriptions = new Set(['all']); // Default subscribe to all
      client.clientId = this.generateClientId();

      this.clients.set(client.clientId, client);
      console.log(`WebSocket client connected: ${client.clientId} (${this.clients.size} total)`);

      // Send welcome message
      this.sendToClient(client, {
        type: 'subscribed',
        channels: Array.from(client.subscriptions),
      });

      // Handle incoming messages
      client.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(client, message);
        } catch (error) {
          this.sendToClient(client, { type: 'error', message: 'Invalid JSON message' });
        }
      });

      // Handle pong for heartbeat
      client.on('pong', () => {
        client.isAlive = true;
      });

      // Handle disconnect
      client.on('close', () => {
        this.clients.delete(client.clientId);
        console.log(`WebSocket client disconnected: ${client.clientId} (${this.clients.size} remaining)`);
      });

      client.on('error', (err) => {
        console.error(`WebSocket error for ${client.clientId}:`, err.message);
      });
    });

    // Start heartbeat interval (ping every 30 seconds)
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const client = ws as WebSocketClient;
        if (!client.isAlive) {
          console.log(`Terminating inactive client: ${client.clientId}`);
          this.clients.delete(client.clientId);
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    console.log('WebSocket server initialized on /ws');
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(client: WebSocketClient, message: any): void {
    switch (message.action) {
      case 'subscribe':
        this.handleSubscribe(client, message.channels);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(client, message.channels);
        break;
      case 'ping':
        this.sendToClient(client, { type: 'heartbeat', timestamp: new Date().toISOString() });
        break;
      default:
        this.sendToClient(client, { type: 'error', message: `Unknown action: ${message.action}` });
    }
  }

  private handleSubscribe(client: WebSocketClient, channels: string[]): void {
    if (!Array.isArray(channels)) {
      this.sendToClient(client, { type: 'error', message: 'Channels must be an array' });
      return;
    }

    // Valid channel formats:
    // - 'all' - all updates
    // - 'country:US' - all US updates
    // - 'category:Inflation' - all inflation updates
    // - 'importance:high' - all high importance updates
    // - 'event:us-cpi' - specific event updates

    channels.forEach((channel) => client.subscriptions.add(channel));

    this.sendToClient(client, {
      type: 'subscribed',
      channels: Array.from(client.subscriptions),
    });
  }

  private handleUnsubscribe(client: WebSocketClient, channels: string[]): void {
    if (!Array.isArray(channels)) {
      this.sendToClient(client, { type: 'error', message: 'Channels must be an array' });
      return;
    }

    channels.forEach((channel) => client.subscriptions.delete(channel));

    // Ensure at least 'all' subscription if empty
    if (client.subscriptions.size === 0) {
      client.subscriptions.add('all');
    }

    this.sendToClient(client, {
      type: 'unsubscribed',
      channels: Array.from(client.subscriptions),
    });
  }

  private sendToClient(client: WebSocketClient, message: WsMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private clientMatchesUpdate(client: WebSocketClient, update: ReleaseUpdate['data']): boolean {
    for (const channel of client.subscriptions) {
      if (channel === 'all') return true;
      if (channel === `country:${update.country}`) return true;
      if (channel === `category:${update.category}`) return true;
      if (channel === `importance:${update.importance}`) return true;
      if (channel === `event:${update.event_slug}`) return true;
    }
    return false;
  }

  // Broadcast a release update to all interested clients
  broadcastReleaseUpdate(releaseData: ReleaseUpdate['data']): void {
    const message: ReleaseUpdate = {
      type: 'release_update',
      data: releaseData,
    };

    let sentCount = 0;
    this.clients.forEach((client) => {
      if (this.clientMatchesUpdate(client, releaseData)) {
        this.sendToClient(client, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`Broadcast release update for ${releaseData.event_slug} to ${sentCount} clients`);
    }
  }

  // Check for release updates and broadcast changes
  async checkForUpdates(): Promise<void> {
    const releases = db.prepare(`
      SELECT
        e.slug as event_slug,
        e.name as event_name,
        e.country,
        e.category,
        e.importance,
        r.release_date,
        r.actual,
        r.previous,
        r.forecast,
        r.unit,
        r.updated_at
      FROM releases r
      JOIN events e ON r.event_id = e.id
      WHERE r.release_date <= date('now')
      AND r.updated_at > datetime('now', '-5 minutes')
      ORDER BY r.updated_at DESC
      LIMIT 50
    `).all() as any[];

    for (const release of releases) {
      const stateKey = `${release.event_slug}_${release.release_date}`;
      const stateValue = `${release.actual}_${release.updated_at}`;

      if (this.lastReleaseStates.get(stateKey) !== stateValue) {
        this.lastReleaseStates.set(stateKey, stateValue);

        // Only broadcast if there's an actual value (new data)
        if (release.actual !== null) {
          this.broadcastReleaseUpdate(release);
        }
      }
    }

    // Cleanup old states (older than 1 day)
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, _value] of this.lastReleaseStates) {
      const timestamp = parseInt(key.split('_')[1] || '0', 10);
      if (timestamp < cutoffTime) {
        this.lastReleaseStates.delete(key);
      }
    }
  }

  // Get current connection stats
  getStats(): { connectedClients: number; subscriptions: Record<string, number> } {
    const subscriptions: Record<string, number> = {};

    this.clients.forEach((client) => {
      client.subscriptions.forEach((sub) => {
        subscriptions[sub] = (subscriptions[sub] || 0) + 1;
      });
    });

    return {
      connectedClients: this.clients.size,
      subscriptions,
    };
  }

  // Shutdown gracefully
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });

    this.wss?.close();
    console.log('WebSocket server shut down');
  }
}

// Singleton instance
export const wsServer = new WebSocketServer();
