import dotenv from 'dotenv';
dotenv.config();

import db from '../config/database';

// Official source URLs for each economic indicator
const SOURCE_URLS: Record<string, string> = {
  // BLS Reports
  'nonfarm-payrolls': 'https://www.bls.gov/news.release/empsit.nr0.htm',
  'unemployment-rate': 'https://www.bls.gov/news.release/empsit.nr0.htm',
  'average-hourly-earnings': 'https://www.bls.gov/news.release/empsit.nr0.htm',
  'labor-force-participation': 'https://www.bls.gov/news.release/empsit.nr0.htm',
  'average-weekly-hours': 'https://www.bls.gov/news.release/empsit.nr0.htm',
  'cpi': 'https://www.bls.gov/news.release/cpi.nr0.htm',
  'cpi-yoy': 'https://www.bls.gov/news.release/cpi.nr0.htm',
  'core-cpi': 'https://www.bls.gov/news.release/cpi.nr0.htm',
  'core-cpi-yoy': 'https://www.bls.gov/news.release/cpi.nr0.htm',
  'ppi': 'https://www.bls.gov/news.release/ppi.nr0.htm',
  'jolts': 'https://www.bls.gov/news.release/jolts.nr0.htm',
  'jolts-quits': 'https://www.bls.gov/news.release/jolts.nr0.htm',
  'jolts-hires': 'https://www.bls.gov/news.release/jolts.nr0.htm',
  'import-prices': 'https://www.bls.gov/news.release/ximpim.nr0.htm',
  'export-prices': 'https://www.bls.gov/news.release/ximpim.nr0.htm',
  'employment-cost-index': 'https://www.bls.gov/news.release/eci.nr0.htm',
  'unit-labor-costs': 'https://www.bls.gov/news.release/prod2.nr0.htm',
  'nonfarm-productivity': 'https://www.bls.gov/news.release/prod2.nr0.htm',

  // DOL
  'initial-claims': 'https://www.dol.gov/ui/data.pdf',
  'continuing-claims': 'https://www.dol.gov/ui/data.pdf',

  // BEA Reports
  'gdp': 'https://www.bea.gov/news/glance',
  'gdp-growth': 'https://www.bea.gov/news/glance',
  'real-gdp': 'https://www.bea.gov/news/glance',
  'gdp-deflator': 'https://www.bea.gov/news/glance',
  'pce': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'pce-yoy': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'core-pce': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'core-pce-yoy': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'personal-income': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'personal-spending': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'personal-savings-rate': 'https://www.bea.gov/news/2024/personal-income-and-outlays',
  'trade-balance': 'https://www.bea.gov/news/2024/us-international-trade-goods-and-services',
  'exports': 'https://www.bea.gov/news/2024/us-international-trade-goods-and-services',
  'imports': 'https://www.bea.gov/news/2024/us-international-trade-goods-and-services',
  'current-account': 'https://www.bea.gov/news/2024/us-current-account-deficit',

  // Census Bureau
  'retail-sales': 'https://www.census.gov/retail/index.html',
  'retail-sales-ex-auto': 'https://www.census.gov/retail/index.html',
  'housing-starts': 'https://www.census.gov/construction/nrc/index.html',
  'building-permits': 'https://www.census.gov/construction/bps/',
  'new-home-sales': 'https://www.census.gov/construction/nrs/index.html',
  'durable-goods': 'https://www.census.gov/manufacturing/m3/adv/index.html',
  'factory-orders': 'https://www.census.gov/manufacturing/m3/index.html',
  'construction-spending': 'https://www.census.gov/construction/c30/c30index.html',
  'wholesale-inventories': 'https://www.census.gov/wholesale/index.html',
  'business-inventories': 'https://www.census.gov/mtis/index.html',

  // Federal Reserve
  'industrial-production': 'https://www.federalreserve.gov/releases/g17/current/',
  'capacity-utilization': 'https://www.federalreserve.gov/releases/g17/current/',
  'fomc-meeting': 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  'fomc-minutes': 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  'fed-press-conference': 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  'beige-book': 'https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm',
  'fed-chair-speaks': 'https://www.federalreserve.gov/newsevents/speeches.htm',
  'fomc-member-speaks': 'https://www.federalreserve.gov/newsevents/speeches.htm',
  'fed-balance-sheet': 'https://www.federalreserve.gov/releases/h41/',
  'consumer-credit': 'https://www.federalreserve.gov/releases/g19/current/',
  'm1-money-supply': 'https://www.federalreserve.gov/releases/h6/current/',
  'm2-money-supply': 'https://www.federalreserve.gov/releases/h6/current/',
  'fed-funds-rate': 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm',
  'fed-funds-target-upper': 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm',
  'fed-funds-target-lower': 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm',

  // Regional Fed
  'empire-state': 'https://www.newyorkfed.org/survey/empire/empiresurvey_overview',
  'philly-fed': 'https://www.philadelphiafed.org/surveys-and-data/regional-economic-analysis/mbos',
  'richmond-fed': 'https://www.richmondfed.org/research/regional_economy/surveys_of_business_conditions/manufacturing',
  'dallas-fed': 'https://www.dallasfed.org/research/surveys/tmos',
  'kc-fed': 'https://www.kansascityfed.org/research/regional-research/manufacturing-survey/',
  'chicago-fed-activity': 'https://www.chicagofed.org/research/data/cfnai/current-data',
  'gdpnow': 'https://www.atlantafed.org/cqer/research/gdpnow',

  // ISM
  'ism-manufacturing': 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/pmi/november/',
  'ism-services': 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/services/november/',
  'ism-manufacturing-prices': 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/pmi/november/',
  'chicago-pmi': 'https://www.ismchicago.org/index.cfm?BV=1',

  // S&P Global PMI
  'sp-manufacturing-pmi': 'https://www.pmi.spglobal.com/Public/Home/PressRelease',
  'sp-services-pmi': 'https://www.pmi.spglobal.com/Public/Home/PressRelease',
  'sp-composite-pmi': 'https://www.pmi.spglobal.com/Public/Home/PressRelease',

  // University of Michigan
  'umich-sentiment': 'http://www.sca.isr.umich.edu/',
  'umich-inflation-expectations': 'http://www.sca.isr.umich.edu/',
  'umich-5y-inflation': 'http://www.sca.isr.umich.edu/',

  // Conference Board
  'cb-consumer-confidence': 'https://www.conference-board.org/topics/consumer-confidence',
  'leading-index': 'https://www.conference-board.org/topics/us-leading-indicators',

  // Housing
  'existing-home-sales': 'https://www.nar.realtor/research-and-statistics/housing-statistics/existing-home-sales',
  'pending-home-sales': 'https://www.nar.realtor/research-and-statistics/housing-statistics/pending-home-sales',
  'nahb-housing': 'https://www.nahb.org/news-and-economics/housing-economics/indices/housing-market-index',
  'case-shiller-home-price': 'https://www.spglobal.com/spdji/en/index-family/indicators/sp-corelogic-case-shiller/',
  'mba-mortgage-apps': 'https://www.mba.org/news-and-research/newsroom',

  // Treasury
  '3m-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  '6m-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  '1y-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  '2y-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  '5y-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  '10y-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  '30y-treasury': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  'tic-flows': 'https://home.treasury.gov/data/treasury-international-capital-tic-system',

  // EIA Energy
  'eia-crude-inventories': 'https://www.eia.gov/petroleum/supply/weekly/',
  'eia-gasoline-inventories': 'https://www.eia.gov/petroleum/supply/weekly/',
  'eia-distillate-inventories': 'https://www.eia.gov/petroleum/supply/weekly/',
  'eia-natgas-storage': 'https://www.eia.gov/naturalgas/storage/dashboard/',
  'oil-price-wti': 'https://www.eia.gov/petroleum/data.php',
  'oil-price-brent': 'https://www.eia.gov/petroleum/data.php',
  'natural-gas-price': 'https://www.eia.gov/naturalgas/data.php',

  // API & Baker Hughes
  'api-crude-inventory': 'https://www.api.org/oil-and-natural-gas/wells-to-consumer/exploration-and-production/weekly-statistical-bulletin',
  'baker-hughes-oil-rigs': 'https://bakerhughesrigcount.gcs-web.com/rig-count-overview',
  'baker-hughes-total-rigs': 'https://bakerhughesrigcount.gcs-web.com/rig-count-overview',

  // OPEC
  'opec-meeting': 'https://www.opec.org/opec_web/en/publications/338.htm',

  // ADP
  'adp-employment': 'https://adpemploymentreport.com/',

  // Challenger
  'challenger-job-cuts': 'https://www.challengergray.com/insights/',

  // NFIB
  'nfib-small-business': 'https://www.nfib.com/surveys/small-business-economic-trends/',

  // Other
  'vehicle-sales': 'https://wardsintelligence.informa.com/WI964541/US-Sales-Review',
  'tipp-economic-optimism': 'https://www.investors.com/news/economy/ibd-tipp-economic-optimism-index/',

  // Freddie Mac
  'mortgage-rate-30y': 'https://www.freddiemac.com/pmms',
  'mortgage-rate-15y': 'https://www.freddiemac.com/pmms',
};

async function main() {
  console.log('Updating source URLs for releases...');
  console.log('='.repeat(60));

  const getEventSlug = db.prepare('SELECT slug FROM events WHERE id = ?');
  const updateRelease = db.prepare('UPDATE releases SET source_url = ? WHERE id = ?');
  const allReleases = db.prepare('SELECT id, event_id FROM releases').all() as Array<{ id: number; event_id: number }>;

  let updated = 0;
  let skipped = 0;

  for (const release of allReleases) {
    const event = getEventSlug.get(release.event_id) as { slug: string } | undefined;
    if (event && SOURCE_URLS[event.slug]) {
      updateRelease.run(SOURCE_URLS[event.slug], release.id);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated: ${updated} releases with source URLs`);
  console.log(`Skipped: ${skipped} releases (no URL mapping)`);
  console.log('='.repeat(60));
  console.log('Done!');
}

main().catch(console.error);
