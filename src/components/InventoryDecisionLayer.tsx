import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, RefreshCw, ShoppingCart } from 'lucide-react';
import { PRODUCTS, type Product } from '../data/products';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import {
  type ProductInventoryDecision,
  computeProductDecision,
  computeProductDecisionSync,
} from '../services/inventoryDecisionService';

interface InventoryDecisionLayerProps {
  onOpenProcurement?: (product?: Product, suggestedQty?: number) => void;
}

export const InventoryDecisionLayer: React.FC<InventoryDecisionLayerProps> = ({ onOpenProcurement }) => {
  const { getRetailerInventory } = useSupplyChain();
  const [decisions, setDecisions] = useState<Record<string, ProductInventoryDecision>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute decisions on mount and when inventory updates
  useEffect(() => {
    let isMounted = true;

    async function loadDecisions() {
      setIsLoading(true);
      const results: Record<string, ProductInventoryDecision> = {};

      // First populate with instant sync calculations
      for (const p of PRODUCTS) {
        const liveStock = getRetailerInventory(p.id, p.currentStock);
        results[p.id] = computeProductDecisionSync(p, liveStock);
      }
      if (isMounted) {
        setDecisions({ ...results });
      }

      // Then fetch async ML predictions from /api/predict-demand
      try {
        const asyncPromises = PRODUCTS.map(async (p) => {
          const liveStock = getRetailerInventory(p.id, p.currentStock);
          const decision = await computeProductDecision(p, liveStock, 'GUNTUR_STORE_01');
          return { id: p.id, decision };
        });

        const asyncResults = await Promise.all(asyncPromises);
        if (isMounted) {
          const updated = { ...results };
          for (const item of asyncResults) {
            updated[item.id] = item.decision;
          }
          setDecisions(updated);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Async ML inventory decision load completed with warnings:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadDecisions();

    return () => {
      isMounted = false;
    };
  }, [getRetailerInventory]);

  const categories = ['All', 'Staples & Grains', 'Spices & Condiments', 'Fats & Oils', 'Packaged & Dairy'];

  const filteredProducts = PRODUCTS.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const getRiskBadge = (risk: string) => {
    if (risk === 'HIGH') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>HIGH</span>
        </span>
      );
    }
    if (risk === 'MEDIUM') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
          MEDIUM
        </span>
      );
    }
    if (risk === 'LOW') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          LOW
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        NONE
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">


      {/* Featured Example Card matching prompt requirements */}
      {decisions['sona-masoori-rice'] && (
        <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">🌾</span>
              <div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                  Featured Product Case Study
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {decisions['sona-masoori-rice'].productName}
                </h3>
              </div>
            </div>
            {getRiskBadge(decisions['sona-masoori-rice'].stockoutRisk)}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <p className="text-[11px] text-slate-500 font-semibold">Current Stock</p>
              <p className="text-lg font-black text-slate-900">
                {decisions['sona-masoori-rice'].currentStock.toLocaleString('en-IN')} {decisions['sona-masoori-rice'].unit}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Live Store Stock</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <p className="text-[11px] text-blue-700 font-semibold flex items-center space-x-1">
                <span>Predicted Demand</span>
                <span className="text-[9px] bg-blue-100 px-1 rounded">ML API</span>
              </p>
              <p className="text-lg font-black text-blue-900">
                {decisions['sona-masoori-rice'].forecastDemand.toLocaleString('en-IN')} {decisions['sona-masoori-rice'].unit}
              </p>
              <p className="text-[10px] text-blue-600 font-medium">XGBoost Forecast</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <p className="text-[11px] text-slate-500 font-semibold">Stockout Risk</p>
              <p className="text-lg font-black text-rose-700">
                {decisions['sona-masoori-rice'].stockoutRisk}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Reorder Level: {decisions['sona-masoori-rice'].reorderLevel} {decisions['sona-masoori-rice'].unit}</p>
            </div>

            <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-xs space-y-1">
              <p className="text-[11px] text-emerald-100 font-bold uppercase tracking-wider">DemandX Recommendation</p>
              <p className="text-lg font-black text-white">
                {decisions['sona-masoori-rice'].recommendedOrder.toLocaleString('en-IN')} {decisions['sona-masoori-rice'].unit}
              </p>
              <button
                onClick={() => onOpenProcurement?.(PRODUCTS.find(p => p.id === 'sona-masoori-rice'), decisions['sona-masoori-rice'].recommendedOrder)}
                className="w-full mt-1 py-1 bg-white text-emerald-800 text-[11px] font-black rounded-lg hover:bg-emerald-50 cursor-pointer shadow-2xs flex items-center justify-center space-x-1"
              >
                <span>Order Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-600 bg-amber-100/60 p-2 rounded-lg border border-amber-200">
            💡 <span className="font-bold">Formula Transparency:</span> {decisions['sona-masoori-rice'].formulaExplanation}
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {isLoading && (
          <span className="text-xs text-blue-600 font-bold flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing ML API Predictions...</span>
          </span>
        )}
      </div>

      {/* Complete Product Decision Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            All Products — DemandX Decision Matrix
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">
            {filteredProducts.length} items analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-100">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Recent Demand</th>
                <th className="p-3 text-right">Forecast Demand (ML)</th>
                <th className="p-3 text-right">Reorder Level</th>
                <th className="p-3 text-center">Stockout Risk</th>
                <th className="p-3 text-center">Overstock Risk</th>
                <th className="p-3 text-right">Recommended Order</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const dec = decisions[p.id] || computeProductDecisionSync(p, getRetailerInventory(p.id, p.currentStock));
                return (
                  <tr key={p.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <span>{p.icon}</span>
                        <div>
                          <p>{p.name}</p>
                          <span className="text-[10px] text-slate-400 font-normal">{p.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-right font-bold text-slate-900">
                      <span className={dec.currentStock <= dec.reorderLevel ? 'text-rose-600 font-black' : 'text-slate-900'}>
                        {dec.currentStock.toLocaleString('en-IN')} {p.unit}
                      </span>
                    </td>

                    <td className="p-3 text-right text-slate-600 font-semibold">
                      {dec.recentDemand.toLocaleString('en-IN')} {p.unit}
                    </td>

                    <td className="p-3 text-right font-bold text-blue-700">
                      <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {dec.forecastDemand.toLocaleString('en-IN')} {p.unit}
                      </span>
                    </td>

                    <td className="p-3 text-right font-semibold text-slate-700">
                      {dec.reorderLevel.toLocaleString('en-IN')} {p.unit}
                    </td>

                    <td className="p-3 text-center">
                      {getRiskBadge(dec.stockoutRisk)}
                    </td>

                    <td className="p-3 text-center">
                      {getRiskBadge(dec.overstockRisk)}
                    </td>

                    <td className="p-3 text-right font-black">
                      {dec.recommendedOrder > 0 ? (
                        <span className="bg-purple-50 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200 font-black">
                          {dec.recommendedOrder.toLocaleString('en-IN')} {p.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0 {p.unit}</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenProcurement?.(p, dec.recommendedOrder > 0 ? dec.recommendedOrder : p.recommendedStock)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1.5 ${
                          dec.recommendedOrder > 0
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs shadow-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
