import { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import axios from "@/config/config";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
    });
  };

  const getCylinderName = (payment) => {
    // Check if cylinder is directly on payment
    if (payment.cylinder) {
      if (typeof payment.cylinder === 'object' && payment.cylinder.cylinderType) {
        return payment.cylinder.cylinderType || payment.cylinder.cylinderName || payment.cylinder.name || "N/A";
      }
    }
    
    // Check if cylinder is in booking
    if (payment.booking?.cylinder) {
      const cylinder = payment.booking.cylinder;
      if (typeof cylinder === 'object') {
        return cylinder.cylinderType || cylinder.cylinderName || cylinder.name || "N/A";
      }
    }
    
    return "N/A";
  };

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, methodFilter]);

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
          <h1 className="text-2xl font-bold mb-4">Customer Payments</h1>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Payments</div>
              <div className="text-2xl font-bold">{stats.totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Amount</div>
              <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Online</div>
              <div className="text-2xl font-bold">{stats.onlinePayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Cash</div>
              <div className="text-2xl font-bold">{stats.cashPayments}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex gap-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-8">No payments found</div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Cylinder</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          {payment.customer?.username || payment.customer?.businessName || "N/A"}
                        </TableCell>
                        <TableCell>{payment.customer?.phoneNo || "N/A"}</TableCell>
                        <TableCell>{getCylinderName(payment)}</TableCell>
                        <TableCell>{payment.booking?.quantity || payment.quantity || 0}</TableCell>
                        <TableCell>₹{payment.amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          {payment.method === "razorpay" || payment.method === "online" ? "Online" : "Cash"}
                        </TableCell>
                        <TableCell>
                          {payment.status === "completed" || payment.status === "paid" ? "Paid" : "Pending"}
                        </TableCell>
                        <TableCell>{formatDate(payment.paymentDate || payment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

