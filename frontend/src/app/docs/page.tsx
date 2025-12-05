import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function DocsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-fcfcb.up.railway.app';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">API Documentation</h1>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              All API requests require authentication using an API key. Include
              your API key in the request header:
            </p>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto">
              <code className="text-green-400 text-sm">
                X-API-Key: econ_live_your_api_key_here
              </code>
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Alternatively, you can pass the key as a query parameter:{' '}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                ?api_key=your_key
              </code>
            </p>
          </section>

          {/* Base URL */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Base URL</h2>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4">
              <code className="text-blue-400 text-sm">{API_URL}</code>
            </div>
          </section>

          {/* Calendar Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Calendar Endpoints</h2>
            <div className="space-y-6">
              <EndpointDoc
                method="GET"
                path="/api/calendar/today"
                description="Get all economic events scheduled for today"
              />
              <EndpointDoc
                method="GET"
                path="/api/calendar/week"
                description="Get all economic events for the current week"
              />
              <EndpointDoc
                method="GET"
                path="/api/calendar/range"
                description="Get events within a date range"
                params={[
                  { name: 'start', type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  { name: 'end', type: 'string', description: 'End date (YYYY-MM-DD)' },
                ]}
              />
            </div>
          </section>

          {/* Events Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Events Endpoints</h2>
            <div className="space-y-6">
              <EndpointDoc
                method="GET"
                path="/api/events"
                description="List all economic indicators"
                params={[
                  { name: 'country', type: 'string', description: 'Filter by country code (e.g., US, EU, UK)' },
                  { name: 'category', type: 'string', description: 'Filter by category' },
                  { name: 'importance', type: 'string', description: 'Filter by importance (high, medium, low)' },
                ]}
              />
              <EndpointDoc
                method="GET"
                path="/api/events/categories"
                description="List all event categories"
              />
              <EndpointDoc
                method="GET"
                path="/api/events/:slug"
                description="Get details for a specific indicator"
              />
              <EndpointDoc
                method="GET"
                path="/api/events/:slug/history"
                description="Get historical data for an indicator"
              />
            </div>
          </section>

          {/* Releases Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Releases Endpoints</h2>
            <div className="space-y-6">
              <EndpointDoc
                method="GET"
                path="/api/releases/latest"
                description="Get the latest value for each indicator"
              />
              <EndpointDoc
                method="GET"
                path="/api/releases/upcoming"
                description="Get upcoming scheduled releases"
              />
              <EndpointDoc
                method="GET"
                path="/api/releases/high-impact"
                description="Get high-impact events only"
              />
            </div>
          </section>

          {/* Sessions Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Sessions Endpoints</h2>
            <div className="space-y-6">
              <EndpointDoc
                method="GET"
                path="/api/sessions"
                description="Get all market sessions"
              />
              <EndpointDoc
                method="GET"
                path="/api/sessions/active"
                description="Get currently active market sessions"
              />
            </div>
          </section>

          {/* WebSocket */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">WebSocket (Real-time Updates)</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Connect to our WebSocket endpoint for real-time release updates:
            </p>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 mb-4">
              <code className="text-blue-400 text-sm">
                ws://{API_URL.replace('https://', '').replace('http://', '')}/ws
              </code>
            </div>
            <h3 className="text-lg font-medium mb-2">Subscribe to Channels</h3>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 mb-4">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">
{`{
  "action": "subscribe",
  "channels": ["country:US", "importance:high"]
}`}
              </pre>
            </div>
            <h3 className="text-lg font-medium mb-2">Available Channels</h3>
            <ul className="list-disc pl-6 space-y-1 text-zinc-600 dark:text-zinc-400">
              <li><code>all</code> - All updates</li>
              <li><code>country:XX</code> - Updates for specific country (US, EU, UK, JP, CN)</li>
              <li><code>category:Name</code> - Updates for category (Inflation, Employment)</li>
              <li><code>importance:level</code> - Updates by importance (high, medium, low)</li>
              <li><code>event:slug</code> - Updates for specific event (us-cpi, fed-funds-rate)</li>
            </ul>
          </section>

          {/* Rate Limits */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Rate Limits</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              API requests are rate limited to ensure fair usage:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><strong>1,000 requests</strong> per hour per API key</li>
              <li>Rate limit headers are included in every response</li>
            </ul>
            <div className="mt-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">Response Headers</h4>
              <ul className="text-sm space-y-1 font-mono">
                <li>X-RateLimit-Limit: 1000</li>
                <li>X-RateLimit-Remaining: 999</li>
                <li>X-RateLimit-Reset: 1234567890</li>
              </ul>
            </div>
          </section>

          {/* Example Request */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Example Request</h2>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">
{`curl -X GET "${API_URL}/api/calendar/today" \\
  -H "X-API-Key: econ_live_your_api_key_here"`}
              </pre>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface EndpointDocProps {
  method: string;
  path: string;
  description: string;
  params?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

function EndpointDoc({ method, path, description, params }: EndpointDocProps) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 flex items-center gap-3">
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded">
          {method}
        </span>
        <code className="text-sm">{path}</code>
      </div>
      <div className="px-4 py-3">
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">{description}</p>
        {params && params.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
            <table className="w-full text-sm">
              <tbody>
                {params.map((param) => (
                  <tr key={param.name} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2 pr-4 font-mono text-blue-600 dark:text-blue-400">
                      {param.name}
                    </td>
                    <td className="py-2 pr-4 text-zinc-500">{param.type}</td>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
