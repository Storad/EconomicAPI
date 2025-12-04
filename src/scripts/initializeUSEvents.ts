/**
 * Initialize US Economic Events
 * Creates all US economic indicators needed for the calendar
 */

import db from '../config/database';

interface EventDefinition {
  slug: string;
  name: string;
  category: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  frequency: string;
  source: string;
  sourceUrl: string;
}

// Comprehensive list of US economic events
export const US_EVENTS: EventDefinition[] = [
  // INFLATION
  { slug: 'cpi', name: 'Consumer Price Index (CPI)', category: 'Inflation', description: 'Measures average change in prices paid by consumers', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/cpi/' },
  { slug: 'cpi-yoy', name: 'CPI Year-over-Year', category: 'Inflation', description: 'Annual change in consumer prices', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/cpi/' },
  { slug: 'core-cpi', name: 'Core CPI (ex Food & Energy)', category: 'Inflation', description: 'CPI excluding volatile food and energy', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/cpi/' },
  { slug: 'core-cpi-yoy', name: 'Core CPI Year-over-Year', category: 'Inflation', description: 'Annual change in core consumer prices', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/cpi/' },
  { slug: 'ppi', name: 'Producer Price Index (PPI)', category: 'Inflation', description: 'Measures average change in selling prices by producers', importance: 'medium', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/ppi/' },
  { slug: 'pce', name: 'Personal Consumption Expenditures', category: 'Inflation', description: 'Fed preferred inflation measure', importance: 'high', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },
  { slug: 'pce-yoy', name: 'PCE Year-over-Year', category: 'Inflation', description: 'Annual change in PCE prices', importance: 'high', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },
  { slug: 'core-pce', name: 'Core PCE (ex Food & Energy)', category: 'Inflation', description: 'Fed primary inflation gauge', importance: 'high', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },
  { slug: 'core-pce-yoy', name: 'Core PCE Year-over-Year', category: 'Inflation', description: 'Annual change in core PCE', importance: 'high', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },
  { slug: 'import-prices', name: 'Import Price Index', category: 'Inflation', description: 'Price changes for imported goods', importance: 'low', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/mxp/' },
  { slug: 'export-prices', name: 'Export Price Index', category: 'Inflation', description: 'Price changes for exported goods', importance: 'low', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/mxp/' },

  // EMPLOYMENT
  { slug: 'nonfarm-payrolls', name: 'Non-Farm Payrolls', category: 'Employment', description: 'Monthly change in total employed persons', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/ces/' },
  { slug: 'unemployment-rate', name: 'Unemployment Rate', category: 'Employment', description: 'Percentage of labor force unemployed', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/cps/' },
  { slug: 'average-hourly-earnings', name: 'Average Hourly Earnings', category: 'Employment', description: 'Average hourly wage growth', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/ces/' },
  { slug: 'labor-force-participation', name: 'Labor Force Participation Rate', category: 'Employment', description: 'Percentage of population in labor force', importance: 'medium', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/cps/' },
  { slug: 'initial-claims', name: 'Initial Jobless Claims', category: 'Employment', description: 'Weekly new unemployment benefit claims', importance: 'medium', frequency: 'Weekly', source: 'DOL', sourceUrl: 'https://www.dol.gov/ui/data.pdf' },
  { slug: 'continuing-claims', name: 'Continuing Jobless Claims', category: 'Employment', description: 'Ongoing unemployment benefit recipients', importance: 'medium', frequency: 'Weekly', source: 'DOL', sourceUrl: 'https://www.dol.gov/ui/data.pdf' },
  { slug: 'jolts', name: 'JOLTS Job Openings', category: 'Employment', description: 'Job openings, hires, and separations', importance: 'high', frequency: 'Monthly', source: 'BLS', sourceUrl: 'https://www.bls.gov/jlt/' },
  { slug: 'adp-employment', name: 'ADP Employment Change', category: 'Employment', description: 'Private sector employment change estimate', importance: 'medium', frequency: 'Monthly', source: 'ADP', sourceUrl: 'https://adpemploymentreport.com/' },
  { slug: 'challenger-job-cuts', name: 'Challenger Job Cuts', category: 'Employment', description: 'Announced corporate layoffs', importance: 'low', frequency: 'Monthly', source: 'Challenger', sourceUrl: 'https://www.challengergray.com/' },
  { slug: 'unit-labor-costs', name: 'Unit Labor Costs', category: 'Employment', description: 'Labor costs per unit of output', importance: 'medium', frequency: 'Quarterly', source: 'BLS', sourceUrl: 'https://www.bls.gov/lpc/' },
  { slug: 'nonfarm-productivity', name: 'Non-Farm Productivity', category: 'Employment', description: 'Output per hour worked', importance: 'medium', frequency: 'Quarterly', source: 'BLS', sourceUrl: 'https://www.bls.gov/lpc/' },

  // GDP & GROWTH
  { slug: 'gdp', name: 'Gross Domestic Product', category: 'GDP', description: 'Total economic output', importance: 'high', frequency: 'Quarterly', source: 'BEA', sourceUrl: 'https://www.bea.gov/data/gdp' },
  { slug: 'gdp-growth', name: 'GDP Growth Rate', category: 'GDP', description: 'Quarterly GDP growth annualized', importance: 'high', frequency: 'Quarterly', source: 'BEA', sourceUrl: 'https://www.bea.gov/data/gdp' },
  { slug: 'real-gdp', name: 'Real GDP', category: 'GDP', description: 'Inflation-adjusted GDP', importance: 'high', frequency: 'Quarterly', source: 'BEA', sourceUrl: 'https://www.bea.gov/data/gdp' },

  // CONSUMER
  { slug: 'retail-sales', name: 'Retail Sales', category: 'Consumer', description: 'Total retail store sales', importance: 'high', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/retail/' },
  { slug: 'retail-sales-ex-auto', name: 'Retail Sales ex Autos', category: 'Consumer', description: 'Retail sales excluding auto dealers', importance: 'high', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/retail/' },
  { slug: 'personal-income', name: 'Personal Income', category: 'Consumer', description: 'Total income received by individuals', importance: 'medium', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },
  { slug: 'personal-spending', name: 'Personal Spending', category: 'Consumer', description: 'Consumer expenditures', importance: 'medium', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },
  { slug: 'consumer-credit', name: 'Consumer Credit', category: 'Consumer', description: 'Outstanding consumer debt', importance: 'low', frequency: 'Monthly', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/releases/g19/' },
  { slug: 'umich-sentiment', name: 'Michigan Consumer Sentiment', category: 'Consumer', description: 'Consumer confidence survey', importance: 'medium', frequency: 'Monthly', source: 'UMich', sourceUrl: 'http://www.sca.isr.umich.edu/' },
  { slug: 'umich-inflation-expectations', name: 'Michigan Inflation Expectations', category: 'Consumer', description: 'Consumer inflation expectations', importance: 'medium', frequency: 'Monthly', source: 'UMich', sourceUrl: 'http://www.sca.isr.umich.edu/' },
  { slug: 'cb-consumer-confidence', name: 'CB Consumer Confidence', category: 'Consumer', description: 'Conference Board consumer confidence', importance: 'medium', frequency: 'Monthly', source: 'Conference Board', sourceUrl: 'https://www.conference-board.org/' },
  { slug: 'tipp-economic-optimism', name: 'IBD/TIPP Economic Optimism', category: 'Consumer', description: 'Economic optimism index', importance: 'low', frequency: 'Monthly', source: 'TIPP', sourceUrl: 'https://www.tipponline.com/' },
  { slug: 'vehicle-sales', name: 'Total Vehicle Sales', category: 'Consumer', description: 'Auto and light truck sales', importance: 'low', frequency: 'Monthly', source: 'BEA', sourceUrl: 'https://www.bea.gov/' },

  // MANUFACTURING & INDUSTRY
  { slug: 'ism-manufacturing', name: 'ISM Manufacturing PMI', category: 'Manufacturing', description: 'Manufacturing sector health', importance: 'high', frequency: 'Monthly', source: 'ISM', sourceUrl: 'https://www.ismworld.org/' },
  { slug: 'ism-manufacturing-prices', name: 'ISM Manufacturing Prices', category: 'Manufacturing', description: 'Manufacturing input prices', importance: 'medium', frequency: 'Monthly', source: 'ISM', sourceUrl: 'https://www.ismworld.org/' },
  { slug: 'ism-services', name: 'ISM Services PMI', category: 'Services', description: 'Services sector health', importance: 'high', frequency: 'Monthly', source: 'ISM', sourceUrl: 'https://www.ismworld.org/' },
  { slug: 'sp-manufacturing-pmi', name: 'S&P Manufacturing PMI', category: 'Manufacturing', description: 'S&P Global manufacturing PMI', importance: 'medium', frequency: 'Monthly', source: 'S&P Global', sourceUrl: 'https://www.spglobal.com/marketintelligence/' },
  { slug: 'sp-services-pmi', name: 'S&P Services PMI', category: 'Services', description: 'S&P Global services PMI', importance: 'medium', frequency: 'Monthly', source: 'S&P Global', sourceUrl: 'https://www.spglobal.com/marketintelligence/' },
  { slug: 'industrial-production', name: 'Industrial Production', category: 'Manufacturing', description: 'Output of factories, mines, utilities', importance: 'medium', frequency: 'Monthly', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/releases/g17/' },
  { slug: 'capacity-utilization', name: 'Capacity Utilization', category: 'Manufacturing', description: 'Industrial capacity usage rate', importance: 'medium', frequency: 'Monthly', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/releases/g17/' },
  { slug: 'durable-goods', name: 'Durable Goods Orders', category: 'Manufacturing', description: 'Orders for long-lasting goods', importance: 'high', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/manufacturing/m3/' },
  { slug: 'factory-orders', name: 'Factory Orders', category: 'Manufacturing', description: 'Total manufacturing orders', importance: 'medium', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/manufacturing/m3/' },
  { slug: 'business-inventories', name: 'Business Inventories', category: 'Manufacturing', description: 'Inventory levels across sectors', importance: 'low', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/' },
  { slug: 'wholesale-inventories', name: 'Wholesale Inventories', category: 'Manufacturing', description: 'Wholesaler inventory levels', importance: 'low', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/' },

  // REGIONAL FED SURVEYS
  { slug: 'empire-state', name: 'Empire State Manufacturing', category: 'Manufacturing', description: 'NY Fed manufacturing survey', importance: 'medium', frequency: 'Monthly', source: 'NY Fed', sourceUrl: 'https://www.newyorkfed.org/' },
  { slug: 'philly-fed', name: 'Philadelphia Fed Index', category: 'Manufacturing', description: 'Philly Fed manufacturing survey', importance: 'medium', frequency: 'Monthly', source: 'Philly Fed', sourceUrl: 'https://www.philadelphiafed.org/' },
  { slug: 'richmond-fed', name: 'Richmond Fed Index', category: 'Manufacturing', description: 'Richmond Fed manufacturing survey', importance: 'low', frequency: 'Monthly', source: 'Richmond Fed', sourceUrl: 'https://www.richmondfed.org/' },
  { slug: 'dallas-fed', name: 'Dallas Fed Manufacturing', category: 'Manufacturing', description: 'Dallas Fed manufacturing survey', importance: 'low', frequency: 'Monthly', source: 'Dallas Fed', sourceUrl: 'https://www.dallasfed.org/' },
  { slug: 'chicago-pmi', name: 'Chicago PMI', category: 'Manufacturing', description: 'Chicago area business barometer', importance: 'medium', frequency: 'Monthly', source: 'ISM-Chicago', sourceUrl: 'https://www.chicagobusiness.com/' },
  { slug: 'chicago-fed-activity', name: 'Chicago Fed National Activity', category: 'Economy', description: 'National economic activity index', importance: 'low', frequency: 'Monthly', source: 'Chicago Fed', sourceUrl: 'https://www.chicagofed.org/' },
  { slug: 'nfib-small-business', name: 'NFIB Small Business Optimism', category: 'Business', description: 'Small business sentiment', importance: 'medium', frequency: 'Monthly', source: 'NFIB', sourceUrl: 'https://www.nfib.com/' },

  // HOUSING
  { slug: 'housing-starts', name: 'Housing Starts', category: 'Housing', description: 'New residential construction', importance: 'medium', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/construction/' },
  { slug: 'building-permits', name: 'Building Permits', category: 'Housing', description: 'Permits for new construction', importance: 'medium', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/construction/' },
  { slug: 'existing-home-sales', name: 'Existing Home Sales', category: 'Housing', description: 'Sales of pre-owned homes', importance: 'medium', frequency: 'Monthly', source: 'NAR', sourceUrl: 'https://www.nar.realtor/' },
  { slug: 'new-home-sales', name: 'New Home Sales', category: 'Housing', description: 'Sales of newly built homes', importance: 'medium', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/construction/' },
  { slug: 'pending-home-sales', name: 'Pending Home Sales', category: 'Housing', description: 'Home sale contracts signed', importance: 'medium', frequency: 'Monthly', source: 'NAR', sourceUrl: 'https://www.nar.realtor/' },
  { slug: 'nahb-housing', name: 'NAHB Housing Market Index', category: 'Housing', description: 'Homebuilder sentiment', importance: 'medium', frequency: 'Monthly', source: 'NAHB', sourceUrl: 'https://www.nahb.org/' },
  { slug: 'case-shiller-home-price', name: 'Case-Shiller Home Price Index', category: 'Housing', description: 'Home price changes in major metros', importance: 'medium', frequency: 'Monthly', source: 'S&P', sourceUrl: 'https://www.spglobal.com/' },
  { slug: 'construction-spending', name: 'Construction Spending', category: 'Housing', description: 'Total construction expenditures', importance: 'low', frequency: 'Monthly', source: 'Census', sourceUrl: 'https://www.census.gov/construction/' },

  // TRADE
  { slug: 'trade-balance', name: 'Trade Balance', category: 'Trade', description: 'Exports minus imports', importance: 'medium', frequency: 'Monthly', source: 'Census/BEA', sourceUrl: 'https://www.census.gov/foreign-trade/' },

  // FED & INTEREST RATES
  { slug: 'fomc-meeting', name: 'FOMC Interest Rate Decision', category: 'Central Bank', description: 'Federal Reserve rate decision', importance: 'high', frequency: 'Eight per year', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/monetarypolicy/' },
  { slug: 'fed-press-conference', name: 'Fed Press Conference', category: 'Central Bank', description: 'Fed Chair press conference', importance: 'high', frequency: 'Eight per year', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/' },
  { slug: 'fed-chair-speaks', name: 'Fed Chair Speech', category: 'Central Bank', description: 'Federal Reserve Chair remarks', importance: 'high', frequency: 'Variable', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/' },
  { slug: 'fomc-member-speaks', name: 'FOMC Member Speech', category: 'Central Bank', description: 'Fed official remarks', importance: 'medium', frequency: 'Variable', source: 'Fed', sourceUrl: 'https://www.federalreserve.gov/' },
  { slug: 'leading-index', name: 'CB Leading Economic Index', category: 'Economy', description: 'Composite leading indicator', importance: 'medium', frequency: 'Monthly', source: 'Conference Board', sourceUrl: 'https://www.conference-board.org/' },

  // ENERGY
  { slug: 'eia-crude-inventories', name: 'EIA Crude Oil Inventories', category: 'Energy', description: 'Weekly crude oil stocks', importance: 'medium', frequency: 'Weekly', source: 'EIA', sourceUrl: 'https://www.eia.gov/petroleum/' },
  { slug: 'eia-natgas-storage', name: 'EIA Natural Gas Storage', category: 'Energy', description: 'Weekly natural gas stocks', importance: 'low', frequency: 'Weekly', source: 'EIA', sourceUrl: 'https://www.eia.gov/naturalgas/' },
  { slug: 'api-crude-inventory', name: 'API Crude Oil Inventory', category: 'Energy', description: 'Weekly crude oil stocks (API)', importance: 'low', frequency: 'Weekly', source: 'API', sourceUrl: 'https://www.api.org/' },
  { slug: 'baker-hughes-oil-rigs', name: 'Baker Hughes Oil Rig Count', category: 'Energy', description: 'Active oil drilling rigs', importance: 'low', frequency: 'Weekly', source: 'Baker Hughes', sourceUrl: 'https://bakerhughes.com/' },
  { slug: 'opec-meeting', name: 'OPEC Meeting', category: 'Energy', description: 'OPEC production decision', importance: 'high', frequency: 'Variable', source: 'OPEC', sourceUrl: 'https://www.opec.org/' },
];

export function initializeUSEvents(): { created: number; existing: number } {
  console.log('Initializing US economic events...');

  const checkEvent = db.prepare('SELECT id FROM events WHERE slug = ?');
  const insertEvent = db.prepare(`
    INSERT INTO events (slug, name, category, country, description, importance, frequency, source, source_url)
    VALUES (?, ?, ?, 'US', ?, ?, ?, ?, ?)
  `);

  let created = 0;
  let existing = 0;

  for (const event of US_EVENTS) {
    const exists = checkEvent.get(event.slug);
    if (exists) {
      existing++;
      continue;
    }

    insertEvent.run(
      event.slug,
      event.name,
      event.category,
      event.description,
      event.importance,
      event.frequency,
      event.source,
      event.sourceUrl
    );
    console.log(`Created: ${event.slug} - ${event.name}`);
    created++;
  }

  console.log(`US Events: ${created} created, ${existing} already existed`);
  return { created, existing };
}

// Run directly if this is the main module
if (require.main === module) {
  initializeUSEvents();
}
