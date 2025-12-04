import dotenv from 'dotenv';
dotenv.config();

import db, { initializeDatabase } from '../config/database';

// Comprehensive list of all economic indicators
const indicators = [
  // ========== INFLATION ==========
  { name: 'Consumer Price Index (CPI)', slug: 'cpi', category: 'Inflation', country: 'US', importance: 'high', description: 'Measures the average change in prices paid by consumers for goods and services', source: 'BLS', source_url: 'https://www.bls.gov/cpi/', frequency: 'Monthly' },
  { name: 'CPI Year-over-Year', slug: 'cpi-yoy', category: 'Inflation', country: 'US', importance: 'high', description: 'Annual inflation rate based on CPI', source: 'BLS', source_url: 'https://www.bls.gov/cpi/', frequency: 'Monthly' },
  { name: 'Core CPI', slug: 'core-cpi', category: 'Inflation', country: 'US', importance: 'high', description: 'CPI excluding food and energy prices', source: 'BLS', source_url: 'https://www.bls.gov/cpi/', frequency: 'Monthly' },
  { name: 'Core CPI Year-over-Year', slug: 'core-cpi-yoy', category: 'Inflation', country: 'US', importance: 'high', description: 'Annual core inflation rate', source: 'BLS', source_url: 'https://www.bls.gov/cpi/', frequency: 'Monthly' },
  { name: 'Producer Price Index (PPI)', slug: 'ppi', category: 'Inflation', country: 'US', importance: 'medium', description: 'Measures average change in selling prices received by domestic producers', source: 'BLS', source_url: 'https://www.bls.gov/ppi/', frequency: 'Monthly' },
  { name: 'Personal Consumption Expenditures (PCE)', slug: 'pce', category: 'Inflation', country: 'US', importance: 'high', description: 'The Fed\'s preferred inflation measure', source: 'BEA', source_url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index', frequency: 'Monthly' },
  { name: 'PCE Year-over-Year', slug: 'pce-yoy', category: 'Inflation', country: 'US', importance: 'high', description: 'Annual PCE inflation rate', source: 'BEA', source_url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index', frequency: 'Monthly' },
  { name: 'Core PCE', slug: 'core-pce', category: 'Inflation', country: 'US', importance: 'high', description: 'PCE excluding food and energy - the Fed\'s key inflation metric', source: 'BEA', source_url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index', frequency: 'Monthly' },
  { name: 'Core PCE Year-over-Year', slug: 'core-pce-yoy', category: 'Inflation', country: 'US', importance: 'high', description: 'Annual core PCE inflation rate', source: 'BEA', source_url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index', frequency: 'Monthly' },

  // ========== EMPLOYMENT ==========
  { name: 'Non-Farm Payrolls (NFP)', slug: 'nonfarm-payrolls', category: 'Employment', country: 'US', importance: 'high', description: 'Monthly change in employment excluding farm workers', source: 'BLS', source_url: 'https://www.bls.gov/news.release/empsit.nr0.htm', frequency: 'Monthly' },
  { name: 'Unemployment Rate', slug: 'unemployment-rate', category: 'Employment', country: 'US', importance: 'high', description: 'Percentage of the labor force that is unemployed', source: 'BLS', source_url: 'https://www.bls.gov/news.release/empsit.nr0.htm', frequency: 'Monthly' },
  { name: 'JOLTS Job Openings', slug: 'jolts', category: 'Employment', country: 'US', importance: 'high', description: 'Job openings, hires, and separations data', source: 'BLS', source_url: 'https://www.bls.gov/jlt/', frequency: 'Monthly' },
  { name: 'JOLTS Quits Rate', slug: 'jolts-quits', category: 'Employment', country: 'US', importance: 'medium', description: 'Voluntary quits as an indicator of labor market confidence', source: 'BLS', source_url: 'https://www.bls.gov/jlt/', frequency: 'Monthly' },
  { name: 'JOLTS Hires', slug: 'jolts-hires', category: 'Employment', country: 'US', importance: 'medium', description: 'Number of hires during the month', source: 'BLS', source_url: 'https://www.bls.gov/jlt/', frequency: 'Monthly' },
  { name: 'Initial Jobless Claims', slug: 'initial-claims', category: 'Employment', country: 'US', importance: 'high', description: 'Weekly count of new unemployment claims', source: 'DOL', source_url: 'https://www.dol.gov/ui/data.pdf', frequency: 'Weekly' },
  { name: 'Continuing Jobless Claims', slug: 'continuing-claims', category: 'Employment', country: 'US', importance: 'medium', description: 'Number of people continuing to receive unemployment benefits', source: 'DOL', source_url: 'https://www.dol.gov/ui/data.pdf', frequency: 'Weekly' },
  { name: 'Labor Force Participation Rate', slug: 'labor-force-participation', category: 'Employment', country: 'US', importance: 'medium', description: 'Percentage of working-age population in the labor force', source: 'BLS', source_url: 'https://www.bls.gov/news.release/empsit.nr0.htm', frequency: 'Monthly' },
  { name: 'Average Hourly Earnings', slug: 'average-hourly-earnings', category: 'Employment', country: 'US', importance: 'high', description: 'Average hourly earnings for all employees', source: 'BLS', source_url: 'https://www.bls.gov/news.release/empsit.nr0.htm', frequency: 'Monthly' },
  { name: 'Average Weekly Hours', slug: 'average-weekly-hours', category: 'Employment', country: 'US', importance: 'low', description: 'Average weekly hours worked', source: 'BLS', source_url: 'https://www.bls.gov/news.release/empsit.nr0.htm', frequency: 'Monthly' },
  { name: 'ADP Employment Change', slug: 'adp-employment', category: 'Employment', country: 'US', importance: 'high', description: 'ADP National Employment Report - private payrolls preview', source: 'ADP', source_url: 'https://adpemploymentreport.com/', frequency: 'Monthly' },
  { name: 'Challenger Job Cuts', slug: 'challenger-job-cuts', category: 'Employment', country: 'US', importance: 'medium', description: 'Challenger, Gray & Christmas job cut announcements', source: 'Challenger', source_url: 'https://www.challengergray.com/press/press-releases', frequency: 'Monthly' },
  { name: 'Employment Cost Index', slug: 'employment-cost-index', category: 'Employment', country: 'US', importance: 'high', description: 'Quarterly measure of labor costs', source: 'BLS', source_url: 'https://www.bls.gov/news.release/eci.nr0.htm', frequency: 'Quarterly' },
  { name: 'Unit Labor Costs', slug: 'unit-labor-costs', category: 'Employment', country: 'US', importance: 'medium', description: 'Labor costs per unit of output', source: 'BLS', source_url: 'https://www.bls.gov/news.release/prod2.nr0.htm', frequency: 'Quarterly' },
  { name: 'Nonfarm Productivity', slug: 'nonfarm-productivity', category: 'Employment', country: 'US', importance: 'medium', description: 'Output per hour of all persons in nonfarm business sector', source: 'BLS', source_url: 'https://www.bls.gov/news.release/prod2.nr0.htm', frequency: 'Quarterly' },

  // ========== GDP & GROWTH ==========
  { name: 'Gross Domestic Product (GDP)', slug: 'gdp', category: 'Growth', country: 'US', importance: 'high', description: 'Total value of goods and services produced', source: 'BEA', source_url: 'https://www.bea.gov/data/gdp/gross-domestic-product', frequency: 'Quarterly' },
  { name: 'GDP Growth Rate', slug: 'gdp-growth', category: 'Growth', country: 'US', importance: 'high', description: 'Annualized quarterly GDP growth rate', source: 'BEA', source_url: 'https://www.bea.gov/data/gdp/gross-domestic-product', frequency: 'Quarterly' },
  { name: 'Real GDP', slug: 'real-gdp', category: 'Growth', country: 'US', importance: 'high', description: 'Inflation-adjusted GDP', source: 'BEA', source_url: 'https://www.bea.gov/data/gdp/gross-domestic-product', frequency: 'Quarterly' },
  { name: 'GDP Deflator', slug: 'gdp-deflator', category: 'Growth', country: 'US', importance: 'medium', description: 'Price deflator for GDP', source: 'BEA', source_url: 'https://www.bea.gov/data/gdp/gross-domestic-product', frequency: 'Quarterly' },

  // ========== CONSUMER & RETAIL ==========
  { name: 'Retail Sales', slug: 'retail-sales', category: 'Consumer', country: 'US', importance: 'high', description: 'Monthly retail and food services sales', source: 'Census', source_url: 'https://www.census.gov/retail/index.html', frequency: 'Monthly' },
  { name: 'Retail Sales Ex-Auto', slug: 'retail-sales-ex-auto', category: 'Consumer', country: 'US', importance: 'high', description: 'Retail sales excluding automobiles', source: 'Census', source_url: 'https://www.census.gov/retail/index.html', frequency: 'Monthly' },
  { name: 'University of Michigan Consumer Sentiment', slug: 'umich-sentiment', category: 'Consumer', country: 'US', importance: 'medium', description: 'University of Michigan consumer sentiment index', source: 'UMich', source_url: 'http://www.sca.isr.umich.edu/', frequency: 'Monthly' },
  { name: 'CB Consumer Confidence', slug: 'cb-consumer-confidence', category: 'Consumer', country: 'US', importance: 'high', description: 'Conference Board Consumer Confidence Index', source: 'Conference Board', source_url: 'https://www.conference-board.org/topics/consumer-confidence', frequency: 'Monthly' },
  { name: 'UMich Inflation Expectations', slug: 'umich-inflation-expectations', category: 'Inflation', country: 'US', importance: 'high', description: 'University of Michigan 1-year inflation expectations', source: 'UMich', source_url: 'http://www.sca.isr.umich.edu/', frequency: 'Monthly' },
  { name: 'UMich 5-Year Inflation Expectations', slug: 'umich-5y-inflation', category: 'Inflation', country: 'US', importance: 'medium', description: 'University of Michigan 5-year inflation expectations', source: 'UMich', source_url: 'http://www.sca.isr.umich.edu/', frequency: 'Monthly' },
  { name: 'Personal Income', slug: 'personal-income', category: 'Consumer', country: 'US', importance: 'medium', description: 'Total personal income of individuals', source: 'BEA', source_url: 'https://www.bea.gov/data/income-saving/personal-income', frequency: 'Monthly' },
  { name: 'Personal Spending', slug: 'personal-spending', category: 'Consumer', country: 'US', importance: 'high', description: 'Personal consumption expenditures', source: 'BEA', source_url: 'https://www.bea.gov/data/income-saving/personal-income', frequency: 'Monthly' },
  { name: 'Personal Savings Rate', slug: 'personal-savings-rate', category: 'Consumer', country: 'US', importance: 'medium', description: 'Personal savings as percentage of disposable income', source: 'BEA', source_url: 'https://www.bea.gov/data/income-saving/personal-income', frequency: 'Monthly' },
  { name: 'Redbook Index', slug: 'redbook', category: 'Consumer', country: 'US', importance: 'low', description: 'Johnson Redbook weekly retail sales index', source: 'Redbook', source_url: 'https://www.redbookresearch.com/', frequency: 'Weekly' },

  // ========== HOUSING ==========
  { name: 'Housing Starts', slug: 'housing-starts', category: 'Housing', country: 'US', importance: 'medium', description: 'Number of new residential construction projects', source: 'Census', source_url: 'https://www.census.gov/construction/nrc/index.html', frequency: 'Monthly' },
  { name: 'Building Permits', slug: 'building-permits', category: 'Housing', country: 'US', importance: 'medium', description: 'Number of permits issued for new construction', source: 'Census', source_url: 'https://www.census.gov/construction/bps/', frequency: 'Monthly' },
  { name: 'Existing Home Sales', slug: 'existing-home-sales', category: 'Housing', country: 'US', importance: 'medium', description: 'Sales of existing homes', source: 'NAR', source_url: 'https://www.nar.realtor/research-and-statistics/housing-statistics/existing-home-sales', frequency: 'Monthly' },
  { name: 'New Home Sales', slug: 'new-home-sales', category: 'Housing', country: 'US', importance: 'medium', description: 'Sales of new single-family houses', source: 'Census', source_url: 'https://www.census.gov/construction/nrs/index.html', frequency: 'Monthly' },
  { name: 'Case-Shiller Home Price Index', slug: 'case-shiller-home-price', category: 'Housing', country: 'US', importance: 'medium', description: 'S&P CoreLogic Case-Shiller Home Price Index', source: 'S&P', source_url: 'https://www.spglobal.com/spdji/en/index-family/indicators/sp-corelogic-case-shiller', frequency: 'Monthly' },
  { name: '30-Year Mortgage Rate', slug: 'mortgage-rate-30y', category: 'Housing', country: 'US', importance: 'high', description: '30-year fixed-rate mortgage average', source: 'Freddie Mac', source_url: 'https://www.freddiemac.com/pmms', frequency: 'Weekly' },
  { name: '15-Year Mortgage Rate', slug: 'mortgage-rate-15y', category: 'Housing', country: 'US', importance: 'medium', description: '15-year fixed-rate mortgage average', source: 'Freddie Mac', source_url: 'https://www.freddiemac.com/pmms', frequency: 'Weekly' },
  { name: 'NAHB Housing Market Index', slug: 'nahb-housing', category: 'Housing', country: 'US', importance: 'medium', description: 'National Association of Home Builders housing market index - builder confidence', source: 'NAHB', source_url: 'https://www.nahb.org/news-and-economics/housing-economics/indices/housing-market-index', frequency: 'Monthly' },
  { name: 'Pending Home Sales', slug: 'pending-home-sales', category: 'Housing', country: 'US', importance: 'medium', description: 'Pending home sales index - signed contracts for existing homes', source: 'NAR', source_url: 'https://www.nar.realtor/research-and-statistics/housing-statistics/pending-home-sales', frequency: 'Monthly' },
  { name: 'MBA Mortgage Applications', slug: 'mba-mortgage-apps', category: 'Housing', country: 'US', importance: 'low', description: 'Mortgage Bankers Association weekly mortgage applications', source: 'MBA', source_url: 'https://www.mba.org/news-and-research/research-and-economics/single-family-research', frequency: 'Weekly' },
  { name: 'Construction Spending', slug: 'construction-spending', category: 'Housing', country: 'US', importance: 'low', description: 'Total value of construction put in place', source: 'Census', source_url: 'https://www.census.gov/construction/c30/c30index.html', frequency: 'Monthly' },

  // ========== MANUFACTURING & INDUSTRY ==========
  { name: 'Industrial Production', slug: 'industrial-production', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'Output of manufacturing, mining, and utilities sectors', source: 'Fed', source_url: 'https://www.federalreserve.gov/releases/g17/current/', frequency: 'Monthly' },
  { name: 'Capacity Utilization', slug: 'capacity-utilization', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'Percentage of industrial capacity in use', source: 'Fed', source_url: 'https://www.federalreserve.gov/releases/g17/current/', frequency: 'Monthly' },
  { name: 'Durable Goods Orders', slug: 'durable-goods', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'New orders for manufactured durable goods', source: 'Census', source_url: 'https://www.census.gov/manufacturing/m3/index.html', frequency: 'Monthly' },
  { name: 'Factory Orders', slug: 'factory-orders', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'Manufacturers\' shipments, inventories, and orders', source: 'Census', source_url: 'https://www.census.gov/manufacturing/m3/index.html', frequency: 'Monthly' },
  { name: 'ISM Manufacturing PMI', slug: 'ism-manufacturing', category: 'Manufacturing', country: 'US', importance: 'high', description: 'Institute for Supply Management Manufacturing PMI', source: 'ISM', source_url: 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/', frequency: 'Monthly' },
  { name: 'ISM Services PMI', slug: 'ism-services', category: 'Services', country: 'US', importance: 'high', description: 'Institute for Supply Management Services PMI - non-manufacturing sector', source: 'ISM', source_url: 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/', frequency: 'Monthly' },
  { name: 'S&P Global Manufacturing PMI', slug: 'sp-manufacturing-pmi', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'S&P Global US Manufacturing Purchasing Managers Index', source: 'S&P Global', source_url: 'https://www.pmi.spglobal.com/Public/Release/PressReleases', frequency: 'Monthly' },
  { name: 'S&P Global Services PMI', slug: 'sp-services-pmi', category: 'Services', country: 'US', importance: 'medium', description: 'S&P Global US Services Purchasing Managers Index', source: 'S&P Global', source_url: 'https://www.pmi.spglobal.com/Public/Release/PressReleases', frequency: 'Monthly' },
  { name: 'S&P Global Composite PMI', slug: 'sp-composite-pmi', category: 'Economy', country: 'US', importance: 'medium', description: 'S&P Global US Composite PMI (Manufacturing + Services)', source: 'S&P Global', source_url: 'https://www.pmi.spglobal.com/Public/Release/PressReleases', frequency: 'Monthly' },
  { name: 'Chicago PMI', slug: 'chicago-pmi', category: 'Manufacturing', country: 'US', importance: 'high', description: 'Chicago Business Barometer - regional manufacturing indicator', source: 'ISM-Chicago', source_url: 'https://www.ismchicago.org/', frequency: 'Monthly' },
  { name: 'Empire State Manufacturing Index', slug: 'empire-state', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'NY Fed manufacturing survey of business conditions', source: 'NY Fed', source_url: 'https://www.newyorkfed.org/survey/empire/empiresurvey_overview', frequency: 'Monthly' },
  { name: 'Richmond Fed Manufacturing Index', slug: 'richmond-fed', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'Richmond Fed Fifth District Survey of Manufacturing Activity', source: 'Richmond Fed', source_url: 'https://www.richmondfed.org/research/regional_economy/surveys_of_business_conditions', frequency: 'Monthly' },
  { name: 'Dallas Fed Manufacturing Index', slug: 'dallas-fed', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'Dallas Fed Texas Manufacturing Outlook Survey', source: 'Dallas Fed', source_url: 'https://www.dallasfed.org/research/surveys/tmos', frequency: 'Monthly' },
  { name: 'Kansas City Fed Manufacturing Index', slug: 'kc-fed', category: 'Manufacturing', country: 'US', importance: 'low', description: 'Kansas City Fed Tenth District Manufacturing Survey', source: 'KC Fed', source_url: 'https://www.kansascityfed.org/research/regional-research/manufacturing-survey/', frequency: 'Monthly' },

  // ========== INTEREST RATES & BONDS ==========
  { name: 'Federal Funds Rate', slug: 'fed-funds-rate', category: 'Interest Rates', country: 'US', importance: 'high', description: 'Target federal funds rate set by the FOMC', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm', frequency: 'As announced' },
  { name: 'Fed Funds Target (Upper)', slug: 'fed-funds-target-upper', category: 'Interest Rates', country: 'US', importance: 'high', description: 'Upper bound of fed funds target range', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm', frequency: 'As announced' },
  { name: 'Fed Funds Target (Lower)', slug: 'fed-funds-target-lower', category: 'Interest Rates', country: 'US', importance: 'high', description: 'Lower bound of fed funds target range', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm', frequency: 'As announced' },
  { name: '3-Month Treasury Yield', slug: '3m-treasury', category: 'Interest Rates', country: 'US', importance: 'medium', description: '3-month U.S. Treasury bill rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '6-Month Treasury Yield', slug: '6m-treasury', category: 'Interest Rates', country: 'US', importance: 'low', description: '6-month U.S. Treasury bill rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '1-Year Treasury Yield', slug: '1y-treasury', category: 'Interest Rates', country: 'US', importance: 'low', description: '1-year U.S. Treasury rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '2-Year Treasury Yield', slug: '2y-treasury', category: 'Interest Rates', country: 'US', importance: 'high', description: '2-year U.S. Treasury constant maturity rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '5-Year Treasury Yield', slug: '5y-treasury', category: 'Interest Rates', country: 'US', importance: 'medium', description: '5-year U.S. Treasury constant maturity rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '10-Year Treasury Yield', slug: '10y-treasury', category: 'Interest Rates', country: 'US', importance: 'high', description: '10-year U.S. Treasury constant maturity rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '30-Year Treasury Yield', slug: '30y-treasury', category: 'Interest Rates', country: 'US', importance: 'medium', description: '30-year U.S. Treasury constant maturity rate', source: 'Treasury', source_url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', frequency: 'Daily' },
  { name: '10Y-2Y Yield Spread', slug: '10y-2y-spread', category: 'Interest Rates', country: 'US', importance: 'high', description: 'Difference between 10-year and 2-year Treasury yields (recession indicator)', source: 'FRED', source_url: 'https://fred.stlouisfed.org/series/T10Y2Y', frequency: 'Daily' },
  { name: '10Y-3M Yield Spread', slug: '10y-3m-spread', category: 'Interest Rates', country: 'US', importance: 'high', description: 'Difference between 10-year Treasury and 3-month T-bill (recession indicator)', source: 'FRED', source_url: 'https://fred.stlouisfed.org/series/T10Y3M', frequency: 'Daily' },

  // ========== MONEY SUPPLY & CREDIT ==========
  { name: 'M1 Money Supply', slug: 'm1-money-supply', category: 'Money Supply', country: 'US', importance: 'medium', description: 'Currency, demand deposits, and other checkable deposits', source: 'Fed', source_url: 'https://www.federalreserve.gov/releases/h6/current/', frequency: 'Weekly' },
  { name: 'M2 Money Supply', slug: 'm2-money-supply', category: 'Money Supply', country: 'US', importance: 'medium', description: 'M1 plus savings deposits, money market funds, and small CDs', source: 'Fed', source_url: 'https://www.federalreserve.gov/releases/h6/current/', frequency: 'Weekly' },
  { name: 'Consumer Credit', slug: 'consumer-credit', category: 'Credit', country: 'US', importance: 'medium', description: 'Total outstanding consumer credit', source: 'Fed', source_url: 'https://www.federalreserve.gov/releases/g19/current/', frequency: 'Monthly' },

  // ========== TRADE & INTERNATIONAL ==========
  { name: 'Trade Balance', slug: 'trade-balance', category: 'Trade', country: 'US', importance: 'medium', description: 'Difference between exports and imports', source: 'Census', source_url: 'https://www.census.gov/foreign-trade/data/index.html', frequency: 'Monthly' },
  { name: 'Exports', slug: 'exports', category: 'Trade', country: 'US', importance: 'medium', description: 'Total U.S. exports of goods and services', source: 'Census', source_url: 'https://www.census.gov/foreign-trade/data/index.html', frequency: 'Monthly' },
  { name: 'Imports', slug: 'imports', category: 'Trade', country: 'US', importance: 'medium', description: 'Total U.S. imports of goods and services', source: 'Census', source_url: 'https://www.census.gov/foreign-trade/data/index.html', frequency: 'Monthly' },
  { name: 'Dollar Index (DXY)', slug: 'dollar-index', category: 'Trade', country: 'US', importance: 'medium', description: 'U.S. Dollar Index against major currencies', source: 'FRED', source_url: 'https://fred.stlouisfed.org/series/DTWEXBGS', frequency: 'Daily' },
  { name: 'Current Account Balance', slug: 'current-account', category: 'Trade', country: 'US', importance: 'medium', description: 'U.S. current account balance - trade in goods, services, income, and transfers', source: 'BEA', source_url: 'https://www.bea.gov/data/intl-trade-investment/international-transactions', frequency: 'Quarterly' },
  { name: 'Net Long-Term TIC Flows', slug: 'tic-flows', category: 'Trade', country: 'US', importance: 'medium', description: 'Treasury International Capital - foreign purchases of U.S. securities', source: 'Treasury', source_url: 'https://home.treasury.gov/data/treasury-international-capital-tic-system', frequency: 'Monthly' },
  { name: 'Wholesale Inventories', slug: 'wholesale-inventories', category: 'Trade', country: 'US', importance: 'low', description: 'Merchant wholesalers inventories', source: 'Census', source_url: 'https://www.census.gov/wholesale/index.html', frequency: 'Monthly' },
  { name: 'Business Inventories', slug: 'business-inventories', category: 'Economy', country: 'US', importance: 'low', description: 'Total business inventories', source: 'Census', source_url: 'https://www.census.gov/mtis/index.html', frequency: 'Monthly' },

  // ========== COMMODITIES & ENERGY ==========
  { name: 'WTI Crude Oil Price', slug: 'oil-price-wti', category: 'Commodities', country: 'US', importance: 'high', description: 'West Texas Intermediate crude oil spot price', source: 'EIA', source_url: 'https://www.eia.gov/petroleum/', frequency: 'Daily' },
  { name: 'Brent Crude Oil Price', slug: 'oil-price-brent', category: 'Commodities', country: 'Global', importance: 'high', description: 'Brent crude oil spot price', source: 'EIA', source_url: 'https://www.eia.gov/petroleum/', frequency: 'Daily' },
  { name: 'Natural Gas Price', slug: 'natural-gas-price', category: 'Commodities', country: 'US', importance: 'medium', description: 'Henry Hub natural gas spot price', source: 'EIA', source_url: 'https://www.eia.gov/naturalgas/', frequency: 'Daily' },
  { name: 'Gold Price', slug: 'gold-price', category: 'Commodities', country: 'Global', importance: 'medium', description: 'London gold fixing price', source: 'LBMA', source_url: 'https://www.lbma.org.uk/prices-and-data/precious-metal-prices', frequency: 'Daily' },
  { name: 'EIA Crude Oil Inventories', slug: 'eia-crude-inventories', category: 'Energy', country: 'US', importance: 'high', description: 'Weekly U.S. commercial crude oil inventories', source: 'EIA', source_url: 'https://www.eia.gov/petroleum/supply/weekly/', frequency: 'Weekly' },
  { name: 'EIA Gasoline Inventories', slug: 'eia-gasoline-inventories', category: 'Energy', country: 'US', importance: 'medium', description: 'Weekly U.S. motor gasoline inventories', source: 'EIA', source_url: 'https://www.eia.gov/petroleum/supply/weekly/', frequency: 'Weekly' },
  { name: 'EIA Distillate Inventories', slug: 'eia-distillate-inventories', category: 'Energy', country: 'US', importance: 'medium', description: 'Weekly U.S. distillate fuel oil inventories', source: 'EIA', source_url: 'https://www.eia.gov/petroleum/supply/weekly/', frequency: 'Weekly' },
  { name: 'EIA Natural Gas Storage', slug: 'eia-natgas-storage', category: 'Energy', country: 'US', importance: 'medium', description: 'Weekly natural gas storage report', source: 'EIA', source_url: 'https://www.eia.gov/naturalgas/storage/', frequency: 'Weekly' },
  { name: 'Baker Hughes Oil Rig Count', slug: 'baker-hughes-oil-rigs', category: 'Energy', country: 'US', importance: 'medium', description: 'Weekly U.S. oil rig count', source: 'Baker Hughes', source_url: 'https://bakerhughesrigcount.gcs-web.com/', frequency: 'Weekly' },
  { name: 'Baker Hughes Total Rig Count', slug: 'baker-hughes-total-rigs', category: 'Energy', country: 'US', importance: 'low', description: 'Weekly U.S. total rig count (oil + gas)', source: 'Baker Hughes', source_url: 'https://bakerhughesrigcount.gcs-web.com/', frequency: 'Weekly' },
  { name: 'API Crude Oil Inventory', slug: 'api-crude-inventory', category: 'Energy', country: 'US', importance: 'medium', description: 'American Petroleum Institute weekly crude inventory (Tuesday night)', source: 'API', source_url: 'https://www.api.org/', frequency: 'Weekly' },

  // ========== MARKET INDICATORS ==========
  { name: 'S&P 500 Index', slug: 'sp500', category: 'Markets', country: 'US', importance: 'high', description: 'S&P 500 stock market index', source: 'S&P', source_url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/', frequency: 'Daily' },
  { name: 'VIX (Volatility Index)', slug: 'vix', category: 'Markets', country: 'US', importance: 'high', description: 'CBOE Volatility Index - fear gauge', source: 'CBOE', source_url: 'https://www.cboe.com/tradable_products/vix/', frequency: 'Daily' },

  // ========== CENTRAL BANK ==========
  { name: 'FOMC Meeting', slug: 'fomc-meeting', category: 'Central Bank', country: 'US', importance: 'high', description: 'Federal Open Market Committee interest rate decision', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', frequency: 'Every 6 weeks' },
  { name: 'FOMC Minutes', slug: 'fomc-minutes', category: 'Central Bank', country: 'US', importance: 'high', description: 'Detailed record of FOMC meeting discussions', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', frequency: '3 weeks after meeting' },
  { name: 'Fed Chair Press Conference', slug: 'fed-press-conference', category: 'Central Bank', country: 'US', importance: 'high', description: 'Federal Reserve Chair press conference', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', frequency: 'After FOMC meetings' },
  { name: 'Fed Beige Book', slug: 'beige-book', category: 'Central Bank', country: 'US', importance: 'medium', description: 'Summary of economic conditions by Federal Reserve district', source: 'Fed', source_url: 'https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm', frequency: '8 times per year' },
  { name: 'Fed Balance Sheet', slug: 'fed-balance-sheet', category: 'Central Bank', country: 'US', importance: 'medium', description: 'Federal Reserve weekly balance sheet (H.4.1 release)', source: 'Fed', source_url: 'https://www.federalreserve.gov/releases/h41/', frequency: 'Weekly' },
  { name: 'Atlanta Fed GDPNow', slug: 'gdpnow', category: 'Growth', country: 'US', importance: 'medium', description: 'Atlanta Fed real-time GDP estimate', source: 'Atlanta Fed', source_url: 'https://www.atlantafed.org/cqer/research/gdpnow', frequency: 'Multiple per week' },
  { name: 'NY Fed Nowcast', slug: 'ny-fed-nowcast', category: 'Growth', country: 'US', importance: 'low', description: 'NY Fed Staff Nowcast for GDP', source: 'NY Fed', source_url: 'https://www.newyorkfed.org/research/policy/nowcast', frequency: 'Weekly' },

  // ========== BUSINESS INDICATORS ==========
  { name: 'Leading Economic Index', slug: 'leading-index', category: 'Economy', country: 'US', importance: 'medium', description: 'Conference Board Leading Economic Index', source: 'Conference Board', source_url: 'https://www.conference-board.org/topics/us-leading-indicators', frequency: 'Monthly' },
  { name: 'Chicago Fed National Activity Index', slug: 'chicago-fed-activity', category: 'Economy', country: 'US', importance: 'medium', description: 'Weighted average of 85 monthly indicators of national economic activity', source: 'Chicago Fed', source_url: 'https://www.chicagofed.org/research/data/cfnai/current-data', frequency: 'Monthly' },
  { name: 'Philadelphia Fed Index', slug: 'philly-fed', category: 'Manufacturing', country: 'US', importance: 'medium', description: 'Philadelphia Fed Manufacturing Business Outlook Survey', source: 'Philadelphia Fed', source_url: 'https://www.philadelphiafed.org/surveys-and-data/regional-economic-analysis/mbos', frequency: 'Monthly' },
  { name: 'NFIB Small Business Optimism', slug: 'nfib-small-business', category: 'Economy', country: 'US', importance: 'medium', description: 'National Federation of Independent Business small business optimism index', source: 'NFIB', source_url: 'https://www.nfib.com/surveys/small-business-economic-trends/', frequency: 'Monthly' },
  { name: 'Import Prices', slug: 'import-prices', category: 'Inflation', country: 'US', importance: 'low', description: 'U.S. import price index', source: 'BLS', source_url: 'https://www.bls.gov/mxp/', frequency: 'Monthly' },
  { name: 'Export Prices', slug: 'export-prices', category: 'Inflation', country: 'US', importance: 'low', description: 'U.S. export price index', source: 'BLS', source_url: 'https://www.bls.gov/mxp/', frequency: 'Monthly' },
  { name: 'ISM Manufacturing Prices', slug: 'ism-manufacturing-prices', category: 'Inflation', country: 'US', importance: 'medium', description: 'ISM Manufacturing Prices Paid - input cost inflation', source: 'ISM', source_url: 'https://www.ismworld.org/', frequency: 'Monthly' },
  { name: 'RCM/TIPP Economic Optimism', slug: 'tipp-economic-optimism', category: 'Consumer', country: 'US', importance: 'low', description: 'IBD/TIPP Economic Optimism Index', source: 'TIPP', source_url: 'https://www.investors.com/', frequency: 'Monthly' },
  { name: 'Wards Total Vehicle Sales', slug: 'vehicle-sales', category: 'Consumer', country: 'US', importance: 'medium', description: 'Total vehicle sales in the United States', source: 'Wards', source_url: 'https://wardsintelligence.informa.com/', frequency: 'Monthly' },
  { name: 'Fed Chair Powell Speaks', slug: 'fed-chair-speaks', category: 'Central Bank', country: 'US', importance: 'high', description: 'Federal Reserve Chair public speech or testimony', source: 'Fed', source_url: 'https://www.federalreserve.gov/', frequency: 'As scheduled' },
  { name: 'FOMC Member Speaks', slug: 'fomc-member-speaks', category: 'Central Bank', country: 'US', importance: 'medium', description: 'Federal Reserve official public speech', source: 'Fed', source_url: 'https://www.federalreserve.gov/', frequency: 'As scheduled' },
  { name: 'OPEC Meeting', slug: 'opec-meeting', category: 'Energy', country: 'Global', importance: 'high', description: 'OPEC and OPEC+ meetings on oil production', source: 'OPEC', source_url: 'https://www.opec.org/', frequency: 'As scheduled' },
  { name: 'API Weekly Crude Stock', slug: 'api-crude-inventory', category: 'Energy', country: 'US', importance: 'medium', description: 'American Petroleum Institute weekly crude inventory (Tuesday night)', source: 'API', source_url: 'https://www.api.org/', frequency: 'Weekly' },
];

async function main() {
  console.log('Seeding database with comprehensive economic indicators...');
  console.log('='.repeat(60));

  initializeDatabase();

  // Disable foreign key checks for seeding
  db.pragma('foreign_keys = OFF');

  // Insert all indicators
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (name, slug, category, country, importance, description, source, source_url, frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const indicator of indicators) {
    insertEvent.run(
      indicator.name,
      indicator.slug,
      indicator.category,
      indicator.country,
      indicator.importance,
      indicator.description,
      indicator.source,
      indicator.source_url,
      indicator.frequency
    );
    count++;
  }

  console.log(`\nAdded ${count} economic indicators`);

  // Summary by category
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count FROM events GROUP BY category ORDER BY count DESC
  `).all() as Array<{ category: string; count: number }>;

  console.log('\nIndicators by category:');
  for (const cat of categories) {
    console.log(`  ${cat.category}: ${cat.count}`);
  }

  // Re-enable foreign key checks
  db.pragma('foreign_keys = ON');

  console.log('\n' + '='.repeat(60));
  console.log('Database seeded successfully!');
}

main().catch(console.error);
