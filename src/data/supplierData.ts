export const SUPPLIER_DATA = {
  region: 'Andhra Pradesh',
  hubName: 'Guntur Wholesale Mandi & Grain Logistics Yard',
  kpis: {
    activeBuyerRequests: 24,
    activeBuyerRequestsChange: '+15%',
    highDemandProducts: 9,
    totalOrders: 68,
    totalOrdersChange: '+22%',
    estimatedRevenue: '₹5.8 Lakh',
    estimatedRevenueChange: '+20%'
  },
  regionalDemandPoints: [
    { city: 'Vijayawada', status: 'High Demand', color: '#EF4444', x: 45, y: 55, demand: 'High' },
    { city: 'Guntur', status: 'High Demand', color: '#EF4444', x: 40, y: 62, demand: 'High' },
    { city: 'Hyderabad', status: 'Medium Demand', color: '#F59E0B', x: 25, y: 35, demand: 'Medium' },
    { city: 'Bangalore', status: 'High Demand', color: '#EF4444', x: 30, y: 80, demand: 'High' },
    { city: 'Visakhapatnam', status: 'Low Demand', color: '#10B981', x: 75, y: 25, demand: 'Low' },
    { city: 'Kakinada', status: 'Low Demand', color: '#10B981', x: 70, y: 40, demand: 'Low' },
    { city: 'Tirupati', status: 'Medium Demand', color: '#F59E0B', x: 42, y: 85, demand: 'Medium' },
  ],
  supplierInventoryCatalog: [
    { id: 'sona-masoori-rice', name: 'Sona Masoori Rice (5kg Bag)', icon: '🌾', category: 'Staples', wholesalePrice: 290, unit: '5kg bag', stockAvailable: '12,000 Bags', grade: 'Aged Polished Raw', moq: '20 Bags', location: 'Krishna Mill Yard', status: 'In Stock' },
    { id: 'red-chilli', name: 'Guntur Dried Red Chilli (1kg)', icon: '🌶️', category: 'Spices', wholesalePrice: 125, unit: '1kg pack', stockAvailable: '25,000 kg', grade: 'Premium Teja 1', moq: '50 kg', location: 'Guntur Yard', status: 'High Demand' },
    { id: 'basmati-rice', name: 'Basmati Rice (Royal 5kg)', icon: '🌾', category: 'Staples', wholesalePrice: 470, unit: '5kg bag', stockAvailable: '3,500 Bags', grade: '1121 Extra Long', moq: '20 Bags', location: 'Rajahmundry Hub', status: 'In Stock' },
    { id: 'cooking-oil', name: 'Fortune Sunflower Oil (1L)', icon: '🌻', category: 'Fats & Oils', wholesalePrice: 122, unit: '1L pouch', stockAvailable: '8,000 Liters', grade: 'FSSAI Certified', moq: '100 Liters', location: 'Tenali Mill Yard', status: 'In Stock' },
    { id: 'chana-dal', name: 'Chana Dal (Unpolished 1kg)', icon: '🫘', category: 'Pulses', wholesalePrice: 88, unit: '1kg pack', stockAvailable: '40,000 kg', grade: 'Grade A Cleaned', moq: '50 kg', location: 'Guntur Hub', status: 'In Stock' },
    { id: 'turmeric', name: 'Organic Turmeric Powder (1kg)', icon: '🟡', category: 'Spices', wholesalePrice: 142, unit: '1kg pack', stockAvailable: '5,000 kg', grade: '99% Curcumin Pure', moq: '50 kg', location: 'Guntur Exporters', status: 'In Stock' },
    { id: 'sugar', name: 'Refined Crystal Sugar (5kg Bag)', icon: '🍬', category: 'Staples', wholesalePrice: 210, unit: '5kg bag', stockAvailable: '15,000 Bags', grade: 'Sulfur-Free Grade 1', moq: '25 Bags', location: 'Chittoor Sugar Depot', status: 'In Stock' },
    { id: 'aashirvaad-atta', name: 'Wheat Atta (Whole Grain 5kg)', icon: '🍞', category: 'Staples', wholesalePrice: 245, unit: '5kg bag', stockAvailable: '4,500 Bags', grade: 'MP Sharbati', moq: '15 Bags', location: 'Coastal Agro Mill', status: 'In Stock' },
    { id: 'moong-dal', name: 'Moong Dal (Yellow Split 1kg)', icon: '🥣', category: 'Pulses', wholesalePrice: 120, unit: '1kg pack', stockAvailable: '15,000 kg', grade: 'Yellow Cleaned', moq: '50 kg', location: 'Kurnool Depot', status: 'In Stock' },
    { id: 'toor-dal', name: 'Toor Dal (Unpolished 1kg)', icon: '🫘', category: 'Pulses', wholesalePrice: 148, unit: '1kg pack', stockAvailable: '18,000 kg', grade: 'Desi Yellow', moq: '50 kg', location: 'Kakinada Hub', status: 'In Stock' },
    { id: 'tata-salt', name: 'Tata Salt Iodized (1kg)', icon: '🧂', category: 'Spices', wholesalePrice: 22, unit: '1kg pack', stockAvailable: '10,000 Packs', grade: 'Vacuum Evaporated', moq: '50 Packs', location: 'Vijayawada Depot', status: 'In Stock' },
  ],
  topBuyerRequests: [
    { id: 'req-1', product: 'Sona Masoori Rice (5kg Bag)', icon: '🌾', quantity: '500 Bags', buyer: 'Vijayawada Central Mart', location: 'Vijayawada, AP', budget: '₹1.45 Lakh', timeRemaining: '2 days left', urgent: true },
    { id: 'req-2', product: 'Refined Crystal Sugar (5kg Bag)', icon: '🍬', quantity: '400 Bags', buyer: 'Hyderabad Supermarket Co-op', location: 'Hyderabad, TS', budget: '₹84,000', timeRemaining: '3 days left', urgent: false },
    { id: 'req-3', product: 'Guntur Dried Red Chilli (1kg)', icon: '🌶️', quantity: '2,000 kg', buyer: 'Bangalore Spice Processing Ltd', location: 'Bangalore, KA', budget: '₹2.50 Lakh', timeRemaining: '5 days left', urgent: true },
    { id: 'req-4', product: 'Basmati Rice (Royal 5kg)', icon: '🌾', quantity: '300 Bags', buyer: 'Visakhapatnam Mega Hypermart', location: 'Visakhapatnam, AP', budget: '₹1.41 Lakh', timeRemaining: '1 day left', urgent: true },
    { id: 'req-5', product: 'Fortune Sunflower Oil (1L)', icon: '🌻', quantity: '1,500 Liters', buyer: 'Tirupati Wholesale Distributors', location: 'Tirupati, AP', budget: '₹1.83 Lakh', timeRemaining: '4 days left', urgent: false },
    { id: 'req-6', product: 'Whole Wheat Atta (5kg)', icon: '🍞', quantity: '400 Bags', buyer: 'Kurnool Food Mart', location: 'Kurnool, AP', budget: '₹98,000', timeRemaining: '3 days left', urgent: false },
  ],
  activeB2BOrders: [
    { id: 'SUP-9401', retailerName: 'Guntur Retail Co-op', product: '500 Bags Sona Masoori Rice (5kg)', amount: 145000, date: '2026-09-14', status: 'In Transit', carrier: 'Coastal Freight Logistics AP-07-VT-4412' },
    { id: 'SUP-9402', retailerName: 'Vijayawada Supermart', product: '1,000 kg Dried Red Chilli', amount: 125000, date: '2026-09-13', status: 'Dispatched', carrier: 'FastFreight Logistics 10-Ton' },
    { id: 'SUP-9403', retailerName: 'Hyderabad Express Stores', product: '200 Bags Basmati Rice', amount: 94000, date: '2026-09-12', status: 'Delivered', carrier: 'Godavari Transport Line' },
    { id: 'SUP-9404', retailerName: 'Mangalagiri Mart', product: '500 L Sunflower Oil', amount: 61000, date: '2026-09-11', status: 'Delivered', carrier: 'Tenali Local Fleet' },
  ],
  marketInsights: {
    title: 'Market Insights',
    message: 'Demand for Sona Masoori Rice & Guntur Spices is expected to increase by 26% across South India next month. Current spot rate ₹320/bag.',
    cta: 'View Demand Pie Chart →'
  },
  postSupply: {
    title: 'Post Available Supply',
    message: 'List your newly milled grocery batch and instantly reach 12,500+ connected retail buyers in AP & TS.',
    cta: 'Manage Catalog →'
  }
};
