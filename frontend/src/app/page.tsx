import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Calendar, Globe, Zap, Lock, Clock, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Economic Data API
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
                Real-time economic indicators, release calendars, and market data
                from trusted government sources. Built for traders and developers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  View Documentation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything you need
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Calendar className="h-8 w-8 mb-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-lg font-semibold mb-2">Economic Calendar</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Comprehensive calendar of economic releases with forecasts,
                  actuals, and historical data.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Globe className="h-8 w-8 mb-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-lg font-semibold mb-2">Global Coverage</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Data from US, EU, UK, Japan, China, and more. Over 100
                  economic indicators tracked.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Zap className="h-8 w-8 mb-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  WebSocket support for instant release notifications. Never
                  miss an important data point.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Lock className="h-8 w-8 mb-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  API key authentication with rate limiting. Your data access
                  is protected and reliable.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Clock className="h-8 w-8 mb-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-lg font-semibold mb-2">Historical Data</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Access years of historical releases for backtesting and
                  analysis.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <BarChart3 className="h-8 w-8 mb-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-lg font-semibold mb-2">Government Sources</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Data sourced directly from BLS, FRED, ECB, and other official
                  sources.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-xl mx-auto">
              Sign up today and get access to comprehensive economic data for
              just $25/month.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
