import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Clock,
  MapPin,
  Bell,
  ShoppingBag,
  Settings,
  HelpCircle,
  BarChart3,
  Boxes,
  Sparkles,
  Users,
  Percent,
  LineChart,
  Truck,
  FileText,
  Package,
  Layers,
  Factory,
  Leaf,
} from 'lucide-react';
import { useToast } from './Toast';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isHighlighted?: boolean;
}

interface SidebarProps {
  role: 'customer' | 'retailer' | 'supplier' | 'manufacturer';
  activeItem?: string;
  onSelectKey?: (key: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeItem = 'Dashboard', onSelectKey }) => {
  const { showToast } = useToast();

  const themeColors = {
    customer: {
      activeBg: 'bg-emerald-100/70 text-emerald-800 font-bold',
      hoverBg: 'hover:bg-emerald-50 text-slate-700',
      accent: 'emerald',
      helpBtn: 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/50',
    },
    retailer: {
      activeBg: 'bg-blue-100/70 text-blue-800 font-bold',
      hoverBg: 'hover:bg-blue-50 text-slate-700',
      accent: 'blue',
      helpBtn: 'border-blue-200 bg-blue-50/50 text-blue-800 hover:bg-blue-100/50',
    },
    supplier: {
      activeBg: 'bg-amber-100/70 text-amber-800 font-bold',
      hoverBg: 'hover:bg-amber-50 text-slate-700',
      accent: 'amber',
      helpBtn: 'border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100/50',
    },
    manufacturer: {
      activeBg: 'bg-purple-100/70 text-purple-800 font-bold',
      hoverBg: 'hover:bg-purple-50 text-slate-700',
      accent: 'purple',
      helpBtn: 'border-purple-200 bg-purple-50/50 text-purple-800 hover:bg-purple-100/50',
    },
  };

  const navConfigs: Record<string, NavItem[]> = {
    customer: [
      { key: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'Market Prices', label: 'Market Prices', icon: <TrendingUp className="w-4 h-4" /> },
      { key: 'Product Search', label: 'Product Search', icon: <Search className="w-4 h-4" /> },
      { key: 'Best Time to Buy', label: 'Best Time to Buy', icon: <Clock className="w-4 h-4" /> },
      { key: 'Smart Basket', label: 'Smart Basket', icon: <ShoppingBag className="w-4 h-4" /> },
      { key: 'Nearby Sellers', label: 'Nearby Sellers', icon: <MapPin className="w-4 h-4" /> },
      { key: 'Personalized Alerts', label: 'Personalized Alerts', icon: <Bell className="w-4 h-4" /> },
      { key: 'Orders & Khata', label: 'Orders & Khata', icon: <FileText className="w-4 h-4" /> },
      { key: 'Settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
    retailer: [
      { key: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'Demand Forecast', label: 'Demand Forecast', icon: <BarChart3 className="w-4 h-4" /> },
      {
        key: 'DEMAND PREDICTOR',
        label: 'DEMAND PREDICTOR',
        icon: <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />,
        badge: '⚡ ML AI',
        isHighlighted: true,
      },
      { key: 'Inventory Planning', label: 'Inventory Planning', icon: <Boxes className="w-4 h-4" /> },
      { key: 'Product Insights', label: 'Product Insights', icon: <Sparkles className="w-4 h-4" /> },
      { key: 'Nearby Suppliers', label: 'Nearby Suppliers', icon: <Users className="w-4 h-4" /> },
      { key: 'Supplier Orders', label: 'Supplier Orders', icon: <Truck className="w-4 h-4" />, badge: 'Orders' },
      { key: 'Price Trends', label: 'Price Trends', icon: <LineChart className="w-4 h-4" /> },
      { key: 'Offers & Schemes', label: 'Offers & Schemes', icon: <Percent className="w-4 h-4" /> },
      { key: 'Sales Analytics', label: 'Sales Analytics', icon: <TrendingUp className="w-4 h-4" /> },
      { key: 'Settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
    supplier: [
      { key: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'Market Demand', label: 'Market Demand', icon: <TrendingUp className="w-4 h-4" /> },
      { key: 'Buyer Requests', label: 'Buyer Requests', icon: <FileText className="w-4 h-4" /> },
      { key: 'Supply Opportunities', label: 'Supply Opportunities', icon: <Package className="w-4 h-4" /> },
      { key: 'Price Analysis', label: 'Price Analysis', icon: <LineChart className="w-4 h-4" /> },
      { key: 'Manage Products', label: 'Manage Products', icon: <Boxes className="w-4 h-4" /> },
      { key: 'Orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
      { key: 'Logistics Support', label: 'Logistics Support', icon: <Truck className="w-4 h-4" /> },
      { key: 'Analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { key: 'Settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
    manufacturer: [
      { key: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'Production Planning', label: 'Production Planning', icon: <Factory className="w-4 h-4" /> },
      { key: 'Market Forecast', label: 'Market Forecast', icon: <BarChart3 className="w-4 h-4" /> },
      { key: 'Raw Material Insights', label: 'Raw Material Insights', icon: <Layers className="w-4 h-4" /> },
      { key: 'Capacity Utilization', label: 'Capacity Utilization', icon: <TrendingUp className="w-4 h-4" /> },
      { key: 'Product Performance', label: 'Product Performance', icon: <Sparkles className="w-4 h-4" /> },
      { key: 'Distribution Insights', label: 'Distribution Insights', icon: <Truck className="w-4 h-4" /> },
      { key: 'Sustainability', label: 'Sustainability', icon: <Leaf className="w-4 h-4" /> },
      { key: 'Reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
      { key: 'Settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
  };

  const theme = themeColors[role];
  const items = navConfigs[role];

  return (
    <aside className="w-56 bg-white border-r border-slate-200/90 flex flex-col justify-between p-3 shrink-0 rounded-l-[18px]">
      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
        {items.map((item) => {
          const isSelected = activeItem === item.key;
          const isSpecial = item.isHighlighted;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectKey && onSelectKey(item.key)}
              className={`w-full text-left flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                isSpecial
                  ? isSelected
                    ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white font-black shadow-lg ring-2 ring-indigo-400/80 scale-[1.02]'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] border border-blue-400/40'
                  : isSelected
                  ? theme.activeBg
                  : theme.hoverBg
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <span className={isSpecial ? 'text-amber-300' : isSelected ? 'text-current' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`shrink-0 ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isSpecial
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Support / Need Help Widget */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => showToast('Customer Support', 'Connecting with DemandX 24/7 Supply Chain Specialist...', 'info')}
          className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${theme.helpBtn}`}
        >
          <HelpCircle className="w-4 h-4" />
          <div className="text-left">
            <p className="text-[11px] font-bold leading-tight">Need Help?</p>
            <p className="text-[10px] opacity-80">Chat with us</p>
          </div>
        </button>
      </div>
    </aside>
  );
};


