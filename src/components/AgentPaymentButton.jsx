import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/config/config';

export default function AgentPaymentButton({ amount, onPaymentSuccess, disabled, customAmount, totalDue, autoTrigger }) {
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);
  
  // Razorpay safe transaction limit - start with a very conservative limit
  // This will be automatically reduced if Razorpay rejects it
  const RAZORPAY_SAFE_LIMIT = 25000; // ₹25,000 - very conservative limit that should work with all accounts

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

  // Process a single payment with automatic retry on amount limit error
  const processSinglePayment = async (paymentAmount, paymentNumber, totalPayments, token, retryWithSmallerAmount = false) => {
    return new Promise((resolve, reject) => {
      // If retrying with smaller amount, reduce it by half
      const actualAmount = retryWithSmallerAmount ? Math.floor(paymentAmount / 2) : paymentAmount;
      
      // Create Razorpay order for this payment
      axios.post(
        '/api/agent/payment/create-order',
        { 
          amount: actualAmount,
          description: `Payment ${paymentNumber}/${totalPayments} for stock received from admin`
        },
        {
          headers: { Authorization: token },
        }
      )
      .then(orderResponse => {
        const orderResult = orderResponse.data;

        if (!orderResult || !orderResult.orderId) {
          // Check if it's an amount limit error from backend
          const errorMsg = orderResult?.error || 'Failed to create payment order';
          if (errorMsg.toLowerCase().includes('amount exceeds') && !retryWithSmallerAmount && actualAmount > 1000) {
            // Retry with smaller amount
            console.log(`Retrying payment with smaller amount: ${Math.floor(actualAmount / 2)}`);
            return processSinglePayment(paymentAmount, paymentNumber, totalPayments, token, true)
              .then(resolve)
              .catch(reject);
          }
          reject(new Error(errorMsg));
          return;
        }

        if (!orderResult.keyId) {
          reject(new Error('Payment gateway configuration error. Please contact support.'));
          return;
        }

        // Initialize Razorpay checkout
        const options = {
          key: orderResult.keyId,
          amount: orderResult.amount,
          currency: orderResult.currency || 'INR',
          name: 'GASCo',
          description: `Payment ${paymentNumber}/${totalPayments} - ₹${actualAmount.toLocaleString()}`,
          order_id: orderResult.orderId,
          handler: async function (response) {
            try {
              // Verify payment
              const verifyResponse = await axios.post(
                '/api/agent/payment/verify',
                {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  amount: actualAmount,
                  totalDue: totalDue || amount, // Pass totalDue if provided
                  description: `Payment ${paymentNumber}/${totalPayments} for stock received from admin`,
                },
                {
                  headers: { Authorization: token },
                }
              );

              resolve({ ...verifyResponse.data, actualAmount, remainingAmount: paymentAmount - actualAmount });
            } catch (error) {
              console.error('Payment verification error:', error);
              const errorMessage = error?.response?.data?.error 
                || error?.message 
                || 'Payment verification failed';
              reject(new Error(errorMessage));
            }
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              reject(new Error('Payment cancelled by user'));
            },
          },
          notes: {
            paymentType: 'agent_to_admin',
            amount: actualAmount.toString(),
            paymentNumber: paymentNumber.toString(),
            totalPayments: totalPayments.toString(),
          },
        };

        const razorpay = new window.Razorpay(options);
        
        // Add error handlers
        razorpay.on('payment.failed', function (response) {
          console.error('Payment failed:', response);
          const error = response.error || response;
          const errorMsg = error.description || error.message || 'Payment failed. Please try again.';
          
          // Check if it's an amount limit error
          if (errorMsg.toLowerCase().includes('amount exceeds maximum') || 
              error.code === 'BAD_REQUEST_ERROR') {
            reject(new Error('AMOUNT_LIMIT_EXCEEDED'));
            return;
          }
          
          reject(new Error(errorMsg));
        });

        razorpay.on('error', function (error) {
          console.error('Razorpay error:', error);
          const errorObj = error.error || error;
          const errorMsg = errorObj.description || errorObj.message || 'Payment gateway error. Please try again.';
          
          // Check if it's an amount limit error - mark it so the outer handler can retry
          if ((errorMsg.toLowerCase().includes('amount exceeds maximum') || 
               errorObj.code === 'BAD_REQUEST_ERROR' ||
               errorObj.field === 'amount' ||
               errorObj.reason === 'input_validation_failed')) {
            // Reject with a special error that indicates we should retry with smaller amount
            reject(new Error('AMOUNT_LIMIT_EXCEEDED'));
            return;
          }
          
          reject(new Error(errorMsg));
        });

        // Open Razorpay checkout
        try {
          razorpay.open();
        } catch (openError) {
          console.error('Error opening Razorpay checkout:', openError);
          reject(new Error('Failed to open payment gateway. Please try again or contact support.'));
        }
      })
      .catch(error => {
        const errorMsg = error?.response?.data?.error || error?.message || 'Failed to create payment order';
        // Check if it's an amount limit error from backend
        if (errorMsg.toLowerCase().includes('amount exceeds') && !retryWithSmallerAmount && paymentAmount > 1000) {
          console.log(`Backend rejected amount ${paymentAmount}, retrying with smaller amount`);
          // Retry with smaller amount
          return processSinglePayment(paymentAmount, paymentNumber, totalPayments, token, true)
            .then(resolve)
            .catch(reject);
        }
        reject(error);
      });
    });
  };

  const handlePayment = async () => {
    // Use customAmount if provided, otherwise use full amount
    const paymentAmount = customAmount && customAmount > 0 ? customAmount : amount;
    
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    if (customAmount && customAmount > amount) {
      toast.error('Online payment amount cannot exceed unpaid amount');
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

      // Always split payments into smaller chunks to avoid Razorpay limits
      // This ensures any amount can be processed
      const payments = [];
      let remainingAmount = paymentAmount;
      let paymentNumber = 1;

      while (remainingAmount > 0) {
        const chunkAmount = Math.min(remainingAmount, RAZORPAY_SAFE_LIMIT);
        payments.push({
          amount: chunkAmount,
          number: paymentNumber,
        });
        remainingAmount -= chunkAmount;
        paymentNumber++;
      }

      const totalPayments = payments.length;
      
      if (totalPayments > 1) {
        toast.info(`Payment of ₹${paymentAmount.toLocaleString()} will be processed in ${totalPayments} transactions of up to ₹${RAZORPAY_SAFE_LIMIT.toLocaleString()} each.`, { duration: 6000 });
      }

      // Process payments sequentially, handling any remaining amounts from retries
      const results = [];
      let actualTotalPaid = 0;
      
      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        setProcessingPayment({
          current: payment.number,
          total: totalPayments,
          amount: payment.amount,
        });

        try {
          const result = await processSinglePayment(
            payment.amount,
            payment.number,
            totalPayments,
            token
          );
          
          results.push(result);
          const paidAmount = result.actualAmount || payment.amount;
          actualTotalPaid += paidAmount;
          
          // If payment was split due to limit, we need to handle the remaining amount
          if (result.remainingAmount && result.remainingAmount > 0) {
            // Add remaining amount to next payment or create new payment
            if (i + 1 < payments.length) {
              payments[i + 1].amount += result.remainingAmount;
            } else {
              // Add as new payment
              payments.push({
                amount: result.remainingAmount,
                number: payments.length + 1,
              });
            }
          }
          
          if (payment.number < payments.length) {
            toast.success(`Payment ${payment.number}/${payments.length} of ₹${paidAmount.toLocaleString()} completed!`, { duration: 3000 });
            // Small delay between payments
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Payment ${payment.number} failed:`, error);
          
          // Check if it's an amount limit error - automatically reduce and retry
          if (error.message === 'AMOUNT_LIMIT_EXCEEDED' || 
              error.message.toLowerCase().includes('amount exceeds')) {
            
            if (payment.amount > 1000) {
              // Reduce amount by half and retry
              const newAmount = Math.floor(payment.amount / 2);
              toast.warning(
                `Payment amount ₹${payment.amount.toLocaleString()} exceeds limit. Reducing to ₹${newAmount.toLocaleString()} and retrying...`, 
                { duration: 4000 }
              );
              
              // Update payment amount and add remainder to next payment or create new one
              const remainder = payment.amount - newAmount;
              payment.amount = newAmount;
              
              if (remainder > 0) {
                if (i + 1 < payments.length) {
                  payments[i + 1].amount += remainder;
                } else {
                  payments.push({
                    amount: remainder,
                    number: payments.length + 1,
                  });
                }
              }
              
              // Retry this payment with smaller amount
              i--; // Go back to retry this payment
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            } else {
              // Amount is already too small, this is a real error
              setLoading(false);
              setProcessingPayment(null);
              toast.error(`Payment failed: Amount ₹${payment.amount.toLocaleString()} is too small or account has very low limits. Please contact admin.`);
              return;
            }
          }
          
          // Other errors
          setLoading(false);
          setProcessingPayment(null);
          toast.error(`Payment ${payment.number}/${payments.length} failed: ${error.message}`);
          return; // Stop processing remaining payments
        }
      }

      setProcessingPayment(null);
      if (totalPayments > 1) {
        toast.success(`All ${totalPayments} payments completed! Total paid: ₹${actualTotalPaid.toLocaleString()}`, { duration: 5000 });
      } else {
        toast.success(`Payment of ₹${actualTotalPaid.toLocaleString()} completed successfully!`);
      }
      
      if (onPaymentSuccess) {
        onPaymentSuccess(results[results.length - 1] || { success: true, totalAmount: actualTotalPaid });
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      const errorMessage = error?.response?.data?.error 
        || error?.message 
        || 'Failed to initialize payment';
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
      setProcessingPayment(null);
    }
  };

  // Auto-trigger payment if autoTrigger prop is true
  useEffect(() => {
    if (autoTrigger && !loading && !processingPayment) {
      const paymentAmount = customAmount && customAmount > 0 ? customAmount : amount;
      if (paymentAmount > 0 && window.Razorpay) {
        // Small delay to ensure everything is ready
        const timer = setTimeout(() => {
          handlePayment();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrigger]);

  const getButtonText = () => {
    const paymentAmount = customAmount && customAmount > 0 ? customAmount : amount;
    if (processingPayment) {
      return `Processing Payment ${processingPayment.current}/${processingPayment.total} (₹${processingPayment.amount.toLocaleString()})...`;
    }
    if (loading) {
      return 'Processing...';
    }
    const numPayments = Math.ceil(paymentAmount / RAZORPAY_SAFE_LIMIT);
    if (numPayments > 1) {
      return `Pay ₹${paymentAmount.toLocaleString()} Online (${numPayments} payments)`;
    }
    if (customAmount && customAmount > 0) {
      return `Pay ₹${paymentAmount.toLocaleString()} Online (Partial)`;
    }
    return `Pay ₹${paymentAmount.toLocaleString()} Online`;
  };

  const paymentAmount = customAmount && customAmount > 0 ? customAmount : amount;
  
  return (
    <Button
      onClick={handlePayment}
      disabled={loading || disabled || paymentAmount <= 0}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading || processingPayment ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {getButtonText()}
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {getButtonText()}
        </>
      )}
    </Button>
  );
}

