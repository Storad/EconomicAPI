export interface EconomicEvent {
  id?: number;
  name: string;
  slug: string;
  category: string;
  country: string;
  currency?: string;
  description?: string;
  why_it_matters?: string;
  source?: string;
  source_url?: string;
  importance: 'high' | 'medium' | 'low';
  frequency?: string;
  release_time?: string;
  typical_reaction_higher?: string;
  typical_reaction_lower?: string;
  typical_reaction_hawkish?: string;
  typical_reaction_dovish?: string;
  related_assets?: string;
  historical_volatility?: string;
}

export interface Release {
  id?: number;
  event_id: number;
  release_date: string;
  release_time?: string;
  timezone?: string;
  actual?: number | null;
  forecast?: number | null;
  previous?: number | null;
  unit?: string;
  period?: string;
  is_preliminary?: boolean;
  source_url?: string;
}

export interface HistoricalData {
  id?: number;
  event_id: number;
  date: string;
  value: number;
  period?: string;
}

export interface MarketSession {
  id?: number;
  name: string;
  timezone: string;
  open_time: string;
  close_time: string;
  days_active?: string;
}

export interface CalendarEvent {
  id: number;
  name: string;
  slug: string;
  category: string;
  country: string;
  currency?: string;
  importance: 'high' | 'medium' | 'low';
  description?: string;
  release_date: string;
  release_time?: string;
  timezone?: string;
  actual?: number | null;
  forecast?: number | null;
  previous?: number | null;
  unit?: string;
  period?: string;
  // Enriched metadata
  why_it_matters?: string;
  typical_reaction?: {
    higherThanExpected?: string;
    lowerThanExpected?: string;
    hawkish?: string;
    dovish?: string;
  };
  related_assets?: string[];
  historical_volatility?: string;
}

// Econtimeline-compatible event format
export interface EcontimelineEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low' | 'holiday';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  category: string;
  country?: string;
  source?: string;
  sourceUrl?: string;
  description?: string;
  whyItMatters?: string;
  frequency?: string;
  typicalReaction?: {
    higherThanExpected?: string;
    lowerThanExpected?: string;
    hawkish?: string;
    dovish?: string;
  };
  relatedAssets?: string[];
  historicalVolatility?: string;
}

export interface FREDSeriesObservation {
  date: string;
  value: string;
}

export interface BLSReleaseSchedule {
  name: string;
  date: string;
  time: string;
}
