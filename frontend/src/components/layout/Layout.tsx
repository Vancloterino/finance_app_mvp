import React, { ReactNode, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import { Home, Users, CreditCard, Settings, LogOut, Menu, X, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import SettingsDialog from '../SettingsDialog';
import Footer from './Footer';
import ThemeToggle from '../ui/ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
    setUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const navigation = [
    { name: 'Spaces', href: '/spaces', icon: Home },
    { name: 'My Account', href: '/account', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
  ];

  const isCurrentPath = (path: string) => location.pathname.startsWith(path);

  // Auth pages (login/register) get no header or footer
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Non-authenticated users get just the content and footer (unless on auth pages)
  if (!state.isAuthenticated) {
    return (
      <>
        {children}
        {!isAuthPage && <Footer />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-5 pb-4 overflow-y-auto shadow-sm">
          <div className="flex items-center justify-between flex-shrink-0 px-4 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-xl flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">FinanceApp</h1>
            <ThemeToggle />
          </div>

          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-2" aria-label="Main navigation">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isCurrentPath(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-[#0070BA] text-white shadow-md hover:bg-white hover:text-[#0070BA]'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white group-hover:text-[#0070BA]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {state.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {state.user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {state.user?.email}
                </p>
              </div>
              <ChevronUp className={`h-4 w-4 text-gray-500 transition-transform ${userMenuOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Popup menu */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2" role="menu" aria-label="User menu options">
                <button
                  onClick={handleOpenSettings}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  role="menuitem"
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  role="menuitem"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Finance App</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 flex z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
            <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close mobile menu"
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
                <nav className="mt-5 px-3 space-y-2" aria-label="Mobile navigation">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isCurrentPath(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isActive
                            ? 'bg-[#0070BA] text-white shadow-md hover:bg-white hover:text-[#0070BA]'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        } group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all`}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className={`mr-4 h-6 w-6 ${isActive ? 'text-white group-hover:text-[#0070BA]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {state.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {state.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {state.user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-700 dark:text-gray-200 hover:text-[#0070BA] hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Sign out of your account"
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
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Layout;