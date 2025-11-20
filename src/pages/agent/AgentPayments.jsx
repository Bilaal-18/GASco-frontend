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
      toast.error("Authentication token not found");
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

    if (paymentAmount > stockInfo.unpaidStockAmount) {
      toast.error("Online payment amount cannot exceed unpaid amount");
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
          <h1 className="text-2xl font-bold mb-4">Pay Admin</h1>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Stock Amount</div>
              <div className="text-2xl font-bold">₹{stockInfo.totalStockAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Paid Amount</div>
              <div className="text-2xl font-bold">₹{stockInfo.paidStockAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Unpaid Amount</div>
              <div className="text-2xl font-bold">₹{stockInfo.unpaidStockAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Payments</div>
              <div className="text-2xl font-bold">{paymentHistory.length}</div>
            </CardContent>
          </Card>
        </div>

        {stockInfo.unpaidStockAmount > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Outstanding Payment: ₹{stockInfo.unpaidStockAmount.toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
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
                    }}
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
                        Pay ₹{stockInfo.unpaidStockAmount.toLocaleString()}
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setOnlinePaymentDialogOpen(true)} variant="outline">
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
              <div className="mb-4 font-semibold">Unpaid Stock Details</div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cylinder</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price per Unit</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Date Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockInfo.unpaidStocks.map((stock) => (
                      <TableRow key={stock._id}>
                        <TableCell>{stock.cylinderId?.cylinderName || stock.cylinderId?.cylinderType || "N/A"}</TableCell>
                        <TableCell>{stock.quantity || 0}</TableCell>
                        <TableCell>₹{stock.cylinderId?.price?.toLocaleString() || 0}</TableCell>
                        <TableCell>₹{stock.totalAmount?.toLocaleString() || 0}</TableCell>
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
            <div className="mb-4 font-semibold">Payment History</div>
            {paymentHistory.length === 0 ? (
              <div className="text-center py-8">No payment history found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{payment.transactionID?.slice(-8) || payment._id.slice(-8)}</TableCell>
                        <TableCell>₹{payment.amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          {payment.method === "razorpay" || payment.method === "online" ? "Online" : "Cash"}
                        </TableCell>
                        <TableCell>
                          {payment.status === "completed" || payment.status === "paid" ? "Paid" : "Pending"}
                        </TableCell>
                        <TableCell>{formatDate(payment.paymentDate || payment.createdAt)}</TableCell>
                        <TableCell>{payment.description || payment.notes || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={onlinePaymentDialogOpen} onOpenChange={setOnlinePaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay Online</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={stockInfo.unpaidStockAmount}
                  value={onlinePaymentAmount}
                  onChange={(e) => setOnlinePaymentAmount(e.target.value)}
                  placeholder={`Max: ₹${stockInfo.unpaidStockAmount.toLocaleString()}`}
                />
                <div className="text-sm text-gray-500">
                  Unpaid: ₹{stockInfo.unpaidStockAmount.toLocaleString()}
                </div>
                {onlinePaymentAmount && parseFloat(onlinePaymentAmount) > 0 && (
                  <div className="text-sm">
                    Remaining: ₹{(stockInfo.unpaidStockAmount - parseFloat(onlinePaymentAmount)).toLocaleString()}
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

