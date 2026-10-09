import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';

export const MarketInsightsPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('All Insights');

  const insightsList = [
    {
      id: '1',
      category: 'Regional Demand',
      title: 'Sona Masoori Rice demand rising in South India',
      region: 'Andhra Pradesh & Telangana',
      impact: '+26% Demand Growth',
      badge: 'High Impact',
      icon: '🌾',
      description: 'Increased kirana restocking and wholesale mill movements are driving Sona Masoori rice procurement volumes across Vijayawada, Guntur, and Hyderabad markets.',
      time: 'Updated 2 hours ago'
    },
    {
      id: '2',
      category: 'Seasonal Trends',
      title: 'Red Chilli demand expected to increase during upcoming festival season',
      region: 'Guntur Spice Hub & Pan-India',
      impact: '+28% Export Spike',
      badge: 'Surge Warning',
      icon: '🌶️',
      description: 'Spice processing manufacturers are accumulating Guntur chilli inventory ahead of Q4 festive food processing runs.',
      time: 'Updated 4 hours ago'
    },
    {
      id: '3',
      category: 'Market Trends',
      title: 'Urban consumption of packaged sauces & ready mixes increasing',
      region: 'Tier-1 & Tier-2 AP Cities',
      impact: '+18% Retail Velocity',
      badge: 'Consumer Shift',
      icon: '🥫',
      description: 'Convenience food adoption in Vijayawada & Visakhapatnam urban centers is creating steady wholesale demand for processed condiments.',
      time: 'Updated 1 day ago'
    },
    {
      id: '4',
      category: 'Price Trends',
      title: 'Cold storage potato supply stabilizing wholesale rates',
      region: 'UP to South Corridor',
      impact: '-10% Price Moderation',
      badge: 'Stable Supply',
      icon: '🥔',
      description: 'Substantial cold storage releases from Uttar Pradesh have balanced potato availability in South Indian distribution hubs.',
      time: 'Updated 1 day ago'
    }
  ];

  const filteredInsights = selectedCategory === 'All Insights'
    ? insightsList
    : insightsList.filter((i) => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">India Market Intelligence Feed</h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                Live Data Signals
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Deep regional analytics, seasonal demand shifts, and wholesale price trend signals across South India.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            {['All Insights', 'Regional Demand', 'Seasonal Trends', 'Market Trends', 'Price Trends'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-md space-y-2">
            <span className="text-2xl">⚡</span>
            <h4 className="font-black text-base">South India Demand Surge</h4>
            <p className="text-xs text-emerald-200">AP & Telangana showing +26% growth across key vegetables.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-2">
            <span className="text-2xl">🌶️</span>
            <h4 className="font-bold text-slate-900 text-base">Guntur Spice Corridor</h4>
            <p className="text-xs text-slate-500">Chilli exports projected to touch ₹420 Cr this quarter.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-2">
            <span className="text-2xl">🏬</span>
            <h4 className="font-bold text-slate-900 text-base">Retail Velocity Shift</h4>
            <p className="text-xs text-slate-500">Urban supermarkets ordering 18% more processed sauces.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-2">
            <span className="text-2xl">♻</span>
            <h4 className="font-bold text-slate-900 text-base">Zero-Waste Target</h4>
            <p className="text-xs text-emerald-700 font-bold">30% Spoilage Reduction Achieved</p>
          </div>
        </div>

        {/* Feed Cards */}
        <div className="space-y-4">
          {filteredInsights.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                <span className="text-4xl p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                  {item.icon}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">• {item.region}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{item.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.time}</p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 space-y-2">
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-full">
                  {item.impact}
                </span>
                <button
                  onClick={() => showToast('Insight Bookmarked', `Full analytical report for "${item.title}" saved to your dashboard.`, 'info')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>Explore Signal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
