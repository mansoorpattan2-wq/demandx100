import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Footer: React.FC = () => {
  const { currentUser, userRole } = useAuth();

  const roleLinks = [
    { role: 'customer', path: '/customer', label: 'Customer Dashboard', style: 'hover:text-emerald-400' },
    { role: 'retailer', path: '/retailer', label: 'Retailer Dashboard', style: 'hover:text-blue-400' },
    { role: 'supplier', path: '/supplier', label: 'Supplier Dashboard', style: 'hover:text-amber-400' },
    { role: 'manufacturer', path: '/manufacturer', label: 'Manufacturer Dashboard', style: 'hover:text-purple-400' },
  ];

  const activeRoleLink = (currentUser && userRole)
    ? roleLinks.find((r) => r.role === userRole)
    : null;

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Story pipeline banner matching Image 1 bottom */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 sm:p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-base">DemandX Story Pipeline</h4>
              <p className="text-slate-400 text-xs">Data → AI Analysis → Demand Forecast → Action → Less Waste → More Profit</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-4 py-2 rounded-xl">
            <span>People. Products. A Better Tomorrow.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800">

          {/* Col 1 & 2: Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/30">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-bold tracking-tight text-white">Demand</span>
                <span className="text-2xl font-black text-emerald-500">X</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">
              Predict Today. Prepare Tomorrow. AI-powered Market Demand Intelligence for everyone in the supply chain — from farmers & retailers to manufacturers.
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Vijayawada • Guntur • Hyderabad • Bangalore • Pan India
            </p>
          </div>

          {/* Col 3: Role Portals */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-3">Role Dashboard</h5>
            <ul className="space-y-2 text-xs">
              {activeRoleLink ? (
                <li><Link to={activeRoleLink.path} className={`${activeRoleLink.style} transition-colors font-bold`}>{activeRoleLink.label}</Link></li>
              ) : (
                <li className="text-slate-500 italic">Login to access dashboard</li>
              )}
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-3">Platform</h5>
            <ul className="space-y-2 text-xs">
              {currentUser && userRole && (
                <li><Link to="/ai" className="hover:text-indigo-400 transition-colors font-bold">AI Insights</Link></li>
              )}
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors">Product Analysis</Link></li>
              <li><Link to="/forecast" className="hover:text-emerald-400 transition-colors">Demand Forecast</Link></li>
              <li><Link to="/inventory" className="hover:text-emerald-400 transition-colors">Inventory Optimization</Link></li>
              <li><Link to="/insights" className="hover:text-emerald-400 transition-colors">Market Insights</Link></li>
            </ul>
          </div>

          {/* Col 5: Company Links */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-3">Company</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">About Us</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition-colors">Solutions</a></li>
              <li><a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              <li><a href="#privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <p>© {new Date().getFullYear()} DemandX Inc. All rights reserved.</p>
            <span className="inline-flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>All Systems Operational</span>
            </span>
          </div>

          <p className="font-medium text-slate-300">A Smarter Market for a Better Tomorrow.</p>

          <div className="flex items-center space-x-4">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="LinkedIn">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="X (Twitter)">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="Instagram">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="YouTube">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

