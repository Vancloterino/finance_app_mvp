import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types';
import { paymentsApi } from '../../api/services';
import Button from '../ui/Button';
import {
  CreditCard,
  Plus,
  Check,
  MoreHorizontal,
  Trash2,
  Star,
  AlertTriangle
} from 'lucide-react';

interface PaymentMethodsListProps {
  onAddPaymentMethod: () => void;
  refreshTrigger?: number;
}

const PaymentMethodsList: React.FC<PaymentMethodsListProps> = ({
  onAddPaymentMethod,
  refreshTrigger = 0
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, [refreshTrigger]);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await paymentsApi.getPaymentMethods();
      setPaymentMethods(response.payment_methods);
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setActionLoading(paymentMethodId);
      await paymentsApi.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to set default payment method:', err);
      // TODO: Show error toast
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setActionLoading(paymentMethodId);
      await paymentsApi.removePaymentMethod(paymentMethodId);
      await loadPaymentMethods(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to remove payment method:', err);
      // TODO: Show error toast
    } finally {
      setActionLoading(null);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // You could expand this with actual brand icons
    return <CreditCard className="h-6 w-6" />;
  };

  const getCardBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'text-blue-600';
      case 'mastercard':
        return 'text-red-600';
      case 'amex':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="secondary" onClick={loadPaymentMethods}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
          <p className="text-gray-600 mb-4">
            Add a payment method to participate in group expenses and payouts.
          </p>
          <Button onClick={onAddPaymentMethod}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
            <Button variant="secondary" size="sm" onClick={onAddPaymentMethod}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <div
                key={method.id}
                className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${getCardBrandColor(method.card?.brand || '')}`}>
                      {getCardBrandIcon(method.card?.brand || '')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
                        </p>
                        {index === 0 && (
                          <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            <Star className="h-3 w-3" />
                            <span>Default</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Expires {method.card?.exp_month}/{method.card?.exp_year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {index !== 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={actionLoading === method.id}
                        loading={actionLoading === method.id}
                      >
                        <Check className="h-4 w-4" />
                        Set Default
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(method.id)}
                      disabled={actionLoading === method.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentMethodsList;