import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ShoppingBag,
  Sparkles,
  Store,
  BarChart3,
  DollarSign,
  Truck,
  Users,
  Percent,
  TrendingUp,
  Settings as SettingsIcon,
  Tag,
  Phone,
  MapPin,
  Bot,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  PackageCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Sidebar } from '../components/Sidebar';
import { PriceTrendsView } from '../components/PriceTrendsView';
import { RETAILER_DATA, getDynamicRetailerData } from '../data/retailerData';
import { PRODUCTS } from '../data/products';
import { useToast } from '../components/Toast';
import { DemandPredictionForm } from '../components/DemandPredictionForm';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import { ProcurementModal } from '../components/ProcurementModal';
import { InventoryDecisionLayer } from '../components/InventoryDecisionLayer';
import { JarvisAssistantModal } from '../components/JarvisAssistantModal';

const formatOrderDate = (d: any): string => {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (typeof d === 'number') return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (d instanceof Date) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (d.toDate && typeof d.toDate === 'function') return d.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return String(d);
};

export const RetailerDashboard: React.FC = () => {
  const { showToast } = useToast();
  const {
    getCustomerOrders,
    getRetailerInventory,
    getRetailerProcurementOrders,
    deliverSupplierOrder,
  } = useSupplyChain();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [storeLocation, setStoreLocation] = useState(RETAILER_DATA.storeName);
  const [isProcurementOpen, setIsProcurementOpen] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [procurementProduct, setProcurementProduct] = useState<any>(undefined);
  const [procurementQty, setProcurementQty] = useState<number | undefined>(undefined);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [isReceivingOrderId, setIsReceivingOrderId] = useState<string | null>(null);

  const dynamicData = getDynamicRetailerData(storeLocation);

  const handleStoreLocationChange = (newLoc: string) => {
    setStoreLocation(newLoc);
    showToast('Store Location Updated', `Switched view to ${newLoc}. Charts and KPIs recalculated!`, 'info');
  };

  const handleOpenProcurement = (product?: any, qty?: number) => {
    setProcurementProduct(product);
    setProcurementQty(qty);
    setIsProcurementOpen(true);
  };

  const retailerId = 'GUNTUR_STORE_01';
  const customerOrders = getCustomerOrders(retailerId);

  // Compute live real-time stock total across all products
  const liveTotalStock = PRODUCTS.reduce(
    (sum, p) => sum + getRetailerInventory(p.id, p.currentStock),
    0
  );

  // Compute live sales total & order counts
  const liveSalesAmount = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const liveOrderCount = customerOrders.length;

  const renderContent = () => {
    switch (activeTab) {
      case 'Demand Forecast':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">6-Week Store Demand Forecast</h3>
              <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                Guntur Region Model
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Sona Masoori Rice & Grocery Projected Weekly Demand (Bags)</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicData.demandForecastSonaMasoori} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actual" name="Actual Sales" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="predicted" name="AI Predicted Demand" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'DEMAND PREDICTOR':
      case 'AI Demand Predictor':
        return (
          <div className="animate-fade-in">
            <DemandPredictionForm />
          </div>
        );

      case 'Inventory Planning':
        return (
          <InventoryDecisionLayer onOpenProcurement={handleOpenProcurement} />
        );

      case 'Product Insights':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Product Sales Velocity & Profit Margin Insights</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time category intelligence on high-turnover vs slow-moving store inventory.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                8 Commodities Analyzed
              </span>
            </div>

            {/* Product Performance Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: 'sona-masoori-rice',
                  name: 'Babu Super Sona Masoori Rice (5kg)',
                  icon: '🌾',
                  category: 'Staples & Grains',
                  velocity: '⚡ FAST TURNOVER',
                  velocityStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  growth: '+28% MoM',
                  growthPositive: true,
                  margin: '24.5%',
                  daysToSell: '4 Days',
                  safetyBuffer: '1,200 bags',
                  advisory: 'Maintain safety stock to prevent stockout during upcoming festive demand peak.',
                },
                {
                  id: 'red_chilli',
                  name: 'Guntur Red Chilli (Teja)',
                  icon: '🌶️',
                  category: 'Spices',
                  velocity: '⚡ FAST TURNOVER',
                  velocityStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  growth: '+35% MoM',
                  growthPositive: true,
                  margin: '32.0%',
                  daysToSell: '5 Days',
                  safetyBuffer: '150 kg',
                  advisory: 'High margin commodity. Stock up before upcoming export surge.',
                },
                {
                  id: 'basmati_rice',
                  name: 'Basmati Rice (Royal 5kg)',
                  icon: '🌾',
                  category: 'Staples',
                  velocity: '📈 STEADY SELLER',
                  velocityStyle: 'bg-blue-100 text-blue-800 border-blue-300',
                  growth: '+14% MoM',
                  growthPositive: true,
                  margin: '18.0%',
                  daysToSell: '12 Days',
                  safetyBuffer: '300 Bags',
                  advisory: 'Consistent household demand. Maintain 14-day stock rotation.',
                },
                {
                  id: 'sunflower_oil',
                  name: 'Refined Sunflower Oil (1L)',
                  icon: '🌻',
                  category: 'Fats & Oils',
                  velocity: '📈 HIGH VALUE',
                  velocityStyle: 'bg-blue-100 text-blue-800 border-blue-300',
                  growth: '+22% MoM',
                  growthPositive: true,
                  margin: '15.5%',
                  daysToSell: '8 Days',
                  safetyBuffer: '450 Liters',
                  advisory: 'Stable turnover. Pair with wheat flour for bundle promotions.',
                },
                {
                  id: 'potato',
                  name: 'Potato (Indore White)',
                  icon: '🥔',
                  category: 'Vegetables',
                  velocity: '📦 SLOW TURNOVER',
                  velocityStyle: 'bg-amber-100 text-amber-900 border-amber-300',
                  growth: '-8% MoM',
                  growthPositive: false,
                  margin: '12.0%',
                  daysToSell: '18 Days',
                  safetyBuffer: '800 kg',
                  advisory: 'Offer 10% combo discount with Onion to clear stock faster.',
                },
                {
                  id: 'turmeric',
                  name: 'Organic Turmeric (500g)',
                  icon: '🟡',
                  category: 'Spices',
                  velocity: '⚡ HIGH MARGIN',
                  velocityStyle: 'bg-purple-100 text-purple-800 border-purple-300',
                  growth: '+19% MoM',
                  growthPositive: true,
                  margin: '38.0%',
                  daysToSell: '14 Days',
                  safetyBuffer: '80 Pkts',
                  advisory: 'Top margin contributor. Place near checkout for impulse buys.',
                },
                {
                  id: 'milk',
                  name: 'Fresh Whole Milk (500ml)',
                  icon: '🥛',
                  category: 'Dairy',
                  velocity: '⚡ DAILY ESSENTIAL',
                  velocityStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  growth: '+42% MoM',
                  growthPositive: true,
                  margin: '10.0%',
                  daysToSell: '1 Day',
                  safetyBuffer: '200 Crates',
                  advisory: 'Perishable item with 100% daily clearance rate.',
                },
                {
                  id: 'wheat_atta',
                  name: 'Wheat Atta (Whole Grain 5kg)',
                  icon: '🍞',
                  category: 'Staples',
                  velocity: '📈 STEADY STAPLE',
                  velocityStyle: 'bg-blue-100 text-blue-800 border-blue-300',
                  growth: '+12% MoM',
                  growthPositive: true,
                  margin: '16.5%',
                  daysToSell: '10 Days',
                  safetyBuffer: '180 Bags',
                  advisory: 'High repeat order item. Reorder when stock drops below 40 bags.',
                },
              ].map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${item.velocityStyle}`}>
                        {item.velocity}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{item.category}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Sales Growth</p>
                        <p className={`font-black ${item.growthPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.growth}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Gross Margin</p>
                        <p className="font-black text-slate-900">{item.margin}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                      <span>Avg Turnover: <strong className="text-slate-800">{item.daysToSell}</strong></span>
                      <span>Safety Buffer: <strong className="text-slate-800">{item.safetyBuffer}</strong></span>
                    </div>

                    <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80 text-[11px] text-blue-900 leading-snug">
                      💡 <span className="font-bold">DemandX Advisory:</span> {item.advisory}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenProcurement(PRODUCTS.find(p => p.id === item.id) || PRODUCTS[0])}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Procure Stock</span>
                    <Truck className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Nearby Suppliers':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Verified B2B Suppliers in Guntur & Andhra Pradesh</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Direct agricultural producers, wholesale distributors, and regional processing hubs.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                7 Active Suppliers Connected
              </span>
            </div>

            {/* Supplier Directory List */}
            <div className="space-y-3">
              {[
                {
                  id: 'guntur_spices',
                  name: 'Guntur Spice Traders & Exporters',
                  hub: 'Guntur Spice Market Hub',
                  distance: '4.2 km away',
                  rating: '4.9 ⭐ (142 Reviews)',
                  products: 'Guntur Red Chilli, Turmeric, Cumin, Coriander',
                  price: '₹125/kg wholesale',
                  moq: '50 kg',
                  leadTime: '4 Hours Express',
                  credit: '15 Days Credit Available',
                  badge: 'TOP RATED EXPORTER',
                  badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  phone: '+91 98480 11223',
                },
                {
                  id: 'vijayawada_farmers',
                  name: 'Vijayawada Grains & Pulses FPO',
                  hub: 'Vijayawada Wholesale Grain Mandi',
                  distance: '18.5 km away',
                  rating: '4.8 ⭐ (98 Reviews)',
                  products: 'Sona Masoori Rice, Refined Sugar, Chana Dal, Moong Dal',
                  price: '₹52/kg wholesale',
                  moq: '100 kg',
                  leadTime: '6 Hours Same-Day',
                  credit: 'Cash / UPI / Net Banking',
                  badge: 'MANDI DIRECT',
                  badgeStyle: 'bg-blue-100 text-blue-800 border-blue-300',
                  phone: '+91 94401 55667',
                },
                {
                  id: 'andhra_oil_mills',
                  name: 'Andhra Oil Mills & Distributors',
                  hub: 'Tenali Industrial Hub',
                  distance: '12.0 km away',
                  rating: '4.7 ⭐ (76 Reviews)',
                  products: 'Refined Sunflower Oil, Groundnut Oil, Mustard Oil',
                  price: '₹132/L wholesale',
                  moq: '100 Liters',
                  leadTime: '5 Hours',
                  credit: '30 Days Credit Terms',
                  badge: 'VERIFIED MILL',
                  badgeStyle: 'bg-purple-100 text-purple-800 border-purple-300',
                  phone: '+91 98662 33445',
                },
                {
                  id: 'godavari_grain',
                  name: 'Godavari Grain & Rice Processing Hub',
                  hub: 'Rajahmundry Rice Belt',
                  distance: '45.0 km away',
                  rating: '4.9 ⭐ (215 Reviews)',
                  products: 'Royal Basmati Rice, Sonamasuri Rice, Whole Wheat',
                  price: '₹380/bag wholesale',
                  moq: '20 Bags (100 kg)',
                  leadTime: '12 Hours Next-Day',
                  credit: '14 Days Credit Line',
                  badge: 'PREMIUM GRAIN HUB',
                  badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
                  phone: '+91 97012 88990',
                },
                {
                  id: 'deccan_dairy',
                  name: 'Deccan Dairy Products Co-operative',
                  hub: 'Guntur Industrial Estate',
                  distance: '6.5 km away',
                  rating: '4.8 ⭐ (110 Reviews)',
                  products: 'Fresh Whole Milk, Paneer, Butter, Ghee',
                  price: '₹48/L wholesale',
                  moq: '50 Liters',
                  leadTime: '2 Hours Cold-Chain Express',
                  credit: 'Daily Settlement',
                  badge: 'COLD-CHAIN VERIFIED',
                  badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  phone: '+91 99890 44556',
                },
                {
                  id: 'krishna_valley',
                  name: 'Krishna Valley Produce Suppliers',
                  hub: 'Mangalagiri Wholesale Yard',
                  distance: '14.2 km away',
                  rating: '4.6 ⭐ (64 Reviews)',
                  products: 'Onion, Garlic, Ginger, Fresh Curry Leaves',
                  price: '₹28/kg wholesale',
                  moq: '150 kg',
                  leadTime: '5 Hours',
                  credit: 'UPI / Cheque 7 Days',
                  badge: 'WHOLESALE YARD',
                  badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
                  phone: '+91 91772 66778',
                },
                {
                  id: 'coastal_agro',
                  name: 'Coastal Agro Processing Corp',
                  hub: 'Kakinada Port Logistics Hub',
                  distance: '85.0 km away',
                  rating: '4.7 ⭐ (180 Reviews)',
                  products: 'Chana Dal, Toor Dal, Whole Grain Wheat Flour',
                  price: '₹210/bag wholesale',
                  moq: '15 Bags',
                  leadTime: '24 Hours Delivery',
                  credit: '21 Days Corporate Credit',
                  badge: 'BULK PROCESSOR',
                  badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                  phone: '+91 93930 77889',
                },
              ].map((sup) => (
                <div key={sup.id} className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3 hover:border-blue-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${sup.badgeStyle}`}>
                          {sup.badge}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{sup.distance} • {sup.hub}</span>
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{sup.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{sup.rating}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => showToast('Supplier Call Initiated', `Dialing ${sup.phone} (${sup.name})...`, 'info')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 border border-slate-200"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span>Call Supplier</span>
                      </button>

                      <button
                        onClick={() => handleOpenProcurement(PRODUCTS[0])}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <span>Request Order</span>
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Main Commodities</p>
                      <p className="font-bold text-slate-900 truncate">{sup.products}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Indicative Wholesale Rate</p>
                      <p className="font-black text-emerald-700">{sup.price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Min Order (MOQ)</p>
                      <p className="font-bold text-slate-900">{sup.moq}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Delivery & Credit</p>
                      <p className="font-bold text-blue-800">{sup.leadTime} • {sup.credit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Price Trends':
        return (
          <PriceTrendsView
            dynamicPriceData={dynamicData.priceTrendsData}
            storeLocation={storeLocation}
            onOpenProcurement={handleOpenProcurement}
          />
        );

      case 'Offers & Schemes':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Percent className="w-5 h-5 text-blue-600" />
                  <span>Active Supplier Volume Rebates & B2B Schemes</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Exclusive promotional discounts, bulk cashbacks, and credit extension schemes for Guntur retailers.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                6 Active Schemes Available
              </span>
            </div>

            {/* Schemes Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Mega Bulk Spice Rebate Scheme',
                  supplier: 'Guntur Spice Traders',
                  discount: '12% Instant Cashback',
                  condition: 'Valid on Red Chilli orders > 1,000 kg',
                  validity: 'Expires in 3 Days',
                  code: 'GUNTUR12',
                  bg: 'from-amber-500 to-amber-700',
                  badge: 'EXCLUSIVE REBATE',
                },
                {
                  title: 'Pantry Staples Bulk Freight Waiver',
                  supplier: 'Vijayawada Grains & Pulses FPO',
                  discount: '100% Free Freight Transport',
                  condition: 'Valid on Sona Masoori Rice & Grocery orders > ₹15,000',
                  validity: 'Valid Till Month End',
                  code: 'FREESHIP',
                  bg: 'from-emerald-600 to-teal-700',
                  badge: 'FREE DELIVERY',
                },
                {
                  title: 'Edible Oil Volume Scale Scheme',
                  supplier: 'Andhra Oil Mills',
                  discount: 'Buy 200L, Get 15L Mustard Oil FREE',
                  condition: 'Free bonus oil worth ₹2,100',
                  validity: 'Limited Stock Scheme',
                  code: 'OILBONUS',
                  bg: 'from-blue-600 to-indigo-700',
                  badge: 'BONUS PRODUCT',
                },
                {
                  title: 'Grain Procurement Credit Extension',
                  supplier: 'Godavari Grain Processing',
                  discount: '0% Interest 45-Day Credit Line',
                  condition: 'Applicable on Basmati Rice orders > ₹50,000',
                  validity: 'Active Scheme',
                  code: 'CREDIT45',
                  bg: 'from-purple-600 to-slate-800',
                  badge: 'CREDIT EXTENSION',
                },
                {
                  title: 'Festival Dairy Combo Incentive',
                  supplier: 'Deccan Dairy Co-op',
                  discount: 'Extra 5% Profit Margin Rebate',
                  condition: 'When purchasing Milk & Paneer in single PO',
                  validity: 'Expires in 5 Days',
                  code: 'DAIRY5',
                  bg: 'from-pink-600 to-rose-700',
                  badge: 'COMBO DISCONTINUED',
                },
                {
                  title: 'Early Settlement Cash Discount',
                  supplier: 'All AP Verified Suppliers',
                  discount: '2.5% Instant Invoice Discount',
                  condition: 'For UPI / IMPS payments within 24 hours',
                  validity: 'Always Active',
                  code: 'EARLYBIRD',
                  bg: 'from-slate-700 to-slate-900',
                  badge: 'PAYMENT REBATE',
                },
              ].map((scheme, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div className="space-y-3">
                    <div className={`bg-gradient-to-r ${scheme.bg} text-white p-4 space-y-1 relative overflow-hidden`}>
                      <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        {scheme.badge}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight mt-1">{scheme.title}</h4>
                      <p className="text-[11px] text-white/80 font-medium">{scheme.supplier}</p>
                    </div>

                    <div className="p-4 space-y-2.5 pt-0">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-medium">Benefit</p>
                        <p className="text-sm font-black text-slate-900">{scheme.discount}</p>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">📋 {scheme.condition}</p>
                      <p className="text-[11px] text-slate-400 font-medium">⏳ {scheme.validity}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => showToast('Scheme Applied', `Promo code ${scheme.code} applied to your next procurement order!`, 'success')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Apply Code {scheme.code}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Sales Analytics':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Sales Revenue Analytics & Operational Performance</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Comprehensive financial breakdown, 12-month sales trajectory, product revenue leaderboard, and category shares.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                Monthly Turnover Ratio: 4.8x
              </span>
            </div>

            {/* 6 Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Projected Monthly Revenue</p>
                <p className="text-xl font-black text-slate-900">₹2.45 Lakh</p>
                <p className="text-[10px] text-emerald-600 font-bold">↑ +24.5% vs Prev Month</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Gross Profit Margin</p>
                <p className="text-xl font-black text-emerald-700">₹58,800</p>
                <p className="text-[10px] text-slate-500 font-medium">Average 24.0% Margin</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Total Units Sold</p>
                <p className="text-xl font-black text-blue-900">14,850 Units</p>
                <p className="text-[10px] text-blue-600 font-bold">Across 12 Commodities</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Avg Customer Basket</p>
                <p className="text-xl font-black text-purple-900">₹485 / Order</p>
                <p className="text-[10px] text-emerald-600 font-bold">↑ +12.0% Basket Size</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Stockout Loss Saved</p>
                <p className="text-xl font-black text-emerald-700">₹34,200</p>
                <p className="text-[10px] text-emerald-600 font-bold">✓ Saved via AI Buffer</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Repeat Customer Rate</p>
                <p className="text-xl font-black text-indigo-900">76.8%</p>
                <p className="text-[10px] text-indigo-600 font-bold">High Loyalty Index</p>
              </div>
            </div>

            {/* 12-Month Sales Analytics Growth Trend Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>12-Month Sales Revenue & Profit Trajectory (Jan – Dec)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">Full annual sales history with Q4 ML predictive forecast</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  +24.5% Revenue Growth Rate
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicData.annualSalesData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" name="Total Revenue (₹)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Gross Profit (₹)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 8 Product Sales Revenue Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Top Product Revenue Leaderboard
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">Sorted by Monthly Revenue Contribution</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-100">
                    <tr>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5 text-right">Units Sold</th>
                      <th className="p-2.5 text-right">Monthly Revenue</th>
                      <th className="p-2.5 text-right">Revenue Share</th>
                      <th className="p-2.5 text-right">Gross Profit</th>
                      <th className="p-2.5 text-center">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: 'Guntur Red Chilli (Teja)', icon: '🌶️', units: '1,200 kg', revenue: '₹54,200', share: '22.1%', profit: '₹17,344', margin: '32.0%' },
                      { name: 'Sona Masoori Rice (5kg Bag)', icon: '🌾', units: '850 Bags', revenue: '₹42,800', share: '17.5%', profit: '₹10,486', margin: '24.5%' },
                      { name: 'Basmati Rice (Royal 5kg)', icon: '🌾', units: '450 Bags', revenue: '₹38,600', share: '15.8%', profit: '₹6,948', margin: '18.0%' },
                      { name: 'Sunflower Oil (1L Pouch)', icon: '🌻', units: '680 Liters', revenue: '₹32,400', share: '13.2%', profit: '₹5,022', margin: '15.5%' },
                      { name: 'Wheat Atta (Whole Grain 5kg)', icon: '🍞', units: '320 Bags', revenue: '₹28,100', share: '11.5%', profit: '₹4,636', margin: '16.5%' },
                      { name: 'Toor Dal (Unpolished)', icon: '🫘', units: '410 kg', revenue: '₹21,500', share: '8.8%', profit: '₹4,300', margin: '20.0%' },
                      { name: 'Organic Turmeric Powder', icon: '🟡', units: '280 Pkts', revenue: '₹15,400', share: '6.3%', profit: '₹5,852', margin: '38.0%' },
                      { name: 'Fresh Whole Milk & Paneer', icon: '🥛', units: '520 Units', revenue: '₹12,000', share: '4.8%', profit: '₹1,440', margin: '12.0%' },
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-bold text-slate-900 flex items-center space-x-2">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-700">{item.units}</td>
                        <td className="p-2.5 text-right font-black text-slate-900">{item.revenue}</td>
                        <td className="p-2.5 text-right font-bold text-blue-700">{item.share}</td>
                        <td className="p-2.5 text-right font-black text-emerald-700">{item.profit}</td>
                        <td className="p-2.5 text-center">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                            {item.margin}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Revenue Contribution & Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Category Revenue Contribution (6 Categories)</h4>
                <div className="space-y-2 text-xs">
                  {[
                    { category: 'Vegetables & Fresh Produce', share: '38%', amount: '₹93,100', color: 'bg-emerald-500' },
                    { category: 'Staples & Rice / Grains', share: '28%', amount: '₹68,600', color: 'bg-blue-500' },
                    { category: 'Cooking Oils & Fats', share: '15%', amount: '₹36,750', color: 'bg-purple-500' },
                    { category: 'Spices & Condiments', share: '12%', amount: '₹29,400', color: 'bg-amber-500' },
                    { category: 'Pulses & Lentils', share: '5%', amount: '₹12,250', color: 'bg-indigo-500' },
                    { category: 'Packaged Dairy', share: '2%', amount: '₹4,900', color: 'bg-pink-500' },
                  ].map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{c.category} ({c.share})</span>
                        <span>{c.amount}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${c.color}`} style={{ width: c.share }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Peak Shopping Hours Velocity</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">🌅 Morning Peak: 7:00 AM – 10:00 AM</p>
                    <p className="text-[11px] text-slate-500">35% of daily customer sales. Primary demand: Fresh Milk, Vegetables, Atta.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">🌆 Evening Peak: 5:00 PM – 9:00 PM</p>
                    <p className="text-[11px] text-slate-500">47% of daily customer sales. Primary demand: Spices, Oils, Basmati Rice, Vegetables.</p>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                    <span>⚡ Weekend Sales Lift:</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-black">+32.0% Saturday & Sunday Surge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-5 animate-fade-in max-w-4xl">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5 text-blue-600" />
                  <span>Store Settings & ML Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage store profile, automated procurement triggers, and live Firestore sync.</p>
              </div>
            </div>

            {/* Form Sections */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
              
              {/* Store Profile */}
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Store & Business Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Store Name</label>
                    <input
                      type="text"
                      value={storeLocation}
                      onChange={(e) => setStoreLocation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Store ID / Scope</label>
                    <input
                      type="text"
                      readOnly
                      value="GUNTUR_STORE_01"
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GSTIN Registration</label>
                    <input
                      type="text"
                      defaultValue="37AAAAA0000A1Z5"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Region</label>
                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500">
                      <option>Guntur Central, AP</option>
                      <option>Vijayawada Agriculture Hub, AP</option>
                      <option>Hyderabad Regional Depot, TS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ML Model Config */}
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ML Model & Replenishment Thresholds</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">AI Safety Stock Sensitivity</label>
                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500">
                      <option>Balanced (Default 1.25x Safety Buffer)</option>
                      <option>Aggressive (1.5x Safety Buffer for Fast Sellers)</option>
                      <option>Conservative (1.0x Safety Buffer for Capital Preservation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Auto-Procurement Trigger</label>
                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500">
                      <option>Prompt on Stockout Risk HIGH</option>
                      <option>Prompt on Stockout Risk MEDIUM & HIGH</option>
                      <option>Manual Approval Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* System Integration Status */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-900">Firestore Real-Time Sync:</span>
                  <span className="text-slate-600">Connected (GUNTUR_STORE_01)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">Latency: 24ms</span>
              </div>

              <button
                onClick={() => showToast('Settings Saved', 'Store configuration and ML threshold settings updated successfully!', 'success')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        );

      case 'Supplier Orders': {
        const allSupplierOrders = getRetailerProcurementOrders(retailerId);
        const pendingCount = allSupplierOrders.filter((o) => o.status === 'Pending').length;
        const acceptedCount = allSupplierOrders.filter((o) => o.status === 'Accepted').length;
        const dispatchedCount = allSupplierOrders.filter((o) => o.status === 'Dispatched').length;
        const deliveredCount = allSupplierOrders.filter((o) => o.status === 'Delivered').length;
        const cancelledCount = allSupplierOrders.filter((o) => o.status === 'Cancelled').length;

        const filteredOrders = allSupplierOrders.filter((order) => {
          const matchesStatus = orderStatusFilter === 'All' ? true : order.status === orderStatusFilter;
          const matchesSearch =
            orderSearchTerm.trim() === '' ||
            (order.id || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
            (order.supplierName || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
            order.items.some((it) => (it.productName || '').toLowerCase().includes(orderSearchTerm.toLowerCase()));
          return matchesStatus && matchesSearch;
        });

        return (
          <div className="space-y-5 animate-fade-in">
            {/* Header with CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">B2B Supplier Procurement Orders</h2>
                    <p className="text-xs text-slate-500">
                      Track orders placed with regional millers and distributors for {storeLocation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => handleOpenProcurement()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>+ Order Groceries</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setOrderStatusFilter('Pending')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  orderStatusFilter === 'Pending'
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-white border-slate-200 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-amber-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-slate-900">{pendingCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Awaiting response</div>
              </button>

              <button
                onClick={() => setOrderStatusFilter('Accepted')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  orderStatusFilter === 'Accepted'
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between text-blue-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Accepted</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-slate-900">{acceptedCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Ready for dispatch</div>
              </button>

              <button
                onClick={() => setOrderStatusFilter('Dispatched')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  orderStatusFilter === 'Dispatched'
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400'
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between text-indigo-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dispatched</span>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-slate-900">{dispatchedCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Shipment in transit</div>
              </button>

              <button
                onClick={() => setOrderStatusFilter('Delivered')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  orderStatusFilter === 'Delivered'
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                    : 'bg-white border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span>
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-slate-900">{deliveredCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Stock added</div>
              </button>

              <button
                onClick={() => setOrderStatusFilter('Cancelled')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  orderStatusFilter === 'Cancelled'
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                    : 'bg-white border-slate-200 hover:border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-rose-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Cancelled</span>
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-slate-900">{cancelledCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">No stock change</div>
              </button>
            </div>

            {/* Quality & Batch Policy Notice */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start space-x-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Shelf-Life & Best-Before Guidance:</span>{' '}
                Check each batch’s printed best-before date and storage instructions. Sell older eligible batches first. Batch date:{' '}
                <span className="font-mono bg-amber-100/70 px-1.5 py-0.5 rounded text-[11px]">Not recorded</span>.
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder="Search by Order ID, Supplier Name, or Grocery Product..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1 mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </span>
                  {['All', 'Pending', 'Accepted', 'Dispatched', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        orderStatusFilter === st
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders List Table & Mobile Cards */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Supplier Orders Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No orders match your filter criteria. Place an order with your regional grain and grocery suppliers to replenish inventory.
                </p>
                <button
                  onClick={() => handleOpenProcurement()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                >
                  <span>+ Place Grocery Order</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">Order ID & Date</th>
                        <th className="p-3.5">Supplier Name</th>
                        <th className="p-3.5">Grocery Items & Quantities</th>
                        <th className="p-3.5 text-right">Order Value</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Lifecycle & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((po) => {
                        const isDispatched = po.status === 'Dispatched';
                        const isDelivered = po.status === 'Delivered';
                        const isCancelled = po.status === 'Cancelled';
                        const isAccepted = po.status === 'Accepted';
                        const isPending = po.status === 'Pending';

                        return (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 align-top">
                              <div className="font-mono font-bold text-blue-700">{po.id}</div>
                              <div className="text-[11px] text-slate-500">{formatOrderDate(po.createdAt)}</div>
                              <span
                                className={`inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  po.isDemo ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {po.isDemo ? 'Demo Fixture' : 'Live Firestore'}
                              </span>
                            </td>

                            <td className="p-3.5 align-top">
                              <div className="font-bold text-slate-900">{po.supplierName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">ID: {po.supplierId}</div>
                            </td>

                            <td className="p-3.5 align-top max-w-xs">
                              <div className="space-y-1">
                                {po.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px]"
                                  >
                                    <div className="font-bold text-slate-800">{item.productName}</div>
                                    <div className="text-slate-600 font-medium flex justify-between">
                                      <span>
                                        {item.quantity} × {item.unit}
                                      </span>
                                      <span className="font-mono text-slate-700">
                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="p-3.5 align-top text-right">
                              <div className="text-sm font-black text-slate-900">
                                ₹{po.totalAmount.toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">Wholesale B2B</div>
                            </td>

                            <td className="p-3.5 align-top text-center">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center space-x-1 ${
                                  isPending
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : isAccepted
                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                    : isDispatched
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                    : isDelivered
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}
                              >
                                <span>
                                  {isPending && '⏱'}
                                  {isAccepted && '✓'}
                                  {isDispatched && '🚚'}
                                  {isDelivered && '✓'}
                                  {isCancelled && '✕'}
                                </span>
                                <span>{po.status}</span>
                              </span>
                            </td>

                            <td className="p-3.5 align-top text-center">
                              {isDispatched && (
                                <button
                                  disabled={isReceivingOrderId === (po.id || '')}
                                  onClick={async () => {
                                    if (!po.id) return;
                                    try {
                                      setIsReceivingOrderId(po.id);
                                      await deliverSupplierOrder(po.id);
                                      showToast(
                                        'Stock Received',
                                        `Order ${po.id} marked Delivered. Replenished physical store inventory!`,
                                        'success'
                                      );
                                    } catch (err: any) {
                                      showToast('Delivery Update Notice', err?.message || 'Failed to receive stock', 'warning');
                                    } finally {
                                      setIsReceivingOrderId(null);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1 mx-auto"
                                >
                                  {isReceivingOrderId === po.id ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Receiving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <PackageCheck className="w-3.5 h-3.5" />
                                      <span>Mark Goods Received</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {isDelivered && (
                                <div className="text-[11px] text-emerald-700 font-bold flex flex-col items-center">
                                  <span className="flex items-center space-x-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Stock Replenished</span>
                                  </span>
                                  {po.deliveredAt && (
                                    <span className="text-[10px] text-slate-500 font-normal">{formatOrderDate(po.deliveredAt)}</span>
                                  )}
                                </div>
                              )}

                              {isCancelled && (
                                <div className="text-[11px] text-rose-700 max-w-[160px] mx-auto text-left">
                                  <span className="font-bold block">Cancelled</span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {po.cancellationReason || 'Supply shortage'}
                                  </span>
                                  {po.cancelledAt && (
                                    <span className="text-[9px] text-slate-400 block">{formatOrderDate(po.cancelledAt)}</span>
                                  )}
                                </div>
                              )}

                              {isAccepted && (
                                <div className="text-[11px] text-blue-700 font-medium">
                                  <span>Supplier preparing dispatch</span>
                                  {po.acceptedAt && (
                                    <span className="text-[10px] text-slate-400 block">Accepted {formatOrderDate(po.acceptedAt)}</span>
                                  )}
                                </div>
                              )}

                              {isPending && (
                                <div className="text-[11px] text-amber-700 font-medium">
                                  <span>Awaiting supplier review</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredOrders.map((po) => (
                    <div key={po.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono font-bold text-blue-700 text-xs">{po.id}</div>
                          <div className="text-[11px] text-slate-500">{formatOrderDate(po.createdAt)}</div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            po.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : po.status === 'Accepted'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : po.status === 'Dispatched'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                              : po.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900">{po.supplierName}</div>

                      <div className="space-y-1">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="p-2 bg-slate-50 rounded text-xs flex justify-between">
                            <span className="font-semibold text-slate-800">{it.productName}</span>
                            <span className="text-slate-600 font-medium">
                              {it.quantity} × {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Total Value:</span>
                        <span className="text-sm font-black text-slate-900">
                          ₹{po.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {po.status === 'Dispatched' && (
                        <button
                          disabled={isReceivingOrderId === (po.id || '')}
                          onClick={async () => {
                            if (!po.id) return;
                            try {
                              setIsReceivingOrderId(po.id);
                              await deliverSupplierOrder(po.id);
                              showToast('Stock Received', `Order ${po.id} marked Delivered! Replenished store inventory.`, 'success');
                            } catch (err: any) {
                              showToast('Delivery Notice', err?.message || 'Failed to receive stock', 'warning');
                            } finally {
                              setIsReceivingOrderId(null);
                            }
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Mark Goods Received
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Default Overview matching IMAGE 2 top-right
      default:
        return (
          <div className="space-y-5 animate-fade-in">
            {/* 4 KPI Cards Grid matching Image 2 top-right */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Predicted Demand</p>
                    <p className="text-lg font-black text-slate-900">{dynamicData.kpis.predictedDemand}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">↑ {dynamicData.kpis.predictedDemandChange}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Live Store Stock</p>
                    <p className="text-lg font-black text-slate-900">{liveTotalStock.toLocaleString('en-IN')} units</p>
                    <p className="text-[10px] text-emerald-600 font-bold">✓ Live Firestore Sync</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Real-Time Orders</p>
                    <p className="text-lg font-black text-emerald-700">{liveOrderCount} Active Orders</p>
                    <p className="text-[10px] text-slate-500">Recorded Live</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Live Customer Sales</p>
                    <p className="text-lg font-black text-slate-900">₹{liveSalesAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">↑ Updated Real-Time</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Top Selling Products Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Top Selling Products</h3>
                <button onClick={() => setActiveTab('Product Insights')} className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer">
                  View All Insights
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dynamicData.topSellingProducts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[11px] font-semibold text-slate-600">{item.sales}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {item.growth}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Demand Distribution Pie Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>📊</span>
                  <span>Category Sales Volume Share — {storeLocation}</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Dynamic Regional Distribution
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-6 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicData.categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dynamicData.categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} units`, 'Sales Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dynamicData.categoryPieData.map((cat, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{cat.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{cat.value.toLocaleString('en-IN')} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Supplier Procurement Order Status Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">B2B Supplier Procurement Orders</h3>
                    <p className="text-[11px] text-slate-500">
                      Live status of stock replenishments placed with grain & grocery suppliers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenProcurement()}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Order Groceries
                  </button>
                  <button
                    onClick={() => setActiveTab('Supplier Orders')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View All Orders →</span>
                  </button>
                </div>
              </div>

              {/* Status summary pills */}
              {(() => {
                const poList = getRetailerProcurementOrders(retailerId);
                const pPending = poList.filter((o) => o.status === 'Pending').length;
                const pAccepted = poList.filter((o) => o.status === 'Accepted').length;
                const pDispatched = poList.filter((o) => o.status === 'Dispatched').length;
                const pDelivered = poList.filter((o) => o.status === 'Delivered').length;
                const pCancelled = poList.filter((o) => o.status === 'Cancelled').length;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div
                      onClick={() => {
                        setOrderStatusFilter('Pending');
                        setActiveTab('Supplier Orders');
                      }}
                      className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <div className="text-[10px] font-bold text-amber-800 uppercase">Pending</div>
                      <div className="text-base font-black text-amber-950">{pPending}</div>
                    </div>
                    <div
                      onClick={() => {
                        setOrderStatusFilter('Accepted');
                        setActiveTab('Supplier Orders');
                      }}
                      className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <div className="text-[10px] font-bold text-blue-800 uppercase">Accepted</div>
                      <div className="text-base font-black text-blue-950">{pAccepted}</div>
                    </div>
                    <div
                      onClick={() => {
                        setOrderStatusFilter('Dispatched');
                        setActiveTab('Supplier Orders');
                      }}
                      className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 cursor-pointer hover:bg-indigo-100/60 transition-colors"
                    >
                      <div className="text-[10px] font-bold text-indigo-800 uppercase">Dispatched</div>
                      <div className="text-base font-black text-indigo-950">{pDispatched}</div>
                    </div>
                    <div
                      onClick={() => {
                        setOrderStatusFilter('Delivered');
                        setActiveTab('Supplier Orders');
                      }}
                      className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">Delivered</div>
                      <div className="text-base font-black text-emerald-950">{pDelivered}</div>
                    </div>
                    <div
                      onClick={() => {
                        setOrderStatusFilter('Cancelled');
                        setActiveTab('Supplier Orders');
                      }}
                      className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 cursor-pointer hover:bg-rose-100/60 transition-colors"
                    >
                      <div className="text-[10px] font-bold text-rose-800 uppercase">Cancelled</div>
                      <div className="text-base font-black text-rose-950">{pCancelled}</div>
                    </div>
                  </div>
                );
              })()}

              {getRetailerProcurementOrders(retailerId).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No orders placed yet. Click "+ Order Groceries" to restock grains, pulses, and pantry essentials.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-y border-slate-100">
                      <tr>
                        <th className="p-3">Order ID & Date</th>
                        <th className="p-3">Supplier Name</th>
                        <th className="p-3">Items & Quantities</th>
                        <th className="p-3 text-right">Order Value</th>
                        <th className="p-3 text-center">Current Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getRetailerProcurementOrders(retailerId).slice(0, 5).map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <span className="font-mono font-bold text-blue-700 block">{po.id}</span>
                            <span className="text-[10px] text-slate-400 block">{formatOrderDate(po.createdAt)}</span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{po.supplierName}</td>
                          <td className="p-3 text-slate-700">
                            {po.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-semibold mr-1.5 my-0.5 border border-slate-200"
                              >
                                {item.productName} ({item.quantity} × {item.unit})
                              </span>
                            ))}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            ₹{po.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center space-x-1 ${
                                po.status === 'Dispatched'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : po.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : po.status === 'Accepted'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : po.status === 'Cancelled'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <span>
                                {po.status === 'Pending' && '⏱'}
                                {po.status === 'Accepted' && '✓'}
                                {po.status === 'Dispatched' && '🚚'}
                                {po.status === 'Delivered' && '✓'}
                                {po.status === 'Cancelled' && '✕'}
                              </span>
                              <span>{po.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {po.status === 'Dispatched' ? (
                              <button
                                disabled={isReceivingOrderId === (po.id || '')}
                                onClick={async () => {
                                  if (!po.id) return;
                                  try {
                                    setIsReceivingOrderId(po.id);
                                    await deliverSupplierOrder(po.id);
                                    showToast('Stock Received', `Order ${po.id} marked Delivered! Stock updated.`, 'success');
                                  } catch (err: any) {
                                    showToast('Delivery Notice', err?.message || 'Failed to receive stock', 'warning');
                                  } finally {
                                    setIsReceivingOrderId(null);
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                              >
                                <PackageCheck className="w-3 h-3" />
                                <span>Confirm Received</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Row: AI Insight & Supplier Offers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* AI Insight */}
              <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">AI Insight</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {RETAILER_DATA.aiInsight.message}
                  </p>
                  <button
                    onClick={() => setActiveTab('Demand Forecast')}
                    className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{RETAILER_DATA.aiInsight.cta}</span>
                  </button>
                </div>
              </div>

              {/* Supplier Offers */}
              <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800">Supplier Offers</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {RETAILER_DATA.supplierOffers.message}
                  </p>
                  <button
                    onClick={() => setActiveTab('Nearby Suppliers')}
                    className="px-3 py-1.5 bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{RETAILER_DATA.supplierOffers.cta}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Role Top Strip Banner matching Image 2 top-right */}
        <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="font-black text-sm uppercase tracking-wide">Retailer</span>
            <span className="text-blue-100 text-xs">— Plan Stock. Boost Sales.</span>
          </div>
        </div>

        {/* Dashboard Frame Container (Stays visible at all times) */}
        <div className="bg-white border border-slate-200/90 rounded-[22px] shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[720px]">

          {/* Role Sidebar */}
          <Sidebar role="retailer" activeItem={activeTab} onSelectKey={setActiveTab} />

          {/* Main Dashboard Area */}
          <main className="flex-1 p-4 sm:p-6 bg-slate-50/50 space-y-5 overflow-y-auto">

            {/* Header with Greeting & Store Location */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {activeTab === 'Dashboard' ? 'Welcome Back, Retailer!' : activeTab}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plan your inventory smartly and never miss a sale.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Store Pill Selector */}
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                  <Store className="w-4 h-4 text-blue-600" />
                  <select
                    value={storeLocation}
                    onChange={(e) => handleStoreLocationChange(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="My Store - Guntur, AP">My Store - Guntur, AP</option>
                    <option value="Vijayawada Central Mart, AP">Vijayawada Central Mart, AP</option>
                    <option value="Hyderabad Express Store, TS">Hyderabad Express Store, TS</option>
                  </select>
                </div>

                {/* AI Insights Control (Preserved and accessible directly in Header) */}
                <Link
                  to="/ai"
                  className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Open AI Market Insights"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Insights</span>
                </Link>

                {/* JARVIS Full-Screen 3D Voice Command Centre Button immediately beside AI Insights */}
                <Link
                  to="/jarvis"
                  className="relative group flex items-center space-x-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_22px_rgba(6,182,212,0.45)] hover:border-cyan-400 transition-all cursor-pointer shrink-0"
                  title="Open JARVIS Full-Screen 3D Voice Command Centre"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="tracking-wide">Open Jarvis</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono">
                    3D VOICE
                  </span>
                </Link>

                {/* Order Stock from Supplier Action Button */}
                <button
                  type="button"
                  onClick={() => setIsProcurementOpen(true)}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Truck className="w-4 h-4" />
                  <span>Order Stock from Supplier</span>
                </button>
              </div>
            </div>

            {/* Dynamic Content Area */}
            {renderContent()}

          </main>

        </div>

      </div>

      {/* Procurement Modal */}
      <ProcurementModal
        isOpen={isProcurementOpen}
        onClose={() => {
          setIsProcurementOpen(false);
          setProcurementProduct(undefined);
          setProcurementQty(undefined);
        }}
        retailerStoreName={storeLocation}
        initialProduct={procurementProduct}
        initialQuantity={procurementQty}
      />

      {/* JARVIS Multilingual AI Voice Assistant Modal */}
      <JarvisAssistantModal
        isOpen={isJarvisOpen}
        onClose={() => setIsJarvisOpen(false)}
        storeLocation={storeLocation}
        userRole="retailer"
      />
    </div>
  );
};
