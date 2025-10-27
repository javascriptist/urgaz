/**
 * Payme Payment Service - Vanilla JavaScript
 * 
 * Usage:
 * 1. Import this file in your HTML
 * 2. Call PaymeService.createPayment(orderId, amount)
 * 3. User will be redirected to Payme checkout
 */

class PaymeService {
  constructor(config) {
    this.backendUrl = config.backendUrl;
    this.publishableKey = config.publishableKey;
  }

  /**
   * Check if Payme is enabled on the backend
   * @returns {Promise<boolean>}
   */
  async isEnabled() {
    try {
      const response = await fetch(`${this.backendUrl}/store/custom`, {
        method: 'GET',
        headers: {
          'x-publishable-api-key': this.publishableKey
        }
      });

      const data = await response.json();
      return data.paymeEnabled === true;
    } catch (error) {
      console.error('Failed to check Payme status:', error);
      return false;
    }
  }

  /**
   * Create a Payme payment and redirect to checkout
   * @param {string} orderId - Your order ID
   * @param {number} amount - Amount in UZS
   * @param {string} returnUrl - Optional return URL after payment
   * @returns {Promise<void>}
   */
  async createPayment(orderId, amount, returnUrl = null) {
    try {
      // Validate inputs
      if (!orderId || !amount) {
        throw new Error('orderId and amount are required');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Create payment receipt
      const response = await fetch(`${this.backendUrl}/store/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': this.publishableKey
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

    } catch (error) {
      console.error('Payme payment error:', error);
      throw error;
    }
  }

  /**
   * Create payment with loading state and error handling
   * @param {string} orderId
   * @param {number} amount
   * @param {Object} callbacks - { onLoading, onSuccess, onError }
   */
  async createPaymentWithCallbacks(orderId, amount, callbacks = {}) {
    const { onLoading, onSuccess, onError } = callbacks;

    try {
      if (onLoading) onLoading(true);

      await this.createPayment(orderId, amount);

      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
    } finally {
      if (onLoading) onLoading(false);
    }
  }
}

// Example usage:
/*
const paymeService = new PaymeService({
  backendUrl: 'https://your-backend.com',
  publishableKey: 'pk_your_key_here'
});

// Check if enabled
const isEnabled = await paymeService.isEnabled();
console.log('Payme enabled:', isEnabled);

// Create payment
await paymeService.createPayment('order_123', 50000);

// Or with callbacks
await paymeService.createPaymentWithCallbacks('order_123', 50000, {
  onLoading: (loading) => console.log('Loading:', loading),
  onSuccess: () => console.log('Redirecting to Payme...'),
  onError: (error) => console.error('Payment failed:', error)
});
*/

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymeService;
}

// Export for browser globals
if (typeof window !== 'undefined') {
  window.PaymeService = PaymeService;
}
