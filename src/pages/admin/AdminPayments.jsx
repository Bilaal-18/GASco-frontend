import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 

import {
  Wallet,        
  DollarSign,    
  Calendar,      
  User,          
  Package,       
  CreditCard,    
  Loader2,       
  Search,        
  Filter,        
  CheckCircle2,  
  Clock,         
  TrendingUp,    
  TrendingDown,  
  AlertCircle,   
} from "lucide-react";
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
      const res = await axios.get("/api/admin/agent-payments", {
        headers: { Authorization: token }, 
      });

      const paymentsData = res.data?.payments || res.data || [];
      
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setAgentPayments(paymentsArray);
      setFilteredPayments(paymentsArray);

      const totalAmount = paymentsArray.reduce((sum, p) => sum + (p.amount || 0), 0);
      
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
            const stockRes = await axios.get(`/api/ownStock/${agent._id}`, {
              headers: { Authorization: token },
            });
            
            const stocks = stockRes.data?.Ownstock || stockRes.data || [];
          
            const totalStockAmount = stocks.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

            const paymentsRes = await axios.get("/api/admin/agent-payments", {
              headers: { Authorization: token },
            });
            
            const allPayments = paymentsRes.data?.payments || [];
            
            const agentPayments = allPayments.filter(
              (p) => (p.agent?._id || p.agent)?.toString() === agent._id.toString()
            );
            
            const totalPaid = agentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
            console.error(`Error fetching data for agent ${agent._id}:`, err);
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

 
  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar /> 
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> {/* Spinning loader icon */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
        
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-blue-600" /> {/* Wallet icon */}
            Agent Payments & Pending Amounts {/* Page title */}
          </h1>
          {/* Page description */}
          <p className="text-gray-600">View payments received and pending amounts from agents</p>
        </div>

        <div className="flex gap-2 mb-6 border-b">
        
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "payments"
                ? "border-b-2 border-blue-600 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"        
            }`}
          >
            Payments Received
          </button>
          
      
          <button
            onClick={() => setActiveTab("pending")} 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-orange-600 text-orange-600" 
                : "text-gray-500 hover:text-gray-700"         
            }`}
          >
            Pending Amounts 
          </button>
        </div>

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

        {activeTab === "payments" && (
          <>
         +
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search by agent name, transaction ID..." 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      className="pl-10"
                    />
                  </div>
                  
                
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" /> 
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)} 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Payment Methods</option> 
                      <option value="online">Online</option> 
                      <option value="cash">Cash</option> 
                    </select>
                  </div>
                  
                  
                  <div className="text-sm text-gray-500 flex items-center">
                    Showing {filteredPayments.length} of {agentPayments.length} payments 
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" /> 
                    <p className="text-gray-500 text-lg">
                      
                      {search || methodFilter !== "all"
                        ? "No payments found matching your filters." 
                        : "No payments received yet."} 
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              
              <div className="grid grid-cols-1 gap-6">
                {filteredPayments.map((payment) => (
                  <Card key={payment._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <CardTitle className="text-xl">
                              Payment #{payment.transactionID?.slice(-8) || payment._id.slice(-8)} {/* Show last 8 chars of transaction ID */}
                            </CardTitle>
                            {getMethodBadge(payment.method)} 
                            {getStatusBadge(payment.status)} 
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" /> 
                              {formatDate(payment.paymentDate || payment.createdAt)}
                            </span>
                          </div>
                        </div>
                      
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{payment.amount?.toLocaleString() || 0} 
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                  
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4" /> 
                            Agent Details 
                          </h3>
                          <div className="text-sm space-y-1 text-gray-600">
                          
                            <p>
                              <strong>Name:</strong> {payment.agent?.agentname || payment.agent?.username || "N/A"}
                            </p>
                            
                            <p>
                              <strong>Email:</strong> {payment.agent?.email || "N/A"}
                            </p>
                    
                            <p>
                              <strong>Phone:</strong> {payment.agent?.phoneNo || "N/A"}
                            </p>
                          </div>
                        </div>

                      
                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Payment & Transaction 
                          </h3>
                          <div className="text-sm space-y-1 text-gray-600">
                        
                            {payment.description && (
                              <p>
                                <strong>Description:</strong> {payment.description}
                              </p>
                            )}
                          
                            {payment.notes && (
                              <p>
                                <strong>Notes:</strong> {payment.notes}
                              </p>
                            )}
                          
                            {payment.razorpayOrderId && (
                              <p>
                                <strong>Razorpay Order:</strong> {payment.razorpayOrderId}
                              </p>
                            )}
                            
                            {payment.razorpayPaymentId && (
                              <p>
                                <strong>Razorpay Payment:</strong> {payment.razorpayPaymentId}
                              </p>
                            )}
                          
                            {payment.transactionID && (
                              <p>
                                <strong>Transaction ID:</strong> {payment.transactionID}
                              </p>
                            )}
                          
                            {payment.stockIds && payment.stockIds.length > 0 && (
                              <p>
                                <strong>Stock Items Paid:</strong> {payment.stockIds.length} item(s)
                              </p>
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

        {activeTab === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Amounts by Agent</CardTitle> 
            </CardHeader>
            <CardContent>
              {agentPendingAmounts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No pending amounts found</p>
                </div>
              ) : (
              
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    
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
                  
                    <tbody>
                      {agentPendingAmounts
                        .sort((a, b) => b.pendingAmount - a.pendingAmount) 
                        .map((agent) => (
                          <tr key={agent.agentId} className="border-t hover:bg-gray-50">
                            
                            <td className="p-3 font-medium">{agent.agentName}</td>
                            
                            <td className="p-3 text-gray-600">{agent.email}</td>
                          
                            <td className="p-3 text-gray-600">{agent.phoneNo}</td>
                            
                            <td className="p-3 text-right">
                              ₹{agent.totalStockAmount.toLocaleString()}
                            </td>
                          
                            <td className="p-3 text-right text-green-600">
                              ₹{agent.totalPaid.toLocaleString()}
                            </td>
                          
                            <td className="p-3 text-right">
                              {agent.pendingAmount > 0 ? (
                                <Badge className="bg-orange-500 text-white text-base px-3 py-1">
                                  ₹{agent.pendingAmount.toLocaleString()}
                                </Badge>
                              ) : (
                                <Badge className="bg-green-500 text-white text-base px-3 py-1">
                                  ₹0 
                                </Badge>
                              )}
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
      </div>
    </div>
  );
}
