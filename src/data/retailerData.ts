export const RETAILER_DATA = {
  storeName: 'My Store - Guntur, AP',
  kpis: {
    predictedDemand: '1,250 packs',
    predictedDemandChange: '+18%',
    currentStock: '800 packs',
    currentStockChange: '-10%',
    recommendedStock: '1,300 packs',
    potentialRevenue: '₹1.8 Lakh',
    potentialRevenueChange: '+22%'
  },
  demandForecastSonaMasoori: [
    { week: 'W1', actual: 800, predicted: 750 },
    { week: 'W2', actual: 1100, predicted: 1200 },
    { week: 'W3', actual: 1400, predicted: 1500 },
    { week: 'W4', actual: 1700, predicted: 1900 },
    { week: 'W5', actual: 2000, predicted: 2300 },
    { week: 'W6', actual: 2100, predicted: 2700 },
  ],
  topSellingProducts: [
    { name: 'Sona Masoori Rice (5kg)', icon: '🌾', sales: '320 bags', growth: '+25%' },
    { name: 'Madhur Pure Sugar (5kg)', icon: '🍬', sales: '280 bags', growth: '+18%' },
    { name: 'Tata Sampann Chana Dal (1kg)', icon: '🫘', sales: '150 packs', growth: '+12%' },
    { name: 'Tata Sampann Moong Dal (1kg)', icon: '🥣', sales: '120 packs', growth: '+8%' },
    { name: 'Fortune Sunflower Oil (1L)', icon: '🛢️', sales: '110 pouches', growth: '+20%' },
  ],
  aiInsight: {
    title: 'AI Insight',
    message: 'Sona Masoori Rice demand will increase by 22% next month in your area. Consider placing a bulk supplier order before festival season.',
    cta: 'View Forecast →'
  },
  supplierOffers: {
    title: 'Supplier Offers',
    message: 'Get wholesale prices from verified AP & TS mandi suppliers.',
    cta: 'View Suppliers →'
  }
};

export const getDynamicRetailerData = (storeLocation: string) => {
  let mult = 1.0;
  let locTag = 'Guntur APMC Zone';
  if (storeLocation.includes('Vijayawada')) {
    mult = 1.45;
    locTag = 'Vijayawada Metro Hub';
  } else if (storeLocation.includes('Hyderabad')) {
    mult = 2.1;
    locTag = 'Hyderabad Urban Sector';
  }

  const demandForecastSonaMasoori = [
    { week: 'W1', actual: Math.round(800 * mult), predicted: Math.round(750 * mult) },
    { week: 'W2', actual: Math.round(1100 * mult), predicted: Math.round(1200 * mult) },
    { week: 'W3', actual: Math.round(1400 * mult), predicted: Math.round(1500 * mult) },
    { week: 'W4', actual: Math.round(1700 * mult), predicted: Math.round(1900 * mult) },
    { week: 'W5', actual: Math.round(2000 * mult), predicted: Math.round(2300 * mult) },
    { week: 'W6', actual: Math.round(2100 * mult), predicted: Math.round(2700 * mult) },
  ];

  const categoryPieData = storeLocation.includes('Hyderabad') ? [
    { name: 'Grains & Rice', value: Math.round(840 * mult), color: '#3B82F6' },
    { name: 'Pulses & Dal', value: Math.round(720 * mult), color: '#10B981' },
    { name: 'Cooking Oils', value: Math.round(520 * mult), color: '#F97316' },
    { name: 'Spices & Condiments', value: Math.round(310 * mult), color: '#EF4444' },
    { name: 'Flours & Atta', value: Math.round(210 * mult), color: '#8B5CF6' },
  ] : storeLocation.includes('Vijayawada') ? [
    { name: 'Grains & Rice', value: Math.round(950 * mult), color: '#3B82F6' },
    { name: 'Cooking Oils', value: Math.round(620 * mult), color: '#F97316' },
    { name: 'Pulses & Dal', value: Math.round(410 * mult), color: '#10B981' },
    { name: 'Flours & Atta', value: Math.round(360 * mult), color: '#8B5CF6' },
    { name: 'Spices & Condiments', value: Math.round(210 * mult), color: '#EF4444' },
  ] : [
    { name: 'Grains & Rice', value: Math.round(320), color: '#3B82F6' },
    { name: 'Pulses & Dal', value: Math.round(280), color: '#10B981' },
    { name: 'Cooking Oils', value: Math.round(150), color: '#F97316' },
    { name: 'Flours & Atta', value: Math.round(120), color: '#8B5CF6' },
    { name: 'Spices & Condiments', value: Math.round(110), color: '#EF4444' },
  ];

  const topSellingProducts = [
    { name: 'Sona Masoori Rice (5kg)', icon: '🌾', sales: `${Math.round(320 * mult)} bags`, growth: '+25%' },
    { name: 'Madhur Pure Sugar (5kg)', icon: '🍬', sales: `${Math.round(280 * mult)} bags`, growth: '+18%' },
    { name: 'Tata Sampann Chana Dal (1kg)', icon: '🫘', sales: `${Math.round(150 * mult)} packs`, growth: '+12%' },
    { name: 'Tata Sampann Moong Dal (1kg)', icon: '🥣', sales: `${Math.round(120 * mult)} packs`, growth: '+8%' },
    { name: 'Fortune Sunflower Oil (1L)', icon: '🛢️', sales: `${Math.round(110 * mult)} pouches`, growth: '+20%' },
  ];

  const priceTrendsData = [
    { item: 'Sona Masoori Rice', spot: Math.round(320 * (storeLocation.includes('Hyderabad') ? 1.08 : storeLocation.includes('Vijayawada') ? 1.04 : 1.0)), wholesale: Math.round(290 * (storeLocation.includes('Hyderabad') ? 1.08 : storeLocation.includes('Vijayawada') ? 1.04 : 1.0)) },
    { item: 'Basmati Rice', spot: Math.round(510 * (storeLocation.includes('Hyderabad') ? 1.1 : storeLocation.includes('Vijayawada') ? 1.05 : 1.0)), wholesale: Math.round(470 * (storeLocation.includes('Hyderabad') ? 1.1 : storeLocation.includes('Vijayawada') ? 1.05 : 1.0)) },
    { item: 'Madhur Sugar', spot: Math.round(230 * (storeLocation.includes('Hyderabad') ? 1.05 : storeLocation.includes('Vijayawada') ? 1.02 : 1.0)), wholesale: Math.round(210 * (storeLocation.includes('Hyderabad') ? 1.05 : storeLocation.includes('Vijayawada') ? 1.02 : 1.0)) },
    { item: 'Sunflower Oil', spot: Math.round(135 * (storeLocation.includes('Hyderabad') ? 1.12 : storeLocation.includes('Vijayawada') ? 1.06 : 1.0)), wholesale: Math.round(122 * (storeLocation.includes('Hyderabad') ? 1.12 : storeLocation.includes('Vijayawada') ? 1.06 : 1.0)) },
    { item: 'Chana Dal', spot: Math.round(98 * (storeLocation.includes('Hyderabad') ? 1.1 : storeLocation.includes('Vijayawada') ? 1.04 : 1.0)), wholesale: Math.round(88 * (storeLocation.includes('Hyderabad') ? 1.1 : storeLocation.includes('Vijayawada') ? 1.04 : 1.0)) },
    { item: 'Toor Dal', spot: Math.round(165 * (storeLocation.includes('Hyderabad') ? 1.08 : storeLocation.includes('Vijayawada') ? 1.03 : 1.0)), wholesale: Math.round(148 * (storeLocation.includes('Hyderabad') ? 1.08 : storeLocation.includes('Vijayawada') ? 1.03 : 1.0)) },
    { item: 'Wheat Atta', spot: Math.round(275 * (storeLocation.includes('Hyderabad') ? 1.07 : storeLocation.includes('Vijayawada') ? 1.04 : 1.0)), wholesale: Math.round(245 * (storeLocation.includes('Hyderabad') ? 1.07 : storeLocation.includes('Vijayawada') ? 1.04 : 1.0)) },
    { item: 'Dried Red Chilli', spot: Math.round(140 * (storeLocation.includes('Hyderabad') ? 1.15 : storeLocation.includes('Vijayawada') ? 1.08 : 1.0)), wholesale: Math.round(125 * (storeLocation.includes('Hyderabad') ? 1.15 : storeLocation.includes('Vijayawada') ? 1.08 : 1.0)) },
  ];

  const annualSalesData = [
    { month: 'Jan', revenue: Math.round(140000 * mult), profit: Math.round(33600 * mult) },
    { month: 'Feb', revenue: Math.round(152000 * mult), profit: Math.round(36480 * mult) },
    { month: 'Mar', revenue: Math.round(165000 * mult), profit: Math.round(39600 * mult) },
    { month: 'Apr', revenue: Math.round(172000 * mult), profit: Math.round(41280 * mult) },
    { month: 'May', revenue: Math.round(185000 * mult), profit: Math.round(44400 * mult) },
    { month: 'Jun', revenue: Math.round(198000 * mult), profit: Math.round(47520 * mult) },
    { month: 'Jul', revenue: Math.round(210000 * mult), profit: Math.round(50400 * mult) },
    { month: 'Aug', revenue: Math.round(225000 * mult), profit: Math.round(54000 * mult) },
    { month: 'Sep (Now)', revenue: Math.round(245000 * mult), profit: Math.round(58800 * mult) },
    { month: 'Oct (FC)', revenue: Math.round(268000 * mult), profit: Math.round(64320 * mult) },
    { month: 'Nov (FC)', revenue: Math.round(285000 * mult), profit: Math.round(68400 * mult) },
    { month: 'Dec (FC)', revenue: Math.round(310000 * mult), profit: Math.round(74400 * mult) },
  ];

  const kpis = {
    predictedDemand: `${Math.round(1250 * mult).toLocaleString()} packs`,
    predictedDemandChange: storeLocation.includes('Hyderabad') ? '+31%' : storeLocation.includes('Vijayawada') ? '+24%' : '+18%',
    currentStock: `${Math.round(800 * mult).toLocaleString()} packs`,
    currentStockChange: storeLocation.includes('Hyderabad') ? '+12%' : storeLocation.includes('Vijayawada') ? '-5%' : '-10%',
    recommendedStock: `${Math.round(1300 * mult).toLocaleString()} packs`,
    potentialRevenue: `₹${(1.8 * mult).toFixed(1)} Lakh`,
    potentialRevenueChange: storeLocation.includes('Hyderabad') ? '+35%' : storeLocation.includes('Vijayawada') ? '+29%' : '+22%'
  };

  return {
    demandForecastSonaMasoori,
    demandForecastTomato: demandForecastSonaMasoori, // Compatibility alias
    categoryPieData,
    topSellingProducts,
    priceTrendsData,
    annualSalesData,
    kpis,
    locTag,
  };
};
