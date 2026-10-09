import React, { useState } from 'react';
import { X, TrendingUp, User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setUserRole, setCustomUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'retailer' | 'supplier' | 'manufacturer'>('customer');
  const [email, setEmail] = useState('durgaprasad@demandx.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUserRole(selectedRole);
    setCustomUser({
      displayName: email ? email.split('@')[0] : 'User',
      email: email,
      photoURL: null,
    });
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      navigate(`/${selectedRole}`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Login to DemandX</h3>
            <p className="text-xs text-slate-500">Access role-tailored demand intelligence</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900">Welcome Back!</h4>
            <p className="text-sm text-slate-600">Redirecting to your {selectedRole} dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            {/* Role selector buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Select Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'customer', label: 'Customer', activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold', hoverColor: 'hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300' },
                  { id: 'retailer', label: 'Retailer', activeColor: 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold', hoverColor: 'hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300' },
                  { id: 'supplier', label: 'Supplier', activeColor: 'bg-amber-600 text-white border-amber-600 shadow-sm font-bold', hoverColor: 'hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300' },
                  { id: 'manufacturer', label: 'Manufacturer', activeColor: 'bg-purple-600 text-white border-purple-600 shadow-sm font-bold', hoverColor: 'hover:text-purple-700 hover:bg-purple-50 hover:border-purple-300' },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as any)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${selectedRole === role.id ? role.activeColor : `border-slate-200 text-slate-600 ${role.hoverColor}`
                      }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email / Phone</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <span>Continue as {selectedRole.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
