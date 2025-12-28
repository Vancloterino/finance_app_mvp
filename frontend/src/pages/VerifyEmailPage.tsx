import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail, Loader } from 'lucide-react';
import { api } from '../api/client';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setIsLoading(false);
      setError('Invalid or missing verification token.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await api.post('/auth/verify-email', { token: verificationToken });
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to verify email. The link may have expired.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    // We don't have the email from the token, so ask user to go to resend page
    navigate('/resend-verification');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Verifying Your Email
            </h2>

            <p className="text-gray-600 text-center">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Email Verified Successfully!
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Your email has been verified. You can now log in to your account and start using FinanceApp.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 text-center">
                <strong>Welcome aboard!</strong> You now have full access to create spaces, manage shared expenses, and collaborate with your group.
              </p>
            </div>

            <p className="text-sm text-gray-500 text-center">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Verification Failed
          </h2>

          <p className="text-gray-600 text-center mb-6">
            {error}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Common reasons:</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1 ml-4 list-disc">
              <li>The verification link has expired (valid for 24 hours)</li>
              <li>You've already verified your email</li>
              <li>The link is invalid or corrupted</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              to="/resend-verification"
              className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-[#0070BA] to-[#005a94] text-white rounded-lg font-medium hover:from-[#005a94] hover:to-[#004d7a] transition-all"
            >
              <Mail className="h-5 w-5 mr-2" />
              Resend Verification Email
            </Link>
            <Link
              to="/login"
              className="block w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
