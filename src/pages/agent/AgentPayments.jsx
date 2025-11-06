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

export default function AgentPayments() {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [stockInfo, setStockInfo] = useState({
    totalStockAmount: 0,
    unpaidStockAmount: 0,
    paidStockAmount: 0,
    unpaidStocks: [],
  });
  const [loading, setLoading] = useState(true);
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false);
  const [cashPaymentAmount, setCashPaymentAmount] = useState("");
  const [cashPaymentDescription, setCashPaymentDescription] = useState("");
  const [cashPaymentNotes, setCashPaymentNotes] = useState("");
  const [submittingCashPayment, setSubmittingCashPayment] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPaymentHistory();
  }, [token]);

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
      setStockInfo({
        totalStockAmount: data.stockInfo?.totalStockAmount || 0,
        unpaidStockAmount: data.stockInfo?.unpaidStockAmount || 0,
        paidStockAmount: data.stockInfo?.paidStockAmount || 0,
        unpaidStocks: data.stockInfo?.unpaidStocks || [],
      });
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

  const handleCashPayment = async (e) => {
    e.preventDefault();
    
    if (!cashPaymentAmount || parseFloat(cashPaymentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(cashPaymentAmount) > stockInfo.unpaidStockAmount) {
      toast.error("Payment amount cannot exceed unpaid stock amount");
      return;
    }

    try {
      setSubmittingCashPayment(true);
      const res = await axios.post(
        "/api/agent/payment/cash",
        {
          amount: parseFloat(cashPaymentAmount),
          description: cashPaymentDescription || "Cash payment for stock received",
          notes: cashPaymentNotes,
        },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Cash payment recorded successfully!");
      setCashPaymentDialogOpen(false);
      setCashPaymentAmount("");
      setCashPaymentDescription("");
      setCashPaymentNotes("");
      await fetchPaymentHistory();
    } catch (err) {
      console.error("Error recording cash payment:", err);
      toast.error(err?.response?.data?.error || "Failed to record cash payment");
    } finally {
      setSubmittingCashPayment(false);
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
              <div className="flex items-center justify-between">
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
                <Button
                  onClick={() => setCashPaymentDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Cash Payment
                </Button>
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
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{payment.amount?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Payment Dialog */}
        <Dialog open={cashPaymentDialogOpen} onOpenChange={setCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Payment</DialogTitle>
              <DialogDescription>
                Record a cash payment made to admin for stock received
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCashPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={stockInfo.unpaidStockAmount}
                  value={cashPaymentAmount}
                  onChange={(e) => setCashPaymentAmount(e.target.value)}
                  placeholder={`Max: ₹${stockInfo.unpaidStockAmount.toLocaleString()}`}
                  required
                />
                <p className="text-xs text-gray-500">
                  Unpaid amount: ₹{stockInfo.unpaidStockAmount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  value={cashPaymentDescription}
                  onChange={(e) => setCashPaymentDescription(e.target.value)}
                  placeholder="Cash payment for stock received"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={cashPaymentNotes}
                  onChange={(e) => setCashPaymentNotes(e.target.value)}
                  placeholder="Additional notes"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCashPaymentDialogOpen(false);
                    setCashPaymentAmount("");
                    setCashPaymentDescription("");
                    setCashPaymentNotes("");
                  }}
                  disabled={submittingCashPayment}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingCashPayment} className="bg-blue-600 hover:bg-blue-700">
                  {submittingCashPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

