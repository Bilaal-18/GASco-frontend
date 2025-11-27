import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/config/config";
import userContext from "@/context/UserContext";
import Sidebar from "@/components/layout/SideBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
// ShadCN chart helpers
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Recharts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

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
import { Cylinder, Loader2,UserCog,Users, Wallet } from "lucide-react";
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
      const totalPayments = payments.reduce((sum, p) => {
        if (p.status === 'pending' || p.status === 'failed') {
          return sum;
        }
        
        const onlinePaid = Number(p.onlinePaid || 0);
        const cashPaid = Number(p.cashPaid || 0);
        const hasPartialFields = onlinePaid > 0 || cashPaid > 0;
        
        if (hasPartialFields) {
          return sum + onlinePaid + cashPaid;
        } else {
          return sum + (Number(p.amount || 0));
        }
      }, 0);

      let totalPending = 0;
      try {
        const agents = agentsRes.data || [];
        const pendingAmounts = await Promise.all(
          agents.map(async (agent) => {
            try {
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
                return 0;
              }

              const agentPayments = payments.filter(p => 
                p.agent?._id === agent._id || p.agent === agent._id
              );
              
            
              const totalPaid = agentPayments.reduce((sum, p) => {
                if (p.status === 'pending' || p.status === 'failed') {
                  return sum;
                }
                
                const onlinePaid = Number(p.onlinePaid || 0);
                const cashPaid = Number(p.cashPaid || 0);
                const hasPartialFields = onlinePaid > 0 || cashPaid > 0;
                
                if (hasPartialFields) {
                  return sum + onlinePaid + cashPaid;
                } else {
                  return sum + (Number(p.amount || 0));
                }
              }, 0);

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
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <UserCog className="h-4 w-4 text-black" />
                <span>Total Agents</span>
              </div>
              <div className="text-2xl font-bold mt-1">{summary.agents}</div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-black" />
                <span>Total Customers</span>
              </div>
              <div className="text-2xl font-bold">{summary.customers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 ">
                <Cylinder className="h-4 w-4 text-black"/>
                <span>Total Stock</span>
              </div>
              <div className="text-2xl font-bold">{summary.stock}</div>
            </CardContent>
          </Card>

          <Card >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4"/>
                <span>Payment Received</span>
              </div>
              
              <div className="text-2xl font-bold">₹{summary.paymentsReceived.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Pending Amount</div>
              <div className="text-2xl font-bold">₹{summary.pendingAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8">

        
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Users Overview</h2>

            <ChartContainer>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: "Agents", value: summary.agents },
                  { name: "Customers", value: summary.customers }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>


        
          <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Payment Status</h2>

            <ChartContainer>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Received", value: summary.paymentsReceived },
                      { name: "Pending", value: summary.pendingAmount }
                    ]}
                    cx="50%"
                    cy="50%"
                    label
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>

                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>


          <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Stock Overview</h2>

            <ChartContainer>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Available Stock", value: summary.stock },
                      { name: "Sold", value: summary.stock === 0 ? 1 : summary.stock / 3 }
                    ]}
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#9ca3af" />
                  </Pie>

                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        </div>


        {/* <Card>
          <CardContent className="p-4">
            <div className="mb-4 font-semibold">Quick Actions</div>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setSelectedAgent(null);
                  setCashAmount("");
                  setCashDescription("");
                  setCashPaymentDialogOpen(true);
                }}
              >
                Record Cash Payment
              </Button>
              <Button
                onClick={() => navigate("/admin/payments")}
                variant="outline"
              >
                View All Payments
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={cashPaymentDialogOpen} onOpenChange={setCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Agent</Label>
                <select
                  value={selectedAgent?._id || selectedAgent?.agentId || ""}
                  onChange={(e) => {
                    const agent = agents.find(a => (a._id || a.agentId) === e.target.value);
                    setSelectedAgent(agent);
                  }}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select agent...</option>
                  {agents.map((agent) => (
                    <option key={agent._id || agent.agentId} value={agent._id || agent.agentId}>
                      {agent.agentname || agent.username || "Unknown Agent"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Amount"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={cashDescription}
                  onChange={(e) => setCashDescription(e.target.value)}
                  placeholder="Description"
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
                >
                  {recordingCashPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
