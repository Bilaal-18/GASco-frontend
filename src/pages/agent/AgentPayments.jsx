import { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  DollarSign,
  Calendar,
  Package,
  CreditCard,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import axios from "@/config/config";
import { toast } from "sonner";
import AgentPaymentButton from "@/components/AgentPaymentButton";

export default function AgentPayments() {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [stockInfo, setStockInfo] = useState({
    totalStockAmount: 0,
    unpaidStockAmount: 0,
    paidStockAmount: 0,
    unpaidStocks: [],
  });
  const [loading, setLoading] = useState(true);
  const [onlinePaymentDialogOpen, setOnlinePaymentDialogOpen] = useState(false);
  const [onlinePaymentAmount, setOnlinePaymentAmount] = useState("");
  const [processingOnlinePayment, setProcessingOnlinePayment] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPaymentHistory();
  }, [token]);

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) return;
    
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      toast.error('Failed to load payment gateway. Please refresh the page.');
    };
    document.body.appendChild(script);
  }, []);

  const fetchPaymentHistory = async () => {
    if (!token) {
      toast.error("Authentication token not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // This endpoint should be added to backend - for now using a placeholder
      const res = await axios.get("/api/agent/payment/history", {
        headers: { Authorization: token },
      });

      const data = res.data || {};
      setPaymentHistory(data.payments || []);
      
      const stockInfoData = {
        totalStockAmount: data.stockInfo?.totalStockAmount || 0,
        unpaidStockAmount: data.stockInfo?.unpaidStockAmount || 0,
        paidStockAmount: data.stockInfo?.paidStockAmount || 0,
        unpaidStocks: data.stockInfo?.unpaidStocks || [],
      };
      
      // Debug logging
      console.log('Agent Payment History Data:', {
        stockInfo: stockInfoData,
        paymentsCount: data.payments?.length || 0,
        rawData: data.stockInfo
      });
      
      setStockInfo(stockInfoData);
    } catch (err) {
      console.error("Error fetching agent payment history:", err);
      // If endpoint doesn't exist, set empty data
      if (err?.response?.status === 404) {
        setPaymentHistory([]);
        setStockInfo({
          totalStockAmount: 0,
          unpaidStockAmount: 0,
          paidStockAmount: 0,
          unpaidStocks: [],
        });
      } else {
        toast.error(err?.response?.data?.error || "Failed to fetch payment history");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    const paymentAmount = parseFloat(onlinePaymentAmount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Allow agent to enter any desired amount (not limited to unpaid amount)
    if (paymentAmount < 1) {
      toast.error("Minimum payment amount is ₹1");
      return;
    }

    try {
      setProcessingOnlinePayment(true);

      // Wait for Razorpay SDK to load
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

      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Create Razorpay order
      const orderResponse = await axios.post(
        '/api/agent/payment/create-order',
        { 
          amount: paymentAmount,
          description: `Online payment for stock received from admin`
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
        description: `Payment - ₹${paymentAmount.toLocaleString()}`,
        order_id: orderResult.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(
              '/api/agent/payment/verify',
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: paymentAmount,
                totalDue: stockInfo.unpaidStockAmount,
                description: `Online payment for stock received from admin`,
              },
              {
                headers: { Authorization: token },
              }
            );

            toast.success('Online payment completed successfully!');
            setOnlinePaymentDialogOpen(false);
            setOnlinePaymentAmount("");
            // Refresh payment history after a short delay to ensure backend has processed
            setTimeout(async () => {
              await fetchPaymentHistory();
            }, 1000);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error?.response?.data?.error || 'Payment verification failed');
          } finally {
            setProcessingOnlinePayment(false);
          }
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setProcessingOnlinePayment(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        const error = response.error || response;
        const errorMsg = error.description || error.message || 'Payment failed. Please try again.';
        toast.error(errorMsg);
        setProcessingOnlinePayment(false);
      });

      razorpay.on('error', function (error) {
        console.error('Razorpay error:', error);
        const errorObj = error.error || error;
        const errorMsg = errorObj.description || errorObj.message || 'Payment gateway error. Please try again.';
        toast.error(errorMsg);
        setProcessingOnlinePayment(false);
      });

      // Open Razorpay checkout - this will open the payment modal
      razorpay.open();
      
      // Close dialog after Razorpay opens (payment modal is now open)
      setOnlinePaymentDialogOpen(false);
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      const errorMessage = error?.response?.data?.error 
        || error?.message 
        || 'Failed to initialize payment';
      toast.error(errorMessage, { duration: 5000 });
      setProcessingOnlinePayment(false);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMethodBadge = (method) => {
    if (method === "razorpay" || method === "online") {
      return (
        <Badge className="bg-purple-500 text-white">
          <CreditCard className="w-3 h-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500 text-white">
        <DollarSign className="w-3 h-3 mr-1" />
        Cash
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "completed" || status === "paid") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <AgentSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-blue-600" />
            Payment Status & Pay Admin
          </h1>
          <p className="text-gray-600">View your payment status and make payments for stock received</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stock Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">₹{stockInfo.totalStockAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Paid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <p className="text-3xl font-bold text-green-600">₹{stockInfo.paidStockAmount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unpaid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-500" />
                <p className="text-3xl font-bold text-orange-600">₹{stockInfo.unpaidStockAmount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{paymentHistory.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Unpaid Stock Alert */}
        {stockInfo.unpaidStockAmount > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-800">Outstanding Payment Required</p>
                    <p className="text-sm text-orange-600">
                      You have ₹{stockInfo.unpaidStockAmount.toLocaleString()} unpaid for stock received. 
                      Please make a payment to clear your dues.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setOnlinePaymentDialogOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Online
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unpaid Stock Details */}
        {stockInfo.unpaidStocks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Unpaid Stock Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Cylinder</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Price per Unit</th>
                      <th className="p-2 text-left">Total Amount</th>
                      <th className="p-2 text-left">Date Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockInfo.unpaidStocks.map((stock) => (
                      <tr key={stock._id} className="border-t hover:bg-gray-50">
                        <td className="p-2">{stock.cylinderId?.cylinderName || stock.cylinderId?.cylinderType || "N/A"}</td>
                        <td className="p-2">{stock.quantity || 0}</td>
                        <td className="p-2">₹{stock.cylinderId?.price?.toLocaleString() || 0}</td>
                        <td className="p-2 font-semibold">₹{stock.totalAmount?.toLocaleString() || 0}</td>
                        <td className="p-2">{formatDate(stock.assignedDate || stock.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentHistory.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No payment history found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paymentHistory.map((payment) => (
                  <Card key={payment._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-semibold text-lg">
                              Payment #{payment.transactionID?.slice(-8) || payment._id.slice(-8)}
                            </span>
                            {getMethodBadge(payment.method)}
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(payment.paymentDate || payment.createdAt)}
                            </p>
                            {payment.description && (
                              <p><strong>Description:</strong> {payment.description}</p>
                            )}
                            {payment.notes && (
                              <p><strong>Notes:</strong> {payment.notes}</p>
                            )}
                            {payment.transactionID && (
                              <p><strong>Transaction ID:</strong> {payment.transactionID}</p>
                            )}
                            {/* Partial Payment Details */}
                            {payment.status === "partial" && payment.method === "online" && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="font-semibold text-yellow-800 text-xs mb-1">Partial Payment</p>
                                <p className="text-xs">
                                  <strong>Online Paid:</strong> ₹{(payment.onlinePaid || 0).toLocaleString()}
                                </p>
                                <p className="text-xs">
                                  <strong>Cash Paid:</strong> ₹{(payment.cashPaid || 0).toLocaleString()}
                                </p>
                                <p className="text-xs">
                                  <strong>Remaining Cash:</strong> ₹{(payment.remainingCash || 0).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{payment.amount?.toLocaleString() || 0}
                          </p>
                          {payment.status === "partial" && (
                            <p className="text-sm text-orange-600 mt-1">
                              Remaining: ₹{(payment.remainingCash || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Payment Dialog */}
        <Dialog open={onlinePaymentDialogOpen} onOpenChange={setOnlinePaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay Online via Razorpay</DialogTitle>
              <DialogDescription>
                Enter the amount you want to pay manually. The payment will be processed securely through Razorpay.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded space-y-1 text-sm">
                <p><strong>Unpaid Amount:</strong> ₹{stockInfo.unpaidStockAmount.toLocaleString()}</p>
                <p className="text-gray-600">You can enter any desired amount to pay</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onlineAmount">Payment Amount (₹)</Label>
                <Input
                  id="onlineAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={onlinePaymentAmount}
                  onChange={(e) => setOnlinePaymentAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                  required
                />
                <p className="text-xs text-gray-500">
                  Unpaid Amount: ₹{stockInfo.unpaidStockAmount.toLocaleString()} | Enter any amount you want to pay
                </p>
                {onlinePaymentAmount && parseFloat(onlinePaymentAmount) > 0 && parseFloat(onlinePaymentAmount) < stockInfo.unpaidStockAmount && (
                  <p className="text-sm text-blue-600 font-medium">
                    Remaining amount after payment: ₹{(stockInfo.unpaidStockAmount - parseFloat(onlinePaymentAmount)).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p className="font-semibold mb-1">Note:</p>
                <p>Online payments are processed securely through Razorpay. You will be redirected to the payment gateway to complete the transaction.</p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOnlinePaymentDialogOpen(false);
                    setOnlinePaymentAmount("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleOnlinePayment}
                  disabled={processingOnlinePayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingOnlinePayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
}

