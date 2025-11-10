// ============================================
// FRONTEND: Admin Payments Page Component
// ============================================
// This component displays all payments received from agents and calculates pending amounts
// It shows two tabs: "Payments Received" and "Pending Amounts"

// Import React hooks - useState manages component state, useEffect runs side effects
import { useEffect, useState } from "react";

// Import Sidebar component - navigation menu for admin panel
import Sidebar from "@/components/layout/Sidebar";

// Import UI components from shadcn/ui library - these are reusable UI elements
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Card container for displaying content
import { Badge } from "@/components/ui/badge"; // Badge component for showing status labels
import { Button } from "@/components/ui/button"; // Button component for actions
import { Input } from "@/components/ui/input"; // Input field for search functionality
import { Label } from "@/components/ui/label"; // Label component for form fields
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Dialog component for modals

// Import icons from lucide-react library - these are visual icons for the UI
import {
  Wallet,        // Wallet icon - represents payments/money
  DollarSign,    // Dollar sign icon - represents cash payments
  Calendar,      // Calendar icon - represents dates
  User,          // User icon - represents agent information
  Package,       // Package icon - represents stock/items
  CreditCard,    // Credit card icon - represents online payments
  Loader2,       // Loading spinner icon - shows when data is being fetched
  Search,        // Search icon - for search input field
  Filter,        // Filter icon - for filtering options
  CheckCircle2,  // Check circle icon - represents completed status
  Clock,         // Clock icon - represents pending status
  TrendingUp,    // Trending up icon - shows positive trends
  TrendingDown,  // Trending down icon - shows negative trends
  AlertCircle,   // Alert circle icon - shows warnings or empty states
} from "lucide-react";

// Import axios - HTTP client for making API requests to backend
import axios from "@/config/config";

// Import toast - notification library to show success/error messages to users
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

  // ============================================
  // FUNCTION: Get Payment Method Badge Component
  // ============================================
  // Returns a colored badge showing payment method (Online or Cash)
  const getMethodBadge = (method) => {
    // If payment method is razorpay or online, show purple "Online" badge
    if (method === "razorpay" || method === "online") {
      return (
        <Badge className="bg-purple-500 text-white">
          <CreditCard className="w-3 h-3 mr-1" /> {/* Credit card icon */}
          Online {/* Badge text */}
        </Badge>
      );
    }
    // Otherwise, show gray "Cash" badge
    return (
      <Badge className="bg-gray-500 text-white">
        <DollarSign className="w-3 h-3 mr-1" /> {/* Dollar sign icon */}
        Cash {/* Badge text */}
      </Badge>
    );
  };

  // ============================================
  // FUNCTION: Get Payment Status Badge Component
  // ============================================
  // Returns a colored badge showing payment status (Completed or Pending)
  const getStatusBadge = (status) => {
    // If status is completed or paid, show green "Completed" badge
    if (status === "completed" || status === "paid") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {/* Check circle icon */}
          Completed {/* Badge text */}
        </Badge>
      );
    }
    // Otherwise, show yellow "Pending" badge
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
        <Clock className="w-3 h-3 mr-1" /> {/* Clock icon */}
        Pending {/* Badge text */}
      </Badge>
    );
  };

  // ============================================
  // LOADING STATE - Show Spinner While Data Loads
  // ============================================
  // If data is still loading, show loading spinner instead of content
  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar /> {/* Show sidebar navigation */}
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> {/* Spinning loader icon */}
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER - Display the Page Content
  // ============================================
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar navigation menu */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 p-8">
        {/* ============================================
            Page Header Section
            ============================================ */}
        <div className="mb-8">
          {/* Page title with wallet icon */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-blue-600" /> {/* Wallet icon */}
            Agent Payments & Pending Amounts {/* Page title */}
          </h1>
          {/* Page description */}
          <p className="text-gray-600">View payments received and pending amounts from agents</p>
        </div>

        {/* ============================================
            Tab Navigation - Switch Between Views
            ============================================ */}
        <div className="flex gap-2 mb-6 border-b">
          {/* Payments Received Tab Button */}
          <button
            onClick={() => setActiveTab("payments")} // When clicked, switch to payments tab
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "payments"
                ? "border-b-2 border-blue-600 text-blue-600" // Active tab styling (blue)
                : "text-gray-500 hover:text-gray-700"        // Inactive tab styling (gray)
            }`}
          >
            Payments Received {/* Tab label */}
          </button>
          
          {/* Pending Amounts Tab Button */}
          <button
            onClick={() => setActiveTab("pending")} // When clicked, switch to pending tab
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-orange-600 text-orange-600" // Active tab styling (orange)
                : "text-gray-500 hover:text-gray-700"           // Inactive tab styling (gray)
            }`}
          >
            Pending Amounts {/* Tab label */}
          </button>
        </div>

        {/* ============================================
            Statistics Cards - Show Key Metrics
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Card 1: Total Payments Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalCount}</p> {/* Display total count */}
            </CardContent>
          </Card>
          
          {/* Card 2: Total Amount Received */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" /> {/* Upward trend icon */}
                <p className="text-3xl font-bold text-green-600">₹{stats.totalAmount.toLocaleString()}</p> {/* Display total amount with formatting */}
              </div>
            </CardContent>
          </Card>
          
          {/* Card 3: Online Payments Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Online Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.onlinePayments}</p> {/* Display online count */}
            </CardContent>
          </Card>
          
          {/* Card 4: Cash Payments Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">{stats.cashPayments}</p> {/* Display cash count */}
            </CardContent>
          </Card>
          
          {/* Card 5: Total Pending Amount */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-500" /> {/* Downward trend icon */}
                <p className="text-3xl font-bold text-orange-600">₹{stats.totalPending.toLocaleString()}</p> {/* Display pending amount */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================
            Payments Received Tab Content
            ============================================ */}
        {activeTab === "payments" && (
          <>
            {/* ============================================
                Search and Filter Section
                ============================================ */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search Input Field */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /> {/* Search icon */}
                    <Input
                      placeholder="Search by agent name, transaction ID..." // Placeholder text
                      value={search} // Current search value
                      onChange={(e) => setSearch(e.target.value)} // Update search state when user types
                      className="pl-10" // Add left padding for icon
                    />
                  </div>
                  
                  {/* Payment Method Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" /> {/* Filter icon */}
                    <select
                      value={methodFilter} // Current selected filter
                      onChange={(e) => setMethodFilter(e.target.value)} // Update filter when user selects option
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Payment Methods</option> {/* Show all methods */}
                      <option value="online">Online</option> {/* Show only online */}
                      <option value="cash">Cash</option> {/* Show only cash */}
                    </select>
                  </div>
                  
                  {/* Results Count Display */}
                  <div className="text-sm text-gray-500 flex items-center">
                    Showing {filteredPayments.length} of {agentPayments.length} payments {/* Show count of filtered vs total */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ============================================
                Payments List Display
                ============================================ */}
            {/* If no payments found after filtering */}
            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" /> {/* Empty state icon */}
                    <p className="text-gray-500 text-lg">
                      {/* Show different message based on whether filters are applied */}
                      {search || methodFilter !== "all"
                        ? "No payments found matching your filters." // If filters applied
                        : "No payments received yet."} {/* If no filters */}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* If payments exist, display them in a grid */
              <div className="grid grid-cols-1 gap-6">
                {/* Map through each filtered payment and create a card */}
                {filteredPayments.map((payment) => (
                  <Card key={payment._id} className="hover:shadow-lg transition-shadow">
                    {/* Payment Card Header */}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Payment ID and Badges */}
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <CardTitle className="text-xl">
                              Payment #{payment.transactionID?.slice(-8) || payment._id.slice(-8)} {/* Show last 8 chars of transaction ID */}
                            </CardTitle>
                            {getMethodBadge(payment.method)} {/* Show payment method badge */}
                            {getStatusBadge(payment.status)} {/* Show payment status badge */}
                          </div>
                          {/* Payment Date */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" /> {/* Calendar icon */}
                              {formatDate(payment.paymentDate || payment.createdAt)} {/* Formatted date */}
                            </span>
                          </div>
                        </div>
                        {/* Payment Amount (Right Side) */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{payment.amount?.toLocaleString() || 0} {/* Display amount with formatting */}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* Payment Card Content - Details */}
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Agent Details */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4" /> {/* User icon */}
                            Agent Details {/* Section title */}
                          </h3>
                          <div className="text-sm space-y-1 text-gray-600">
                            {/* Agent Name */}
                            <p>
                              <strong>Name:</strong> {payment.agent?.agentname || payment.agent?.username || "N/A"}
                            </p>
                            {/* Agent Email */}
                            <p>
                              <strong>Email:</strong> {payment.agent?.email || "N/A"}
                            </p>
                            {/* Agent Phone */}
                            <p>
                              <strong>Phone:</strong> {payment.agent?.phoneNo || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Right Column: Payment & Transaction Details */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Package className="w-4 h-4" /> {/* Package icon */}
                            Payment & Transaction {/* Section title */}
                          </h3>
                          <div className="text-sm space-y-1 text-gray-600">
                            {/* Description (if exists) */}
                            {payment.description && (
                              <p>
                                <strong>Description:</strong> {payment.description}
                              </p>
                            )}
                            {/* Notes (if exists) */}
                            {payment.notes && (
                              <p>
                                <strong>Notes:</strong> {payment.notes}
                              </p>
                            )}
                            {/* Razorpay Order ID (if exists) */}
                            {payment.razorpayOrderId && (
                              <p>
                                <strong>Razorpay Order:</strong> {payment.razorpayOrderId}
                              </p>
                            )}
                            {/* Razorpay Payment ID (if exists) */}
                            {payment.razorpayPaymentId && (
                              <p>
                                <strong>Razorpay Payment:</strong> {payment.razorpayPaymentId}
                              </p>
                            )}
                            {/* Transaction ID (if exists) */}
                            {payment.transactionID && (
                              <p>
                                <strong>Transaction ID:</strong> {payment.transactionID}
                              </p>
                            )}
                            {/* Stock Items Count (if exists) */}
                            {payment.stockIds && payment.stockIds.length > 0 && (
                              <p>
                                <strong>Stock Items Paid:</strong> {payment.stockIds.length} item(s)
                              </p>
                            )}
                            {/* Partial Payment Details */}
                            {payment.status === "partial" && payment.method === "online" && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="font-semibold text-yellow-800 mb-2">Partial Payment Details</p>
                                <p className="text-sm">
                                  <strong>Online Paid:</strong> ₹{(payment.onlinePaid || 0).toLocaleString()}
                                </p>
                                <p className="text-sm">
                                  <strong>Cash Paid:</strong> ₹{(payment.cashPaid || 0).toLocaleString()}
                                </p>
                                <p className="text-sm">
                                  <strong>Total Due:</strong> ₹{(payment.totalDue || 0).toLocaleString()}
                                </p>
                                <p className="text-sm">
                                  <strong>Remaining Cash:</strong> ₹{(payment.remainingCash || 0).toLocaleString()}
                                </p>
                                <Button
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setCashPaidAmount((payment.cashPaid || 0).toString());
                                    setCashPaymentDialogOpen(true);
                                  }}
                                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                  size="sm"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Update Cash Paid
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================
            Pending Amounts Tab Content
            ============================================ */}
        {activeTab === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Amounts by Agent</CardTitle> {/* Table title */}
            </CardHeader>
            <CardContent>
              {/* If no pending amounts found */}
              {agentPendingAmounts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" /> {/* Empty state icon */}
                  <p className="text-gray-500 text-lg">No pending amounts found</p>
                </div>
              ) : (
                /* If pending amounts exist, display in table */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {/* Table Header */}
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Agent Name</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Phone</th>
                        <th className="p-3 text-right">Total Stock Amount</th>
                        <th className="p-3 text-right">Total Paid</th>
                        <th className="p-3 text-right">Pending Amount</th>
                      </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody>
                      {/* Sort by pending amount (highest first) and map through each agent */}
                      {agentPendingAmounts
                        .sort((a, b) => b.pendingAmount - a.pendingAmount) // Sort descending by pending amount
                        .map((agent) => (
                          <tr key={agent.agentId} className="border-t hover:bg-gray-50">
                            {/* Agent Name */}
                            <td className="p-3 font-medium">{agent.agentName}</td>
                            {/* Agent Email */}
                            <td className="p-3 text-gray-600">{agent.email}</td>
                            {/* Agent Phone */}
                            <td className="p-3 text-gray-600">{agent.phoneNo}</td>
                            {/* Total Stock Amount */}
                            <td className="p-3 text-right">
                              ₹{agent.totalStockAmount.toLocaleString()}
                            </td>
                            {/* Total Paid Amount (green color) */}
                            <td className="p-3 text-right text-green-600">
                              ₹{agent.totalPaid.toLocaleString()}
                            </td>
                            {/* Pending Amount with Badge and Action Button */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {agent.pendingAmount > 0 ? (
                                  <>
                                    <Badge className="bg-orange-500 text-white text-base px-3 py-1">
                                      ₹{agent.pendingAmount.toLocaleString()}
                                    </Badge>
                                    <Button
                                      onClick={() => {
                                        setSelectedAgent(agent);
                                        setNewCashAmount("");
                                        setNewCashDescription("");
                                        setNewCashPaymentDialogOpen(true);
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                                      size="sm"
                                    >
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Add Cash
                                    </Button>
                                  </>
                                ) : (
                                  <Badge className="bg-green-500 text-white text-base px-3 py-1">
                                    ₹0
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Cash Payment Dialog (for creating new cash payments) */}
        <Dialog open={newCashPaymentDialogOpen} onOpenChange={setNewCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Payment</DialogTitle>
              <DialogDescription>
                Record a cash payment received from the agent.
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded space-y-1 text-sm">
                  <p><strong>Agent:</strong> {selectedAgent.agentName}</p>
                  <p><strong>Pending Amount:</strong> ₹{selectedAgent.pendingAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCashAmount">Cash Amount (₹)</Label>
                  <Input
                    id="newCashAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedAgent.pendingAmount}
                    value={newCashAmount}
                    onChange={(e) => setNewCashAmount(e.target.value)}
                    placeholder="Enter cash amount"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Maximum: ₹{selectedAgent.pendingAmount.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCashDescription">Description (Optional)</Label>
                  <Input
                    id="newCashDescription"
                    type="text"
                    value={newCashDescription}
                    onChange={(e) => setNewCashDescription(e.target.value)}
                    placeholder="Payment description"
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
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Record Payment
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cash Payment Dialog (for updating partial payments) */}
        <Dialog open={cashPaymentDialogOpen} onOpenChange={setCashPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Cash Paid Amount</DialogTitle>
              <DialogDescription>
                Enter the cash amount received from the agent for this partial payment.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded space-y-1 text-sm">
                  <p><strong>Online Paid:</strong> ₹{(selectedPayment.onlinePaid || 0).toLocaleString()}</p>
                  <p><strong>Total Due:</strong> ₹{(selectedPayment.totalDue || 0).toLocaleString()}</p>
                  <p><strong>Remaining Cash:</strong> ₹{((selectedPayment.totalDue || 0) - (selectedPayment.onlinePaid || 0)).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cashPaid">Cash Paid Amount (₹)</Label>
                  <Input
                    id="cashPaid"
                    type="number"
                    step="0.01"
                    min="0"
                    max={(selectedPayment.totalDue || 0) - (selectedPayment.onlinePaid || 0)}
                    value={cashPaidAmount}
                    onChange={(e) => setCashPaidAmount(e.target.value)}
                    placeholder="Enter cash paid amount"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Maximum: ₹{((selectedPayment.totalDue || 0) - (selectedPayment.onlinePaid || 0)).toLocaleString()}
                  </p>
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updatingCashPaid ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Update Cash Paid
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
