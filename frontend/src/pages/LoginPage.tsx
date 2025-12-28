import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const { state, login } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (state.isAuthenticated) {
    return <Navigate to="/spaces" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back! Successfully logged in.');
      navigate('/spaces');
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid md:grid-cols-2 min-h-screen">
        {/* Left Side - Image/Branding */}
        <div className="hidden md:flex bg-[#0070BA] text-white flex-col justify-center items-center p-12 relative overflow-hidden">
          <div className="max-w-md z-10">
            <h1 className="text-4xl font-bold mb-6">Welcome back</h1>
            <p className="text-xl text-blue-100 mb-8">
              Sign in to manage your shared spaces and track group finances effortlessly.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-blue-100">Secure group payments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-blue-100">Transparent expense tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-blue-100">Democratic decision making</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFFFFF" d="M45.7,-57.8C58.9,-47.3,69.2,-33.6,73.1,-18.1C77,-2.6,74.5,14.7,67.5,29.4C60.5,44.1,49,56.2,35.1,63.1C21.2,70,-1.1,71.7,-21.8,66.9C-42.5,62.1,-61.6,50.8,-71.4,34.4C-81.2,18,-81.7,-3.5,-75.8,-22.1C-69.9,-40.7,-57.6,-56.4,-42.8,-66.5C-28,-76.6,-11.2,-81.1,3.5,-85.4C18.2,-89.7,32.5,-68.3,45.7,-57.8Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-6 md:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Log in to your account
              </h2>
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-[#0070BA] hover:text-[#005a94] transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#0070BA] focus:ring-[#0070BA] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-[#0070BA] hover:text-[#005a94] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!formData.email || !formData.password}
                className="bg-[#0070BA] hover:bg-[#005a94] text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Signing in...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 text-gray-500">New here?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/register">
                  <Button
                    variant="secondary"
                    fullWidth
                    className="border-2 border-[#0070BA] text-[#0070BA] hover:bg-[#0070BA] hover:text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    Create an account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
