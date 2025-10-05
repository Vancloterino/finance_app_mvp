import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import { Home, Users, CreditCard, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Spaces', href: '/spaces', icon: Home },
    { name: 'My Account', href: '/account', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isCurrentPath = (path: string) => location.pathname.startsWith(path);

  // Non-authenticated users don't need the layout wrapper
  // The Header is now included directly in individual pages
  if (!state.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto shadow-sm">
          <div className="flex items-center flex-shrink-0 px-4 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-xl flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">FinanceApp</h1>
          </div>

          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isCurrentPath(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-[#0070BA] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 group block w-full">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {state.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {state.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {state.user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Finance App</h1>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 flex z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="px-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">F</span>
                  </div>
                </div>
                <nav className="mt-5 px-3 space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isCurrentPath(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isActive
                            ? 'bg-[#0070BA] text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        } group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className={`mr-4 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {state.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {state.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {state.user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-[#0070BA] hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="hidden lg:flex lg:items-center lg:justify-end lg:h-16 lg:bg-white lg:border-b lg:border-gray-200 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-[#0070BA] hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;