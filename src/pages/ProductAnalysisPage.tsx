import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { PRODUCTS } from '../data/products';
import type { Product } from '../data/products';
import { useToast } from '../components/Toast';
import { fetchDemandPrediction } from '../services/api';
import type { DemandPredictionResult } from '../services/api';
import { DemandPredictionForm } from '../components/DemandPredictionForm';

export const ProductAnalysisPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [activeTab, setActiveTab] = useState<'demand' | 'price' | 'inventory' | 'waste' | 'insights'>('demand');
  const [selectedLocation, setSelectedLocation] = useState('All South India');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Next 30 Days');
  const [livePrediction, setLivePrediction] = useState<DemandPredictionResult | null>(null);

  useEffect(() => {
    async function loadLivePrediction() {
      const res = await fetchDemandPrediction({
        Product_Name: selectedProduct.name,
        Category: selectedProduct.category,
        Brand: selectedProduct.category === 'Cooking Oil' ? 'Adani Wilmar' : 'ITC',
        State: selectedLocation.includes('AP') ? 'Andhra Pradesh' : selectedLocation.includes('TS') ? 'Telangana' : 'Karnataka',
        City: selectedLocation === 'All South India' ? 'Bengaluru' : selectedLocation.split(',')[0],
        Region: 'South',
        City_Tier: 'Metro',
        Season: 'Monsoon',
        Selling_Price_INR: selectedProduct.currentPrice,
        MRP_INR: selectedProduct.avgPrice || selectedProduct.currentPrice * 1.1,
        Opening_Stock: selectedProduct.currentStock || 100,
      });

      if (res) {
        setLivePrediction(res);
      }
    }
    loadLivePrediction();
  }, [selectedProduct, selectedLocation]);

  // Chart data generators based on product & live prediction
  const effectiveDemand = livePrediction?.predicted_demand || selectedProduct.predictedDemand;
  const effectiveStock = livePrediction?.recommended_stock || selectedProduct.recommendedStock;

  const demandChartData = [
    { period: 'Week 1', demand: Math.round(effectiveDemand * 0.7), stock: Math.round(effectiveStock * 0.7) },
    { period: 'Week 2', demand: Math.round(effectiveDemand * 0.85), stock: Math.round(effectiveStock * 0.85) },
    { period: 'Week 3', demand: effectiveDemand, stock: effectiveStock },
    { period: 'Week 4', demand: Math.round(effectiveDemand * 1.15), stock: Math.round(effectiveStock * 1.1) },
  ];

  const priceTrendData = [
    { month: 'Jan', price: selectedProduct.currentPrice * 0.8, avgPrice: selectedProduct.avgPrice * 0.85 },
    { month: 'Feb', price: selectedProduct.currentPrice * 0.9, avgPrice: selectedProduct.avgPrice * 0.9 },
    { month: 'Mar', price: selectedProduct.currentPrice, avgPrice: selectedProduct.avgPrice },
    { month: 'Apr', price: selectedProduct.currentPrice * 1.1, avgPrice: selectedProduct.avgPrice * 1.05 },
    { month: 'May', price: selectedProduct.currentPrice * 1.15, avgPrice: selectedProduct.avgPrice * 1.08 },
    { month: 'Jun', price: selectedProduct.currentPrice * 1.25, avgPrice: selectedProduct.avgPrice * 1.1 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Control Header */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <span className="text-3xl p-2 bg-emerald-50 rounded-2xl border border-emerald-200">
              {selectedProduct.icon}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const p = PRODUCTS.find((item) => item.id === e.target.value);
                    if (p) setSelectedProduct(p);
                  }}
                  className="text-xl font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500">{selectedProduct.description}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent focus:outline-none"
              >
                <option value="All South India">All South India</option>
                <option value="Vijayawada, AP">Vijayawada, AP</option>
                <option value="Guntur, AP">Guntur, AP</option>
                <option value="Hyderabad, TS">Hyderabad, TS</option>
                <option value="Bangalore, KA">Bangalore, KA</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-transparent focus:outline-none"
              >
                <option value="Next 30 Days">Next 30 Days</option>
                <option value="Next 7 Days">Next 7 Days</option>
                <option value="Next 3 Months">Next 3 Months</option>
              </select>
            </div>
          </div>

        </div>

        {/* 6 Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
            {livePrediction && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            <p className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
              Expected Demand
              {livePrediction && <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-bold">XGBoost</span>}
            </p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {livePrediction ? livePrediction.predicted_demand : selectedProduct.predictedDemand} {selectedProduct.unit}
            </p>
            <span className="text-[10px] font-bold text-emerald-600">
              {livePrediction ? `${livePrediction.demand_level} DEMAND LEVEL` : `↑ ${selectedProduct.demandChange}% growth`}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Recommended Stock</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">
              {livePrediction ? livePrediction.recommended_stock : selectedProduct.recommendedStock} {selectedProduct.unit}
            </p>
            <span className="text-[10px] text-slate-500">15% Safety Buffer</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Reorder Quantity</p>
            <p className="text-lg font-black text-blue-700 mt-0.5">
              {livePrediction ? livePrediction.recommended_reorder_quantity : 35} {selectedProduct.unit}
            </p>
            <span className="text-[10px] font-bold text-blue-600">Stock Purchase</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Current Price</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">₹{selectedProduct.currentPrice}/{selectedProduct.unit}</p>
            <span className="text-[10px] font-bold text-blue-600">Spot Rate</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Predicted Price</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">₹{Math.round(selectedProduct.currentPrice * 1.15)}/{selectedProduct.unit}</p>
            <span className="text-[10px] font-bold text-emerald-600">↑ 15% next month</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Estimated Waste</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{selectedProduct.estimatedWaste}</p>
            <span className="text-[10px] text-slate-500">Spoilage Risk</span>
          </div>
        </div>

        {/* Live AI Demand Prediction Form connected to FastAPI Backend */}
        <DemandPredictionForm />

        {/* Tab Navigation & Deep Visualizations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
          
          <div className="flex border-b border-slate-200 pb-3 space-x-2 overflow-x-auto">
            {[
              { id: 'demand', label: 'Demand Forecast' },
              { id: 'price', label: 'Price Trend' },
              { id: 'inventory', label: 'Inventory Planning' },
              { id: 'waste', label: 'Spoilage & Waste' },
              { id: 'insights', label: 'AI Insights' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          {activeTab === 'demand' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Weekly Predicted Demand vs Stock Targets</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="demand" name="Predicted Demand" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="stock" name="Recommended Stock Target" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'price' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Historical & Projected Wholesale Price Trajectory</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" />
                    <YAxis unit="₹" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" name="Actual / Projected Rate" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="avgPrice" name="3-Year Moving Average" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-emerald-900">Optimal Stock Level: {selectedProduct.recommendedStock} {selectedProduct.unit}</p>
                  <p className="text-emerald-700">Current Stock in warehouse: {selectedProduct.currentStock} {selectedProduct.unit}</p>
                </div>
                <button
                  onClick={() => showToast('Stock Order Created', `Purchase order placed for ${selectedProduct.recommendedStock - selectedProduct.currentStock} ${selectedProduct.unit} of ${selectedProduct.name}.`, 'success')}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Order Replenishment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'waste' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Spoilage Prevention Analysis</h4>
              <p className="text-slate-600">
                {selectedProduct.name} has an estimated waste factor of <span className="font-bold text-emerald-600">{selectedProduct.estimatedWaste}</span> under DemandX optimized stocking protocols compared to 12% industry baseline.
              </p>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
              <h4 className="font-bold flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>DemandX AI Recommendation</span>
              </h4>
              <p className="text-slate-800 leading-relaxed">
                Market demand for <span className="font-bold">{selectedProduct.name}</span> in South India is accelerating. Optimal stocking can reduce waste by 30% and increase gross margin by 18%.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
