import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPaymentDetails } from "@/store/slices/customer/paymentDetailsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function PaymentDetails() {
  const dispatch = useDispatch();
  const { payments, loading, error } = useSelector((state) => state.paymentDetails);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchPaymentDetails());
  }, [dispatch]);

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    return payment.paymentStatus === filter || payment.status === filter;
  });

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: { variant: "default", className: "bg-green-500", icon: CheckCircle2, label: "Paid" },
      pending: {
        variant: "secondary",
        className: "bg-yellow-500",
        icon: Clock,
        label: "Pending",
      },
      failed: {
        variant: "destructive",
        className: "bg-red-500",
        icon: AlertCircle,
        label: "Failed",
      },
    };

    const config = statusConfig[status?.toLowerCase()] || {
      variant: "secondary",
      icon: Clock,
      label: status || "Pending",
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const totalPaid = payments
    .filter((p) => p.paymentStatus === "paid" || p.status === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.paymentStatus === "pending" || p.status === "pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <CustomerSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <CustomerSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-blue-600" />
            Payment Details
          </h1>
          <p className="text-gray-600">View your payment history and transaction details</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{payments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {["all", "paid", "pending", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">No payments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">
                        #{payment._id?.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {payment.bookingId ? `#${payment.bookingId.slice(-8).toUpperCase()}` : "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{payment.amount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>{payment.paymentMethod || "N/A"}</TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(payment.paymentStatus || payment.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.createdAt || payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
