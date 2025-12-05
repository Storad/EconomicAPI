import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">About Economic API</h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
              Economic API provides developers and traders with reliable,
              real-time access to economic indicators and market data from
              trusted government sources.
            </p>

            <h2 className="text-2xl font-semibold mt-12 mb-4">Our Mission</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              We believe economic data should be accessible, accurate, and
              easy to integrate. Our API aggregates data from multiple official
              sources including the Bureau of Labor Statistics, Federal Reserve,
              European Central Bank, and more.
            </p>

            <h2 className="text-2xl font-semibold mt-12 mb-4">Data Sources</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              All data is sourced directly from official government agencies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400 mb-6">
              <li>Bureau of Labor Statistics (BLS) - Employment, CPI, PPI</li>
              <li>Federal Reserve Economic Data (FRED) - Interest rates, GDP</li>
              <li>Bureau of Economic Analysis (BEA) - Trade balance, GDP</li>
              <li>U.S. Census Bureau - Retail sales, housing data</li>
              <li>European Central Bank (ECB) - Eurozone indicators</li>
              <li>Bank of England - UK economic data</li>
              <li>And many more international sources</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-12 mb-4">Reliability</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Our infrastructure is designed for high availability with automatic
              data syncing and real-time WebSocket updates. We monitor data
              releases and push updates as soon as they become available.
            </p>

            <h2 className="text-2xl font-semibold mt-12 mb-4">Built for Developers</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              With a RESTful API, comprehensive documentation, and WebSocket
              support, integrating economic data into your applications has
              never been easier.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
