import React, { useState } from 'react';
import {
  TrendingUp,
  Factory,
  BarChart3,
  Layers,
  Sparkles,
  Leaf,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  PieChart as PieIcon,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Sidebar } from '../components/Sidebar';
import { MANUFACTURER_DATA, getDynamicManufacturerData } from '../data/manufacturerData';
import { useToast } from '../components/Toast';

export const ManufacturerDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedPlant, setSelectedPlant] = useState(MANUFACTURER_DATA.selectedPlant);
  const [timeframe, setTimeframe] = useState(MANUFACTURER_DATA.timeframe);

  const dynamicData = getDynamicManufacturerData(timeframe, selectedPlant);

  const handlePlantChange = (plant: string) => {
    setSelectedPlant(plant);
    showToast('Filter Updated', `Dashboard recalculating graphs for ${plant} (${timeframe}).`, 'info');
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    showToast('Timeframe Updated', `Updated all graphs, bar charts & pie charts for ${tf}.`, 'info');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Production Planning':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Production Planning & Master Schedule</h3>
                <p className="text-xs text-slate-500">
                  Showing dynamic production targets for <strong className="text-purple-700">{selectedPlant}</strong> ({timeframe}).
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => showToast('MRP Optimizer Triggered', 'Recalculating batch schedules based on latest Guntur mandi arrivals...', 'info')}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Auto-MRP</span>
                </button>
                <button
                  onClick={() => showToast('Production Run Dispatched', 'Shift schedule updated: Processing line 2 shifted to Red Chilli Paste.', 'success')}
                  className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-purple-700 cursor-pointer flex items-center space-x-1"
                >
                  <Factory className="w-3.5 h-3.5" />
                  <span>Schedule New Run</span>
                </button>
              </div>
            </div>

            {/* Demand vs Output Bar Chart */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-900">Target Demand vs Current Output ({timeframe})</h4>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {selectedPlant}
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicData.demandVsProductionChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="demand" name="Market Demand Target" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="production" name="Current Plant Output" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Master Schedules Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Live Production Line Runs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MANUFACTURER_DATA.masterSchedules.map((run) => (
                  <div key={run.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-purple-700">{run.id} • {run.shift}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        run.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        run.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{run.line}</p>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Supervisor: {run.supervisor}</span>
                      <span>{run.current} / {run.target} Units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Market Forecast':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Macro Market Forecast & Category Pie Breakdown</h3>
                <p className="text-xs text-slate-500">Filtered view for <strong>{selectedPlant}</strong> ({timeframe}).</p>
              </div>
            </div>

            {/* Product-wise Forecast & Pie Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Category Projections ({timeframe})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dynamicData.productWiseForecast.map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.predictedDemand} • {item.stockCoverage}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {item.growth}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Pie Chart */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                    <PieIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>SKU Share Pie Chart</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{timeframe}</span>
                </div>
                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicData.pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dynamicData.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {dynamicData.pieChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-1 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-semibold text-slate-700">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Raw Material Insights':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Raw Harvest Procurement & Mandi Stock</h3>
                <p className="text-xs text-slate-500">Mandi sourcing rates, stock safety levels, and vendor lead times for {selectedPlant}.</p>
              </div>
              <button
                onClick={() => showToast('Mandi Order Initiated', 'Request sent to Guntur Agro Co-op for 150 MT Grade-A Red Chilli.', 'success')}
                className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 cursor-pointer"
              >
                Reorder Harvest Stock
              </button>
            </div>

            {/* Mandi Procurement Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Crop / Material</span>
                <span>Primary Mandi</span>
                <span>Stock / Req.</span>
                <span>Rate/kg</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {MANUFACTURER_DATA.rawMaterialProcurement.map((rm, idx) => (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80">
                    <div>
                      <p className="font-bold text-slate-900">{rm.crop}</p>
                      <p className="text-[10px] text-slate-500">Vendor: {rm.vendor}</p>
                    </div>
                    <span className="text-slate-600 font-medium">{rm.mandi}</span>
                    <div className="text-slate-800">
                      <span className="font-bold">{rm.stockOnHand}</span> / <span className="text-slate-500">{rm.requirement}</span>
                    </div>
                    <span className="font-black text-purple-700">{rm.pricePerKg}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] w-fit border ${
                      rm.status === 'Sufficient' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      rm.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {rm.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Capacity Utilization':
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-base font-bold text-slate-900">Plant Capacity Utilization & Machine OEE</h3>
              <p className="text-xs text-slate-500">Filtered capacity metrics for <strong>{selectedPlant}</strong> ({timeframe}).</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Overall Plant Operating Capacity ({selectedPlant})</span>
                <span className="font-black text-purple-700 text-lg">{dynamicData.kpis.capacityUtilization}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: dynamicData.kpis.capacityUtilization }}></div>
              </div>
              <p className="text-xs text-slate-500">Operating at optimal output with safety buffer for seasonal demand spikes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MANUFACTURER_DATA.machineOEEData.map((m, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{m.lineName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.status === 'Optimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-purple-700">{m.oee}%</span>
                      <p className="text-[10px] text-slate-500">Overall OEE</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span>Availability ({m.availability}%)</span>
                      <span>Performance ({m.performance}%)</span>
                      <span>Quality ({m.quality}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-purple-600 h-full" style={{ width: `${m.availability}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Product Performance':
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-base font-bold text-slate-900">Product Line Performance & Gross Margin Velocity</h3>
              <p className="text-xs text-slate-500">Gross margin velocity and yield efficiency across processed lines.</p>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Spices Mix Line', margin: '34% Gross Margin', trend: '+20% Growth', yield: '98.2% Yield Rate', revenue: '₹42 Lakhs' },
                { name: 'Processed Sauce Line', margin: '28% Gross Margin', trend: '+18% Growth', yield: '96.5% Yield Rate', revenue: '₹38 Lakhs' },
                { name: 'Red Chilli Powder Line', margin: '38% Gross Margin', trend: '+28% Growth', yield: '99.1% Yield Rate', revenue: '₹65 Lakhs' },
                { name: 'Tomato Ketchup Base Line', margin: '31% Gross Margin', trend: '+15% Growth', yield: '97.8% Yield Rate', revenue: '₹50 Lakhs' },
              ].map((p, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-slate-500">Monthly Revenue: {p.revenue} • {p.yield}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-800">{p.margin}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {p.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Distribution Insights':
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-base font-bold text-slate-900">Distribution Insights & Regional Freight Velocity</h3>
              <p className="text-xs text-slate-500">Regional logistics hubs, freight dispatch times, and transit velocity.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MANUFACTURER_DATA.distributionHubs.map((hub, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{hub.hubName}</h4>
                      <p className="text-[11px] text-slate-500">{hub.region}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {hub.deliveryRate} On-Time
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-700 pt-1">
                    <span>Active Dispatches: <strong className="text-purple-700">{hub.activeShipments} Trucks</strong></span>
                    <span>Avg Transit: <strong>{hub.transitTime}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Sustainability':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sustainability & Zero-Waste Agricultural Impact</h3>
                <p className="text-xs text-slate-500">ESG agricultural spoilage prevention, renewable energy, and eco-packaging initiatives.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => showToast('ESG Audit Exported', 'Downloaded Annual Agriculture Spoilage Mitigation & CO2 Audit PDF.', 'success')}
                  className="px-3.5 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-800 cursor-pointer flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export ESG Report</span>
                </button>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-800">
                <Leaf className="w-5 h-5" />
                <h4 className="font-bold text-sm">30% Waste Reduction Achieved</h4>
              </div>
              <p className="text-slate-800 leading-relaxed">
                Optimal MRP production scheduling prevents 140 metric tons of raw agricultural harvest spoilage annually, reducing carbon footprint while boosting profit margins by +18%.
              </p>
            </div>

            {/* ESG Metrics 4 Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-2xs">
                <p className="text-xl font-black text-emerald-700">{MANUFACTURER_DATA.esgMetrics.spoilagePreventedTons} Tons</p>
                <p className="text-[11px] font-bold text-slate-600">Spoilage Prevented</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-2xs">
                <p className="text-xl font-black text-emerald-700">{MANUFACTURER_DATA.esgMetrics.co2ReducedTons} Tons</p>
                <p className="text-[11px] font-bold text-slate-600">CO2 Reduced</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-2xs">
                <p className="text-xl font-black text-purple-700">{MANUFACTURER_DATA.esgMetrics.renewableEnergyPercent}%</p>
                <p className="text-[11px] font-bold text-slate-600">Solar Power</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-2xs">
                <p className="text-xl font-black text-blue-700">{MANUFACTURER_DATA.esgMetrics.waterRecycledLiters}</p>
                <p className="text-[11px] font-bold text-slate-600">Water Recycled</p>
              </div>
            </div>

            {/* Active Sustainability Initiatives Items */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Active ESG & Green Manufacturing Initiatives</h4>
                  <p className="text-[11px] text-slate-500">Track live sustainability items across Guntur and Vijayawada plants.</p>
                </div>
                <button
                  onClick={() => showToast('New Initiative Logged', 'Initiated Green Energy & Waste Recycling Audit line.', 'info')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  + Log Green Initiative
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MANUFACTURER_DATA.sustainabilityInitiatives.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 transition-colors flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">{item.title}</p>
                        <p className="text-[11px] font-medium text-emerald-800">{item.impact}</p>
                        <p className="text-[10px] text-slate-500">{item.category}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Reports':
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-base font-bold text-slate-900">Audit Reports & Downloads</h3>
              <p className="text-xs text-slate-500">Official demand reconciliation PDFs and operations audit logs.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-2xs">
              {MANUFACTURER_DATA.auditReports.map((rep) => (
                <div key={rep.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rep.title}</p>
                      <p className="text-[11px] text-slate-500">{rep.category} • {rep.date} • {rep.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('Report Downloaded', `Exported ${rep.title} PDF.`, 'info')}
                    className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-purple-900 transition-colors cursor-pointer flex items-center space-x-1 w-fit"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900">Plant Configuration & Settings</h3>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs text-xs space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span>Active Enterprise Plant:</span>
                <span className="font-bold text-slate-900">{selectedPlant}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span>Predictive MRP Optimizer Engine:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Mandi Price Sync Frequency:</span>
                <span className="font-bold text-purple-700">Real-Time (Hourly API)</span>
              </div>
            </div>
          </div>
        );

      // Default Overview
      default:
        return (
          <div className="space-y-5 animate-fade-in">
            {/* 4 KPI Cards Grid - Dynamic recalculation */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Total Market Demand</p>
                    <p className="text-lg font-black text-slate-900">{dynamicData.kpis.totalMarketDemand}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">↑ {dynamicData.kpis.totalMarketDemandChange}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Current Production</p>
                    <p className="text-lg font-black text-slate-900">{dynamicData.kpis.currentProduction}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">↑ {dynamicData.kpis.currentProductionChange}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Recommended Production</p>
                    <p className="text-lg font-black text-emerald-700">{dynamicData.kpis.recommendedProduction}</p>
                    <p className="text-[10px] text-slate-500">Optimal Run</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Capacity Utilization</p>
                    <p className="text-lg font-black text-purple-700">{dynamicData.kpis.capacityUtilization}</p>
                    <p className="text-[10px] text-purple-600 font-bold">High Efficiency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Middle Row: Demand vs Production LineChart & Product Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Line Chart */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Demand vs Production ({timeframe})</h3>
                    <p className="text-[11px] text-slate-500">Live trend graph for {selectedPlant}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Filtered View
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicData.demandVsProductionChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="demand" name="Demand" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="production" name="Production" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart Card */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <PieIcon className="w-4 h-4 text-purple-600" />
                    <span>SKU Share Pie Chart</span>
                  </h3>
                  <button onClick={() => setActiveTab('Market Forecast')} className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer">
                    View Matrix
                  </button>
                </div>

                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicData.pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dynamicData.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-1 border-t border-slate-100">
                  {dynamicData.pieChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-1 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="font-semibold text-slate-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: AI Recommendation & Sustainability Insight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800">AI Recommendation</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {MANUFACTURER_DATA.aiRecommendation.message}
                  </p>
                  <button
                    onClick={() => setActiveTab('Production Planning')}
                    className="px-3 py-1.5 bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{MANUFACTURER_DATA.aiRecommendation.cta}</span>
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Sustainability Insight</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {MANUFACTURER_DATA.sustainabilityInsight.message}
                  </p>
                  <button
                    onClick={() => setActiveTab('Sustainability')}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{MANUFACTURER_DATA.sustainabilityInsight.cta}</span>
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
        {/* Role Top Strip Banner */}
        <div className="bg-purple-700 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="font-black text-sm uppercase tracking-wide">Manufacturer</span>
            <span className="text-purple-200 text-xs">— Plan Production. Grow Bigger.</span>
          </div>
          <div className="text-xs font-semibold bg-purple-800/80 border border-purple-500/50 px-3 py-1 rounded-xl">
            Enterprise MRP Optimizer Active
          </div>
        </div>

        {/* Dashboard Frame Container */}
        <div className="bg-white border border-slate-200/90 rounded-[22px] shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[720px]">
          {/* Role Sidebar */}
          <Sidebar
            role="manufacturer"
            activeItem={activeTab}
            onSelectKey={setActiveTab}
          />

          {/* Main Dashboard Area */}
          <main className="flex-1 p-4 sm:p-6 bg-slate-50/50 space-y-5 overflow-y-auto">
            {/* Header with Greeting & Dropdown Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    Welcome, Manufacturer!
                  </h1>
                  {activeTab !== 'Dashboard' && (
                    <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      {activeTab}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Convert market intelligence into higher production and profits.
                </p>
              </div>

              {/* Dynamic Plant & Timeframe Filters */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-800">
                  <Factory className="w-3.5 h-3.5 text-purple-600" />
                  <select
                    value={selectedPlant}
                    onChange={(e) => handlePlantChange(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="All Plants">All Plants</option>
                    <option value="Guntur Agro Plant">Guntur Agro Plant</option>
                    <option value="Vijayawada Processing Unit">Vijayawada Processing Unit</option>
                    <option value="Hyderabad Spices Hub">Hyderabad Spices Hub</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={timeframe}
                    onChange={(e) => handleTimeframeChange(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="Last 6 Months">Last 6 Months</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Current Year">Current Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Content Area */}
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};



