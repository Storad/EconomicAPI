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
  'us-cpi': {
    whyItMatters: 'The Consumer Price Index is the primary measure of inflation in the US. Higher CPI can lead to Fed rate hikes.',
    typicalReaction: {
      higher: 'USD strengthens, stocks may fall on rate hike fears',
      lower: 'USD weakens, stocks may rally on dovish expectations'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT', 'GLD'],
    historicalVolatility: 'high'
  },
  'us-nfp': {
    whyItMatters: 'Non-Farm Payrolls show the health of the US labor market. Strong jobs = strong economy.',
    typicalReaction: {
      higher: 'USD strengthens, stocks mixed depending on rate outlook',
      lower: 'USD weakens, stocks may rally on rate cut hopes'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT'],
    historicalVolatility: 'high'
  },
  'fed-funds-rate': {
    whyItMatters: 'The Federal Reserve interest rate decision affects borrowing costs across the entire economy.',
    typicalReaction: {
      hawkish: 'USD strengthens, stocks fall, bonds fall',
      dovish: 'USD weakens, stocks rally, bonds rally'
    },
    relatedAssets: ['DXY', 'SPY', 'TLT', 'QQQ'],
    historicalVolatility: 'high'
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
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (INDICATORS[slug]) {
    return INDICATORS[slug];
  }
  for (const [key, metadata] of Object.entries(INDICATORS)) {
    if (slug.includes(key) || key.includes(slug)) {
      return metadata;
    }
  }
  return {
    whyItMatters: 'This economic indicator provides insights into market conditions.',
    relatedAssets: [],
    historicalVolatility: 'medium'
  };
}

export function getCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
}
