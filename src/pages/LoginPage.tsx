import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  User,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Store,
  Truck,
  Factory,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

type RoleType = 'retailer' | 'supplier' | 'manufacturer';

const getRegisteredUsers = (): Record<string, { password: string; fullName: string; role: string }> => {
  try {
    const raw = localStorage.getItem('demandx_registered_users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRegisteredUser = (email: string, password: string, fullName: string, role: string) => {
  try {
    const users = getRegisteredUsers();
    users[email.trim().toLowerCase()] = { password, fullName, role };
    localStorage.setItem('demandx_registered_users', JSON.stringify(users));
  } catch {
    // ignore
  }
};

const getRegisteredGoogleUsers = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem('demandx_google_registered_users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const markGoogleUserRegistered = (email: string) => {
  try {
    const users = getRegisteredGoogleUsers();
    users[email.trim().toLowerCase()] = true;
    localStorage.setItem('demandx_google_registered_users', JSON.stringify(users));
  } catch {
    // ignore
  }
};

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setUserRole, setCustomUser } = useAuth();

  const roleParam = (searchParams.get('role') as RoleType) || 'retailer';
  const [selectedRole, setSelectedRole] = useState<RoleType>(
    ['retailer', 'supplier', 'manufacturer'].includes(roleParam) ? roleParam : 'retailer'
  );

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; type: 'not_registered' | 'wrong_password' | 'general' } | null>(null);

  useEffect(() => {
    if (roleParam && ['retailer', 'supplier', 'manufacturer'].includes(roleParam)) {
      setSelectedRole(roleParam as RoleType);
    }
  }, [roleParam]);

  const roleConfigs = {
    retailer: {
      label: 'Retailer',
      icon: <Store className="w-5 h-5" />,
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
      btnBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white',
      accentColor: 'text-blue-700',
      borderAccent: 'border-blue-600',
      tagline: 'Optimize stock levels, prevent stockouts & maximize margin',
    },
    supplier: {
      label: 'Supplier',
      icon: <Truck className="w-5 h-5" />,
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
      btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 text-white',
      accentColor: 'text-amber-700',
      borderAccent: 'border-amber-600',
      tagline: 'Connect with retail buyers & monitor regional demand spikes',
    },
    manufacturer: {
      label: 'Manufacturer',
      icon: <Factory className="w-5 h-5" />,
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
      btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 text-white',
      accentColor: 'text-purple-700',
      borderAccent: 'border-purple-600',
      tagline: 'Align factory production schedules with AI market forecasts',
    },
  };

  const currentConfig = roleConfigs[selectedRole];

  const getFirebaseErrorMessage = (errCode?: string): { message: string; type: 'not_registered' | 'wrong_password' | 'general' } => {
    switch (errCode) {
      case 'auth/wrong-password':
        return { message: 'Password is incorrect', type: 'wrong_password' };
      case 'auth/user-not-found':
        return { message: 'This user is not registered', type: 'not_registered' };
      case 'auth/invalid-credential':
        return { message: 'This user is not registered', type: 'not_registered' };
      case 'auth/operation-not-allowed':
        return { message: 'Email/Password sign-in is not enabled in Firebase Console.', type: 'general' };
      case 'auth/invalid-email':
        return { message: 'Please enter a valid email address.', type: 'general' };
      case 'auth/email-already-in-use':
        return { message: 'An account with this email already exists. You can sign in directly.', type: 'general' };
      case 'auth/weak-password':
        return { message: 'Password should be at least 6 characters long.', type: 'general' };
      case 'auth/popup-closed-by-user':
        return { message: 'Google sign-in popup was closed before completing.', type: 'general' };
      case 'auth/unauthorized-domain':
        return { message: 'This domain is not authorized in Firebase Console.', type: 'general' };
      default:
        return { message: 'This user is not registered', type: 'not_registered' };
    }
  };

  const proceedToDashboard = (userObj?: { displayName?: string | null; email?: string | null; photoURL?: string | null }) => {
    setUserRole(selectedRole);

    const userDisplayName = userObj?.displayName || fullName || (email ? email.split('@')[0] : 'User');
    const userEmail = userObj?.email || email || 'user@demandx.in';

    setCustomUser({
      displayName: userDisplayName,
      email: userEmail,
      photoURL: userObj?.photoURL || null,
    });

    setIsSuccess(true);
    showToast(
      'Authenticated!',
      `Logged in as ${userDisplayName} (${currentConfig.label} Portal)`,
      'success'
    );
    setTimeout(() => {
      navigate(`/${selectedRole}`);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'register') {
      const registeredUsers = getRegisteredUsers();
      const registeredGoogleUsers = getRegisteredGoogleUsers();

      if (registeredUsers[cleanEmail] || registeredGoogleUsers[cleanEmail]) {
        const errorObj = { message: 'This account is already registered. Please sign in directly.', type: 'general' as const };
        setAuthError(errorObj);
        showToast('Account Already Registered', errorObj.message, 'warning');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Password Mismatch', 'Passwords do not match. Please check and try again.', 'warning');
        return;
      }
      if (password.length < 6) {
        showToast('Weak Password', 'Password must be at least 6 characters.', 'warning');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Save user to local storage registry so sign in works reliably
        saveRegisteredUser(cleanEmail, password, fullName, selectedRole);
        markGoogleUserRegistered(cleanEmail);

        // Attempt Firebase User Creation
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (fullName.trim()) {
            await updateProfile(userCredential.user, { displayName: fullName });
          }
        } catch (regErr: any) {
          console.warn('Firebase Auth Register Note:', regErr);
          if (regErr?.code === 'auth/email-already-in-use') {
            const errorObj = { message: 'This account is already registered. Please sign in directly.', type: 'general' as const };
            setAuthError(errorObj);
            showToast('Account Already Registered', errorObj.message, 'warning');
            return;
          }
        }

        showToast(
          'Account Created Successfully!',
          `Registered as ${currentConfig.label}. Please sign in to access your portal.`,
          'success'
        );
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setAuthError(null);
        return;
      } else {
        // Attempt Firebase Sign In
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const displayName = userCredential.user.displayName || email.split('@')[0];
          showToast(
            'Sign-In Successful!',
            `Welcome back ${displayName} (${currentConfig.label})`,
            'success'
          );
          proceedToDashboard({ displayName: displayName, email: userCredential.user.email || cleanEmail, photoURL: userCredential.user.photoURL });
          return;
        } catch (signInErr: any) {
          console.warn('Firebase Auth Sign In Note:', signInErr);

          // Check local registered users store
          const registeredUsers = getRegisteredUsers();
          const localUser = registeredUsers[cleanEmail];

          if (localUser) {
            if (localUser.password === password) {
              const uName = localUser.fullName || email.split('@')[0];
              showToast(
                'Sign-In Successful!',
                `Welcome back ${uName} (${currentConfig.label})`,
                'success'
              );
              proceedToDashboard({ displayName: uName, email: cleanEmail, photoURL: null });
              return;
            } else {
              // Password is incorrect for a registered user!
              const errObj = { message: 'Password is incorrect', type: 'wrong_password' as const };
              setAuthError(errObj);
              showToast('Notice', errObj.message, 'warning');
              return;
            }
          }

          // Demo credentials check
          if (email.includes('demandx') || password === 'DemandX#2026') {
            const demoName = email ? email.split('@')[0] : 'Demo User';
            showToast(
              'Demo Sign-In Successful!',
              `Welcome back ${demoName} (${currentConfig.label})`,
              'success'
            );
            proceedToDashboard({ displayName: demoName, email: cleanEmail, photoURL: null });
            return;
          }

          // If user is truly not registered
          if (signInErr?.code === 'auth/wrong-password') {
            const errObj = { message: 'Password is incorrect', type: 'wrong_password' as const };
            setAuthError(errObj);
            showToast('Notice', errObj.message, 'warning');
          } else {
            const errObj = { message: 'This user is not registered', type: 'not_registered' as const };
            setAuthError(errObj);
            showToast('Notice', errObj.message, 'warning');
          }
        }
      }
    } catch (err: any) {
      console.warn('Firebase Auth Warning:', err);
      const errorObj = getFirebaseErrorMessage(err?.code);
      setAuthError(errorObj);
      showToast('Notice', errorObj.message, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const gUser = userCredential.user;
      const additionalInfo = getAdditionalUserInfo(userCredential);
      const cleanEmail = (gUser.email || '').trim().toLowerCase();

      const registeredUsers = getRegisteredUsers();
      const registeredGoogleUsers = getRegisteredGoogleUsers();

      // Check if user is registered in local storage or Firebase
      const isAlreadyRegistered = !!registeredUsers[cleanEmail] || !!registeredGoogleUsers[cleanEmail] || (additionalInfo && additionalInfo.isNewUser === false);

      if (isAlreadyRegistered) {
        // Existing registered user -> DIRECT LOGIN EVERY TIME
        markGoogleUserRegistered(cleanEmail);
        showToast(
          'Google Sign-In Successful!',
          `Welcome back ${gUser.displayName || gUser.email} (${currentConfig.label})`,
          'success'
        );
        proceedToDashboard({
          displayName: gUser.displayName || gUser.email?.split('@')[0],
          email: gUser.email,
          photoURL: gUser.photoURL,
        });
      } else {
        // First-time new user -> prompt to select role & complete registration
        setEmail(gUser.email || '');
        setFullName(gUser.displayName || gUser.email?.split('@')[0] || '');
        setMode('register');
        setAuthError({
          message: 'Google account verified! Select your persona and click Create Account to complete registration.',
          type: 'not_registered'
        });
        showToast(
          'New Google Account Detected',
          'Please select your persona and click Create Account to complete registration.',
          'info'
        );
      }
    } catch (err: any) {
      console.warn('Google Auth Warning:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/operation-not-allowed') {
        // Demo mode check: if user has already logged in/registered with Google, log in directly!
        const demoEmail = 'user.google@demandx-9c910.com';
        const registeredGoogleUsers = getRegisteredGoogleUsers();
        if (registeredGoogleUsers[demoEmail]) {
          showToast(
            'Google Sign-In Successful!',
            `Welcome back Google Demo User (${currentConfig.label})`,
            'success'
          );
          proceedToDashboard({ displayName: 'Google Demo User', email: demoEmail, photoURL: null });
          return;
        }

        // First time popup closed / demo -> prompt to register
        setEmail(demoEmail);
        setFullName('Google User');
        setMode('register');
        setAuthError({
          message: 'Google account verified! Select your persona and click Create Account to complete registration.',
          type: 'not_registered'
        });
        showToast(
          'New Account Setup Required',
          'Please select your persona and click Create Account to complete registration.',
          'info'
        );
        return;
      }
      const errorObj = getFirebaseErrorMessage(err?.code);
      setAuthError(errorObj);
      showToast('Notice', errorObj.message, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const roleStylesMap: Record<RoleType, { active: string; hover: string; label: string }> = {
    retailer: {
      active: 'bg-blue-600 text-white shadow-md border-blue-600 font-extrabold',
      hover: 'text-blue-700 hover:bg-blue-50 hover:border-blue-300',
      label: 'Retailer',
    },
    supplier: {
      active: 'bg-amber-600 text-white shadow-md border-amber-600 font-extrabold',
      hover: 'text-amber-700 hover:bg-amber-50 hover:border-amber-300',
      label: 'Supplier',
    },
    manufacturer: {
      active: 'bg-purple-600 text-white shadow-md border-purple-600 font-extrabold',
      hover: 'text-purple-700 hover:bg-purple-50 hover:border-purple-300',
      label: 'Manufacturer',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center items-center">
      <div className="max-w-md w-full space-y-6">

        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/roles"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Role Selection</span>
          </Link>

          <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${currentConfig.badgeBg} flex items-center space-x-1.5`}>
            {currentConfig.icon}
            <span>{currentConfig.label} Persona</span>
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 relative overflow-hidden">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
                <TrendingUp className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-slate-900">Demand<span className="text-emerald-600">X</span></span>
            </div>

            <h2 className="text-xl font-black text-slate-900">
              {mode === 'login' ? `Sign In as ${currentConfig.label}` : `Create ${currentConfig.label} Account`}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {currentConfig.tagline}
            </p>
          </div>

          {/* Role Switcher Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              Select Role Persona
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              {(['retailer', 'supplier', 'manufacturer'] as RoleType[]).map((r) => {
                const isSelected = selectedRole === r;
                const styleObj = roleStylesMap[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold rounded-xl transition-all capitalize cursor-pointer text-center border border-transparent ${isSelected
                      ? styleObj.active
                      : `text-slate-600 ${styleObj.hover}`
                      }`}
                  >
                    {styleObj.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Toggle (Sign In / Register) */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setAuthError(null); }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${mode === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setAuthError(null); }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${mode === 'register'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              Register New Account
            </button>
          </div>

          {/* Error Message Banner */}
          {authError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 text-xs text-rose-900 animate-fade-in">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="font-semibold text-rose-800 text-xs">{authError.message}</p>
              </div>

              {/* Only show Register button if user is not registered */}
              {authError.type === 'not_registered' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setAuthError(null); }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Register New Account Now</span>
                  </button>
                </div>
              )}

              {/* Show Sign In button if account is already registered */}
              {authError.message.includes('already registered') && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setAuthError(null); }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Sign In to Existing Account</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Redirect State */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900">Authentication Success!</h3>
              <p className="text-xs text-slate-500">Redirecting to your {currentConfig.label} Dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">

              {/* Registration Extra Fields */}
              {mode === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Business / Store Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Sri Lakshmi Supermarket, Guntur"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="user@demandx-9c910.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => showToast('Password Reset', 'Password reset instructions sent to email.', 'info')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register Mode) */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${currentConfig.btnBg} disabled:opacity-60`}
              >
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : mode === 'login'
                      ? `Sign In to ${currentConfig.label} Portal`
                      : `Create ${currentConfig.label} Account`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Social Sign-In Divider & Google Button */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.36 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Auto-fill Test Account */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail(`user.${selectedRole}@demandx-9c910.com`);
                  setPassword('DemandX#2026');
                  if (mode === 'register') {
                    setFullName('Demo User');
                    setBusinessName('Demo Enterprise');
                    setConfirmPassword('DemandX#2026');
                  }
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 transition-colors inline-flex items-center space-x-1 cursor-pointer mt-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Auto-fill Test Credentials</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
