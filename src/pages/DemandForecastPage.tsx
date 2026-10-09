import React, { useState } from 'react';
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
import { PRODUCTS } from '../data/products';
import {
  FORECAST_DATA_7D,
  FORECAST_DATA_30D,
  FORECAST_DATA_3M,
  FORECAST_DATA_6M,
} from '../data/forecastData';
import { DemandPredictionForm } from '../components/DemandPredictionForm';

export const DemandForecastPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [selectedLocation, setSelectedLocation] = useState('Vijayawada & AP Zone');
  const [forecastPeriod, setForecastPeriod] = useState<'7D' | '30D' | '3M' | '6M'>('30D');

  const getForecastDataset = () => {
    switch (forecastPeriod) {
      case '7D': return FORECAST_DATA_7D;
      case '30D': return FORECAST_DATA_30D;
      case '3M': return FORECAST_DATA_3M;
      case '6M': return FORECAST_DATA_6M;
      default: return FORECAST_DATA_30D;
    }
  };

  const chartData = getForecastDataset();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">Advanced Demand Forecast</h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                Predictive Model v4.8
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Simulate future market demand with AI confidence boundaries and peak velocity indicators.
            </p>
          </div>

          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Product Selector */}
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-800">
              <select
                value={selectedProduct.id}
                onChange={(e) => {
                  const found = PRODUCTS.find((p) => p.id === e.target.value);
                  if (found) setSelectedProduct(found);
                }}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selector */}
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-800">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="Vijayawada & AP Zone">Vijayawada & AP Zone</option>
                <option value="Guntur Spice Belt">Guntur Spice Belt</option>
                <option value="Telangana Metro">Telangana Metro</option>
                <option value="Karnataka South">Karnataka South</option>
              </select>
            </div>

            {/* Period Pills */}
            <div className="flex bg-slate-200 p-0.5 rounded-xl font-bold">
              {(['7D', '30D', '3M', '6M'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setForecastPeriod(period)}
                  className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                    forecastPeriod === period
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {period === '7D' ? '7 Days' : period === '30D' ? '30 Days' : period === '3M' ? '3 Months' : '6 Months'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Expected Demand</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{selectedProduct.predictedDemand} units</p>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">High Market Velocity</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Demand Growth</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">+{selectedProduct.demandChange}%</p>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">Surging Trend</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Peak Demand Date</p>
            <p className="text-2xl font-black text-slate-900 mt-1">Oct 18, 2026</p>
            <p className="text-xs text-slate-500 mt-0.5">Festival Harvest Cycle</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Forecast Confidence</p>
            <p className="text-2xl font-black text-blue-700 mt-1">96.4%</p>
            <p className="text-xs font-bold text-blue-600 mt-0.5">High Machine Accuracy</p>
          </div>
        </div>

        {/* Live AI Demand Prediction Form connected to FastAPI Backend */}
        <DemandPredictionForm />

        {/* Recharts Area Chart with Confidence Band */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>{selectedProduct.icon}</span>
              <span>Predictive Demand Trajectory & Confidence Range ({forecastPeriod})</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Confidence Band (Lower/Upper Bounds)
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="predicted" name="Predicted Demand" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="upperBound" name="Upper Bound" fill="#A7F3D0" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lowerBound" name="Lower Bound" fill="#6EE7B7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
