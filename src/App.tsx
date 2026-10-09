import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { SupplyChainProvider } from './contexts/SupplyChainContext';
import { LandingPage } from './pages/LandingPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { LoginPage } from './pages/LoginPage';
import { RetailerDashboard } from './pages/RetailerDashboard';
import { SupplierDashboard } from './pages/SupplierDashboard';
import { ManufacturerDashboard } from './pages/ManufacturerDashboard';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ProductAnalysisPage } from './pages/ProductAnalysisPage';
import { DemandForecastPage } from './pages/DemandForecastPage';
import { InventoryManagementPage } from './pages/InventoryManagementPage';
import { MarketInsightsPage } from './pages/MarketInsightsPage';

import { JarvisCommandCentrePage } from './pages/JarvisCommandCentrePage';

// Scroll to top component on route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isJarvisFullScreen = pathname === '/jarvis';

  if (isJarvisFullScreen) {
    return (
      <Routes>
        <Route path="/jarvis" element={<JarvisCommandCentrePage />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/roles" element={<RoleSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/retailer" element={<RetailerDashboard />} />
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/manufacturer" element={<ManufacturerDashboard />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          <Route path="/jarvis" element={<JarvisCommandCentrePage />} />
          <Route path="/products" element={<ProductAnalysisPage />} />
          <Route path="/forecast" element={<DemandForecastPage />} />
          <Route path="/inventory" element={<InventoryManagementPage />} />
          <Route path="/insights" element={<MarketInsightsPage />} />

          {/* Fallback route */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <SupplyChainProvider>
          <Router>
            <ScrollToTop />
            <AppLayout />
          </Router>
        </SupplyChainProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
