/**
 * Payme Payment Hook for React/Next.js
 * 
 * Usage:
 * import { usePayme } from './hooks/usePayme';
 * 
 * const { isEnabled, isLoading, error, createPayment } = usePayme();
 * await createPayment(orderId, amount);
 */

import { useState, useEffect } from 'react';

interface PaymeConfig {
  backendUrl?: string;
  publishableKey?: string;
}

interface PaymeHookReturn {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  createPayment: (orderId: string, amount: number, returnUrl?: string) => Promise<void>;
  checkStatus: () => Promise<void>;
}

export const usePayme = (config?: PaymeConfig): PaymeHookReturn => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get configuration from env or props
  const backendUrl = config?.backendUrl || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = config?.publishableKey || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  // Check Payme status
  const checkStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/store/custom`, {
        method: 'GET',
        headers: {
          'x-publishable-api-key': publishableKey || ''
        }
      });

      const data = await response.json();
      setIsEnabled(data.paymeEnabled === true);
    } catch (err) {
      console.error('Failed to check Payme status:', err);
      setIsEnabled(false);
    }
  };

  // Create payment
  const createPayment = async (
    orderId: string, 
    amount: number, 
    returnUrl?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!orderId || !amount) {
        throw new Error('orderId and amount are required');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!publishableKey) {
        throw new Error('Publishable key is not configured');
      }

      // Create payment receipt
      const response = await fetch(`${backendUrl}/store/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey
        },
        body: JSON.stringify({
          amount,
          orderId,
          returnUrl: returnUrl || window.location.href
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment creation failed');
      }

      const data = await response.json();

      if (!data.success || !data.data || !data.data._id) {
        throw new Error('Invalid response from payment gateway');
      }

      // Redirect to Payme checkout
      const checkoutUrl = `https://checkout.paycom.uz/${data.data._id}`;
      window.location.href = checkoutUrl;

    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      console.error('Payme payment error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  return {
    isEnabled,
    isLoading,
    error,
    createPayment,
    checkStatus
  };
};

export default usePayme;
