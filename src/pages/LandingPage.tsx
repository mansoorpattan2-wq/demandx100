import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Sparkles,
  Globe,
  Leaf,
  Store,
  Truck,
  Factory,
} from 'lucide-react';
import { useToast } from '../components/Toast';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 space-y-16 bg-mesh-pattern">

      {/* =================================================== */}
      {/* HERO SECTION                                         */}
      {/* =================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-20 bg-gradient-to-b from-emerald-50/80 via-slate-50 to-slate-50 border-b border-slate-200/80">

        {/* Glowing Background Mesh Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">

              {/* Top Tag Pill */}
              <div className="inline-flex items-center space-x-2 bg-emerald-100/90 border border-emerald-300/90 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-800 shadow-xs glow-emerald">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Next-Gen AI Supply Chain Intelligence</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                AI-Powered <br />
                <span className="gradient-text-emerald">
                  Market Demand Intelligence
                </span> <br />
                for Everyone in the Supply Chain
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                From data to decisions — predict demand, reduce waste, plan smarter, and build a synchronized, hyper-efficient market grid across South India.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-7 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all flex items-center space-x-2.5 cursor-pointer active:translate-y-0"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => showToast('DemandX Demo Video', 'Playing 2-minute DemandX platform walk-through preview.', 'info')}
                  className="px-6 py-4 bg-white hover:bg-slate-100/80 text-slate-800 border border-slate-300/80 font-bold text-sm rounded-2xl shadow-xs hover:border-slate-400/80 transition-all flex items-center space-x-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700 ml-0.5" />
                  </div>
                  <span>Watch 2-Min Demo</span>
                </button>
              </div>

              {/* 4 Value Prop Pill Items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80">
                {[
                  { icon: '📈', label: 'Accurate ML Forecasts' },
                  { icon: '♻', label: 'Reduced Wastage' },
                  { icon: '💡', label: 'Smart Decision Layer' },
                  { icon: '🔗', label: 'Connected Grid' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2.5 bg-white/90 border border-slate-200/90 p-3 rounded-2xl shadow-xs hover:border-emerald-300 transition-colors">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Right: Visual Graphic Banner */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 space-y-3">

              {/* Handwritten callout */}
              <div className="flex items-center justify-start px-2 pb-1">
                <span className="font-handwriting text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-emerald-700 tracking-wide select-none drop-shadow-xs whitespace-nowrap">
                  From Data to Decisions ✨
                </span>
              </div>

              {/* Card Banner Container */}
              <div className="relative rounded-3xl overflow-hidden border border-emerald-300/80 shadow-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 space-y-6 glow-emerald">

                {/* Background decorative circles */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>

                {/* Header of graphic */}
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Indian Agriculture & Supply Grid</h4>
                      <p className="text-[11px] text-emerald-300 font-mono">AP • TS • KA • MH • TN</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full animate-pulse">
                    Live Feed
                  </span>
                </div>

                {/* Grid of Supply Chain Nodes */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-1 hover:bg-white/15 transition-colors">
                    <span className="text-2xl">🌾</span>
                    <h5 className="font-bold text-white">Farmers & Produce</h5>
                    <p className="text-[10px] text-emerald-300">Guntur & Vijayawada Hubs</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-1 hover:bg-white/15 transition-colors">
                    <span className="text-2xl">🚚</span>
                    <h5 className="font-bold text-white">Logistics Fleet</h5>
                    <p className="text-[10px] text-emerald-300">2,400 Active Routes</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-1 hover:bg-white/15 transition-colors">
                    <span className="text-2xl">🏬</span>
                    <h5 className="font-bold text-white">Retail Stores</h5>
                    <p className="text-[10px] text-emerald-300">12,500+ Connected Marts</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-1 hover:bg-white/15 transition-colors">
                    <span className="text-2xl">🏭</span>
                    <h5 className="font-bold text-white">Processing Plants</h5>
                    <p className="text-[10px] text-emerald-300">78% Plant Capacity</p>
                  </div>
                </div>

                {/* Floating highlight badges matching Image 1 */}
                <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] font-bold">
                  <div className="bg-emerald-500 text-slate-950 py-2 rounded-xl shadow-md font-extrabold">
                    Higher Profits
                  </div>
                  <div className="bg-teal-400 text-slate-950 py-2 rounded-xl shadow-md font-extrabold">
                    Reduced Waste
                  </div>
                  <div className="bg-amber-400 text-slate-950 py-2 rounded-xl shadow-md font-extrabold">
                    Smarter Planning
                  </div>
                </div>

                {/* Green Leaf Banner at bottom */}
                <div className="bg-emerald-950/90 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center space-x-3 text-emerald-200">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Leaf className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">A Smarter Market for a Better Tomorrow</p>
                    <p className="text-[10px] opacity-80">Reduce food wastage by up to 30% across South India</p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =================================================== */}
      {/* ROLE SELECTION INTERACTIVE CARDS                    */}
      {/* =================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
            Tailored Role Experiences
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">Choose Your Role in the Grid</h2>
          <p className="text-slate-600 text-sm">
            Experience role-scoped real-time intelligence tailored specifically for your operational layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              role: 'retailer',
              title: 'Retailer',
              subtitle: 'Store & Demand Hub',
              icon: Store,
              color: 'blue',
              border: 'hover:border-blue-500',
              bg: 'bg-blue-50/70',
              badge: 'bg-blue-100 text-blue-800',
              desc: 'Monitor inventory, view ML forecast demand, and trigger smart procurement.',
              path: '/login?role=retailer',
            },
            {
              role: 'supplier',
              title: 'Supplier',
              subtitle: 'Regional Distributor',
              icon: Truck,
              color: 'amber',
              border: 'hover:border-amber-500',
              bg: 'bg-amber-50/70',
              badge: 'bg-amber-100 text-amber-800',
              desc: 'Fulfill retailer procurement requests real-time and boost revenue.',
              path: '/login?role=supplier',
            },
            {
              role: 'manufacturer',
              title: 'Manufacturer',
              subtitle: 'Production & Processing',
              icon: Factory,
              color: 'purple',
              border: 'hover:border-purple-500',
              bg: 'bg-purple-50/70',
              badge: 'bg-purple-100 text-purple-800',
              desc: 'Manage raw material streams, track capacity, and plan batch schedules.',
              path: '/login?role=manufacturer',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.role}
                onClick={() => navigate(card.path)}
                className={`demandx-card p-6 cursor-pointer flex flex-col justify-between space-y-4 border border-slate-200 transition-all hover:scale-[1.02] ${card.border}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${card.color}-600`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${card.badge}`}>
                      {card.subtitle}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================== */}
      {/* LANDING PAGE STORY PIPELINE (DATA -> PROFIT)        */}
      {/* =================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl space-y-6 border border-emerald-400/30 glow-emerald">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30">The DemandX Advantage</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">How DemandX Connects the Supply Chain</h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Transforming raw market signals into optimized decision intelligence for all 4 roles.
            </p>
          </div>

          {/* 7-Step Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-center text-xs font-bold pt-4">
            {[
              { step: '1', title: 'DATA', icon: '📊' },
              { step: '2', title: 'AI ANALYSIS', icon: '🧠' },
              { step: '3', title: 'DEMAND FORECAST', icon: '📈' },
              { step: '4', title: 'ACTION', icon: '⚡' },
              { step: '5', title: 'LESS WASTE', icon: '♻' },
              { step: '6', title: 'MORE PROFIT', icon: '💰' },
              { step: '7', title: 'CONNECTED GRID', icon: '🌐' },
            ].map((p, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl flex flex-col items-center justify-between hover:bg-white/20 transition-all hover:scale-105">
                <span className="text-2xl mb-1">{p.icon}</span>
                <span className="text-[10px] text-emerald-400 font-mono">Step {p.step}</span>
                <span className="text-[11px] text-white mt-1 leading-tight font-extrabold">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

