import dotenv from 'dotenv';
dotenv.config();

import db, { initializeDatabase } from '../config/database';

// December 2025 Economic Calendar
// Note: Schedule affected by 2025 government shutdown - BLS dates revised
// Sources: BLS, Census Bureau, ISM, Conference Board, Federal Reserve

interface ScheduledRelease {
  slug: string;
  date: string;
  time: string;
  timezone: string;
  period?: string;
  notes?: string;
}

// Week of Nov 30 - Dec 6, 2025 (From Forex Factory)
const WEEK_DEC_1_RELEASES: ScheduledRelease[] = [
  // Sunday, November 30
  { slug: 'opec-meeting', date: '2025-11-30', time: 'All Day', timezone: 'America/New_York', period: '', notes: 'OPEC-JMMC Meetings' },

  // Monday, December 1
  { slug: 'sp-manufacturing-pmi', date: '2025-12-01', time: '9:45 AM', timezone: 'America/New_York', period: 'Nov Final' },
  { slug: 'ism-manufacturing', date: '2025-12-01', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ism-manufacturing-prices', date: '2025-12-01', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ism-manufacturing-employment', date: '2025-12-01', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ism-manufacturing-new-orders', date: '2025-12-01', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'construction-spending', date: '2025-12-01', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'fed-chair-speaks', date: '2025-12-01', time: '6:00 PM', timezone: 'America/New_York', period: '', notes: 'Fed Chair Powell Speaks' },

  // Tuesday, December 2
  { slug: 'jolts', date: '2025-12-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'fomc-member-speaks', date: '2025-12-02', time: '10:00 AM', timezone: 'America/New_York', period: '', notes: 'FOMC Member Bowman Speaks' },
  { slug: 'tipp-economic-optimism', date: '2025-12-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'vehicle-sales', date: '2025-12-02', time: 'All Day', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'api-crude-inventory', date: '2025-12-02', time: '4:30 PM', timezone: 'America/New_York', period: 'Week' },

  // Wednesday, December 3
  { slug: 'mba-mortgage-applications', date: '2025-12-03', time: '7:00 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'adp-employment', date: '2025-12-03', time: '8:15 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'import-prices', date: '2025-12-03', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'capacity-utilization', date: '2025-12-03', time: '9:15 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'industrial-production', date: '2025-12-03', time: '9:15 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'sp-services-pmi', date: '2025-12-03', time: '9:45 AM', timezone: 'America/New_York', period: 'Nov Final' },
  { slug: 'ism-services', date: '2025-12-03', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ism-services-prices', date: '2025-12-03', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ism-services-employment', date: '2025-12-03', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ism-services-new-orders', date: '2025-12-03', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'eia-crude-inventories', date: '2025-12-03', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },

  // Thursday, December 4
  { slug: 'challenger-job-cuts', date: '2025-12-04', time: '7:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'initial-claims', date: '2025-12-04', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'continuing-claims', date: '2025-12-04', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'jobless-claims-4wk-avg', date: '2025-12-04', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'trade-balance', date: '2025-12-04', time: '8:30 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'factory-orders', date: '2025-12-04', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'factory-orders-ex-transport', date: '2025-12-04', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'durable-goods-ex-transport', date: '2025-12-04', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct Rev' },
  { slug: 'durable-goods-ex-defense', date: '2025-12-04', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct Rev' },
  { slug: 'atlanta-fed-gdpnow', date: '2025-12-04', time: '10:30 AM', timezone: 'America/New_York', period: 'Q4' },
  { slug: 'eia-natgas-storage', date: '2025-12-04', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'treasury-4w-auction', date: '2025-12-04', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-8w-auction', date: '2025-12-04', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'fomc-member-speaks', date: '2025-12-04', time: '12:00 PM', timezone: 'America/New_York', period: '', notes: 'FOMC Member Bowman Speaks' },
  { slug: 'fed-balance-sheet', date: '2025-12-04', time: '4:30 PM', timezone: 'America/New_York', period: 'Week' },

  // Friday, December 5
  { slug: 'nonfarm-payrolls', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'private-payrolls', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'government-payrolls', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'unemployment-rate', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'u6-unemployment', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'average-hourly-earnings', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'average-weekly-hours', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'labor-force-participation', date: '2025-12-05', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-pce', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'personal-income', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'personal-spending', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'real-personal-spending', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'personal-savings-rate', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'umich-sentiment', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec Prelim' },
  { slug: 'umich-inflation-expectations', date: '2025-12-05', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec Prelim' },
  { slug: 'consumer-credit', date: '2025-12-05', time: '3:00 PM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'baker-hughes-oil-rigs', date: '2025-12-05', time: '1:00 PM', timezone: 'America/New_York', period: 'Week' },
];

// Week of Dec 7-13, 2025
const WEEK_DEC_8_RELEASES: ScheduledRelease[] = [
  // Monday, December 8
  { slug: 'wholesale-inventories', date: '2025-12-08', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct Final' },
  { slug: 'treasury-3m-auction', date: '2025-12-08', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-6m-auction', date: '2025-12-08', time: '11:30 AM', timezone: 'America/New_York', period: '' },

  // Tuesday, December 9
  { slug: 'nfib-small-business', date: '2025-12-09', time: '6:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'unit-labor-costs', date: '2025-12-09', time: '8:30 AM', timezone: 'America/New_York', period: 'Q3 Final' },
  { slug: 'nonfarm-productivity', date: '2025-12-09', time: '8:30 AM', timezone: 'America/New_York', period: 'Q3 Final' },
  { slug: 'real-avg-hourly-earnings', date: '2025-12-09', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'treasury-10y-auction', date: '2025-12-09', time: '1:00 PM', timezone: 'America/New_York', period: '' },

  // Wednesday, December 10
  { slug: 'mba-mortgage-applications', date: '2025-12-10', time: '7:00 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'cpi', date: '2025-12-10', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov', notes: 'Revised date - shutdown impact' },
  { slug: 'cpi-yoy', date: '2025-12-10', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-cpi', date: '2025-12-10', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-cpi-yoy', date: '2025-12-10', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'real-avg-hourly-earnings', date: '2025-12-10', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'treasury-budget', date: '2025-12-10', time: '2:00 PM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'eia-crude-inventories', date: '2025-12-10', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'treasury-30y-auction', date: '2025-12-10', time: '1:00 PM', timezone: 'America/New_York', period: '' },

  // Thursday, December 11
  { slug: 'initial-claims', date: '2025-12-11', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'continuing-claims', date: '2025-12-11', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'jobless-claims-4wk-avg', date: '2025-12-11', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'ppi', date: '2025-12-11', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ppi-ex-food-energy', date: '2025-12-11', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'ppi-final-demand', date: '2025-12-11', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'atlanta-fed-gdpnow', date: '2025-12-11', time: '10:30 AM', timezone: 'America/New_York', period: 'Q4' },
  { slug: 'eia-natgas-storage', date: '2025-12-11', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'treasury-4w-auction', date: '2025-12-11', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-8w-auction', date: '2025-12-11', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'fed-balance-sheet', date: '2025-12-11', time: '4:30 PM', timezone: 'America/New_York', period: 'Week' },

  // Friday, December 12
  { slug: 'import-prices', date: '2025-12-12', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'export-prices', date: '2025-12-12', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'umich-sentiment', date: '2025-12-12', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec Prelim' },
  { slug: 'baker-hughes-oil-rigs', date: '2025-12-12', time: '1:00 PM', timezone: 'America/New_York', period: 'Week' },
];

// Week of Dec 14-20, 2025
const WEEK_DEC_15_RELEASES: ScheduledRelease[] = [
  // Monday, December 15
  { slug: 'empire-state', date: '2025-12-15', time: '8:30 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'sp-manufacturing-pmi', date: '2025-12-15', time: '9:45 AM', timezone: 'America/New_York', period: 'Dec Flash' },
  { slug: 'sp-services-pmi', date: '2025-12-15', time: '9:45 AM', timezone: 'America/New_York', period: 'Dec Flash' },
  { slug: 'treasury-3m-auction', date: '2025-12-15', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-6m-auction', date: '2025-12-15', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'tic-flows', date: '2025-12-15', time: '4:00 PM', timezone: 'America/New_York', period: 'Oct' },

  // Tuesday, December 16
  { slug: 'retail-sales', date: '2025-12-16', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'retail-sales-ex-auto', date: '2025-12-16', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-retail-sales', date: '2025-12-16', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'retail-control-group', date: '2025-12-16', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'industrial-production', date: '2025-12-16', time: '9:15 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'capacity-utilization', date: '2025-12-16', time: '9:15 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'nahb-housing', date: '2025-12-16', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'business-inventories', date: '2025-12-16', time: '10:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'treasury-2y-auction', date: '2025-12-16', time: '1:00 PM', timezone: 'America/New_York', period: '' },

  // Wednesday, December 17
  { slug: 'mba-mortgage-applications', date: '2025-12-17', time: '7:00 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'housing-starts', date: '2025-12-17', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'building-permits', date: '2025-12-17', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'eia-crude-inventories', date: '2025-12-17', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'treasury-5y-auction', date: '2025-12-17', time: '1:00 PM', timezone: 'America/New_York', period: '' },
  { slug: 'fomc-meeting', date: '2025-12-17', time: '2:00 PM', timezone: 'America/New_York', notes: 'Interest rate decision' },
  { slug: 'fed-press-conference', date: '2025-12-17', time: '2:30 PM', timezone: 'America/New_York' },

  // Thursday, December 18
  { slug: 'initial-claims', date: '2025-12-18', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'continuing-claims', date: '2025-12-18', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'jobless-claims-4wk-avg', date: '2025-12-18', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'philly-fed', date: '2025-12-18', time: '8:30 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'current-account', date: '2025-12-18', time: '8:30 AM', timezone: 'America/New_York', period: 'Q3' },
  { slug: 'existing-home-sales', date: '2025-12-18', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'leading-index', date: '2025-12-18', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'atlanta-fed-gdpnow', date: '2025-12-18', time: '10:30 AM', timezone: 'America/New_York', period: 'Q4' },
  { slug: 'eia-natgas-storage', date: '2025-12-18', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'treasury-4w-auction', date: '2025-12-18', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-8w-auction', date: '2025-12-18', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-7y-auction', date: '2025-12-18', time: '1:00 PM', timezone: 'America/New_York', period: '' },
  { slug: 'fed-balance-sheet', date: '2025-12-18', time: '4:30 PM', timezone: 'America/New_York', period: 'Week' },

  // Friday, December 19
  { slug: 'pce', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'pce-yoy', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-pce', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-pce-yoy', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'trimmed-mean-pce', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'personal-income', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'personal-spending', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'real-personal-spending', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'personal-savings-rate', date: '2025-12-19', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'kansas-city-fed', date: '2025-12-19', time: '11:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'umich-sentiment', date: '2025-12-19', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec Final' },
  { slug: 'umich-inflation-expectations', date: '2025-12-19', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec Final' },
  { slug: 'baker-hughes-oil-rigs', date: '2025-12-19', time: '1:00 PM', timezone: 'America/New_York', period: 'Week' },
];

// Week of Dec 21-27, 2025 (Christmas week - light schedule)
const WEEK_DEC_22_RELEASES: ScheduledRelease[] = [
  // Monday, December 22
  { slug: 'chicago-fed-activity', date: '2025-12-22', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'treasury-3m-auction', date: '2025-12-22', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-6m-auction', date: '2025-12-22', time: '11:30 AM', timezone: 'America/New_York', period: '' },

  // Tuesday, December 23
  { slug: 'gdp-growth', date: '2025-12-23', time: '8:30 AM', timezone: 'America/New_York', period: 'Q3 Final' },
  { slug: 'gdp', date: '2025-12-23', time: '8:30 AM', timezone: 'America/New_York', period: 'Q3 Final' },
  { slug: 'real-gdp', date: '2025-12-23', time: '8:30 AM', timezone: 'America/New_York', period: 'Q3 Final' },
  { slug: 'cb-consumer-confidence', date: '2025-12-23', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'new-home-sales', date: '2025-12-23', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'richmond-fed', date: '2025-12-23', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'fhfa-house-price-index', date: '2025-12-23', time: '9:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'treasury-2y-auction', date: '2025-12-23', time: '1:00 PM', timezone: 'America/New_York', period: '' },

  // Wednesday, December 24 - Christmas Eve (half day, limited releases)
  { slug: 'mba-mortgage-applications', date: '2025-12-24', time: '7:00 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'durable-goods', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'durable-goods-ex-transport', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'durable-goods-ex-defense', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'core-capital-goods', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'initial-claims', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'continuing-claims', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'jobless-claims-4wk-avg', date: '2025-12-24', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'eia-crude-inventories', date: '2025-12-24', time: '11:00 AM', timezone: 'America/New_York', period: 'Week', notes: 'Early release due to holiday' },

  // Thursday, December 25 - Christmas Day (markets closed)
  // No releases

  // Friday, December 26
  { slug: 'atlanta-fed-gdpnow', date: '2025-12-26', time: '10:30 AM', timezone: 'America/New_York', period: 'Q4' },
  { slug: 'eia-natgas-storage', date: '2025-12-26', time: '10:30 AM', timezone: 'America/New_York', period: 'Week', notes: 'Delayed from Thursday due to holiday' },
  { slug: 'baker-hughes-oil-rigs', date: '2025-12-26', time: '1:00 PM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'fed-balance-sheet', date: '2025-12-26', time: '4:30 PM', timezone: 'America/New_York', period: 'Week' },
];

// Week of Dec 28 - Jan 3, 2026
const WEEK_DEC_29_RELEASES: ScheduledRelease[] = [
  // Monday, December 29
  { slug: 'pending-home-sales', date: '2025-12-29', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'dallas-fed', date: '2025-12-29', time: '10:30 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'treasury-3m-auction', date: '2025-12-29', time: '11:30 AM', timezone: 'America/New_York', period: '' },
  { slug: 'treasury-6m-auction', date: '2025-12-29', time: '11:30 AM', timezone: 'America/New_York', period: '' },

  // Tuesday, December 30
  { slug: 'case-shiller-home-price', date: '2025-12-30', time: '9:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'fhfa-house-price-index', date: '2025-12-30', time: '9:00 AM', timezone: 'America/New_York', period: 'Oct' },
  { slug: 'chicago-pmi', date: '2025-12-30', time: '9:45 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'cb-consumer-confidence', date: '2025-12-30', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },

  // Wednesday, December 31 - New Year's Eve (half day)
  { slug: 'mba-mortgage-applications', date: '2025-12-31', time: '7:00 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'initial-claims', date: '2025-12-31', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'continuing-claims', date: '2025-12-31', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'jobless-claims-4wk-avg', date: '2025-12-31', time: '8:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'eia-crude-inventories', date: '2025-12-31', time: '10:30 AM', timezone: 'America/New_York', period: 'Week' },
  { slug: 'atlanta-fed-gdpnow', date: '2025-12-31', time: '10:30 AM', timezone: 'America/New_York', period: 'Q4' },
  { slug: 'fed-balance-sheet', date: '2025-12-31', time: '4:30 PM', timezone: 'America/New_York', period: 'Week' },

  // Thursday, January 1, 2026 - New Year's Day (markets closed)
  // No releases

  // Friday, January 2, 2026
  { slug: 'ism-manufacturing', date: '2026-01-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'ism-manufacturing-prices', date: '2026-01-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'ism-manufacturing-employment', date: '2026-01-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'ism-manufacturing-new-orders', date: '2026-01-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Dec' },
  { slug: 'construction-spending', date: '2026-01-02', time: '10:00 AM', timezone: 'America/New_York', period: 'Nov' },
  { slug: 'eia-natgas-storage', date: '2026-01-02', time: '10:30 AM', timezone: 'America/New_York', period: 'Week', notes: 'Delayed from Thursday due to holiday' },
  { slug: 'baker-hughes-oil-rigs', date: '2026-01-02', time: '1:00 PM', timezone: 'America/New_York', period: 'Week' },
];

// Combine all releases
const ALL_RELEASES = [
  ...WEEK_DEC_1_RELEASES,
  ...WEEK_DEC_8_RELEASES,
  ...WEEK_DEC_15_RELEASES,
  ...WEEK_DEC_22_RELEASES,
  ...WEEK_DEC_29_RELEASES,
];

export async function populateCalendar(): Promise<{ inserted: number; skipped: number }> {
  console.log('Populating economic calendar with scheduled releases...');

  const getEventBySlug = db.prepare('SELECT id, name FROM events WHERE slug = ?');
  const insertRelease = db.prepare(`
    INSERT OR REPLACE INTO releases (event_id, release_date, release_time, timezone, period, source_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  let skipped = 0;

  for (const release of ALL_RELEASES) {
    const event = getEventBySlug.get(release.slug) as { id: number; name: string } | undefined;

    if (event) {
      insertRelease.run(
        event.id,
        release.date,
        release.time,
        release.timezone,
        release.period || null,
        release.notes ? `Note: ${release.notes}` : null
      );
      console.log(`✓ ${release.date} ${release.time} - ${event.name} (${release.period || ''})`);
      inserted++;
    } else {
      console.log(`✗ Skipped: ${release.slug} - event not found`);
      skipped++;
    }
  }

  console.log(`Calendar populated: ${inserted} inserted, ${skipped} skipped`);
  return { inserted, skipped };
}

// Run directly if this is the main module
if (require.main === module) {
  initializeDatabase();
  populateCalendar().catch(console.error);
}
