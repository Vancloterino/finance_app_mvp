import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useStripe as useStripeContext } from '../../context/StripeContext';
import { paymentsApi } from '../../api/services';
import { CreditCard, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface PaymentMethodSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentMethodSetupForm: React.FC<PaymentMethodSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system not initialized');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create setup intent on backend
      const { client_secret } = await paymentsApi.createSetupIntent();

      // Confirm the setup intent with the card
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to setup payment method');
      }

      if (setupIntent?.status === 'succeeded') {
        onSuccess();
        onClose();
      } else {
        throw new Error('Setup intent was not successful');
      }
    } catch (err: any) {
      console.error('Payment method setup failed:', err);
      setError(err.message || 'Failed to setup payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setIsReady(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment Method">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Secure Payment Setup</p>
              <p>
                Your payment information is securely processed by Stripe. We don't store your card details.
                This payment method will be used for group expenses when payouts are processed.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !isReady || !stripe}
              loading={isProcessing}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing ? 'Setting up...' : 'Add Payment Method'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const PaymentMethodSetupModal: React.FC<PaymentMethodSetupModalProps> = (props) => {
  const { stripe, isLoading, error } = useStripeContext();

  if (isLoading) {
    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose} title="Add Payment Method">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing payment system...</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (error || !stripe) {
    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose} title="Payment Setup Error">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment System Unavailable</h3>
          <p className="text-gray-600 mb-4">
            {error || 'Unable to initialize the payment system. Please try again later.'}
          </p>
          <Button variant="secondary" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Elements stripe={stripe}>
      <PaymentMethodSetupForm {...props} />
    </Elements>
  );
};

export default PaymentMethodSetupModal;