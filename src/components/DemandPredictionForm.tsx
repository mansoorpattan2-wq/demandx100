import React, { useState, useMemo } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Loader2, ArrowRight, Search, ChevronDown, Check } from 'lucide-react';
import { fetchDemandPrediction } from '../services/api';
import type { DemandPredictionPayload, DemandPredictionResult } from '../services/api';
import { PRODUCT_MASTER } from '../data/productMaster';

// Extract unique categories and brands for dropdowns
const ALL_CATEGORIES = Array.from(new Set(PRODUCT_MASTER.map((p) => p.category))).sort();
const ALL_BRANDS = Array.from(new Set(PRODUCT_MASTER.map((p) => p.brand))).sort();

export const DemandPredictionForm: React.FC = () => {
  const [formData, setFormData] = useState<DemandPredictionPayload>({
    Product_Name: 'Fortune Sunflower Oil 1L',
    Category: 'Cooking Oil',
    Brand: 'Adani Wilmar',
    State: 'Karnataka',
    City: 'Bengaluru',
    Region: 'South',
    City_Tier: 'Metro',
    Season: 'Monsoon',
    Festival_Event: 'None',
    Weather: 'Rainy',
    Promotion: 'Yes',
    Day: 'Friday',
    Month: 7,
    Year: 2026,
    Week: 28,
    Weekend: 0,
    Holiday: 0,
    Temperature_C: 24.5,
    Rainfall_mm: 12.5,
    Humidity_pct: 85,
    Selling_Price_INR: 145.0,
    MRP_INR: 145.0,
    Discount_pct: 6,
    Competitor_Price_INR: 150.0,
    Opening_Stock: 50,
    Customer_Footfall: 850,
    Lead_Time_Days: 4,
    Prev_Day_Demand: 62.0,
    '7_Day_Avg_Demand': 58.4,
    '30_Day_Avg_Demand': 54.2,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<DemandPredictionResult | null>(null);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return PRODUCT_MASTER;
    const term = searchTerm.toLowerCase();
    return PRODUCT_MASTER.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleInputChange = (field: keyof DemandPredictionPayload, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Auto-populate related fields when a product is selected
  const handleProductSelect = (productName: string) => {
    const item = PRODUCT_MASTER.find((p) => p.name === productName);
    if (item) {
      setFormData((prev) => ({
        ...prev,
        Product_Name: item.name,
        Category: item.category,
        Brand: item.brand,
        MRP_INR: item.mrp,
        Selling_Price_INR: item.mrp,
      }));
    } else {
      handleInputChange('Product_Name', productName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setPredictionResult(null);

    try {
      const result = await fetchDemandPrediction(formData);
      setPredictionResult(result);
    } catch (err: any) {
      setErrorMessage('Unable to generate prediction. Please check that the DemandX AI backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="demandx-card p-5 sm:p-6 bg-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-black text-slate-900">Live Demand Predictor</h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>XGBoost ML v1.0</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select from all 50 products in the DemandX master catalogue to predict demand via trained ML API.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-xl border border-slate-200">
            📦 {PRODUCT_MASTER.length} Catalogue Products
          </span>
        </div>
      </div>

      {/* Form Controls */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Product Search & Dropdown Row */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <span>Product Selection & Search</span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Auto-populates Category, Brand & MRP
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Real-Time Search Bar */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="🔍 Type product name, brand or category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 font-semibold text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Search Dropdown Popup */}
              {isDropdownOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>Matching Products ({filteredProducts.length})</span>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Close ✕
                    </button>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">
                      No products found matching "{searchTerm}"
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleProductSelect(p.name);
                          setSearchTerm('');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors ${
                          formData.Product_Name === p.name ? 'bg-emerald-50 font-bold border-l-4 border-emerald-500' : ''
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {formData.Product_Name === p.name && (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Brand: <span className="font-medium text-slate-700">{p.brand}</span> • Category:{' '}
                            <span className="font-medium text-slate-700">{p.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-700">₹{p.mrp}</span>
                          <span className="block text-[9px] text-slate-400">MRP</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Complete 50-Product Direct Select Dropdown */}
            <div>
              <select
                value={formData.Product_Name}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
              >
                {PRODUCT_MASTER.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.category} - {p.brand} | ₹{p.mrp})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Form Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Category (Auto-populated) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Category</label>
            <select
              value={formData.Category}
              onChange={(e) => handleInputChange('Category', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Brand (Auto-populated) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Brand</label>
            <select
              value={formData.Brand}
              onChange={(e) => handleInputChange('Brand', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {ALL_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* MRP (INR) (Auto-populated) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">MRP (₹)</label>
            <input
              type="number"
              value={formData.MRP_INR}
              onChange={(e) => handleInputChange('MRP_INR', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Selling Price (₹) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Selling Price (₹)</label>
            <input
              type="number"
              value={formData.Selling_Price_INR}
              onChange={(e) => handleInputChange('Selling_Price_INR', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* City & State */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">City / State</label>
            <select
              value={`${formData.City}, ${formData.State}`}
              onChange={(e) => {
                const [city, state] = e.target.value.split(', ');
                handleInputChange('City', city);
                handleInputChange('State', state);
                if (['Bengaluru', 'Hyderabad', 'Chennai'].includes(city)) {
                  handleInputChange('Region', 'South');
                  handleInputChange('City_Tier', 'Metro');
                } else if (['Patna', 'Guntur', 'Vijayawada'].includes(city)) {
                  handleInputChange('City_Tier', city === 'Patna' ? 'Metro' : 'Tier-2');
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
              <option value="Hyderabad, Telangana">Hyderabad, Telangana</option>
              <option value="Vijayawada, Andhra Pradesh">Vijayawada, Andhra Pradesh</option>
              <option value="Guntur, Andhra Pradesh">Guntur, Andhra Pradesh</option>
              <option value="Patna, Bihar">Patna, Bihar</option>
              <option value="Chennai, Tamil Nadu">Chennai, Tamil Nadu</option>
            </select>
          </div>

          {/* Season */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Season</label>
            <select
              value={formData.Season}
              onChange={(e) => handleInputChange('Season', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Monsoon">Monsoon</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
              <option value="Post-Monsoon">Post-Monsoon</option>
            </select>
          </div>

          {/* Festival Event */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Festival Event</label>
            <select
              value={formData.Festival_Event}
              onChange={(e) => handleInputChange('Festival_Event', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="None">None (Regular Day)</option>
              <option value="Diwali">Diwali</option>
              <option value="Ugadi">Ugadi</option>
              <option value="Makar Sankranti">Makar Sankranti</option>
              <option value="Chhath Puja">Chhath Puja</option>
              <option value="Holi">Holi</option>
            </select>
          </div>

          {/* Weather */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Weather</label>
            <select
              value={formData.Weather}
              onChange={(e) => handleInputChange('Weather', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Clear">Clear</option>
              <option value="Rainy">Rainy</option>
              <option value="Hot">Hot</option>
              <option value="Cloudy">Cloudy</option>
            </select>
          </div>

          {/* Promotion */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Promotion Active</label>
            <select
              value={formData.Promotion}
              onChange={(e) => handleInputChange('Promotion', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Yes">Yes (Discount Active)</option>
              <option value="No">No (Standard Price)</option>
            </select>
          </div>

          {/* Opening Stock */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Current Opening Stock</label>
            <input
              type="number"
              value={formData.Opening_Stock}
              onChange={(e) => handleInputChange('Opening_Stock', parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footfall */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Customer Footfall</label>
            <input
              type="number"
              value={formData.Customer_Footfall}
              onChange={(e) => handleInputChange('Customer_Footfall', parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Prev Day Demand */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Prev Day Demand</label>
            <input
              type="number"
              value={formData.Prev_Day_Demand}
              onChange={(e) => handleInputChange('Prev_Day_Demand', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Predicting demand...</span>
              </>
            ) : (
              <>
                <span>Predict Demand ✨</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Prediction Failed</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Prediction Result Display */}
      {predictionResult && (
        <div className="p-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl shadow-xl space-y-4 animate-fade-in border border-emerald-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">
                {predictionResult.is_fallback ? 'ML Prediction Output' : 'Live ML API Prediction Output'}
              </h4>
            </div>
            <span
              className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full font-mono ${
                predictionResult.is_fallback
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {predictionResult.is_fallback
                ? 'OFFLINE FALLBACK ESTIMATOR'
                : 'POST /api/predict-demand (XGBoost Live)'}
            </span>
          </div>

          {/* Result Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Predicted Demand */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Predicted Demand</p>
              <p className="text-2xl font-black text-white mt-1">{predictionResult.predicted_demand} units</p>
            </div>

            {/* Demand Level */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Demand Level</p>
              <div className="mt-1.5">
                <span
                  className={`inline-block text-xs font-black px-2.5 py-1 rounded-md ${
                    predictionResult.demand_level === 'HIGH'
                      ? 'bg-emerald-500 text-slate-950'
                      : predictionResult.demand_level === 'MEDIUM'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-blue-400 text-slate-950'
                  }`}
                >
                  {predictionResult.demand_level}
                </span>
              </div>
            </div>

            {/* Recommended Stock */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Recommended Stock</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{predictionResult.recommended_stock} units</p>
            </div>

            {/* Recommended Reorder Quantity */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Reorder Quantity</p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {predictionResult.recommended_reorder_quantity} units
              </p>
            </div>

            {/* Product */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Product</p>
              <p className="text-xs font-bold text-white mt-2 truncate">
                {predictionResult.product || formData.Product_Name}
              </p>
            </div>

            {/* City */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">City</p>
              <p className="text-xs font-bold text-white mt-2">{predictionResult.city || formData.City}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
