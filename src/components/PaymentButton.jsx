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

 
  useEffect(() => {
    if (window.Razorpay) {
      return;
    }

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

    if (booking.paymentStatus === 'paid') {
      toast.info('This booking is already paid');
      return;
    }

    if (booking.status !== 'delivered') {
      toast.error('Payment can only be made after the cylinder is delivered. Please wait for delivery confirmation.');
      return;
    }

    if (booking.paymentMethod !== 'online') {
      toast.error('This booking is set for cash payment. Please contact your agent for cash payment.');
      return;
    }

    try {
      setLoading(true);
      if (!window.Razorpay) {
        let attempts = 0;
        while (!window.Razorpay && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
        }
      }

      const orderResult = await dispatch(
        createPaymentOrder(booking._id)
      ).unwrap();

      if (!orderResult || !orderResult.orderId) {
        throw new Error(orderResult?.error || 'Failed to create payment order');
      }

      if (!orderResult.keyId) {
        throw new Error('Payment gateway configuration error. Please contact support.');
      }

      const formatPhoneNumber = (phone) => {
        if (!phone) {
          console.log('[Payment] No phone number provided');
          return '';
        }
        
        try {
        
          let phoneStr = phone.toString().trim();
          let cleaned = phoneStr.replace(/\D/g, '');
          
          console.log('[Payment] Phone number formatting:', {
            original: phoneStr,
            cleaned: cleaned,
            length: cleaned.length
          });
          
          if (cleaned.startsWith('91') && cleaned.length === 12) {
            cleaned = cleaned.substring(2);
            console.log('[Payment] Removed country code 91:', cleaned);
          }
          
          if (cleaned.length > 10) {
            cleaned = cleaned.slice(-10);
            console.log('[Payment] Extracted last 10 digits:', cleaned);
          }
          
          if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
            console.log('[Payment] Valid phone number formatted:', cleaned);
            return cleaned;
          }
          
          console.warn('[Payment] Invalid phone number format:', {
            original: phoneStr,
            cleaned: cleaned,
            length: cleaned.length,
            valid: cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)
          });
          
          return '';
        } catch (error) {
          console.error('[Payment] Error formatting phone number:', error);
          return '';
        }
      };

      const customerPhone = formatPhoneNumber(booking.customer?.phoneNo || '');
      const customerEmail = booking.customer?.email || '';
      const customerName = booking.customer?.username || booking.customer?.businessName || '';
      
      console.log('[Payment] Prefill data preparation:', {
        hasName: !!customerName,
        hasEmail: !!customerEmail,
        hasPhone: !!customerPhone,
        phoneLength: customerPhone.length,
        phoneValue: customerPhone ? '***' + customerPhone.slice(-3) : 'none'
      });

      const prefillData = {};
      
      if (customerName && customerName.trim()) {
        prefillData.name = customerName.trim();
      }
      
      if (customerEmail && customerEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
        prefillData.email = customerEmail.trim();
      }
      
      const isValidPhone = customerPhone && 
                          typeof customerPhone === 'string' &&
                          customerPhone.length === 10 && 
                          /^[6-9]\d{9}$/.test(customerPhone) &&
                          customerPhone === customerPhone.trim() && 
                          !/[^0-9]/.test(customerPhone); 
      
      if (isValidPhone) {
        prefillData.contact = customerPhone;
        console.log('[Payment] Including valid phone number in prefill');
      } else {
        console.log('[Payment] Skipping phone number in prefill - invalid or missing');
        console.log('[Payment] Phone validation:', {
          hasPhone: !!customerPhone,
          length: customerPhone?.length || 0,
          type: typeof customerPhone,
          matchesPattern: customerPhone ? /^[6-9]\d{9}$/.test(customerPhone) : false
        });
      
      }

      console.log('[Payment] Final prefill data (will be sent to Razorpay):', {
        fields: Object.keys(prefillData),
        hasContact: 'contact' in prefillData,
        contactValue: 'contact' in prefillData ? '***' + prefillData.contact.slice(-3) : 'not included'
      });

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
        
        ...(Object.keys(prefillData).length > 0 && { prefill: prefillData }),
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
    
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        setLoading(false);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });

      razorpay.on('error', function (error) {
        console.warn('Razorpay error (may be non-critical):', error);
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

  const totalAmount =
    (booking.quantity || 0) * (booking.cylinder?.price || 0);

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

