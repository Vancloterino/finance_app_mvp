import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (state.isAuthenticated) {
      navigate('/spaces');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Shared Finance Made Simple
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Manage shared expenses with transparency and fairness. Track contributions,
            handle payouts, and maintain financial harmony in your group.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold mb-2">Shared Spaces</h3>
              <p className="text-gray-600">
                Create spaces for roommates, friends, or family to manage shared expenses together.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-600 text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">Smart Tracking</h3>
              <p className="text-gray-600">
                Track contributions and expenses with our virtual ledger system - no money in escrow.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-purple-600 text-4xl mb-4">🗳️</div>
              <h3 className="text-lg font-semibold mb-2">Democratic Payouts</h3>
              <p className="text-gray-600">
                Group consent system ensures everyone agrees before payments are processed.
              </p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="min-w-[200px]"
            >
              Get Started
            </Button>
            {!state.isAuthenticated && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/register')}
                className="min-w-[200px]"
              >
                Create Account
              </Button>
            )}
          </div>

          {state.isAuthenticated && state.user && (
            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800">
                Welcome back, {state.user.name}! Ready to manage your shared finances?
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;