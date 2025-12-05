import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              One plan, everything included. No hidden fees.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Pro API Access</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">$25</span>
                  <span className="text-zinc-600 dark:text-zinc-400">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Full API access to all endpoints</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Economic calendar with forecasts & actuals</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>100+ economic indicators</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Global coverage (US, EU, UK, JP, CN, and more)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time WebSocket updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Historical data access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>1,000 API requests per hour</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Up to 5 API keys</span>
                </li>
              </ul>

              <Link
                href="/sign-up"
                className="block w-full py-3 px-4 text-center bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium"
              >
                Get Started
              </Link>

              <p className="text-center text-sm text-zinc-500 mt-4">
                Cancel anytime. No long-term commitment.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-xl font-semibold mb-4">Need more?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Contact us for enterprise pricing with higher rate limits and
              dedicated support.
            </p>
            <Link
              href="/contact"
              className="text-zinc-900 dark:text-zinc-100 underline hover:no-underline"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
