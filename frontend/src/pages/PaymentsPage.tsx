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
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
        </div>
        <p className="text-gray-600">
          Manage your payment methods for group expenses and shared costs.
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Secure & Protected</p>
            <p>
              Your payment information is encrypted and securely processed by Stripe.
              We never store your full card details on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">How Group Payments Work</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Add a payment method to participate in shared expenses</li>
              <li>• When a payout is approved, payments are split proportionally</li>
              <li>• You'll only be charged for your share of approved expenses</li>
              <li>• All transactions are secure and trackable</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <PaymentMethodsList
          onAddPaymentMethod={() => setIsSetupModalOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
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