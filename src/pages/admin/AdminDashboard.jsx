import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/config/config";
import userContext from "@/context/UserContext";
import Sidebar from "@/components/layout/SideBar";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
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
import { Users, UserCog, Package, Wallet, ArrowRight, AlertCircle, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useContext(userContext);
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    agents: 0,
    customers: 0,
    stock: 0,
    paymentsReceived: 0,
    pendingAmount: 0,
  });
  const [agents, setAgents] = useState([]);
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashDescription, setCashDescription] = useState("");
  const [recordingCashPayment, setRecordingCashPayment] = useState(false);

  const fetchSummary = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized — please login again");
      return;
    }

    try {
      const [agentsRes, customersRes, stockRes, paymentsRes] = await Promise.all([
        axios.get("/api/distributors", {
          headers: { Authorization: token },
        }),
        axios.get("/api/customers", {
          headers: { Authorization: token },
        }),
        axios.get("/api/all", {
          headers: { Authorization: token },
        }),
        axios.get("/api/admin/agent-payments", {
          headers: { Authorization: token },
        }).catch(() => ({ data: { payments: [] } })),
      ]);

      const inventaryArray = stockRes.data?.Inventary || [];

      const totalStock = inventaryArray.reduce(
        (sum, item) => sum + (item.totalQuantity || 0),
        0
      );

      const payments = paymentsRes.data?.payments || [];
      // Calculate total payments received correctly (accounting for partial payments)
      // For partial/paid/completed payments: prefer onlinePaid + cashPaid if available, otherwise use amount
      // For pending/failed payments: don't count them
      const totalPayments = payments.reduce((sum, p) => {
        // Skip pending or failed payments
        if (p.status === 'pending' || p.status === 'failed') {
          return sum;
        }
        
        // For partial, paid, or completed payments, try to use onlinePaid + cashPaid first
        const onlinePaid = Number(p.onlinePaid || 0);
        const cashPaid = Number(p.cashPaid || 0);
        const hasPartialFields = onlinePaid > 0 || cashPaid > 0;
        
        if (hasPartialFields) {
          // If onlinePaid or cashPaid exists, use their sum
          return sum + onlinePaid + cashPaid;
        } else {
          // Otherwise, use the amount field
          return sum + (Number(p.amount || 0));
        }
      }, 0);

      // Calculate pending amount by fetching all agents and their pending amounts
      let totalPending = 0;
      try {
        const agents = agentsRes.data || [];
        const pendingAmounts = await Promise.all(
          agents.map(async (agent) => {
            try {
              // Get agent's stock
              let totalStockAmount = 0;
              try {
                const stockRes = await axios.get(`/api/ownStock/${agent._id}`, {
                  headers: { Authorization: token },
                });
                const stocks = stockRes.data?.Ownstock || stockRes.data?.stocks || stockRes.data || [];
                if (Array.isArray(stocks)) {
                  totalStockAmount = stocks.reduce((sum, s) => sum + (Number(s.totalAmount || 0)), 0);
                }
              } catch (stockError) {
                // If can't fetch stock, skip this agent
                return 0;
              }

              // Get agent's payments
              const agentPayments = payments.filter(p => 
                p.agent?._id === agent._id || p.agent === agent._id
              );
              
              // Calculate total paid
              // For partial/paid/completed payments: prefer onlinePaid + cashPaid if available, otherwise use amount
              // For pending/failed payments: don't count them
              const totalPaid = agentPayments.reduce((sum, p) => {
                // Skip pending or failed payments
                if (p.status === 'pending' || p.status === 'failed') {
                  return sum;
                }
                
                // For partial, paid, or completed payments, try to use onlinePaid + cashPaid first
                const onlinePaid = Number(p.onlinePaid || 0);
                const cashPaid = Number(p.cashPaid || 0);
                const hasPartialFields = onlinePaid > 0 || cashPaid > 0;
                
                if (hasPartialFields) {
                  // If onlinePaid or cashPaid exists, use their sum
                  return sum + onlinePaid + cashPaid;
                } else {
                  // Otherwise, use the amount field
                  return sum + (Number(p.amount || 0));
                }
              }, 0);

              // Pending = Total Stock - Total Paid
              const pending = Math.max(0, totalStockAmount - totalPaid);
              return pending;
            } catch (err) {
              return 0;
            }
          })
        );
        totalPending = pendingAmounts.reduce((sum, p) => sum + p, 0);
      } catch (pendingError) {
        console.error("Error calculating pending amount:", pendingError);
        totalPending = 0;
      }

      setAgents(agentsRes.data || []);
      setSummary({
        agents: agentsRes.data?.length || 0,
        customers: customersRes.data?.length || 0,
        stock: totalStock,
        paymentsReceived: totalPayments,
        pendingAmount: totalPending,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRecordCashPayment = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }

    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid cash amount");
      return;
    }

    try {
      setRecordingCashPayment(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const agentId = selectedAgent._id || selectedAgent.agentId;
      if (!agentId) {
        toast.error("Invalid agent selected");
        return;
      }

      const response = await axios.post(
        "/api/admin/agent-payments/cash",
        {
          agentId: agentId,
          amount: amount,
          description: cashDescription || "Cash payment recorded by admin",
        },
        { headers: { Authorization: token } }
      );

      if (response.data) {
        toast.success("Cash payment recorded successfully!");
        setCashPaymentDialogOpen(false);
        setSelectedAgent(null);
        setCashAmount("");
        setCashDescription("");
        
        // Refresh dashboard data
        setTimeout(() => {
          fetchSummary();
        }, 500);
      }
    } catch (err) {
      console.error("Error recording cash payment:", err);
      if (err.response?.status === 404) {
        toast.error("Payment endpoint not found. Please check if the backend is properly deployed.");
      } else {
        toast.error(err?.response?.data?.error || err?.message || "Failed to record cash payment");
      }
    } finally {
      setRecordingCashPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />

      <main className="p-8 ml-64 min-h-screen max-w-[calc(100%-16rem)]">
        <h2 className="text-3xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
          Welcome, {user?.username || "Admin"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Agents</CardTitle>
              <UserCog className="text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800 dark:text-white">
                {summary.agents}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Customers</CardTitle>
              <Users className="text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800 dark:text-white">
                {summary.customers}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Stock</CardTitle>
              <Package className="text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800 dark:text-white">
                {summary.stock}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-md border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-shadow hover:border-teal-400"
            onClick={() => navigate("/admin/payments")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Payments Received</CardTitle>
              <Wallet className="text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-slate-800 dark:text-white">
                  ₹{summary.paymentsReceived.toLocaleString()}
                </p>
                <ArrowRight className="text-teal-500 w-5 h-5" />
              </div>
              <p className="text-sm text-slate-500 mt-2">Click to view details</p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-md border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-shadow hover:border-orange-400"
            onClick={() => navigate("/admin/payments")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pending Amount</CardTitle>
              <AlertCircle className="text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-slate-800 dark:text-white">
                  ₹{summary.pendingAmount.toLocaleString()}
                </p>
                <ArrowRight className="text-orange-500 w-5 h-5" />
              </div>
              <p className="text-sm text-slate-500 mt-2">Click to view details</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8">
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => {
                    setSelectedAgent(null);
                    setCashAmount("");
                    setCashDescription("");
                    setCashPaymentDialogOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Cash Payment
                </Button>
                <Button
                  onClick={() => navigate("/admin/payments")}
                  variant="outline"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  View All Payments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Payment Dialog */}
        <Dialog open={cashPaymentDialogOpen} onOpenChange={setCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Payment</DialogTitle>
              <DialogDescription>
                Record a cash payment received from an agent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentSelect">Select Agent</Label>
                <select
                  id="agentSelect"
                  value={selectedAgent?._id || selectedAgent?.agentId || ""}
                  onChange={(e) => {
                    const agent = agents.find(a => (a._id || a.agentId) === e.target.value);
                    setSelectedAgent(agent);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent._id || agent.agentId} value={agent._id || agent.agentId}>
                      {agent.agentname || agent.username || "Unknown Agent"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashAmount">Cash Amount (₹)</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter cash amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashDescription">Description (Optional)</Label>
                <Input
                  id="cashDescription"
                  type="text"
                  value={cashDescription}
                  onChange={(e) => setCashDescription(e.target.value)}
                  placeholder="Payment description"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCashPaymentDialogOpen(false);
                    setSelectedAgent(null);
                    setCashAmount("");
                    setCashDescription("");
                  }}
                  disabled={recordingCashPayment}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleRecordCashPayment}
                  disabled={recordingCashPayment || !selectedAgent || !cashAmount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {recordingCashPayment ? (
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
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
