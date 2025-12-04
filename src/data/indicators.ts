/**
 * Economic Indicator Metadata
 * Rich metadata for Econtimeline integration
 */

export interface IndicatorMetadata {
  whyItMatters: string;
  typicalReaction?: {
    higher?: string;
    lower?: string;
    hawkish?: string;
    dovish?: string;
  };
  relatedAssets: string[];
  historicalVolatility: 'high' | 'medium' | 'low';
}

export const INDICATORS: Record<string, IndicatorMetadata> = {
  // INFLATION
  'cpi': {
    whyItMatters: 'The Consumer Price Index is the primary measure of inflation in the US. Higher CPI can lead to Fed rate hikes.',
    typicalReaction: {
      higher: 'USD strengthens, stocks may fall on rate hike fears',
      lower: 'USD weakens, stocks may rally on dovish expectations'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT', 'GLD'],
    historicalVolatility: 'high'
  },
  'core-cpi': {
    whyItMatters: 'Core CPI excludes volatile food and energy prices, giving a clearer picture of underlying inflation.',
    typicalReaction: {
      higher: 'USD strengthens, bonds sell off',
      lower: 'USD weakens, bonds rally'
    },
    relatedAssets: ['DXY', 'TLT', 'IEF'],
    historicalVolatility: 'high'
  },
  'ppi': {
    whyItMatters: 'Producer prices often lead consumer prices. Rising PPI can signal future inflation.',
    typicalReaction: {
      higher: 'Inflation concerns rise, USD mixed',
      lower: 'Inflation concerns ease'
    },
    relatedAssets: ['DXY', 'TLT'],
    historicalVolatility: 'medium'
  },
  'pce': {
    whyItMatters: 'PCE is the Fed preferred inflation measure. Core PCE drives monetary policy decisions.',
    typicalReaction: {
      higher: 'USD strengthens, rate hike expectations rise',
      lower: 'USD weakens, rate cut expectations rise'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT', 'GLD'],
    historicalVolatility: 'high'
  },
  'core-pce': {
    whyItMatters: 'Core PCE is the Fed primary inflation target (2%). Critical for rate decisions.',
    typicalReaction: {
      higher: 'USD strengthens, hawkish Fed expectations',
      lower: 'USD weakens, dovish Fed expectations'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT', 'QQQ'],
    historicalVolatility: 'high'
  },

  // EMPLOYMENT
  'nonfarm-payrolls': {
    whyItMatters: 'Non-Farm Payrolls show the health of the US labor market. Strong jobs = strong economy.',
    typicalReaction: {
      higher: 'USD strengthens, stocks mixed depending on rate outlook',
      lower: 'USD weakens, stocks may rally on rate cut hopes'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT'],
    historicalVolatility: 'high'
  },
  'unemployment-rate': {
    whyItMatters: 'Unemployment rate is a key measure of labor market slack. Low unemployment can be inflationary.',
    typicalReaction: {
      higher: 'USD weakens, dovish expectations',
      lower: 'USD strengthens, hawkish expectations'
    },
    relatedAssets: ['DXY', 'SPY'],
    historicalVolatility: 'high'
  },
  'initial-claims': {
    whyItMatters: 'Weekly jobless claims provide timely labor market data. Rising claims signal weakening employment.',
    typicalReaction: {
      higher: 'USD weakens, recession fears',
      lower: 'USD strengthens, strong labor market'
    },
    relatedAssets: ['DXY', 'SPY'],
    historicalVolatility: 'medium'
  },
  'jolts': {
    whyItMatters: 'Job openings show labor demand. High openings vs hires indicates tight labor market.',
    typicalReaction: {
      higher: 'USD strengthens, wage pressure concerns',
      lower: 'USD weakens, labor market cooling'
    },
    relatedAssets: ['DXY', 'SPY'],
    historicalVolatility: 'medium'
  },
  'average-hourly-earnings': {
    whyItMatters: 'Wage growth feeds into inflation. Strong wage growth can lead to higher rates.',
    typicalReaction: {
      higher: 'USD strengthens, inflation concerns',
      lower: 'USD weakens, disinflation hopes'
    },
    relatedAssets: ['DXY', 'TLT'],
    historicalVolatility: 'high'
  },

  // GDP & GROWTH
  'gdp': {
    whyItMatters: 'GDP measures total economic output. Strong GDP supports risk assets.',
    typicalReaction: {
      higher: 'USD strengthens, stocks rally',
      lower: 'USD weakens, recession concerns'
    },
    relatedAssets: ['DXY', 'SPY', 'QQQ'],
    historicalVolatility: 'high'
  },
  'gdp-growth': {
    whyItMatters: 'Quarterly GDP growth shows economic momentum. Negative growth = recession.',
    typicalReaction: {
      higher: 'Risk-on, USD strengthens',
      lower: 'Risk-off, safe haven flows'
    },
    relatedAssets: ['SPY', 'DXY', 'TLT'],
    historicalVolatility: 'high'
  },

  // CONSUMER
  'retail-sales': {
    whyItMatters: 'Consumer spending is 70% of US GDP. Retail sales show consumer health.',
    typicalReaction: {
      higher: 'USD strengthens, growth optimism',
      lower: 'USD weakens, consumer weakness'
    },
    relatedAssets: ['XRT', 'SPY', 'DXY'],
    historicalVolatility: 'medium'
  },
  'umich-sentiment': {
    whyItMatters: 'Consumer sentiment predicts spending. Falling sentiment can signal recession.',
    typicalReaction: {
      higher: 'Risk-on sentiment',
      lower: 'Risk-off sentiment'
    },
    relatedAssets: ['SPY', 'XRT'],
    historicalVolatility: 'medium'
  },
  'cb-consumer-confidence': {
    whyItMatters: 'Conference Board survey is broader than Michigan. Key for consumer spending outlook.',
    typicalReaction: {
      higher: 'Risk-on, consumer stocks rally',
      lower: 'Risk-off, defensive rotation'
    },
    relatedAssets: ['SPY', 'XRT', 'XLP'],
    historicalVolatility: 'medium'
  },

  // MANUFACTURING
  'ism-manufacturing': {
    whyItMatters: 'ISM PMI above 50 = expansion. Leading indicator for industrial sector.',
    typicalReaction: {
      higher: 'USD strengthens, industrial stocks rally',
      lower: 'USD weakens, recession concerns'
    },
    relatedAssets: ['XLI', 'SPY', 'DXY'],
    historicalVolatility: 'medium'
  },
  'ism-services': {
    whyItMatters: 'Services are 80% of US economy. ISM Services PMI is critical for growth outlook.',
    typicalReaction: {
      higher: 'USD strengthens, growth optimism',
      lower: 'USD weakens, slowdown fears'
    },
    relatedAssets: ['SPY', 'DXY'],
    historicalVolatility: 'medium'
  },
  'industrial-production': {
    whyItMatters: 'Industrial production shows factory output. Key for manufacturing sector health.',
    typicalReaction: {
      higher: 'Industrial stocks rally',
      lower: 'Manufacturing weakness'
    },
    relatedAssets: ['XLI', 'SPY'],
    historicalVolatility: 'low'
  },
  'durable-goods': {
    whyItMatters: 'Durable goods orders show business investment. Leading indicator for GDP.',
    typicalReaction: {
      higher: 'Growth optimism, industrial rally',
      lower: 'Investment weakness'
    },
    relatedAssets: ['XLI', 'SPY'],
    historicalVolatility: 'medium'
  },

  // HOUSING
  'housing-starts': {
    whyItMatters: 'Housing starts show construction activity. Leading indicator for housing market.',
    typicalReaction: {
      higher: 'Homebuilder stocks rally',
      lower: 'Housing weakness'
    },
    relatedAssets: ['XHB', 'ITB'],
    historicalVolatility: 'medium'
  },
  'existing-home-sales': {
    whyItMatters: 'Existing home sales show housing demand. Sensitive to mortgage rates.',
    typicalReaction: {
      higher: 'Housing stocks rally',
      lower: 'Housing market cooling'
    },
    relatedAssets: ['XHB', 'ITB'],
    historicalVolatility: 'medium'
  },
  'new-home-sales': {
    whyItMatters: 'New home sales show demand for newly built homes. Key for homebuilders.',
    typicalReaction: {
      higher: 'Homebuilders rally',
      lower: 'Builder sentiment weakens'
    },
    relatedAssets: ['XHB', 'ITB'],
    historicalVolatility: 'medium'
  },

  // FED & RATES
  'fomc-meeting': {
    whyItMatters: 'The Federal Reserve interest rate decision affects borrowing costs across the entire economy.',
    typicalReaction: {
      hawkish: 'USD strengthens, stocks fall, bonds fall',
      dovish: 'USD weakens, stocks rally, bonds rally'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT', 'QQQ'],
    historicalVolatility: 'high'
  },
  'fed-chair-speaks': {
    whyItMatters: 'Fed Chair comments move markets. Forward guidance on rates is critical.',
    typicalReaction: {
      hawkish: 'USD strengthens, yields rise',
      dovish: 'USD weakens, yields fall'
    },
    relatedAssets: ['DXY', 'TLT', 'SPY'],
    historicalVolatility: 'high'
  },

  // ENERGY
  'eia-crude-inventories': {
    whyItMatters: 'Weekly crude stocks affect oil prices. Draws are bullish, builds are bearish.',
    typicalReaction: {
      higher: 'Oil prices fall on oversupply',
      lower: 'Oil prices rise on tight supply'
    },
    relatedAssets: ['USO', 'XLE', 'OXY'],
    historicalVolatility: 'medium'
  },

  // TRADE
  'trade-balance': {
    whyItMatters: 'Trade deficit affects currency and GDP. Large deficits can pressure USD.',
    typicalReaction: {
      higher: 'USD strengthens (smaller deficit)',
      lower: 'USD weakens (larger deficit)'
    },
    relatedAssets: ['DXY'],
    historicalVolatility: 'low'
  }
};

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD',
  'EU': 'EUR',
  'UK': 'GBP',
  'JP': 'JPY',
  'CN': 'CNY',
  'CA': 'CAD',
  'AU': 'AUD',
  'NZ': 'NZD',
  'CH': 'CHF'
};

export function getIndicatorMetadata(name: string): IndicatorMetadata | null {
  // Normalize the name to match our slug format
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // Direct match
  if (INDICATORS[slug]) {
    return INDICATORS[slug];
  }

  // Partial match - check if any key is contained in slug or vice versa
  for (const [key, metadata] of Object.entries(INDICATORS)) {
    if (slug.includes(key) || key.includes(slug)) {
      return metadata;
    }
  }

  // Return default metadata
  return {
    whyItMatters: 'This economic indicator provides insights into market conditions.',
    relatedAssets: [],
    historicalVolatility: 'medium'
  };
}

export function getCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
}
