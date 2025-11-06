import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerBookings, setSelectedBooking, cancelBooking } from "@/store/slices/customer/customerBookingsSlice";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Edit, Loader2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import PaymentButton from "@/components/PaymentButton";

export default function CustomerBookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookings, loading, error, updateLoading } = useSelector((state) => state.customerBookings);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchCustomerBookings());
  }, [dispatch]);

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    
    const status = booking.status?.toLowerCase();
    
    // Group similar statuses together
    switch (filter) {
      case "pending":
        return status === "pending" || status === "requested";
      case "active":
      case "confirmed":
        return status === "active" || status === "confirmed" || status === "in-progress";
      case "completed":
        return status === "completed" || status === "delivered";
      case "cancelled":
        return status === "cancelled";
      default:
        return status === filter;
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      requested: { variant: "secondary", label: "Requested" },
      "in-progress": { variant: "default", label: "In Progress" },
      confirmed: { variant: "default", label: "Confirmed" },
      active: { variant: "default", label: "Active" },
      delivered: { variant: "default", className: "bg-green-500", label: "Delivered" },
      completed: { variant: "default", className: "bg-green-500", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = statusConfig[status] || { variant: "secondary", label: status };

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleViewStatus = (booking) => {
    dispatch(setSelectedBooking(booking));
    navigate(`/customer/bookings/status/${booking._id}`);
  };

  const handleUpdateBooking = (booking) => {
    dispatch(setSelectedBooking(booking));
    navigate(`/customer/bookings/update/${booking._id}`);
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm(`Are you sure you want to cancel booking #${booking._id?.slice(-8).toUpperCase()}?`)) {
      return;
    }
    
    try {
      await dispatch(cancelBooking(booking._id)).unwrap();
      toast.success("Booking cancelled successfully!");
    } catch (err) {
      toast.error(err || "Failed to cancel booking");
    }
  };

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
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            My Bookings
          </h1>
          <p className="text-gray-600">View and manage your gas cylinder bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending", "active", "completed", "cancelled"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === "all" 
                ? "All" 
                : status === "active" 
                ? "Active/Confirmed" 
                : status === "completed"
                ? "Completed/Delivered"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-600 font-semibold">Error loading bookings</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 && !error ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">No bookings found</p>
                <p className="text-gray-400 text-sm mt-2">Create a new booking to get started</p>
              </div>
            ) : filteredBookings.length === 0 && error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <p className="text-red-600 text-lg">Unable to load bookings</p>
                <p className="text-gray-500 text-sm mt-2">{error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Cylinder</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell className="font-medium">
                        #{booking._id?.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {booking.cylinder?.cylinderName || booking.cylinder?.cylinderType || "N/A"}
                        <p className="text-xs text-gray-500">{booking.cylinder?.cylinderType}</p>
                      </TableCell>
                      <TableCell>{booking.quantity || 0}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{((booking.quantity || 0) * (booking.cylinder?.price || 0)).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        {new Date(booking.createdAt || booking.bookingDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStatus(booking)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {booking.paymentStatus !== "paid" && (
                            <PaymentButton
                              booking={booking}
                              onPaymentSuccess={() => {
                                dispatch(fetchCustomerBookings());
                                toast.success("Payment successful! Booking updated.");
                              }}
                            />
                          )}
                          {(booking.status === "pending" || booking.status === "requested") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateBooking(booking)}
                                disabled={updateLoading}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Update
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                disabled={updateLoading}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {updateLoading ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4 mr-1" />
                                )}
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
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
