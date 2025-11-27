import { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CreditCard } from "lucide-react";
import axios from "@/config/config";
import { toast } from "sonner";
import useRazorpayPayment from "@/utils/razorpay";

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
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const token = localStorage.getItem("token");
  const { handlePayment } = useRazorpayPayment();

  useEffect(() => {
    fetchPaymentHistory();
  }, [token]);

  const fetchPaymentHistory = async () => {
    if (!token) {
      toast.error("Please login to continue");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get("/api/payment/history", {
        params: { paymentType: 'agent' },
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
      toast.error(err?.response?.data?.error || "Failed to load payment information");
      setPaymentHistory([]);
      setStockInfo({
        totalStockAmount: 0,
        unpaidStockAmount: 0,
        paidStockAmount: 0,
        unpaidStocks: [],
      });
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

    if (paymentAmount > stockInfo.unpaidStockAmount) {
      toast.error("Payment amount cannot exceed unpaid amount");
      return;
    }

    setProcessingPayment(true);
    setOnlinePaymentDialogOpen(false);
    
    const success = await handlePayment({
      amount: paymentAmount,
      paymentType: "agent",
      totalDue: stockInfo.unpaidStockAmount,
      description: "Online payment for stock received from admin",
    });

    if (success) {
      setOnlinePaymentAmount("");
      setTimeout(() => {
        fetchPaymentHistory();
      }, 1000);
    }
    
    setProcessingPayment(false);
  };

  const handleFullPayment = async () => {
    setProcessingPayment(true);
    
    const success = await handlePayment({
      amount: stockInfo.unpaidStockAmount,
      paymentType: "agent",
      totalDue: stockInfo.unpaidStockAmount,
      description: "Online payment for stock received from admin",
    });

    if (success) {
      setTimeout(() => {
        fetchPaymentHistory();
      }, 1000);
    }
    
    setProcessingPayment(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AgentSidebar />
      <SidebarInset>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
            <p className="text-gray-600">Pay for stock received from admin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Total Stock Amount</div>
                <div className="text-2xl font-bold">₹{stockInfo.totalStockAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Paid Amount</div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{stockInfo.paidStockAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Unpaid Amount</div>
                <div className="text-2xl font-bold text-red-600">
                  ₹{stockInfo.unpaidStockAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Total Payments Made</div>
                <div className="text-2xl font-bold">{paymentHistory.length}</div>
              </CardContent>
            </Card>
          </div>

        {stockInfo.unpaidStockAmount > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    Outstanding Payment: ₹{stockInfo.unpaidStockAmount.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleFullPayment}
                    disabled={processingPayment}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Full Amount
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => setOnlinePaymentDialogOpen(true)} 
                    variant="outline"
                  >
                    Pay Partial Amount
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stockInfo.unpaidStocks.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="mb-4 font-semibold text-lg">Unpaid Stock Details</div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cylinder Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price per Unit</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Date Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockInfo.unpaidStocks.map((stock) => (
                      <TableRow key={stock._id}>
                        <TableCell>
                          {stock.cylinderId?.cylinderName || stock.cylinderId?.cylinderType || "N/A"}
                        </TableCell>
                        <TableCell>{stock.quantity || 0}</TableCell>
                        <TableCell>₹{(stock.cylinderId?.price || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(stock.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>{formatDate(stock.assignedDate || stock.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 font-semibold text-lg">Payment History</div>
            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment history found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => {
                      const transactionId = payment.transactionID?.slice(-8) || payment._id.slice(-8);
                      
                      const paymentMethod = 
                        payment.method === "razorpay" || payment.method === "online" 
                          ? "Online" 
                          : "Cash";
                      
                      const paymentStatus = 
                        payment.status === "completed" || payment.status === "paid" 
                          ? "Paid" 
                          : "Pending";
                      
                      return (
                        <TableRow key={payment._id}>
                          <TableCell className="font-mono text-sm">{transactionId}</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(payment.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>{paymentMethod}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              paymentStatus === "Paid" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(payment.paymentDate || payment.createdAt)}</TableCell>
                          <TableCell>{payment.description || payment.notes || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={onlinePaymentDialogOpen} onOpenChange={setOnlinePaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay Partial Amount</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Enter Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={stockInfo.unpaidStockAmount}
                  value={onlinePaymentAmount}
                  onChange={(e) => setOnlinePaymentAmount(e.target.value)}
                  placeholder={`Maximum: ₹${stockInfo.unpaidStockAmount.toLocaleString()}`}
                />
                
                <div className="text-sm text-gray-500">
                  Unpaid Amount: ₹{stockInfo.unpaidStockAmount.toLocaleString()}
                </div>
                
                {onlinePaymentAmount && parseFloat(onlinePaymentAmount) > 0 && (
                  <div className="text-sm font-medium">
                    Remaining After Payment: ₹{(stockInfo.unpaidStockAmount - parseFloat(onlinePaymentAmount)).toLocaleString()}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOnlinePaymentDialogOpen(false);
                    setOnlinePaymentAmount("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleOnlinePayment}
                  disabled={processingPayment || !onlinePaymentAmount}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ₹{parseFloat(onlinePaymentAmount || 0).toLocaleString()}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

