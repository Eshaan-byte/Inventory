import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Billing from './pages/Billing';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useAuthStore } from './store/authStore';
import { apiClient } from './lib/api';

function App() {
  const [needsSetup, setNeedsSetup] = useState(null);
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await apiClient.get('/auth/setup-status');
      setNeedsSetup(response.data.needs_setup);
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setNeedsSetup(false);
    }
  };

  // Loading state
  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Setup needed
  if (needsSetup) {
    return <Setup onSetupComplete={() => setNeedsSetup(false)} />;
  }

  // Not authenticated
  if (!user) {
    return <Login />;
  }

  // Authenticated - show main app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
