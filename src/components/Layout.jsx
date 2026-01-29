import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Billing', path: '/billing', icon: '💳', hotkey: 'F2' },
    { name: 'Medicines', path: '/medicines', icon: '💊', hotkey: 'F3' },
    { name: 'Purchases', path: '/purchases', icon: '📦', hotkey: 'F4' },
    { name: 'Customers', path: '/customers', icon: '👥', hotkey: 'F5' },
    { name: 'Suppliers', path: '/suppliers', icon: '🏭', hotkey: 'F6' },
    { name: 'Reports', path: '/reports', icon: '📈', hotkey: 'F7' },
    { name: 'Settings', path: '/settings', icon: '⚙️', hotkey: 'F8' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">AI Builder Pharma</h1>
          <p className="text-xs text-gray-500 mt-1">Inventory & Billing</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.hotkey && (
                <span className="kbd text-xs">{item.hotkey}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
