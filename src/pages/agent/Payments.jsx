import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import AgentSidebar from "@/components/layout/AgentSidebar";
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
  Clock
} from "lucide-react";
import axios from "@/config/config";
import { toast } from "sonner";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [stats, setStats] = useState({
    totalAmount: 0,
    onlinePayments: 0,
    cashPayments: 0,
    totalCount: 0,
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, [token]);

  const fetchPayments = async () => {
    if (!token) {
      toast.error("Authentication token not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get("/api/payment/history", {
        headers: { Authorization: token },
      });

      const paymentsData = res.data?.payments || res.data || [];
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
      setFilteredPayments(paymentsArray);

    
      const totalAmount = paymentsArray.reduce((sum, p) => sum + (p.amount || 0), 0);
      const onlinePayments = paymentsArray.filter(p => p.method === "razorpay" || p.method === "online").length;
      const cashPayments = paymentsArray.filter(p => p.method === "cash").length;

      setStats({
        totalAmount,
        onlinePayments,
        cashPayments,
        totalCount: paymentsArray.length,
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
      toast.error(err?.response?.data?.error || "Failed to fetch payments");
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = payments;

  
    if (search) {
      filtered = filtered.filter((payment) => {
        const customerName = payment.customer?.username || payment.customer?.businessName || "";
        const bookingId = payment.booking?._id || "";
        const transactionId = payment.transactionID || "";
        const searchLower = search.toLowerCase();
        return (
          customerName.toLowerCase().includes(searchLower) ||
          bookingId.toString().includes(search) ||
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
  }, [search, methodFilter, payments]);

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
            Payment Details
          </h1>
          <p className="text-gray-600">View all customer payments received</p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Online Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.onlinePayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">{stats.cashPayments}</p>
            </CardContent>
          </Card>
        </div>

      
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by customer, booking ID, transaction ID..."
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
                Showing {filteredPayments.length} of {payments.length} payments
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
                    : "No payments found."}
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
                          Payment #{payment.transactionID?.slice(-8) || payment._id.slice(-8)}
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
                        Customer Details
                      </h3>
                      <div className="text-sm space-y-1 text-gray-600">
                        <p>
                          <strong>Name:</strong> {payment.customer?.username || payment.customer?.businessName || "N/A"}
                        </p>
                        <p>
                          <strong>Phone:</strong> {payment.customer?.phoneNo || "N/A"}
                        </p>
                        <p>
                          <strong>Email:</strong> {payment.customer?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Booking & Transaction
                      </h3>
                      <div className="text-sm space-y-1 text-gray-600">
                        <p>
                          <strong>Booking ID:</strong> {payment.booking?._id?.slice(-8) || "N/A"}
                        </p>
                        <p>
                          <strong>Cylinder:</strong> {payment.booking?.cylinder?.cylinderType || payment.booking?.cylinder?.cylinderName || "N/A"}
                        </p>
                        <p>
                          <strong>Quantity:</strong> {payment.booking?.quantity || 0}
                        </p>
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

