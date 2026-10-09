import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, User, Sparkles, Menu, X, ArrowRight, LogOut, ChevronDown } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userRole, signOut } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const roleNavItems = [
    { role: 'customer', path: '/customer', label: 'Customer Dashboard', activeStyle: 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80', hoverStyle: 'hover:text-emerald-700 hover:bg-emerald-50/80 hover:border-emerald-200/60' },
    { role: 'retailer', path: '/retailer', label: 'Retailer Dashboard', activeStyle: 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80', hoverStyle: 'hover:text-blue-700 hover:bg-blue-50/80 hover:border-blue-200/60' },
    { role: 'supplier', path: '/supplier', label: 'Supplier Dashboard', activeStyle: 'bg-amber-50 text-amber-700 font-bold border border-amber-200/80', hoverStyle: 'hover:text-amber-700 hover:bg-amber-50/80 hover:border-amber-200/60' },
    { role: 'manufacturer', path: '/manufacturer', label: 'Manufacturer Dashboard', activeStyle: 'bg-purple-50 text-purple-700 font-bold border border-purple-200/80', hoverStyle: 'hover:text-purple-700 hover:bg-purple-50/80 hover:border-purple-200/60' },
  ];

  // Only show role dashboard link & AI Insights if logged in
  const visibleRoleItems = (currentUser && userRole)
    ? roleNavItems.filter((item) => item.role === userRole)
    : [];

  const showAIInsights = Boolean(currentUser && userRole);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsProfileOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Get display name: prefer displayName, fallback to email prefix
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="sticky top-0 z-50 glass-nav border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Brand Logo & Navigation Links immediately next to DemandX */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xl font-bold tracking-tight text-slate-900">Demand</span>
                    <span className="text-xl font-black text-emerald-600">X</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 tracking-wide -mt-1 hidden sm:block">
                    Predict Today. Prepare Tomorrow.
                  </p>
                </div>
              </Link>

              {/* Navigation Links placed immediately right next to DemandX */}
              <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg transition-all border border-transparent ${isActive('/') ? 'bg-slate-100 text-slate-900 font-bold border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                >
                  Home
                </Link>
                {visibleRoleItems.map((item) => (
                  <Link
                    key={item.role}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg transition-all border border-transparent ${isActive(item.path) ? item.activeStyle : `text-slate-600 ${item.hoverStyle}`
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {showAIInsights && (
                  <>
                    <Link
                      to="/ai"
                      className={`px-3 py-2 rounded-lg transition-all border border-transparent flex items-center space-x-1.5 ${isActive('/ai')
                          ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200'
                          : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/80 hover:border-indigo-200/60'
                        }`}
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>AI Insights</span>
                    </Link>
                    <Link
                      to="/jarvis"
                      className="px-3 py-2 rounded-lg transition-all border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 flex items-center space-x-1.5 shadow-sm shadow-cyan-900/20 group"
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="font-bold">Open Jarvis</span>
                      <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-200 ml-1">3D</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center space-x-3">

              {/* Conditional: Profile Dropdown OR Login Button */}
              {currentUser ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    {/* Avatar */}
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={displayName}
                        className="w-7 h-7 rounded-full border-2 border-emerald-500/30 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                        {initials}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[100px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 py-2 z-50 animate-fade-in">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt={displayName}
                              className="w-10 h-10 rounded-full border-2 border-emerald-500/30 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                            {userRole && (
                              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {userRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Switch Role option */}
                      <div className="px-2 pt-1">
                        <button
                          onClick={() => { setIsProfileOpen(false); navigate('/login'); }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>Switch Role Persona</span>
                        </button>
                      </div>

                      {/* Sign Out Button */}
                      <div className="px-2 pt-1 pb-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Login Button (shown when NOT logged in) */}
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-all hidden sm:flex items-center space-x-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Login</span>
                  </button>

                  {/* Launch App Button */}
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm hover:shadow-md hover:shadow-emerald-700/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Launch App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 px-4 pt-2 pb-6 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
            >
              Home
            </Link>
            {visibleRoleItems.map((item) => (
              <Link
                key={item.role}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg font-medium ${item.role === 'customer' ? 'text-emerald-700 hover:bg-emerald-50' :
                    item.role === 'retailer' ? 'text-blue-700 hover:bg-blue-50' :
                      item.role === 'supplier' ? 'text-amber-700 hover:bg-amber-50' :
                        'text-purple-700 hover:bg-purple-50'
                  }`}
              >
                {item.label}
              </Link>
            ))}
            {showAIInsights && (
              <>
                <Link
                  to="/ai"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  AI Insights
                </Link>
                <Link
                  to="/jarvis"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg font-bold text-cyan-300 bg-slate-950 border border-cyan-800/60 hover:bg-cyan-950"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Open Jarvis (3D Voice Command)</span>
                </Link>
              </>
            )}

            {/* Mobile: Sign Out or Login */}
            {currentUser ? (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="flex items-center space-x-3 px-3 py-2">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={displayName} className="w-8 h-8 rounded-full border-2 border-emerald-500/30" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    {userRole && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {userRole}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <button
                  onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl font-semibold text-white bg-emerald-700 hover:bg-emerald-800"
                >
                  <User className="w-4 h-4" />
                  <span>Login / Register</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
};
