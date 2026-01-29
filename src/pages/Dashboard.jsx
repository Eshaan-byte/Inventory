import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [dailySales, expiry, stockData] = await Promise.all([
        api.sales.dailySummary(today),
        api.batches.expiryAlerts(90),
        api.reports.stockSummary(),
      ]);

      setSummary({
        daily_sales: dailySales.data.summary,
        stock: stockData.data.summary,
      });

      setExpiryAlerts(expiry.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { name: 'New Sale', path: '/billing', icon: '💳', color: 'blue', hotkey: 'F2' },
    { name: 'Add Medicine', path: '/medicines', icon: '💊', color: 'green', hotkey: 'F3' },
    { name: 'Purchase Entry', path: '/purchases', icon: '📦', color: 'purple', hotkey: 'F4' },
    { name: 'View Reports', path: '/reports', icon: '📈', color: 'orange', hotkey: 'F7' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{summary?.daily_sales?.total_sales?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.daily_sales?.total_invoices || 0} invoices
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Medicines</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.stock?.total_medicines || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.stock?.total_stock_quantity || 0} units in stock
              </p>
            </div>
            <div className="text-4xl">💊</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cash Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{summary?.daily_sales?.cash_sales?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Today</p>
            </div>
            <div className="text-4xl">💵</div>
          </div>
        </div>

        <div className="card border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiry Alerts</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {expiryAlerts.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Next 90 days</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={`card hover:shadow-lg transition-shadow border-l-4 border-${action.color}-500`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{action.icon}</div>
                <p className="font-medium text-gray-900">{action.name}</p>
                <span className="kbd text-xs mt-2 inline-block">{action.hotkey}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiryAlerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Expiry Alerts</h2>
            <Link to="/reports" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {expiryAlerts.map((alert, index) => (
                  <tr key={index}>
                    <td>
                      <div className="font-medium">{alert.medicine_name}</div>
                      <div className="text-xs text-gray-500">{alert.manufacturer}</div>
                    </td>
                    <td>{alert.batch_number}</td>
                    <td>{new Date(alert.expiry_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.days_to_expiry < 30
                          ? 'bg-red-100 text-red-800'
                          : alert.days_to_expiry < 60
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.days_to_expiry} days
                      </span>
                    </td>
                    <td>{alert.quantity_in_stock} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
