import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPaymentOrder, verifyPayment, clearPaymentError } from '@/store/slices/customer/paymentSlice';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentButton({ booking, onPaymentSuccess }) {
  const dispatch = useDispatch();
  const { paymentLoading, paymentError, currentOrder } = useSelector(
    (state) => state.payment
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentError) {
      toast.error(paymentError);
      dispatch(clearPaymentError());
    }
  }, [paymentError, dispatch]);

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
    if (!booking || !booking._id) {
      toast.error('Invalid booking information');
      return;
    }

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      toast.info('This booking is already paid');
      return;
    }

    // Check if booking is delivered - payment only allowed after delivery
    if (booking.status !== 'delivered') {
      toast.error('Payment can only be made after the cylinder is delivered. Please wait for delivery confirmation.');
      return;
    }

    // Check if payment method is online
    if (booking.paymentMethod !== 'online') {
      toast.error('This booking is set for cash payment. Please contact your agent for cash payment.');
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

      // Create Razorpay order
      const orderResult = await dispatch(
        createPaymentOrder(booking._id)
      ).unwrap();

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
        description: `Payment for booking #${booking._id?.slice(-8).toUpperCase()}`,
        order_id: orderResult.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            // Verify payment
            const verifyResult = await dispatch(
              verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookingId: booking._id,
              })
            ).unwrap();

            toast.success('Payment successful!');
            if (onPaymentSuccess) {
              onPaymentSuccess(verifyResult);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            const errorMessage = typeof error === 'string' 
              ? error 
              : error?.message || error?.error || 'Payment verification failed';
            toast.error(errorMessage);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: booking.customer?.username || booking.customer?.businessName || '',
          email: booking.customer?.email || '',
          contact: booking.customer?.phoneNo || '',
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
          bookingId: booking._id,
        },
      };

      const razorpay = new window.Razorpay(options);
      
      // Add error handler
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        setLoading(false);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.error || 'Failed to initialize payment';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Calculate total amount
  const totalAmount =
    (booking.quantity || 0) * (booking.cylinder?.price || 0);

  // Only show payment button if booking is delivered and payment method is online
  if (booking.status !== 'delivered' || booking.paymentMethod !== 'online') {
    return null;
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || paymentLoading || booking.paymentStatus === 'paid'}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading || paymentLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : booking.paymentStatus === 'paid' ? (
        'Paid'
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ₹{totalAmount.toLocaleString()}
        </>
      )}
    </Button>
  );
}

