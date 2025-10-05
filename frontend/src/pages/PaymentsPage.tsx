import React, { useState } from 'react';
import PaymentMethodsList from '../components/payments/PaymentMethodsList';
import PaymentMethodSetupModal from '../components/payments/PaymentMethodSetupModal';
import PaymentHistory from '../components/payments/PaymentHistory';
import { CreditCard, Shield, Info } from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePaymentMethodAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-xl flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
        </div>
        <p className="text-gray-600 ml-15">
          Manage your payment methods for group expenses and shared costs.
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-sm text-green-900">
            <p className="font-semibold mb-1">Secure & Protected</p>
            <p className="text-green-700">
              Your payment information is encrypted and securely processed by Stripe.
              We never store your full card details on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-[#0070BA]" />
          </div>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">How Group Payments Work</p>
            <ul className="space-y-1.5 text-blue-700">
              <li className="flex items-start gap-2">
                <span className="text-[#0070BA] font-bold mt-0.5">→</span>
                <span>Add a payment method to participate in shared expenses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0070BA] font-bold mt-0.5">→</span>
                <span>When a payout is approved, payments are split proportionally</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0070BA] font-bold mt-0.5">→</span>
                <span>You'll only be charged for your share of approved expenses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0070BA] font-bold mt-0.5">→</span>
                <span>All transactions are secure and trackable</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <PaymentMethodsList
          onAddPaymentMethod={() => setIsSetupModalOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <PaymentHistory />
      </div>

      {/* Setup Modal */}
      <PaymentMethodSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSuccess={handlePaymentMethodAdded}
      />
    </div>
  );
};

export default PaymentsPage;