import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const navigation = [
    { name: 'How It Works', onClick: () => scrollToSection('how-it-works') },
    { name: 'Features', onClick: () => scrollToSection('features') },
    { name: 'User Guide', onClick: () => scrollToSection('user-guide') },
    { name: 'About', onClick: () => scrollToSection('about') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#0070BA]">FinanceApp</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={item.onClick}
                className="text-gray-700 hover:text-[#0070BA] font-medium transition-colors cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {state.isAuthenticated ? (
              <Button
                onClick={() => navigate('/spaces')}
                className="!bg-[#0070BA] hover:!bg-[#005a94] !text-white font-semibold"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-[#0070BA]"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="!bg-[#0070BA] hover:!bg-[#005a94] !text-white font-semibold"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-[#0070BA] p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="text-left text-gray-700 hover:text-[#0070BA] font-medium px-2 py-2 transition-colors"
                >
                  {item.name}
                </button>
              ))}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {state.isAuthenticated ? (
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate('/spaces');
                      setMobileMenuOpen(false);
                    }}
                    className="!bg-[#0070BA] hover:!bg-[#005a94] !text-white font-semibold"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => {
                        navigate('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="border-2 border-[#0070BA] text-[#0070BA]"
                    >
                      Log In
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => {
                        navigate('/register');
                        setMobileMenuOpen(false);
                      }}
                      className="!bg-[#0070BA] hover:!bg-[#005a94] !text-white font-semibold"
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
