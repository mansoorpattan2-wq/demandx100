export const MANUFACTURER_DATA = {
  selectedPlant: 'All Plants',
  timeframe: 'Last 6 Months',
  kpis: {
    totalMarketDemand: '4,800 units',
    totalMarketDemandChange: '+22%',
    currentProduction: '4,000 units',
    currentProductionChange: '+10%',
    recommendedProduction: '5,000 units',
    capacityUtilization: '78%'
  },
  demandVsProductionChart: [
    { month: 'Jan', demand: 1500, production: 1000 },
    { month: 'Feb', demand: 2200, production: 1800 },
    { month: 'Mar', demand: 2800, production: 2400 },
    { month: 'Apr', demand: 3600, production: 3100 },
    { month: 'May', demand: 4200, production: 3600 },
    { month: 'Jun', demand: 4800, production: 4000 },
  ],
  productWiseForecast: [
    { name: 'Sona Masoori Rice', icon: '🌾', growth: '+24%', predictedDemand: '1,800 MT', stockCoverage: '14 Days' },
    { name: 'Red Chilli', icon: '🌶️', growth: '+28%', predictedDemand: '1,200 MT', stockCoverage: '21 Days' },
    { name: 'Refined Sugar', icon: '🍬', growth: '+16%', predictedDemand: '1,500 MT', stockCoverage: '10 Days' },
    { name: 'Spices Mix', icon: '🧂', growth: '+20%', predictedDemand: '950 MT', stockCoverage: '30 Days' },
    { name: 'Processed Sauce', icon: '🥫', growth: '+18%', predictedDemand: '1,100 MT', stockCoverage: '18 Days' },
  ],
  masterSchedules: [
    { id: 'RUN-401', line: 'Line 1 (Red Chilli Paste)', target: '1,200 Units', current: '1,050 Units', status: 'In Progress', shift: 'Morning Shift', supervisor: 'R. Sharma' },
    { id: 'RUN-402', line: 'Line 2 (Paddy Milling & Dehusking)', target: '1,800 Units', current: '1,800 Units', status: 'Completed', shift: 'Morning Shift', supervisor: 'K. Patel' },
    { id: 'RUN-403', line: 'Line 3 (Guntur Chilli Powder Packaging)', target: '800 Units', current: '420 Units', status: 'In Progress', shift: 'Evening Shift', supervisor: 'V. Rao' },
    { id: 'RUN-404', line: 'Line 4 (Spices Blending Unit)', target: '1,500 Units', current: '0 Units', status: 'Scheduled', shift: 'Night Shift', supervisor: 'A. Kumar' },
  ],
  rawMaterialProcurement: [
    { crop: 'Grade-A Red Chilli (Dry)', mandi: 'Guntur Mirchi Mandi', stockOnHand: '450 Tons', requirement: '600 Tons', pricePerKg: '₹145', status: 'Stock Alert', vendor: 'Guntur Agro Co-op' },
    { crop: 'Raw Paddy (Sona Masoori)', mandi: 'Miryalaguda Mandi', stockOnHand: '820 Tons', requirement: '800 Tons', pricePerKg: '₹34', status: 'Sufficient', vendor: 'Krishna Valley Millers Fed' },
    { crop: 'Refined Sugar Crystals', mandi: 'Nandyal Sugar APMC', stockOnHand: '310 Tons', requirement: '500 Tons', pricePerKg: '₹38', status: 'Low Stock', vendor: 'Deccan Supply Hub' },
    { crop: 'Whole Turmeric & Spices', mandi: 'Nizamabad Mandi', stockOnHand: '210 Tons', requirement: '200 Tons', pricePerKg: '₹92', status: 'Sufficient', vendor: 'Telangana Spice Board' },
  ],
  machineOEEData: [
    { lineName: 'Extraction & Pulper Line 1', oee: 84, availability: 92, performance: 95, quality: 96, status: 'Optimal' },
    { lineName: 'High-Speed Powder Blending Line 2', oee: 76, availability: 85, performance: 90, quality: 99, status: 'Optimal' },
    { lineName: 'Automated Bottling & Pouch Packaging Line 3', oee: 68, availability: 75, performance: 92, quality: 98, status: 'Maintenance Due' },
    { lineName: 'Cold Storage Thermal Control Line 4', oee: 91, availability: 98, performance: 94, quality: 99, status: 'Optimal' },
  ],
  distributionHubs: [
    { hubName: 'Vijayawada Central Logistics Node', region: 'Andhra Pradesh', activeShipments: 14, transitTime: '4.2 Hrs', deliveryRate: '98.8%' },
    { hubName: 'Hyderabad Industrial Storage Hub', region: 'Telangana', activeShipments: 22, transitTime: '6.5 Hrs', deliveryRate: '97.5%' },
    { hubName: 'Bangalore South Spice Dispatch Depot', region: 'Karnataka', activeShipments: 18, transitTime: '12.0 Hrs', deliveryRate: '99.1%' },
    { hubName: 'Chennai Maritime Export Warehouse', region: 'Tamil Nadu', activeShipments: 9, transitTime: '14.5 Hrs', deliveryRate: '96.2%' },
  ],
  esgMetrics: {
    spoilagePreventedTons: 140,
    co2ReducedTons: 380,
    renewableEnergyPercent: 42,
    waterRecycledLiters: '2.4 Million',
    wasteDivertedPercent: 94,
  },
  sustainabilityInitiatives: [
    { id: 'SUS-01', title: 'Zero Harvest Spoilage MRP Scheduling', category: 'Waste Mitigation', impact: '140 Tons Harvest Saved', status: 'Active', icon: '🌾' },
    { id: 'SUS-02', title: 'Solar Rooftop Power Co-generation', category: 'Clean Energy', impact: '42% Off-Grid Power', status: 'Active', icon: '☀️' },
    { id: 'SUS-03', title: 'Closed-Loop Industrial Water Recycling', category: 'Water Conservation', impact: '2.4M Liters Saved', status: 'Active', icon: '💧' },
    { id: 'SUS-04', title: 'Biodegradable Plant-Pulp Packaging Line', category: 'Eco Packaging', impact: '85% Plastic Reduced', status: 'In Rollout', icon: '♻️' },
    { id: 'SUS-05', title: 'Direct Ethical Farmer Procurement Scheme', category: 'Fair Trade Sourcing', impact: '88% Direct Purchase', status: 'Active', icon: '🧑‍🌾' },
  ],
  auditReports: [
    { id: 'REP-2026-Q3', title: 'Q3 Demand vs Production Reconciliation Report', date: 'Sep 10, 2026', size: '2.4 MB', category: 'Production Audit' },
    { id: 'REP-2026-RAW', title: 'Raw Harvest Sourcing & Mandi Price Ledger', date: 'Sep 05, 2026', size: '1.8 MB', category: 'Procurement' },
    { id: 'REP-2026-ESG', title: 'Annual Agriculture Spoilage Mitigation & CO2 Audit', date: 'Aug 28, 2026', size: '4.1 MB', category: 'Sustainability' },
    { id: 'REP-2026-OEE', title: 'Plant Equipment Efficiency & Maintenance Log', date: 'Aug 15, 2026', size: '3.2 MB', category: 'Operations' },
  ],
  aiRecommendation: {
    title: 'AI Recommendation',
    message: 'Increase production of Red Chilli based products by 15% to meet upcoming demand in Q4.',
    cta: 'View Plan →'
  },
  sustainabilityInsight: {
    title: 'Sustainability Insight',
    message: 'Optimal production planning can reduce waste by 30% and increase profit by 18%.',
    cta: 'View Report →'
  }
};

export const getDynamicManufacturerData = (timeframe: string, plant: string) => {
  let plantMultiplier = 1.0;
  if (plant === 'Guntur Agro Plant') plantMultiplier = 0.45;
  else if (plant === 'Vijayawada Processing Unit') plantMultiplier = 0.35;
  else if (plant === 'Hyderabad Spices Hub') plantMultiplier = 0.20;

  if (timeframe === 'Last 30 Days') {
    const demandVsProductionChart = [
      { month: 'Week 1', demand: Math.round(750 * plantMultiplier), production: Math.round(680 * plantMultiplier) },
      { month: 'Week 2', demand: Math.round(920 * plantMultiplier), production: Math.round(850 * plantMultiplier) },
      { month: 'Week 3', demand: Math.round(1100 * plantMultiplier), production: Math.round(1020 * plantMultiplier) },
      { month: 'Week 4', demand: Math.round(1350 * plantMultiplier), production: Math.round(1210 * plantMultiplier) },
      { month: 'Week 5', demand: Math.round(1480 * plantMultiplier), production: Math.round(1390 * plantMultiplier) },
    ];

    const pieChartData = [
      { name: 'Red Chilli Paste', value: Math.round(420 * plantMultiplier), color: '#EF4444' },
      { name: 'Tomato Ketchup', value: Math.round(380 * plantMultiplier), color: '#F97316' },
      { name: 'Chilli Powder', value: Math.round(290 * plantMultiplier), color: '#8B5CF6' },
      { name: 'Spices Mix', value: Math.round(210 * plantMultiplier), color: '#10B981' },
      { name: 'Sauces', value: Math.round(180 * plantMultiplier), color: '#3B82F6' },
    ];

    const kpis = {
      totalMarketDemand: `${(1.2 * plantMultiplier).toFixed(1)}k units`,
      totalMarketDemandChange: '+14%',
      currentProduction: `${(1.1 * plantMultiplier).toFixed(1)}k units`,
      currentProductionChange: '+8%',
      recommendedProduction: `${(1.3 * plantMultiplier).toFixed(1)}k units`,
      capacityUtilization: plant === 'Guntur Agro Plant' ? '82%' : plant === 'Vijayawada Processing Unit' ? '75%' : '80%',
    };

    const productWiseForecast = [
      { name: 'Sona Masoori Rice', icon: '🌾', growth: '+18%', predictedDemand: `${Math.round(450 * plantMultiplier)} MT`, stockCoverage: '10 Days' },
      { name: 'Red Chilli', icon: '🌶️', growth: '+22%', predictedDemand: `${Math.round(380 * plantMultiplier)} MT`, stockCoverage: '15 Days' },
      { name: 'Refined Sugar', icon: '🍬', growth: '+12%', predictedDemand: `${Math.round(310 * plantMultiplier)} MT`, stockCoverage: '8 Days' },
      { name: 'Spices Mix', icon: '🧂', growth: '+15%', predictedDemand: `${Math.round(240 * plantMultiplier)} MT`, stockCoverage: '20 Days' },
      { name: 'Processed Sauce', icon: '🥫', growth: '+14%', predictedDemand: `${Math.round(280 * plantMultiplier)} MT`, stockCoverage: '12 Days' },
    ];

    return { demandVsProductionChart, pieChartData, kpis, productWiseForecast };
  } else if (timeframe === 'Current Year') {
    const demandVsProductionChart = [
      { month: 'Q1', demand: Math.round(8200 * plantMultiplier), production: Math.round(7100 * plantMultiplier) },
      { month: 'Q2', demand: Math.round(10800 * plantMultiplier), production: Math.round(9600 * plantMultiplier) },
      { month: 'Q3', demand: Math.round(13500 * plantMultiplier), production: Math.round(11800 * plantMultiplier) },
      { month: 'Q4 (Proj)', demand: Math.round(16200 * plantMultiplier), production: Math.round(14500 * plantMultiplier) },
    ];

    const pieChartData = [
      { name: 'Red Chilli Paste', value: Math.round(4800 * plantMultiplier), color: '#EF4444' },
      { name: 'Tomato Ketchup', value: Math.round(3900 * plantMultiplier), color: '#F97316' },
      { name: 'Chilli Powder', value: Math.round(3200 * plantMultiplier), color: '#8B5CF6' },
      { name: 'Spices Mix', value: Math.round(2700 * plantMultiplier), color: '#10B981' },
      { name: 'Sauces', value: Math.round(2100 * plantMultiplier), color: '#3B82F6' },
    ];

    const kpis = {
      totalMarketDemand: `${(48.7 * plantMultiplier).toFixed(1)}k units`,
      totalMarketDemandChange: '+28%',
      currentProduction: `${(43.0 * plantMultiplier).toFixed(1)}k units`,
      currentProductionChange: '+18%',
      recommendedProduction: `${(51.0 * plantMultiplier).toFixed(1)}k units`,
      capacityUtilization: plant === 'Guntur Agro Plant' ? '89%' : plant === 'Vijayawada Processing Unit' ? '84%' : '86%',
    };

    const productWiseForecast = [
      { name: 'Sona Masoori Rice', icon: '🌾', growth: '+32%', predictedDemand: `${Math.round(6200 * plantMultiplier)} MT`, stockCoverage: '18 Days' },
      { name: 'Red Chilli', icon: '🌶️', growth: '+36%', predictedDemand: `${Math.round(4800 * plantMultiplier)} MT`, stockCoverage: '28 Days' },
      { name: 'Refined Sugar', icon: '🍬', growth: '+22%', predictedDemand: `${Math.round(4100 * plantMultiplier)} MT`, stockCoverage: '14 Days' },
      { name: 'Spices Mix', icon: '🧂', growth: '+26%', predictedDemand: `${Math.round(3200 * plantMultiplier)} MT`, stockCoverage: '35 Days' },
      { name: 'Processed Sauce', icon: '🥫', growth: '+24%', predictedDemand: `${Math.round(3800 * plantMultiplier)} MT`, stockCoverage: '22 Days' },
    ];

    return { demandVsProductionChart, pieChartData, kpis, productWiseForecast };
  } else {
    // Last 6 Months (Default)
    const demandVsProductionChart = [
      { month: 'Jan', demand: Math.round(1500 * plantMultiplier), production: Math.round(1000 * plantMultiplier) },
      { month: 'Feb', demand: Math.round(2200 * plantMultiplier), production: Math.round(1800 * plantMultiplier) },
      { month: 'Mar', demand: Math.round(2800 * plantMultiplier), production: Math.round(2400 * plantMultiplier) },
      { month: 'Apr', demand: Math.round(3600 * plantMultiplier), production: Math.round(3100 * plantMultiplier) },
      { month: 'May', demand: Math.round(4200 * plantMultiplier), production: Math.round(3600 * plantMultiplier) },
      { month: 'Jun', demand: Math.round(4800 * plantMultiplier), production: Math.round(4000 * plantMultiplier) },
    ];

    const pieChartData = [
      { name: 'Red Chilli Paste', value: Math.round(1600 * plantMultiplier), color: '#EF4444' },
      { name: 'Tomato Ketchup', value: Math.round(1400 * plantMultiplier), color: '#F97316' },
      { name: 'Chilli Powder', value: Math.round(1000 * plantMultiplier), color: '#8B5CF6' },
      { name: 'Spices Mix', value: Math.round(800 * plantMultiplier), color: '#10B981' },
      { name: 'Sauces', value: Math.round(600 * plantMultiplier), color: '#3B82F6' },
    ];

    const kpis = {
      totalMarketDemand: `${(4.8 * plantMultiplier).toFixed(1)}k units`,
      totalMarketDemandChange: '+22%',
      currentProduction: `${(4.0 * plantMultiplier).toFixed(1)}k units`,
      currentProductionChange: '+10%',
      recommendedProduction: `${(5.0 * plantMultiplier).toFixed(1)}k units`,
      capacityUtilization: plant === 'Guntur Agro Plant' ? '82%' : plant === 'Vijayawada Processing Unit' ? '76%' : '78%',
    };

    const productWiseForecast = [
      { name: 'Sona Masoori Rice', icon: '🌾', growth: '+24%', predictedDemand: `${Math.round(1800 * plantMultiplier)} MT`, stockCoverage: '14 Days' },
      { name: 'Red Chilli', icon: '🌶️', growth: '+28%', predictedDemand: `${Math.round(1200 * plantMultiplier)} MT`, stockCoverage: '21 Days' },
      { name: 'Refined Sugar', icon: '🍬', growth: '+16%', predictedDemand: `${Math.round(1500 * plantMultiplier)} MT`, stockCoverage: '10 Days' },
      { name: 'Spices Mix', icon: '🧂', growth: '+20%', predictedDemand: `${Math.round(950 * plantMultiplier)} MT`, stockCoverage: '30 Days' },
      { name: 'Processed Sauce', icon: '🥫', growth: '+18%', predictedDemand: `${Math.round(1100 * plantMultiplier)} MT`, stockCoverage: '18 Days' },
    ];

    return { demandVsProductionChart, pieChartData, kpis, productWiseForecast };
  }
};



