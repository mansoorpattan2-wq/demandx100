import React from 'react';
import { RoleCard } from '../components/RoleCard';
import { Sparkles } from 'lucide-react';

export const RoleSelectionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-100/80 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Select Your Supply Chain Persona</span>
          </div>

          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Choose your role to launch a tailored dashboard with specialized AI demand forecasts, price tracking, and inventory tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <RoleCard
            role="retailer"
            title="Retailer"
            subtitle="Plan store inventory, avoid stockouts & boost profit margins"
            route="/login?role=retailer"
          />
          <RoleCard
            role="supplier"
            title="Supplier"
            subtitle="Connect with active buyers & spot regional demand surges"
            route="/login?role=supplier"
          />
          <RoleCard
            role="manufacturer"
            title="Manufacturer"
            subtitle="Align production runs with predictive market demand forecasts"
            route="/login?role=manufacturer"
          />
        </div>

      </div>
    </div>
  );
};
