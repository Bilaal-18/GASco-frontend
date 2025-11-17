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

// Main component function - this is the AdminPayments page component
export default function AdminPayments() {
  // ============================================
  // STATE MANAGEMENT - Store data that changes over time
  // ============================================
  
  // State to store all agent payments received from backend API
  const [agentPayments, setAgentPayments] = useState([]);
  
  // State to store filtered payments (after applying search/filter)
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // State to store pending amounts for each agent (calculated from stock - payments)
  const [agentPendingAmounts, setAgentPendingAmounts] = useState([]);
  
  // State to track if data is currently being loaded from backend
  const [loading, setLoading] = useState(true);
  
  // State to store search text entered by user in search box
  const [search, setSearch] = useState("");
  

  
  // State to store selected payment method filter (all, online, cash)
  const [methodFilter, setMethodFilter] = useState("all");
  
  // State to track which tab is active - "payments" shows received payments, "pending" shows pending amounts
  const [activeTab, setActiveTab] = useState("payments"); // "payments" or "pending"
  
  // State for cash payment dialog (for updating partial payments)
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cashPaidAmount, setCashPaidAmount] = useState("");
  const [updatingCashPaid, setUpdatingCashPaid] = useState(false);
  
  // State for new cash payment dialog (for creating new cash payments)
  const [newCashPaymentDialogOpen, setNewCashPaymentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newCashAmount, setNewCashAmount] = useState("");
  const [newCashDescription, setNewCashDescription] = useState("");
  const [creatingCashPayment, setCreatingCashPayment] = useState(false);
  
  // State to store statistics calculated from payments data
  const [stats, setStats] = useState({
    totalAmount: 0,        // Sum of all payment amounts
    onlinePayments: 0,     // Count of online/razorpay payments
    cashPayments: 0,       // Count of cash payments
    totalCount: 0,         // Total number of payments
    totalAgents: 0,        // Number of unique agents who made payments
    totalPending: 0,       // Total pending amount across all agents
  });
  
  // Get authentication token from browser's local storage - needed for API requests
  const token = localStorage.getItem("token");

  // ============================================
  // USE EFFECT - Runs when component loads or token changes
  // ============================================
  // This effect runs automatically when the component first loads
  // It fetches both payments and pending amounts from the backend
  useEffect(() => {
    fetchAgentPayments();        // Call function to get all payments from backend
    fetchAgentPendingAmounts();  // Call function to calculate pending amounts
  }, [token]); // Re-run if token changes (user logs in/out)

  // ============================================
  // FUNCTION: Fetch Agent Payments from Backend
  // ============================================
  // This function makes an API call to get all payments received from agents
  const fetchAgentPayments = async () => {
    // Check if user has authentication token - if not, show error and stop
    if (!token) {
      toast.error("Authentication token not found"); // Show error message to user
      setLoading(false); // Stop loading spinner
      return; // Exit function early
    }

    try {
      // Set loading to true - this shows loading spinner to user
      setLoading(true);
      
      // Make GET request to backend API endpoint to fetch all agent payments
      // The endpoint is: GET /api/admin/agent-payments
      // Headers include the token for authentication
      const res = await axios.get("/api/admin/agent-payments", {
        headers: { Authorization: token }, // Send token in request header
      });

      // Extract payments data from response - handle different response formats
      // Backend might return data in res.data.payments or directly in res.data
      const paymentsData = res.data?.payments || res.data || [];
      
      // Ensure we have an array (safety check) - convert to array if needed
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      
      // Store all payments in state - this updates the component
      setAgentPayments(paymentsArray);
      
      // Also set filtered payments initially (before any filters applied)
      setFilteredPayments(paymentsArray);

      // ============================================
      // Calculate Statistics from Payments Data
      // ============================================
      
      // Calculate total amount: sum all payment amounts (including partial payments)
      // For partial/paid payments: onlinePaid + cashPaid
      // For completed payments: amount
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
      
      // Count online payments: filter payments where method is "razorpay" or "online"
      // Then get the length (count) of filtered array
      const onlinePayments = paymentsArray.filter(p => p.method === "razorpay" || p.method === "online").length;
      
      // Count cash payments: filter payments where method is "cash"
      const cashPayments = paymentsArray.filter(p => p.method === "cash").length;
      
      // Count unique agents: create a Set (unique values) of agent IDs
      // Map through payments to get agent ID, then get size of Set
      const uniqueAgents = new Set(paymentsArray.map(p => p.agent?._id || p.agent)).size;

      // Update stats state with calculated values
      // prev => ({...prev, ...}) keeps existing stats and only updates new values
      setStats(prev => ({
        ...prev,              // Keep existing stats values
        totalAmount,          // Update total amount
        onlinePayments,       // Update online payments count
        cashPayments,         // Update cash payments count
        totalCount: paymentsArray.length, // Update total count
        totalAgents: uniqueAgents,        // Update unique agents count
      }));
    } catch (err) {
      // If API call fails, log error to console for debugging
      console.error("Error fetching agent payments:", err);
      
      // Show error message to user - try to get error message from response, or use default
      toast.error(err?.response?.data?.error || "Failed to fetch agent payments");
      
      // Set empty arrays so UI doesn't break
      setAgentPayments([]);
      setFilteredPayments([]);
    } finally {
      // Always run this code - whether success or error
      setLoading(false); // Hide loading spinner
    }
  };

  // ============================================
  // FUNCTION: Fetch Agent Pending Amounts
  // ============================================
  // This function calculates how much each agent still owes
  // Formula: Pending = Total Stock Amount - Total Paid Amount
  const fetchAgentPendingAmounts = async () => {
    // If no token, exit early - can't make API calls without authentication
    if (!token) return;

    try {
      // ============================================
      // Step 1: Fetch All Agents from Backend
      // ============================================
      // Make GET request to get list of all agents (distributors)
      // Endpoint: GET /api/distributors
      const agentsRes = await axios.get("/api/distributors", {
        headers: { Authorization: token }, // Send token for authentication
      });
      
      // Extract agents array from response, default to empty array if not found
      const agents = agentsRes.data || [];

      // ============================================
      // Step 2: For Each Agent, Calculate Pending Amount
      // ============================================
      // Use Promise.all to fetch data for all agents in parallel (faster)
      // map creates an array of promises (one for each agent)
      const pendingAmounts = await Promise.all(
        agents.map(async (agent) => {
          try {
            // ============================================
            // Step 2a: Get Agent's Stock Information
            // ============================================
            // Make GET request to get all stock assigned to this agent
            // Endpoint: GET /api/ownStock/:agentId
            // Note: This endpoint requires agent auth, so we'll handle errors gracefully
            let stocks = [];
            let totalStockAmount = 0;
            
            try {
              const stockRes = await axios.get(`/api/ownStock/${agent._id}`, {
                headers: { Authorization: token },
              });
              
              // Extract stock data from response
              // Backend returns data in Ownstock field or directly
              stocks = stockRes.data?.Ownstock || stockRes.data?.stocks || stockRes.data || [];
              
              // Ensure stocks is an array
              if (!Array.isArray(stocks)) {
                console.warn(`Stocks data for agent ${agent._id} is not an array:`, stocks);
                stocks = [];
              }
              
              // Calculate total stock amount: sum all stock item amounts
              // Each stock item has a totalAmount field
              totalStockAmount = stocks.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            } catch (stockError) {
              // If we can't fetch stock (e.g., authorization issue), try to get from payments data
              console.warn(`Could not fetch stock for agent ${agent._id}, will calculate from payments:`, stockError?.response?.status || stockError?.message);
              // We'll calculate from payments if available, otherwise default to 0
              totalStockAmount = 0;
            }

            // ============================================
            // Step 2b: Get Agent's Payment History
            // ============================================
            // Make GET request to get all payments (we already have this, but need to filter)
            let allPayments = [];
            
            try {
              const paymentsRes = await axios.get("/api/admin/agent-payments", {
                headers: { Authorization: token },
              });
              
              // Extract all payments from response
              allPayments = paymentsRes.data?.payments || [];
              
              // Ensure allPayments is an array
              if (!Array.isArray(allPayments)) {
                console.warn(`Payments data is not an array:`, allPayments);
                allPayments = [];
              }
            } catch (paymentError) {
              console.warn(`Could not fetch payments for agent ${agent._id}:`, paymentError?.response?.status || paymentError?.message);
              allPayments = [];
            }
            
            // If we couldn't get stock amount, try to estimate from payments
            if (totalStockAmount === 0 && allPayments.length > 0) {
              // Estimate total stock from the highest totalDue in payments
              const maxTotalDue = Math.max(...allPayments
                .filter(p => (p.agent?._id || p.agent)?.toString() === agent._id.toString())
                .map(p => Number(p.totalDue || 0))
                .filter(d => d > 0)
              );
              if (maxTotalDue > 0) {
                totalStockAmount = maxTotalDue;
              }
            }
            
            // Filter payments to only get payments from this specific agent
            // Compare agent ID from payment with current agent's ID
            const agentPayments = allPayments.filter(
              (p) => (p.agent?._id || p.agent)?.toString() === agent._id.toString()
            );
            
            // Calculate total amount paid by this agent (including partial payments)
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

            // ============================================
            // Step 2c: Calculate Pending Amount
            // ============================================
            // Pending = Total Stock Amount - Total Paid Amount
            const pendingAmount = totalStockAmount - totalPaid;

            // Return object with agent info and calculated amounts
            return {
              agentId: agent._id,                                    // Agent's unique ID
              agentName: agent.agentname || agent.username || "Unknown", // Agent's name
              email: agent.email || "N/A",                          // Agent's email
              phoneNo: agent.phoneNo || "N/A",                       // Agent's phone number
              totalStockAmount,                                       // Total value of stock assigned
              totalPaid,                                             // Total amount agent has paid
              pendingAmount: pendingAmount > 0 ? pendingAmount : 0,   // Pending amount (can't be negative)
            };
          } catch (err) {
            // If error fetching data for this agent, log it and return default values
            // Only log if it's not an axios error (which we're already handling above)
            if (!err?.isAxiosError) {
              console.error(`Unexpected error fetching data for agent ${agent._id}:`, err);
            }
            return {
              agentId: agent._id,
              agentName: agent.agentname || agent.username || "Unknown",
              email: agent.email || "N/A",
              phoneNo: agent.phoneNo || "N/A",
              totalStockAmount: 0,  // Default to 0 if error
              totalPaid: 0,         // Default to 0 if error
              pendingAmount: 0,      // Default to 0 if error
            };
          }
        })
      );

      // Store calculated pending amounts in state
      setAgentPendingAmounts(pendingAmounts);
      
      // ============================================
      // Step 3: Calculate Total Pending Across All Agents
      // ============================================
      // Sum all pending amounts from all agents
      const totalPending = pendingAmounts.reduce((sum, a) => sum + (a.pendingAmount || 0), 0);
      
      // Update stats with total pending amount
      setStats(prev => ({
        ...prev,
        totalPending, // Update total pending in stats
      }));
    } catch (err) {
      // If error occurs, log it and show error message to user
      console.error("Error fetching agent pending amounts:", err);
      toast.error("Failed to fetch pending amounts");
    }
  };

  // ============================================
  // USE EFFECT: Filter Payments Based on Search and Method
  // ============================================
  // This effect runs whenever search text, method filter, or payments data changes
  // It filters the payments list based on user's search and filter selections
  useEffect(() => {
    // Start with all payments
    let filtered = agentPayments;

    // ============================================
    // Apply Search Filter
    // ============================================
    // If user has entered search text, filter payments
    if (search) {
      filtered = filtered.filter((payment) => {
        // Get agent name from payment object (handle different formats)
        const agentName = payment.agent?.agentname || payment.agent?.username || "";
        
        // Get transaction ID from payment
        const transactionId = payment.transactionID || "";
        
        // Convert search text to lowercase for case-insensitive search
        const searchLower = search.toLowerCase();
        
        // Return true if agent name OR transaction ID contains search text
        return (
          agentName.toLowerCase().includes(searchLower) ||
          transactionId.toLowerCase().includes(searchLower)
        );
      });
    }

    // ============================================
    // Apply Payment Method Filter
    // ============================================
    // If user selected a specific payment method (not "all")
    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => {
        // If filter is "online", include both "razorpay" and "online" methods
        if (methodFilter === "online") {
          return payment.method === "razorpay" || payment.method === "online";
        }
        // Otherwise, match exact method (e.g., "cash")
        return payment.method === methodFilter;
      });
    }

    // Update filtered payments state - this triggers UI update
    setFilteredPayments(filtered);
  }, [search, methodFilter, agentPayments]); // Re-run when these values change

  // ============================================
  // FUNCTION: Handle Cash Paid Update
  // ============================================
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
      // Refresh both payments and pending amounts after a short delay
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

  // ============================================
  // FUNCTION: Format Date for Display
  // ============================================
  // Converts date string to readable format like "Jan 15, 2024, 10:30 AM"
  const formatDate = (dateString) => {
    // If no date provided, return "N/A"
    if (!dateString) return "N/A";
    
    // Convert string to Date object
    const date = new Date(dateString);
    
    // Format date using locale-specific formatting
    return date.toLocaleDateString("en-US", {
      year: "numeric",    // Show full year (2024)
      month: "short",     // Show abbreviated month (Jan)
      day: "numeric",     // Show day number (15)
      hour: "2-digit",    // Show hour in 12-hour format (10)
      minute: "2-digit",  // Show minutes (30)
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
