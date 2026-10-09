import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, Truck, Factory, Sparkles, ArrowRight } from 'lucide-react';

interface RoleCardProps {
  role: 'customer' | 'retailer' | 'supplier' | 'manufacturer' | 'ai';
  title: string;
  subtitle: string;
  route: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, title, subtitle, route }) => {
  const navigate = useNavigate();

  const roleStyles = {
    customer: {
      bg: 'bg-emerald-50/70 hover:bg-emerald-50 hover:border-emerald-300 border-emerald-200/80',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/20',
      arrowColor: 'bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white',
      badge: 'Customer',
    },
    retailer: {
      bg: 'bg-blue-50/70 hover:bg-blue-50 hover:border-blue-300 border-blue-200/80',
      iconBg: 'bg-blue-600 text-white shadow-blue-600/20',
      arrowColor: 'bg-white text-blue-700 hover:bg-blue-600 hover:text-white',
      badge: 'Retailer',
    },
    supplier: {
      bg: 'bg-amber-50/70 hover:bg-amber-50 hover:border-amber-300 border-amber-200/80',
      iconBg: 'bg-amber-600 text-white shadow-amber-600/20',
      arrowColor: 'bg-white text-amber-700 hover:bg-amber-600 hover:text-white',
      badge: 'Supplier',
    },
    manufacturer: {
      bg: 'bg-purple-50/70 hover:bg-purple-50 hover:border-purple-300 border-purple-200/80',
      iconBg: 'bg-purple-600 text-white shadow-purple-600/20',
      arrowColor: 'bg-white text-purple-700 hover:bg-purple-600 hover:text-white',
      badge: 'Manufacturer',
    },
    ai: {
      bg: 'bg-indigo-50/70 hover:bg-indigo-50 hover:border-indigo-300 border-indigo-200/80',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-600/20',
      arrowColor: 'bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white',
      badge: 'AI Insight',
    },
  };

  const icons = {
    customer: <ShoppingBag className="w-6 h-6" />,
    retailer: <Store className="w-6 h-6" />,
    supplier: <Truck className="w-6 h-6" />,
    manufacturer: <Factory className="w-6 h-6" />,
    ai: <Sparkles className="w-6 h-6" />,
  };

  const style = roleStyles[role];

  return (
    <div
      onClick={() => navigate(route)}
      className={`p-5 sm:p-6 rounded-[20px] border ${style.bg} transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs hover:shadow-md hover:-translate-y-1`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center shadow-md transition-transform group-hover:scale-110`}>
          {icons[role]}
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{style.badge}</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className={`w-9 h-9 rounded-full ${style.arrowColor} shadow-xs flex items-center justify-center transition-all group-hover:translate-x-1 shrink-0 ml-2`}>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
};
