import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/SideBar";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import axios from "@/config/config";
import { toast } from "sonner";

export default function AdminPayments() {
  const [agentPayments, setAgentPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [agentPendingAmounts, setAgentPendingAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("payments");
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cashPaidAmount, setCashPaidAmount] = useState("");
  const [updatingCashPaid, setUpdatingCashPaid] = useState(false);
  const [newCashPaymentDialogOpen, setNewCashPaymentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newCashAmount, setNewCashAmount] = useState("");
  const [newCashDescription, setNewCashDescription] = useState("");
  const [creatingCashPayment, setCreatingCashPayment] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    onlinePayments: 0,
    cashPayments: 0,
    totalCount: 0,
    totalAgents: 0,
    totalPending: 0,
  });
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAgentPayments();
    fetchAgentPendingAmounts();
  }, [token]);

  const fetchAgentPayments = async () => {
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

      const paymentsData = res.data?.payments || [];
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      
      setAgentPayments(paymentsArray);
      setFilteredPayments(paymentsArray);

      const totalAmount = paymentsArray.reduce((sum, p) => {
        if (p.status === 'partial' || p.status === 'paid') {
          const onlinePaid = Number(p.onlinePaid || 0);
          const cashPaid = Number(p.cashPaid || 0);
          return sum + onlinePaid + cashPaid;
        } else if (p.status === 'completed') {
          return sum + (Number(p.amount || 0));
        }
        return sum;
      }, 0);
      
      const onlinePayments = paymentsArray.filter(p => p.method === "razorpay" || p.method === "online").length;
      const cashPayments = paymentsArray.filter(p => p.method === "cash").length;
      const uniqueAgents = new Set(paymentsArray.map(p => p.agent?._id || p.agent)).size;

      setStats(prev => ({
        ...prev,
        totalAmount,
        onlinePayments,
        cashPayments,
        totalCount: paymentsArray.length,
        totalAgents: uniqueAgents,
      }));
    } catch (err) {
      console.error("Error fetching agent payments:", err);
      toast.error(err?.response?.data?.error || "Failed to fetch agent payments");
      setAgentPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentPendingAmounts = async () => {
    if (!token) return;

    try {
      const agentsRes = await axios.get("/api/distributors", {
        headers: { Authorization: token },
      });
      
      const agents = agentsRes.data || [];

      const pendingAmounts = await Promise.all(
        agents.map(async (agent) => {
          try {
            let stocks = [];
            let totalStockAmount = 0;
            
            try {
              const stockRes = await axios.get(`/api/ownStock/${agent._id}`, {
                headers: { Authorization: token },
              });
              
              stocks = stockRes.data?.Ownstock || stockRes.data?.stocks || stockRes.data || [];
              
              if (!Array.isArray(stocks)) {
                console.warn(`Stocks data for agent ${agent._id} is not an array:`, stocks);
                stocks = [];
              }
              
              totalStockAmount = stocks.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            } catch (stockError) {
              console.warn(`Could not fetch stock for agent ${agent._id}, will calculate from payments:`, stockError?.response?.status || stockError?.message);
              totalStockAmount = 0;
            }

            let allPayments = [];
            
            try {
              const paymentsRes = await axios.get("/api/payment/history", {
                params: { paymentType: 'agent' },
                headers: { Authorization: token },
              });
              
              allPayments = paymentsRes.data?.payments || [];
              
              if (!Array.isArray(allPayments)) {
                console.warn(`Payments data is not an array:`, allPayments);
                allPayments = [];
              }
            } catch (paymentError) {
              console.warn(`Could not fetch payments for agent ${agent._id}:`, paymentError?.response?.status || paymentError?.message);
              allPayments = [];
            }
            
            if (totalStockAmount === 0 && allPayments.length > 0) {
              const maxTotalDue = Math.max(...allPayments
                .filter(p => (p.agent?._id || p.agent)?.toString() === agent._id.toString())
                .map(p => Number(p.totalDue || 0))
                .filter(d => d > 0)
              );
              if (maxTotalDue > 0) {
                totalStockAmount = maxTotalDue;
              }
            }
            
            const agentPayments = allPayments.filter(
              (p) => (p.agent?._id || p.agent)?.toString() === agent._id.toString()
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

            const pendingAmount = totalStockAmount - totalPaid;

            return {
              agentId: agent._id,
              agentName: agent.agentname || agent.username || "Unknown",
              email: agent.email || "N/A",
              phoneNo: agent.phoneNo || "N/A",
              totalStockAmount,
              totalPaid,
              pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
            };
          } catch (err) {
            if (!err?.isAxiosError) {
              console.error(`Unexpected error fetching data for agent ${agent._id}:`, err);
            }
            return {
              agentId: agent._id,
              agentName: agent.agentname || agent.username || "Unknown",
              email: agent.email || "N/A",
              phoneNo: agent.phoneNo || "N/A",
              totalStockAmount: 0,
              totalPaid: 0,
              pendingAmount: 0,
            };
          }
        })
      );

      setAgentPendingAmounts(pendingAmounts);
      
      const totalPending = pendingAmounts.reduce((sum, a) => sum + (a.pendingAmount || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalPending,
      }));
    } catch (err) {
      console.error("Error fetching agent pending amounts:", err);
      toast.error("Failed to fetch pending amounts");
    }
  };

  useEffect(() => {
    let filtered = agentPayments;

    if (search) {
      filtered = filtered.filter((payment) => {
        const agentName = payment.agent?.agentname || payment.agent?.username || "";
        const transactionId = payment.transactionID || "";
        const searchLower = search.toLowerCase();
        
        return (
          agentName.toLowerCase().includes(searchLower) ||
          transactionId.toLowerCase().includes(searchLower)
        );
      });
    }

    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => {
        if (methodFilter === "online") {
          return payment.method === "razorpay" || payment.method === "online";
        }
        return payment.method === methodFilter;
      });
    }

    setFilteredPayments(filtered);
  }, [search, methodFilter, agentPayments]);

  const handleUpdateCashPaid = async () => {
    if (!selectedPayment) return;

    const cashPaid = parseFloat(cashPaidAmount);
    if (!cashPaid || cashPaid < 0) {
      toast.error("Please enter a valid cash paid amount");
      return;
    }

    const remainingCash = (selectedPayment.totalDue || 0) - (selectedPayment.onlinePaid || 0);
    if (cashPaid > remainingCash) {
      toast.error(`Cash paid cannot exceed remaining amount (₹${remainingCash.toLocaleString()})`);
      return;
    }

    try {
      setUpdatingCashPaid(true);
      const res = await axios.put(
        `/api/admin/agent-payments/${selectedPayment._id}/cash-paid`,
        { cashPaid },
        { headers: { Authorization: token } }
      );

      toast.success("Cash paid amount updated successfully!");
      setCashPaymentDialogOpen(false);
      setSelectedPayment(null);
      setCashPaidAmount("");
      setTimeout(async () => {
        await fetchAgentPayments();
        await fetchAgentPendingAmounts();
      }, 500);
    } catch (err) {
      console.error("Error updating cash paid:", err);
      toast.error(err?.response?.data?.error || "Failed to update cash paid amount");
    } finally {
      setUpdatingCashPaid(false);
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

  const getMethodText = (method) => {
    return method === "razorpay" || method === "online" ? "Online" : "Cash";
  };

  const getStatusText = (status) => {
    return status === "completed" || status === "paid" ? "Completed" : "Pending";
  };

  const getStatusColor = (status) => {
    return status === "completed" || status === "paid" ? "text-green-600" : "text-yellow-600";
  };

  if (loading) {
    return (
      <SidebarProvider>
        <Sidebar />
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
      <Sidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Agent Payments</h1>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 font-medium ${
              activeTab === "payments"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Payments Received
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 font-medium ${
              activeTab === "pending"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Amounts
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Payments</div>
              <div className="text-2xl font-bold">{stats.totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Amount</div>
              <div className="text-2xl font-bold text-green-600">₹{stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Online Payments</div>
              <div className="text-2xl font-bold">{stats.onlinePayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Cash Payments</div>
              <div className="text-2xl font-bold">{stats.cashPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Pending</div>
              <div className="text-2xl font-bold text-orange-600">₹{stats.totalPending.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {activeTab === "payments" && (
          <>
            <div className="mb-6 flex gap-2">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border rounded"
              >
                <option value="all">All Methods</option>
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    {search || methodFilter !== "all"
                      ? "No payments found matching your filters."
                      : "No payments received yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          {payment.transactionID?.slice(-8) || payment._id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          {payment.agent?.agentname || payment.agent?.username || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₹{payment.amount?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>{getMethodText(payment.method)}</TableCell>
                        <TableCell>
                          <span className={getStatusColor(payment.status)}>
                            {getStatusText(payment.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {payment.status === "partial" && payment.method === "online" && (
                            <Button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setCashPaidAmount((payment.cashPaid || 0).toString());
                                setCashPaymentDialogOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Update Cash
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {activeTab === "pending" && (
          <Card>
            <CardContent className="p-4">
              {agentPendingAmounts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No pending amounts found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Stock Amount</TableHead>
                        <TableHead>Total Paid</TableHead>
                        <TableHead>Pending Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentPendingAmounts
                        .sort((a, b) => b.pendingAmount - a.pendingAmount)
                        .map((agent) => (
                          <TableRow key={agent.agentId}>
                            <TableCell className="font-medium">{agent.agentName}</TableCell>
                            <TableCell>{agent.email}</TableCell>
                            <TableCell>{agent.phoneNo}</TableCell>
                            <TableCell className="text-right">
                              ₹{agent.totalStockAmount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              ₹{agent.totalPaid.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={agent.pendingAmount > 0 ? "text-orange-600 font-semibold" : "text-green-600"}>
                                ₹{agent.pendingAmount.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {agent.pendingAmount > 0 && (
                                <Button
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setNewCashAmount("");
                                    setNewCashDescription("");
                                    setNewCashPaymentDialogOpen(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Add Cash
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={newCashPaymentDialogOpen} onOpenChange={setNewCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Payment</DialogTitle>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded space-y-1 text-sm">
                  <p><strong>Agent:</strong> {selectedAgent.agentName}</p>
                  <p><strong>Pending Amount:</strong> ₹{selectedAgent.pendingAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedAgent.pendingAmount}
                    value={newCashAmount}
                    onChange={(e) => setNewCashAmount(e.target.value)}
                    placeholder="Amount"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    type="text"
                    value={newCashDescription}
                    onChange={(e) => setNewCashDescription(e.target.value)}
                    placeholder="Description"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewCashPaymentDialogOpen(false);
                      setSelectedAgent(null);
                      setNewCashAmount("");
                      setNewCashDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!newCashAmount || parseFloat(newCashAmount) <= 0) {
                        toast.error("Please enter a valid cash amount");
                        return;
                      }
                      try {
                        setCreatingCashPayment(true);
                        await axios.post(
                          `/api/admin/agent-payments/cash`,
                          {
                            agentId: selectedAgent.agentId,
                            amount: parseFloat(newCashAmount),
                            description: newCashDescription || "Cash payment recorded by admin",
                          },
                          { headers: { Authorization: token } }
                        );
                        toast.success("Cash payment recorded successfully!");
                        setNewCashPaymentDialogOpen(false);
                        setSelectedAgent(null);
                        setNewCashAmount("");
                        setNewCashDescription("");
                        setTimeout(async () => {
                          await fetchAgentPayments();
                          await fetchAgentPendingAmounts();
                        }, 500);
                      } catch (err) {
                        console.error("Error creating cash payment:", err);
                        toast.error(err?.response?.data?.error || "Failed to record cash payment");
                      } finally {
                        setCreatingCashPayment(false);
                      }
                    }}
                    disabled={creatingCashPayment}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {creatingCashPayment ? (
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
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={cashPaymentDialogOpen} onOpenChange={setCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Cash Paid</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded space-y-1 text-sm">
                  <div>Online Paid: ₹{(selectedPayment.onlinePaid || 0).toLocaleString()}</div>
                  <div>Total Due: ₹{(selectedPayment.totalDue || 0).toLocaleString()}</div>
                  <div className="font-semibold">Remaining Cash: ₹{((selectedPayment.totalDue || 0) - (selectedPayment.onlinePaid || 0)).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Cash Paid Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={(selectedPayment.totalDue || 0) - (selectedPayment.onlinePaid || 0)}
                    value={cashPaidAmount}
                    onChange={(e) => setCashPaidAmount(e.target.value)}
                    placeholder="Amount"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCashPaymentDialogOpen(false);
                      setSelectedPayment(null);
                      setCashPaidAmount("");
                    }}
                    disabled={updatingCashPaid}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpdateCashPaid}
                    disabled={updatingCashPaid}
                  >
                    {updatingCashPaid ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
