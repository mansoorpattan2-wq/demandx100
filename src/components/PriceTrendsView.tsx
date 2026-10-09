import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  BarChart3,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Lightbulb,
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
} from 'recharts';
import { PRODUCTS, type Product } from '../data/products';

interface PriceTrendsViewProps {
  dynamicPriceData: Array<{ item: string; spot: number; wholesale: number }>;
  storeLocation: string;
  onOpenProcurement?: (product?: Product, suggestedQty?: number) => void;
}

export const PriceTrendsView: React.FC<PriceTrendsViewProps> = ({
  dynamicPriceData,
  storeLocation,
  onOpenProcurement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const priceTrendItems = [
    {
      id: 'sona-masoori-rice',
      name: 'Babu Super Sona Masoori Rice (5kg)',
      icon: '🌾',
      category: 'Staples',
      spotRate: 320,
      wholesale: 290,
      unit: '5kg bag',
      trend: '-5.2%',
      trendUp: false,
      status: 'PRICE DROPPING',
      statusStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      advisory: 'Fresh milling arrivals from Krishna & Guntur basins. Favorable bulk purchase window.',
    },
    {
      id: 'red-chilli',
      name: 'Guntur Dried Red Chilli (1kg)',
      icon: '🌶️',
      category: 'Spices',
      spotRate: 140,
      wholesale: 125,
      unit: '1kg pack',
      trend: '+12.4%',
      trendUp: true,
      status: 'PRICE SURGING',
      statusStyle: 'bg-rose-100 text-rose-800 border-rose-300',
      advisory: 'Export demand spiking. Procure immediately before a further 10% rate hike.',
    },
    {
      id: 'basmati-rice',
      name: 'India Gate Royal Basmati Rice (5kg)',
      icon: '🌾',
      category: 'Staples',
      spotRate: 510,
      wholesale: 470,
      unit: '5kg bag',
      trend: '+0.5%',
      trendUp: true,
      status: 'STABLE RATE',
      statusStyle: 'bg-blue-100 text-blue-800 border-blue-300',
      advisory: 'Stable wholesale prices. Optimal steady procurement window.',
    },
    {
      id: 'cooking-oil',
      name: 'Fortune Sunlite Sunflower Oil (1L)',
      icon: '🌻',
      category: 'Fats & Oils',
      spotRate: 135,
      wholesale: 122,
      unit: '1L pouch',
      trend: '-4.2%',
      trendUp: false,
      status: 'PRICE DROPPING',
      statusStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      advisory: 'Import tariff relaxation driving price drop. Reorder standard quantity.',
    },
    {
      id: 'chana-dal',
      name: 'Tata Sampann Chana Dal (1kg)',
      icon: '🫘',
      category: 'Pulses',
      spotRate: 98,
      wholesale: 88,
      unit: '1kg pack',
      trend: '-3.5%',
      trendUp: false,
      status: 'STABLE RATE',
      statusStyle: 'bg-blue-100 text-blue-800 border-blue-300',
      advisory: 'Maintain 14-day stock buffer. Mandi pulse rates expected to remain flat.',
    },
    {
      id: 'sugar',
      name: 'Madhur Pure Crystal Sugar (5kg)',
      icon: '🍬',
      category: 'Staples',
      spotRate: 230,
      wholesale: 210,
      unit: '5kg bag',
      trend: '-2.8%',
      trendUp: false,
      status: 'PRICE DROPPING',
      statusStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      advisory: 'Sugar crushing season arrivals at coastal mills. Favorable buying window.',
    },
    {
      id: 'aashirvaad-atta',
      name: 'Aashirvaad Whole Wheat Atta (5kg)',
      icon: '🍞',
      category: 'Staples',
      spotRate: 275,
      wholesale: 245,
      unit: '5kg bag',
      trend: '+0.0%',
      trendUp: true,
      status: 'STABLE RATE',
      statusStyle: 'bg-blue-100 text-blue-800 border-blue-300',
      advisory: 'Steady government grain release maintaining balanced market rates.',
    },
    {
      id: 'moong-dal',
      name: 'Tata Sampann Yellow Moong Dal (1kg)',
      icon: '🥣',
      category: 'Pulses',
      spotRate: 135,
      wholesale: 120,
      unit: '1kg pack',
      trend: '-4.5%',
      trendUp: false,
      status: 'PRICE DROPPING',
      statusStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      advisory: 'Pulse mill processing in Andhra stabilizing spot rates ₹15 below peak.',
    },
    {
      id: 'toor-dal',
      name: 'Tata Sampann Unpolished Toor Dal (1kg)',
      icon: '🫘',
      category: 'Pulses',
      spotRate: 165,
      wholesale: 148,
      unit: '1kg pack',
      trend: '+4.2%',
      trendUp: true,
      status: 'MODERATE INCREASE',
      statusStyle: 'bg-amber-100 text-amber-900 border-amber-300',
      advisory: 'Regional festival buying causing slight rate appreciation in wholesale mandis.',
    },
    {
      id: 'tata-salt',
      name: 'Tata Salt Vacuum Evaporated (1kg)',
      icon: '🧂',
      category: 'Spices',
      spotRate: 24,
      wholesale: 22,
      unit: '1kg pack',
      trend: '+0.0%',
      trendUp: true,
      status: 'STABLE RATE',
      statusStyle: 'bg-blue-100 text-blue-800 border-blue-300',
      advisory: 'Fixed FMCG MRP baseline pricing across all regional retail mandis.',
    },
    {
      id: 'spices-mix',
      name: 'Guntur Garam Masala Mix (500g)',
      icon: '🥘',
      category: 'Spices',
      spotRate: 215,
      wholesale: 190,
      unit: '500g pack',
      trend: '+3.5%',
      trendUp: true,
      status: 'MODERATE INCREASE',
      statusStyle: 'bg-amber-100 text-amber-900 border-amber-300',
      advisory: 'Whole clove and cardamom import duties shifting regional spice blend costs.',
    },
  ];

  const categories = ['All', 'Staples', 'Pulses', 'Spices', 'Fats & Oils'];

  const filteredItems = priceTrendItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* Top Banner & KPI Summary Cards */}
      <div className="space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Wholesale Mandi Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Wholesale Mandi Rates & Margin Analytics
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 max-w-xl">
              Live tracking of spot retail prices vs Guntur & Vijayawada mandi wholesale rates for 12 core commodities.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 z-10">
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Mandi Feed: {storeLocation}</span>
            </span>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tracked Items</p>
              <span className="text-lg">📦</span>
            </div>
            <p className="text-2xl font-black text-slate-900">12 Commodities</p>
            <p className="text-[10px] text-blue-600 font-bold">100% Verified Mandi Rates</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Highest Surge</p>
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-600">+18.5%</p>
            <p className="text-[10px] text-slate-500 font-medium">Green Chilli (Hybrid)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Steepest Drop</p>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">-14.0%</p>
            <p className="text-[10px] text-emerald-700 font-bold">Nashik Red Onion (Buy Opportunity)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Store Margin</p>
              <span className="text-lg">💰</span>
            </div>
            <p className="text-2xl font-black text-emerald-800">24.2% Margin</p>
            <p className="text-[10px] text-emerald-600 font-bold">Avg ₹18.5 / unit spread</p>
          </div>
        </div>
      </div>

      {/* Visual Chart Comparing Spot vs Mandi Rate */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Retail Spot Rate vs Wholesale Mandi Price Spread (₹)</span>
            </h3>
            <p className="text-xs text-slate-500">Visual price margin comparison across 12 Guntur & Vijayawada commodities</p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1.5 bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Retail Spot Rate</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Wholesale Mandi Rate</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicPriceData} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="item" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Price']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="spot" name="Retail Spot Rate (₹)" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="wholesale" name="Wholesale Mandi Rate (₹)" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Controls: Search, Category Filters, & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">

        {/* Left: Search Box */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search commodity (e.g. Tomato, Chilli, Oil)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Center: Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cards View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Items Section: Grid View OR Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredItems.map((item) => {
            const margin = Math.round(((item.spotRate - item.wholesale) / item.spotRate) * 100);
            const spreadAmount = item.spotRate - item.wholesale;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl p-2 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${item.statusStyle}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Price Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Retail Spot Rate</p>
                      <p className="text-lg font-black text-slate-900">₹{item.spotRate} <span className="text-xs font-semibold text-slate-500">/ {item.unit}</span></p>
                    </div>

                    <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-2xl space-y-0.5">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Wholesale Mandi</p>
                      <p className="text-lg font-black text-emerald-900">₹{item.wholesale} <span className="text-xs font-semibold text-emerald-700">/ {item.unit}</span></p>
                    </div>
                  </div>

                  {/* Margin & Trend Pill Bar */}
                  <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl text-xs">
                    <div className="flex items-center space-x-1 text-blue-900 font-extrabold">
                      <span>Margin:</span>
                      <span className="text-emerald-700 font-black">₹{spreadAmount} ({margin}%)</span>
                    </div>

                    <span className={`font-black flex items-center space-x-0.5 text-xs ${item.trendUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item.trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{item.trend} (7d)</span>
                    </span>
                  </div>

                  {/* Mandi Advisory Box */}
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-start space-x-2 text-xs text-slate-700">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed font-medium">
                      {item.advisory}
                    </p>
                  </div>
                </div>

                {/* Procurement Action Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const matchedProduct = PRODUCTS.find((p) => p.id === item.id) || PRODUCTS[0];
                      onOpenProcurement?.(matchedProduct, 50);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Procure at Wholesale Mandi Rate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Mandi Table View */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Commodity Name</th>
                  <th className="p-3.5 text-center">Category</th>
                  <th className="p-3.5 text-right">Wholesale Rate</th>
                  <th className="p-3.5 text-right">Retail Rate</th>
                  <th className="p-3.5 text-right">Spread / Margin</th>
                  <th className="p-3.5 text-center">7-Day Trend</th>
                  <th className="p-3.5">Mandi Advisory</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {filteredItems.map((item) => {
                  const spread = item.spotRate - item.wholesale;
                  const marginPct = Math.round((spread / item.spotRate) * 100);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{item.icon}</span>
                          <span className="font-bold text-slate-900">{item.name}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-black text-emerald-800">
                        ₹{item.wholesale} / {item.unit}
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-900">
                        ₹{item.spotRate} / {item.unit}
                      </td>

                      <td className="p-3.5 text-right font-black text-blue-700">
                        ₹{spread} ({marginPct}%)
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1 text-xs font-black ${item.trendUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{item.trend}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-xs text-slate-600 max-w-xs font-normal">
                        {item.advisory}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const matchedProduct = PRODUCTS.find((p) => p.id === item.id) || PRODUCTS[0];
                            onOpenProcurement?.(matchedProduct, 50);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          Procure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
