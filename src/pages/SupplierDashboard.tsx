import React, { useState } from 'react';
import {
  TrendingUp,
  FileText,
  Package,
  Sparkles,
  Truck,
  DollarSign,
  Globe,
  Plus,
  Loader2,
  Inbox,
  BarChart3,
  Boxes,
  LineChart as LineChartIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Sidebar } from '../components/Sidebar';
import { SUPPLIER_DATA } from '../data/supplierData';
import { useToast } from '../components/Toast';
import { useSupplyChain } from '../contexts/SupplyChainContext';

const regionalDemandPieData = [
  { name: 'Vijayawada', value: 28, color: '#EF4444', demand: '14,200 kg (High)' },
  { name: 'Guntur', value: 24, color: '#F97316', demand: '12,100 kg (High)' },
  { name: 'Hyderabad', value: 18, color: '#F59E0B', demand: '9,400 kg (Medium)' },
  { name: 'Bangalore', value: 15, color: '#3B82F6', demand: '7,800 kg (High)' },
  { name: 'Visakhapatnam', value: 8, color: '#10B981', demand: '4,100 kg (Low)' },
  { name: 'Tirupati', value: 7, color: '#8B5CF6', demand: '3,500 kg (Medium)' },
];

export const SupplierDashboard: React.FC = () => {
  const { showToast } = useToast();
  const {
    getSupplierBuyerRequests,
    acceptSupplierOrder,
    cancelSupplierOrder,
    dispatchSupplierOrder,
    deliverSupplierOrder,
  } = useSupplyChain();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [supplierRegion, setSupplierRegion] = useState(SUPPLIER_DATA.region);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState<string>('Stock allocation depleted at supplier depot.');

  const realTimePOList = getSupplierBuyerRequests('GUNTUR_SUPPLIER_HUB');

  // Dynamic Supplier KPIs computed from live Firestore procurement orders
  const pendingCount = realTimePOList.filter((po) => po.status === 'Pending').length;
  const fulfilledOrders = realTimePOList.filter((po) => po.status === 'Dispatched' || po.status === 'Delivered');
  const totalDispatchedRevenue = fulfilledOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  const activeBuyerRequests = 24 + pendingCount;
  const totalOrders = 68 + realTimePOList.length;
  const estimatedRevenueFormatted = `₹${((580000 + totalDispatchedRevenue) / 100000).toFixed(1)} Lakh`;

  const catalogCategories = ['All', 'Staples', 'Pulses', 'Spices', 'Fats & Oils', 'Dairy'];

  const filteredCatalog = SUPPLIER_DATA.supplierInventoryCatalog.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Market Demand':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Regional Commodity Market Demand Pie Chart</h3>
              <span className="text-xs font-semibold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                AP & South India Demand Breakdown
              </span>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Regional Demand Share by City</h4>
                  <p className="text-xs text-slate-500">Live demand share distribution based on B2B retail procurement signals</p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full self-start sm:self-auto">
                  6 Active Markets
                </span>
              </div>

              <div className="h-80 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionalDemandPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {regionalDemandPieData.map((entry, index) => (
                        <Cell key={`cell-mkt-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `${value}% Share (${item.payload.demand})`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                {regionalDemandPieData.map((item) => (
                  <div key={item.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    </div>
                    <p className="text-base font-black text-slate-900">{item.value}%</p>
                    <p className="text-[10px] font-semibold text-slate-500">{item.demand.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Buyer Requests':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>B2B Retailer Procurement Requests & RFQs</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time procurement orders placed by Vijayawada, Guntur & AP store owners.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                {realTimePOList.length + SUPPLIER_DATA.topBuyerRequests.length} Active RFQs
              </span>
            </div>

            {/* Real-Time Firestore Orders Stream */}
            {realTimePOList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-2xs">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">No pending retailer orders currently.</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  When regional retailers trigger stock replenishment, incoming procurement orders will appear here real time.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">⚡ Real-Time Retailer Procurement Orders (Firestore Sync)</h4>
                <div className="space-y-2.5">
                  {realTimePOList.map((po) => {
                    const orderKey = po.id || '';
                    const isProcessing = !!processingIds[orderKey];
                    return (
                      <div key={orderKey} className="bg-white border border-amber-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-amber-900 text-xs">{orderKey}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              po.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : po.status === 'Accepted'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : po.status === 'Dispatched'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : po.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}>
                              {po.status}
                            </span>
                            {po.createdAt && (
                              <span className="text-[10px] text-slate-400">Placed: {String(po.createdAt)}</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-900 mt-1">{po.retailerName}</p>
                          <p className="text-[11px] text-slate-600">
                            {po.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-xs font-black text-emerald-800">₹{po.totalAmount.toLocaleString('en-IN')}</p>
                            {po.status === 'Cancelled' && po.cancellationReason && (
                              <span className="text-[10px] text-rose-600 italic">Reason: {po.cancellationReason}</span>
                            )}
                          </div>
                        </div>

                        {/* Supplier Interactive Actions */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {po.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={async () => {
                                  if (!orderKey || isProcessing) return;
                                  setProcessingIds((prev) => ({ ...prev, [orderKey]: true }));
                                  try {
                                    await acceptSupplierOrder(orderKey);
                                    showToast('Order Accepted', `Order ${orderKey} accepted for ${po.retailerName}. Ready for dispatch.`, 'success');
                                  } catch (err: any) {
                                    showToast('Acceptance Failed', err?.message || 'Unable to accept order.', 'warning');
                                  } finally {
                                    setProcessingIds((prev) => ({ ...prev, [orderKey]: false }));
                                  }
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Accept Order</span>}
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => setCancelModalOrder({ id: orderKey, retailerName: po.retailerName })}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {po.status === 'Accepted' && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={async () => {
                                  if (!orderKey || isProcessing) return;
                                  setProcessingIds((prev) => ({ ...prev, [orderKey]: true }));
                                  try {
                                    await dispatchSupplierOrder(orderKey);
                                    showToast('Stock Dispatched', `Order ${orderKey} marked Dispatched. Carrier assigned.`, 'success');
                                  } catch (err: any) {
                                    showToast('Dispatch Failed', err?.message || 'Unable to dispatch order.', 'warning');
                                  } finally {
                                    setProcessingIds((prev) => ({ ...prev, [orderKey]: false }));
                                  }
                                }}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Dispatch Stock</span>}
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => setCancelModalOrder({ id: orderKey, retailerName: po.retailerName })}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {po.status === 'Dispatched' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={async () => {
                                if (!orderKey || isProcessing) return;
                                setProcessingIds((prev) => ({ ...prev, [orderKey]: true }));
                                try {
                                  await deliverSupplierOrder(orderKey);
                                  showToast('Delivery Recorded', `Order ${orderKey} delivered. Retailer stock replenished.`, 'success');
                                } catch (err: any) {
                                  showToast('Delivery Update Failed', err?.message || 'Unable to mark delivered.', 'warning');
                                } finally {
                                  setProcessingIds((prev) => ({ ...prev, [orderKey]: false }));
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Mark Delivered</span>}
                            </button>
                          )}

                          {po.status === 'Delivered' && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0">
                              ✓ Delivered
                            </span>
                          )}

                          {po.status === 'Cancelled' && (
                            <span className="text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-300 shrink-0">
                              ✕ Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extended RFQs List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Open Regional Buyer Inquiries (RFQs)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUPPLIER_DATA.topBuyerRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-2xs hover:border-amber-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl">{req.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{req.product}</h4>
                            <p className="text-[10px] text-slate-500">{req.buyer}</p>
                          </div>
                        </div>
                        {req.urgent && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300">
                            URGENT
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium">Quantity Requested</p>
                          <p className="font-black text-amber-900">{req.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium">Target Budget</p>
                          <p className="font-black text-emerald-700">{req.budget}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        📍 {req.location} • <span className="text-rose-600 font-bold">⏳ {req.timeRemaining}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => showToast('Quote Submitted', `Quotation submitted for ${req.quantity} of ${req.product} to ${req.buyer}.`, 'success')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>Submit B2B Quotation</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Supply Opportunities':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <span>High-Profit Supply Opportunities & Surge Alerts</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Commodities experiencing high buyer liquidity and favorable wholesale price premiums.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                6 Market Surges Identified
              </span>
            </div>

            {/* Opportunity Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Guntur Red Chilli Surge',
                  icon: '🌶️',
                  surge: '+26% Demand Hike',
                  spotRate: '₹140 / kg',
                  wholesalePrice: '₹125 / kg',
                  buyerMatch: '14 Active Exporters',
                  recommendation: 'High export demand. List inventory immediately to secure maximum clearing rate.',
                },
                {
                  title: 'Sona Masoori Rice Regional Demand Surge',
                  icon: '🌾',
                  surge: '+28% Festive Peak',
                  spotRate: '₹320 / bag',
                  wholesalePrice: '₹290 / bag',
                  buyerMatch: '28 Retail Stores',
                  recommendation: 'Vijayawada and Guntur kiranas seeking 4,000 bags volume over next 48 hours.',
                },
                {
                  title: 'Royal Basmati Rice Bulk Contract',
                  icon: '🌾',
                  surge: '+18% Steady Growth',
                  spotRate: '₹420 / bag',
                  wholesalePrice: '₹380 / bag',
                  buyerMatch: '8 Supermarket Chains',
                  recommendation: 'Long-term 30-day supply contract matching for Rajahmundry hub.',
                },
                {
                  title: 'Sunflower Oil Commercial Contract',
                  icon: '🌻',
                  surge: '+15% Volume Surge',
                  spotRate: '₹145 / L',
                  wholesalePrice: '₹132 / L',
                  buyerMatch: '12 Hotel Chains',
                  recommendation: 'Bulk 1,000L tin packaging required for Tenali mill.',
                },
                {
                  title: 'Desi Organic Garlic Shortage Alert',
                  icon: '🧄',
                  surge: '+40% Export Surge',
                  spotRate: '₹180 / kg',
                  wholesalePrice: '₹158 / kg',
                  buyerMatch: '6 Food Processors',
                  recommendation: 'Heavy export demand driving price premium. Premium quality clearing fast.',
                },
                {
                  title: 'Yellow Moong Dal Supply Alert',
                  icon: '🥣',
                  surge: '+22% Consumption Spike',
                  spotRate: '₹135 / kg',
                  wholesalePrice: '₹120 / kg',
                  buyerMatch: '18 Kirana Stores',
                  recommendation: 'Regional pulse market rates firming up due to festival preparation.',
                },
                {
                  title: 'Chana Dal Spot Requisition',
                  icon: '🫘',
                  surge: '+18% Retail Demand',
                  spotRate: '₹95 / kg',
                  wholesalePrice: '₹84 / kg',
                  buyerMatch: '19 Retailers',
                  recommendation: 'Supply bottleneck in Kurnool yard. Favorable clearing rates.',
                },
              ].map((op, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{op.icon}</span>
                        <h4 className="text-xs font-bold text-slate-900">{op.title}</h4>
                      </div>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        {op.surge}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Clearing Rate</p>
                        <p className="font-black text-slate-900">{op.wholesalePrice}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Buyer Interest</p>
                        <p className="font-bold text-amber-900">{op.buyerMatch}</p>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
                      💡 <span className="font-bold">Strategy:</span> {op.recommendation}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('Manage Products');
                      showToast('Catalog Opened', `Select ${op.title} to update available batch stock.`, 'info');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <span>Post Available Batch</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Price Analysis':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <LineChartIcon className="w-5 h-5 text-amber-600" />
                  <span>South India Wholesale Mandi Price Analysis (12 Commodities)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Compare supplier wholesale rates vs retail spot prices across Guntur and AP agricultural yards.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                Live Mandi Feed • 12 Items
              </span>
            </div>

            {/* Bar Graph Comparing Supplier Rate vs Mandi Spot Rate */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                    <span>Wholesale Mandi Rate vs Retail Spot Price Spread (₹)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Commodity price comparison across AP agricultural hubs</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { item: 'Sona Masoori Rice', wholesale: 290, spot: 320 },
                    { item: 'Red Chilli', wholesale: 125, spot: 140 },
                    { item: 'Basmati Rice', wholesale: 470, spot: 510 },
                    { item: 'Sunflower Oil', wholesale: 122, spot: 135 },
                    { item: 'Chana Dal', wholesale: 88, spot: 98 },
                    { item: 'Turmeric', wholesale: 142, spot: 160 },
                    { item: 'Wheat Atta', wholesale: 245, spot: 275 },
                    { item: 'Madhur Sugar', wholesale: 210, spot: 230 },
                    { item: 'Moong Dal', wholesale: 120, spot: 135 },
                    { item: 'Toor Dal', wholesale: 148, spot: 165 },
                    { item: 'Tata Salt', wholesale: 22, spot: 24 },
                    { item: 'Garlic', wholesale: 158, spot: 180 },
                  ]} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="item" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="wholesale" name="Supplier Wholesale Rate (₹)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spot" name="Retail Spot Rate (₹)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Price Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {SUPPLIER_DATA.supplierInventoryCatalog.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.location}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-amber-900">₹{item.wholesalePrice} / {item.unit}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Manage Products':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  <span>Supplier Inventory & Commodity Stock Catalog (12 Items)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage stock availability, wholesale rates, quality grades, and MOQ thresholds.</p>
              </div>
              <button
                onClick={() => showToast('Stock Batch Listed', 'New agricultural commodity batch listed in public DemandX catalog.', 'success')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                <span>List New Stock Batch</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {catalogCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-100">
                    <tr>
                      <th className="p-3">Commodity Item</th>
                      <th className="p-3">Grade & Category</th>
                      <th className="p-3">Stock Available</th>
                      <th className="p-3">MOQ</th>
                      <th className="p-3 text-right">Wholesale Rate</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCatalog.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2.5 font-bold text-slate-900">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <p>{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-normal">{item.location}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-slate-700 block">{item.grade}</span>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </td>

                        <td className="p-3 font-bold text-slate-900">{item.stockAvailable}</td>
                        <td className="p-3 font-semibold text-slate-600">{item.moq}</td>

                        <td className="p-3 text-right font-black text-amber-900">
                          ₹{item.wholesalePrice} / {item.unit}
                        </td>

                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            item.status === 'High Demand'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => showToast('Stock Updated', `Updated stock and rate for ${item.name}.`, 'info')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-all border border-slate-200 cursor-pointer"
                          >
                            Edit Rate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'Orders':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <span>B2B Fulfilled & In-Transit Orders ({SUPPLIER_DATA.activeB2BOrders.length + realTimePOList.length} Orders)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Live tracking of active shipments dispatched from Guntur Supplier Hub.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                100% On-Time Fulfillment
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-100">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Retailer Name</th>
                      <th className="p-3">Commodity & Quantity</th>
                      <th className="p-3 text-right">Order Value</th>
                      <th className="p-3">Logistics Carrier</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SUPPLIER_DATA.activeB2BOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-900">{ord.id}</td>
                        <td className="p-3 font-bold text-slate-900">{ord.retailerName}</td>
                        <td className="p-3 text-slate-700 font-semibold">{ord.product}</td>
                        <td className="p-3 text-right font-black text-emerald-800">
                          ₹{ord.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] font-medium">{ord.carrier}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center space-x-1 ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            <span>{ord.status === 'Delivered' ? '✓' : '🚚'}</span>
                            <span>{ord.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'Logistics Support':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>Trucking Fleet & Cold Chain Matching Hub</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">2,400 active transport vehicles available across the Vijayawada – Guntur agricultural corridor.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                2,400 Trucks Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: 'Refrigerated Cold Chain Truck (10-Ton)',
                  carrier: 'AP Reefer Express Logistics',
                  capacity: '10,000 kg Cold Stock',
                  rate: '₹45 / km',
                  availability: 'Ready in Guntur Hub',
                  suitable: 'Packaged Dairy, Butter, Edible Oils & Shelf-Stable Goods',
                },
                {
                  type: 'Multi-Axle Heavy Lorry (25-Ton)',
                  carrier: 'Godavari Transport Corporation',
                  capacity: '25,000 kg Bulk Cargo',
                  rate: '₹62 / km',
                  availability: 'Ready in Rajahmundry Yard',
                  suitable: 'Basmati Rice, Wheat Atta, Grain Bags',
                },
                {
                  type: 'Medium Covered Lorry (6-Ton)',
                  carrier: 'Vijayawada Freight Lines',
                  capacity: '6,000 kg General Cargo',
                  rate: '₹32 / km',
                  availability: 'Ready in Vijayawada Mandi',
                  suitable: 'Red Chilli, Turmeric, Potato, Spices',
                },
                {
                  type: 'Express Pickup Van (2-Ton)',
                  carrier: 'FastCity Direct Pickup',
                  capacity: '2,000 kg Light Load',
                  rate: '₹22 / km',
                  availability: 'Ready in Tenali Mill',
                  suitable: 'Sunflower Oil Tins, Urgent Retail Deliveries',
                },
              ].map((truck, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        {truck.availability}
                      </span>
                      <span className="text-xs font-black text-emerald-700">{truck.rate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{truck.type}</h4>
                    <p className="text-xs text-slate-500 font-medium">{truck.carrier}</p>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <p className="text-[11px] text-slate-500 font-medium">Capacity: <strong className="text-slate-900">{truck.capacity}</strong></p>
                      <p className="text-[11px] text-slate-500 font-medium">Suitable for: <strong className="text-slate-900">{truck.suitable}</strong></p>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Transport Reserved', `Reserved ${truck.type} for Guntur load dispatch.`, 'success')}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Book Vehicle Transport</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Analytics':
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <span>Supplier Financial Revenue Performance & Tonnage Analytics</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Annual dispatch sales trajectory, order fulfillment efficiency, and top retail accounts.</p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                100% Fulfillment Rate
              </span>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Estimated Monthly Revenue</p>
                <p className="text-2xl font-black text-slate-900">{estimatedRevenueFormatted}</p>
                <p className="text-[10px] text-emerald-600 font-bold">↑ +20.0% vs Prev Month</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Monthly Tonnage Shipped</p>
                <p className="text-2xl font-black text-amber-900">125 Metric Tons</p>
                <p className="text-[10px] text-slate-500 font-medium">Across AP & South India</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Order Completion Rate</p>
                <p className="text-2xl font-black text-emerald-700">99.2%</p>
                <p className="text-[10px] text-emerald-600 font-bold">✓ High Reliability Index</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Active B2B Retailer Accounts</p>
                <p className="text-2xl font-black text-blue-900">42 Retailers</p>
                <p className="text-[10px] text-blue-600 font-bold">Guntur, Vijayawada, Hyd</p>
              </div>
            </div>

            {/* 12-Month Revenue AreaChart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>12-Month Supplier Revenue Trajectory (Jan – Dec)</span>
                </h4>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  +20.0% Growth Rate
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { month: 'Jan', revenue: 320000, profit: 64000 },
                    { month: 'Feb', revenue: 350000, profit: 70000 },
                    { month: 'Mar', revenue: 380000, profit: 76000 },
                    { month: 'Apr', revenue: 410000, profit: 82000 },
                    { month: 'May', revenue: 440000, profit: 88000 },
                    { month: 'Jun', revenue: 480000, profit: 96000 },
                    { month: 'Jul', revenue: 510000, profit: 102000 },
                    { month: 'Aug', revenue: 540000, profit: 108000 },
                    { month: 'Sep (Now)', revenue: 580000, profit: 116000 },
                    { month: 'Oct (FC)', revenue: 620000, profit: 124000 },
                    { month: 'Nov (FC)', revenue: 670000, profit: 134000 },
                    { month: 'Dec (FC)', revenue: 720000, profit: 144000 },
                  ]}>
                    <defs>
                      <linearGradient id="colorSupplierRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSupplierProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" name="Total Dispatch Revenue (₹)" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSupplierRev)" />
                    <Area type="monotone" dataKey="profit" name="Gross Margin (₹)" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSupplierProf)" />
                  </AreaChart>
                </ResponsiveContainer>
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
                  <SettingsIcon className="w-5 h-5 text-amber-600" />
                  <span>Supplier Hub Profile & B2B Matcher Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage supplier hub profile, primary supply corridor, and auto RFQ notification triggers.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Supplier Hub & License Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hub Name</label>
                    <input
                      type="text"
                      defaultValue={SUPPLIER_DATA.hubName}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hub ID / Scope</label>
                    <input
                      type="text"
                      readOnly
                      value="GUNTUR_SUPPLIER_HUB"
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">AP Mandi License Number</label>
                    <input
                      type="text"
                      defaultValue="AP-MANDI-GNT-9402"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Supply Corridor</label>
                    <select
                      value={supplierRegion}
                      onChange={(e) => setSupplierRegion(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Andhra Pradesh">Andhra Pradesh (Guntur – Vijayawada)</option>
                      <option value="Telangana">Telangana (Hyderabad Hub)</option>
                      <option value="Karnataka">Karnataka (Bangalore Yard)</option>
                      <option value="South India Zone">South India Zone</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-900">Firestore Real-Time Sync:</span>
                  <span className="text-slate-600">Connected (GUNTUR_SUPPLIER_HUB)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">Latency: 18ms</span>
              </div>

              <button
                onClick={() => showToast('Hub Settings Saved', 'Supplier hub profile and supply corridor configuration saved successfully!', 'success')}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Save Hub Profile
              </button>
            </div>
          </div>
        );

      // Default Overview matching IMAGE 2 bottom-left
      default:
        return (
          <div className="space-y-5 animate-fade-in">
            {/* 4 KPI Cards Grid matching Image 2 bottom-left */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Active Buyer Requests</p>
                    <p className="text-lg font-black text-slate-900">{activeBuyerRequests}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">↑ Live RFQ Sync</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">High Demand Products</p>
                    <p className="text-lg font-black text-slate-900">{SUPPLIER_DATA.kpis.highDemandProducts}</p>
                    <p className="text-[10px] text-slate-500">Fast Liquidity</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Total B2B Orders</p>
                    <p className="text-lg font-black text-slate-900">{totalOrders}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">✓ Real-Time Updated</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">Estimated Revenue</p>
                    <p className="text-lg font-black text-emerald-700">{estimatedRevenueFormatted}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">↑ Dispatched Sales</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Main Middle Row: Regional Demand Map & Top Buyer Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Regional Demand Pie Chart */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Regional Demand Pie Chart</h3>
                    <p className="text-[11px] text-slate-500">Procurement share across AP & TS hubs</p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Live Regional Share
                  </span>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionalDemandPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {regionalDemandPieData.map((entry, index) => (
                          <Cell key={`cell-ov-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any, item: any) => [
                          `${value}% Share (${item.payload.demand})`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#FFF',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Buyer Requests */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Top Buyer Requests</h3>
                    <button onClick={() => setActiveTab('Buyer Requests')} className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer">
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {SUPPLIER_DATA.topBuyerRequests.slice(0, 3).map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-amber-50/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{req.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{req.product}</p>
                            <p className="text-[11px] font-semibold text-amber-800">{req.quantity} • {req.budget}</p>
                            <p className="text-[10px] text-slate-500">{req.location} • <span className="text-rose-600 font-bold">{req.timeRemaining}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={() => showToast('Bid Submitted', `Inquiry sent for ${req.quantity} of ${req.product} to ${req.location}.`, 'success')}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Market Insights & Post Your Supply */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Market Insights */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Market Insights</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {SUPPLIER_DATA.marketInsights.message}
                  </p>
                  <button
                    onClick={() => setActiveTab('Market Demand')}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{SUPPLIER_DATA.marketInsights.cta}</span>
                  </button>
                </div>
              </div>

              {/* Post Your Supply */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Post Your Supply</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {SUPPLIER_DATA.postSupply.message}
                  </p>
                  <button
                    onClick={() => setActiveTab('Manage Products')}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{SUPPLIER_DATA.postSupply.cta}</span>
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
        
        {/* Role Top Strip Banner matching Image 2 bottom-left */}
        <div className="bg-amber-600 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="font-black text-sm uppercase tracking-wide">Supplier</span>
            <span className="text-amber-100 text-xs">— Find Demand. Supply Smarter.</span>
          </div>
          <div className="text-xs font-semibold bg-amber-700/80 border border-amber-400/50 px-3 py-1 rounded-xl">
            B2B Matching Engine Active
          </div>
        </div>

        {/* Dashboard Frame Container (Stays visible at all times) */}
        <div className="bg-white border border-slate-200/90 rounded-[22px] shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[720px]">
          
          {/* Role Sidebar */}
          <Sidebar role="supplier" activeItem={activeTab} onSelectKey={setActiveTab} />

          {/* Main Dashboard Area */}
          <main className="flex-1 p-4 sm:p-6 bg-slate-50/50 space-y-5 overflow-y-auto">
            
            {/* Header with Greeting & Region */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    Welcome, Supplier!
                  </h1>
                  {activeTab !== 'Dashboard' && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      {activeTab}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Find real demand, connect with buyers and grow your business.
                </p>
              </div>

              {/* Region Selector Pill */}
              <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Globe className="w-4 h-4 text-amber-600" />
                <select
                  value={supplierRegion}
                  onChange={(e) => setSupplierRegion(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="South India Zone">South India Zone</option>
                </select>
              </div>
            </div>

            {/* Dynamic Content Area */}
            {renderContent()}

          </main>

        </div>

      </div>

      {/* Supplier Order Cancellation Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Cancel Supplier Order?</h3>
                <p className="text-xs text-slate-500">Order ID: {cancelModalOrder.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel order <strong className="text-slate-900">{cancelModalOrder.id}</strong> for <strong className="text-slate-900">{cancelModalOrder.retailerName}</strong>?
              This is a permanent terminal state change. The retailer will be notified immediately.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">Cancellation Reason (Visible to Retailer)</label>
              <input
                type="text"
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = cancelModalOrder.id;
                  setCancelModalOrder(null);
                  setProcessingIds((prev) => ({ ...prev, [targetId]: true }));
                  try {
                    await cancelSupplierOrder(targetId, cancelReasonText);
                    showToast('Order Cancelled', `Order ${targetId} has been cancelled.`, 'info');
                  } catch (err: any) {
                    showToast('Cancellation Failed', err?.message || 'Unable to cancel order.', 'warning');
                  } finally {
                    setProcessingIds((prev) => ({ ...prev, [targetId]: false }));
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
