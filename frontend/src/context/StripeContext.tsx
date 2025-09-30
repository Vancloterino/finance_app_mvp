import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { paymentsApi } from '../api/services';

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get Stripe config from backend
        const config = await paymentsApi.getStripeConfig();

        if (!config.publishable_key) {
          throw new Error('Stripe publishable key not configured');
        }

        // Initialize Stripe
        const stripeInstance = await loadStripe(config.publishable_key);

        if (!stripeInstance) {
          throw new Error('Failed to initialize Stripe');
        }

        setStripe(stripeInstance);
      } catch (err: any) {
        console.error('Failed to initialize Stripe:', err);
        setError(err.message || 'Failed to initialize payment system');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);

  const value: StripeContextType = {
    stripe,
    isLoading,
    error
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};