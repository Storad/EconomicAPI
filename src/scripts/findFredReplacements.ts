/**
 * Find FRED Replacement Series
 *
 * Searches FRED for alternative series IDs for broken indicators
 */

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const BROKEN_SERIES = [
  // Japan
  { slug: 'jp-cpi', search: 'japan CPI consumer price', country: 'Japan' },
  { slug: 'jp-core-cpi', search: 'japan core CPI', country: 'Japan' },
  { slug: 'jp-trade-balance', search: 'japan trade balance', country: 'Japan' },
  { slug: 'jp-retail-sales', search: 'japan retail sales', country: 'Japan' },
  { slug: 'jp-tankan-large', search: 'japan tankan manufacturing', country: 'Japan' },

  // China
  { slug: 'cn-gdp-growth', search: 'china GDP growth', country: 'China' },
  { slug: 'cn-ppi', search: 'china producer price PPI', country: 'China' },
  { slug: 'cn-trade-balance', search: 'china trade balance', country: 'China' },
  { slug: 'cn-industrial-production', search: 'china industrial production', country: 'China' },
  { slug: 'cn-retail-sales', search: 'china retail sales', country: 'China' },
  { slug: 'cn-unemployment', search: 'china unemployment rate', country: 'China' },
  { slug: 'cn-manufacturing-pmi', search: 'china PMI manufacturing', country: 'China' },

  // Canada
  { slug: 'ca-trade-balance', search: 'canada trade balance', country: 'Canada' },
  { slug: 'ca-retail-sales', search: 'canada retail sales', country: 'Canada' },

  // Australia
  { slug: 'rba-rate', search: 'australia reserve bank interest rate', country: 'Australia' },
  { slug: 'au-trade-balance', search: 'australia trade balance', country: 'Australia' },
  { slug: 'au-retail-sales', search: 'australia retail sales', country: 'Australia' },

  // Switzerland
  { slug: 'snb-rate', search: 'switzerland SNB interest rate', country: 'Switzerland' },
  { slug: 'ch-cpi', search: 'switzerland CPI inflation', country: 'Switzerland' },
  { slug: 'ch-unemployment', search: 'switzerland unemployment', country: 'Switzerland' },

  // New Zealand
  { slug: 'rbnz-rate', search: 'new zealand RBNZ interest rate', country: 'New Zealand' },
  { slug: 'nz-cpi', search: 'new zealand CPI inflation', country: 'New Zealand' },
  { slug: 'nz-unemployment', search: 'new zealand unemployment', country: 'New Zealand' },

  // UK
  { slug: 'uk-retail-sales', search: 'united kingdom retail sales', country: 'UK' },
];

async function searchFRED(query: string): Promise<{ id: string; title: string; frequency: string; lastUpdated: string }[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY not set');

  try {
    const response = await axios.get('https://api.stlouisfed.org/fred/series/search', {
      params: {
        search_text: query,
        api_key: apiKey,
        file_type: 'json',
        limit: 5,
        order_by: 'popularity',
        sort_order: 'desc',
      },
    });

    return response.data.seriess?.map((s: any) => ({
      id: s.id,
      title: s.title,
      frequency: s.frequency,
      lastUpdated: s.last_updated,
    })) || [];
  } catch (error: any) {
    console.error(`Search error for "${query}":`, error.message);
    return [];
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('SEARCHING FRED FOR REPLACEMENT SERIES');
  console.log('='.repeat(70));
  console.log('');

  const replacements: Record<string, { id: string; title: string }[]> = {};

  for (const item of BROKEN_SERIES) {
    console.log(`\n--- ${item.country}: ${item.slug} ---`);
    console.log(`Search: "${item.search}"`);

    const results = await searchFRED(item.search);

    if (results.length > 0) {
      replacements[item.slug] = results.map(r => ({ id: r.id, title: r.title }));
      console.log('Candidates:');
      for (const r of results) {
        console.log(`  ${r.id.padEnd(22)} ${r.frequency.padEnd(10)} ${r.title.slice(0, 50)}`);
      }
    } else {
      console.log('  No results found');
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate replacement code
  console.log('\n\n' + '='.repeat(70));
  console.log('SUGGESTED REPLACEMENTS (copy to scrapers)');
  console.log('='.repeat(70));
  console.log('');

  for (const [slug, candidates] of Object.entries(replacements)) {
    if (candidates.length > 0) {
      console.log(`'${slug}': '${candidates[0].id}', // ${candidates[0].title.slice(0, 40)}`);
    }
  }
}

main().catch(console.error);
