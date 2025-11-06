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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
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

      // Create Razorpay order
      const orderResult = await dispatch(
        createPaymentOrder(booking._id)
      ).unwrap();

      if (!orderResult || !orderResult.orderId) {
        throw new Error('Failed to create payment order');
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: 'GASCo',
        description: `Payment for booking #${booking._id?.slice(-8).toUpperCase()}`,
        order_id: orderResult.orderId,
        handler: async function (response) {
          try {
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
            toast.error(error || 'Payment verification failed');
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
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }
    } catch (error) {
      toast.error(error || 'Failed to initialize payment');
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

