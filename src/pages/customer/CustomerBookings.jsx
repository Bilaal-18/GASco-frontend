import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerBookings, setSelectedBooking, cancelBooking } from "@/store/slices/customer/customerBookingsSlice";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PaymentButton from "@/components/PaymentButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CustomerBookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookings, loading, error, updateLoading } = useSelector((state) => state.customerBookings);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;


  useEffect(() => {
    dispatch(fetchCustomerBookings());
  }, [dispatch]);

  
  const filteredBookings = bookings.filter((booking) => {
  
    if (filter !== "all") {
      const status = booking.status?.toLowerCase();
      switch (filter) {
        case "pending":
          if (status !== "pending" && status !== "requested") return false;
          break;
        case "active":
          if (status !== "active" && status !== "confirmed" && status !== "in-progress") return false;
          break;
        case "completed":
          if (status !== "completed" && status !== "delivered") return false;
          break;
        case "cancelled":
          if (status !== "cancelled") return false;
          break;
        default:
          if (status !== filter) return false;
      }
    }

    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const bookingId = booking._id?.slice(-8).toUpperCase() || "";
      const cylinderName = booking.cylinder?.cylinderName?.toLowerCase() || "";
      const cylinderType = booking.cylinder?.cylinderType?.toLowerCase() || "";
      const agentName = booking.agent?.agentname?.toLowerCase() || booking.agent?.username?.toLowerCase() || "";
      const status = booking.status?.toLowerCase() || "";
      
      if (
        !bookingId.includes(query) &&
        !cylinderName.includes(query) &&
        !cylinderType.includes(query) &&
        !agentName.includes(query) &&
        !status.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  
const totalPages = Math.ceil(filteredBookings.length / pageSize);
const startIndex = (page - 1) * pageSize;
const endIndex = startIndex + pageSize;
const paginatedBookings = filteredBookings.slice(startIndex, endIndex);



  useEffect(() => {
  setPage(1);
  }, [filter, searchQuery]);


  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      requested: "Pending",
      "in-progress": "In Progress",
      confirmed: "Confirmed",
      active: "Active",
      delivered: "Delivered",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status || "Pending";
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

  const formatDateOnly = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <SidebarProvider>
        <CustomerSidebar />
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
      <CustomerSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
        </div>

        <div className="mb-6 flex gap-2">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All bookings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600">Error: {error}</div>
            </CardContent>
          </Card>
        )}

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">No bookings found</div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Cylinder</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => {
                    const totalAmount = ((booking.quantity || 0) * (booking.cylinder?.price || 0));
                    return (
                      <TableRow key={booking._id}>
                        <TableCell>#{booking._id?.slice(-8).toUpperCase()}</TableCell>
                        <TableCell>
                          {booking.cylinder?.cylinderName || booking.cylinder?.cylinderType || "N/A"}
                        </TableCell>
                        <TableCell>{booking.quantity || 0}</TableCell>
                        <TableCell>₹{totalAmount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusText(booking.status)}</TableCell>
                        <TableCell>
                          <span className={booking.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}>
                            {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                          </span> ({booking.paymentMethod === "online" ? "Online" : "Cash"})
                        </TableCell>
                        <TableCell>{formatDateOnly(booking.createdAt || booking.bookingDate)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === "delivered" && booking.paymentStatus !== "paid" && booking.paymentMethod === "online" && (
                              <PaymentButton
                                booking={booking}
                                onPaymentSuccess={() => {
                                  dispatch(fetchCustomerBookings());
                                  toast.success("Payment successful!");
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
                                  Update
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking)}
                                  disabled={updateLoading}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

     {totalPages > 1 && (
  <div className="flex flex-col items-center gap-3 mt-4">
    <p className="text-sm text-muted-foreground">
      Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length}
    </p>

    <Pagination>
      <PaginationContent>

        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && setPage(page - 1)}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {/* Page Numbers */}
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink
              isActive={page === i + 1}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && setPage(page + 1)}
            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

      </PaginationContent>
    </Pagination>
  </div>
)}

          </>
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
