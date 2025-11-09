import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/config/config';

export default function AgentPaymentButton({ amount, onPaymentSuccess, disabled }) {
  const [loading, setLoading] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      toast.error('Failed to load payment gateway. Please refresh the page.');
    };
    
    document.body.appendChild(script);

    // Cleanup function - only remove if we added it
    return () => {
      const scriptToRemove = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (scriptToRemove && scriptToRemove === script) {
        document.body.removeChild(scriptToRemove);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    try {
      setLoading(true);

      // Wait for Razorpay SDK to load if not already loaded
      if (!window.Razorpay) {
        // Wait up to 5 seconds for Razorpay to load
        let attempts = 0;
        while (!window.Razorpay && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Create Razorpay order
      const orderResponse = await axios.post(
        '/api/agent/payment/create-order',
        { 
          amount: amount,
          description: 'Payment for stock received from admin'
        },
        {
          headers: { Authorization: token },
        }
      );

      const orderResult = orderResponse.data;

      if (!orderResult || !orderResult.orderId) {
        throw new Error(orderResult?.error || 'Failed to create payment order');
      }

      if (!orderResult.keyId) {
        throw new Error('Payment gateway configuration error. Please contact support.');
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency || 'INR',
        name: 'GASCo',
        description: 'Payment to admin for stock received',
        order_id: orderResult.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            // Verify payment
            const verifyResponse = await axios.post(
              '/api/agent/payment/verify',
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: amount,
                description: 'Payment for stock received from admin',
              },
              {
                headers: { Authorization: token },
              }
            );

            toast.success('Payment successful!');
            if (onPaymentSuccess) {
              onPaymentSuccess(verifyResponse.data);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            const errorMessage = error?.response?.data?.error 
              || error?.message 
              || 'Payment verification failed';
            toast.error(errorMessage);
          } finally {
            setLoading(false);
          }
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info('Payment cancelled');
          },
        },
        notes: {
          paymentType: 'agent_to_admin',
          amount: amount.toString(),
        },
      };

      const razorpay = new window.Razorpay(options);
      
      // Add error handlers
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        setLoading(false);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });

      // Handle Razorpay internal errors (like phone validation) that don't block payment
      razorpay.on('error', function (error) {
        console.warn('Razorpay error (may be non-critical):', error);
        // Don't show error toast for validation errors - they're usually non-blocking
      });

      // Open Razorpay checkout
      razorpay.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      const errorMessage = error?.response?.data?.error 
        || error?.message 
        || 'Failed to initialize payment';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || disabled || amount <= 0}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ₹{amount.toLocaleString()} Online
        </>
      )}
    </Button>
  );
}

