/**
 * Release Schedule Patterns
 * Defines when economic indicators are typically released
 */

export interface ReleasePattern {
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'eight-per-year';
  dayOfMonth?: number;
  dayOfWeek?: number;
  time: string;
  timezone: string;
}

export const RELEASE_SCHEDULES: Record<string, ReleasePattern> = {
  'us-cpi': {
    frequency: 'monthly',
    dayOfMonth: 12,
    time: '08:30',
    timezone: 'America/New_York'
  },
  'us-nfp': {
    frequency: 'monthly',
    dayOfWeek: 5,
    time: '08:30',
    timezone: 'America/New_York'
  },
  'fed-funds-rate': {
    frequency: 'eight-per-year',
    time: '14:00',
    timezone: 'America/New_York'
  },
  'us-gdp': {
    frequency: 'quarterly',
    time: '08:30',
    timezone: 'America/New_York'
  },
  'us-ppi': {
    frequency: 'monthly',
    dayOfMonth: 14,
    time: '08:30',
    timezone: 'America/New_York'
  },
  'us-retail-sales': {
    frequency: 'monthly',
    dayOfMonth: 15,
    time: '08:30',
    timezone: 'America/New_York'
  }
};

export function generateFutureReleases(slug: string, months: number = 6): Date[] {
  const schedule = RELEASE_SCHEDULES[slug];
  if (!schedule) return [];

  const dates: Date[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, schedule.dayOfMonth || 15);
    dates.push(date);
  }

  return dates;
}

export function getReleaseSchedule(slug: string): ReleasePattern | null {
  return RELEASE_SCHEDULES[slug] || null;
}
