import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import type { Product } from '../data/products';
import { useToast } from '../components/Toast';

export const InventoryManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'Critical':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Critical</span>;
      case 'Low Stock':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Low Stock</span>;
      case 'Healthy':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Healthy</span>;
      case 'Overstock':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Overstock</span>;
    }
  };

  const getActionBtn = (p: Product) => {
    switch (p.status) {
      case 'Critical':
      case 'Low Stock':
        return (
          <button
            onClick={() => showToast('Order Triggered', `Replenishment order for ${p.recommendedStock - p.currentStock} ${p.unit} of ${p.name} dispatched to supplier.`, 'success')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Stock Up
          </button>
        );
      case 'Healthy':
        return (
          <button
            onClick={() => showToast('Stock Verified', `${p.name} level verified at target ${p.currentStock} ${p.unit}.`, 'info')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            Maintain
          </button>
        );
      case 'Overstock':
        return (
          <button
            onClick={() => showToast('Reallocation Dispatched', `Surplus ${p.name} redistributed to neighboring Vijayawada retail outlet.`, 'warning')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-300 transition-all cursor-pointer"
          >
            Discount / Shift
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Inventory Optimization</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Prevent stockouts and minimize spoilage waste with automated stock recommendation targets.
            </p>
          </div>

          <button
            onClick={() => showToast('Manual Stock Entry', 'Opening bulk inventory CSV import tool.', 'info')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Item</span>
          </button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Items Tracked</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{PRODUCTS.length} Commodities</p>
            <p className="text-xs text-slate-500 mt-0.5">South India Catalog</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</p>
            <p className="text-2xl font-black text-rose-600 mt-1">2 Commodities</p>
            <p className="text-xs font-bold text-rose-600 mt-0.5">Action Required</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Healthy Stock</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">5 Commodities</p>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">Optimal Buffer</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Spoilage Saved</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">₹3.4 Lakh</p>
            <p className="text-xs text-slate-500 mt-0.5">This Season</p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Filter Status:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              {['All', 'Low Stock', 'Critical', 'Healthy', 'Overstock'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                    statusFilter === st ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Inventory Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Product</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Current Stock</th>
                  <th className="p-3.5 text-right">Predicted Demand</th>
                  <th className="p-3.5 text-right">Recommended Target</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="text-xl">{p.icon}</span>
                      <span>{p.name}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">{p.category}</td>
                    <td className="p-3.5 text-right font-bold text-slate-800">{p.currentStock} {p.unit}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{p.predictedDemand} {p.unit}</td>
                    <td className="p-3.5 text-right font-bold">
                      <span className="bg-purple-50 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200 font-black">
                        {p.recommendedStock.toLocaleString('en-IN')} {p.unit}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">{getStatusBadge(p.status)}</td>
                    <td className="p-3.5 text-center pr-5">{getActionBtn(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
