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

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Finance App</h1>
          </div>

          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {state.user?.name}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
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
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isCurrentPath(item.href)
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-base font-medium border-l-4`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {state.user?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {state.user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
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
            className="flex items-center"
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