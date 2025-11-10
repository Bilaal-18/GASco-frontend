import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerBookings, setSelectedBooking, cancelBooking } from "@/store/slices/customer/customerBookingsSlice";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Edit, Loader2, AlertCircle, X, Package, Calendar, DollarSign, MapPin, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PaymentButton from "@/components/PaymentButton";

export default function CustomerBookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookings, loading, error, updateLoading } = useSelector((state) => state.customerBookings);
  const [filter, setFilter] = useState("all");
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchCustomerBookings());
  }, [dispatch]);

  // Filter and search bookings
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
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

    // Search filter
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

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

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

  const toggleBookingDetails = (bookingId) => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedBookings(newExpanded);
  };

  const formatAddress = (address) => {
    if (!address) return "Not provided";
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    return parts.length > 0 ? parts.join(", ") : "Not provided";
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

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by booking ID, cylinder name, agent name, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Tabs and Items Per Page */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
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
            
            {/* Items Per Page */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-md px-3 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
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
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - Search: "{searchQuery}"
                </span>
              )}
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
              <>
                <div className="space-y-4">
                  {paginatedBookings.map((booking) => {
                  const isExpanded = expandedBookings.has(booking._id);
                  const totalAmount = ((booking.quantity || 0) * (booking.cylinder?.price || 0));
                  const bookingDate = new Date(booking.createdAt || booking.bookingDate);
                  
                  return (
                    <Card key={booking._id} className="overflow-hidden">
                      <CardContent className="p-0">
                        
                        <div className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                          
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                                <p className="font-semibold">#{booking._id?.slice(-8).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Cylinder</p>
                                <p className="font-medium">{booking.cylinder?.cylinderName || "N/A"}</p>
                                <p className="text-xs text-gray-500">{booking.cylinder?.cylinderType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                <p className="font-medium">{booking.quantity || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Amount</p>
                                <p className="font-semibold text-green-600">₹{totalAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <div>{getStatusBadge(booking.status)}</div>
                                {booking.status === "delivered" && booking.paymentStatus !== "paid" && (
                                  <p className="text-xs text-orange-600 mt-1 font-medium">
                                    {booking.paymentMethod === "online" ? "Pay Now" : "Pay Cash"}
                                  </p>
                                )}
                              </div>
                            </div>

                          
                            <div className="flex gap-2 flex-wrap items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleBookingDetails(booking._id)}
                                className="flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    View Details
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewStatus(booking)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>

                    
                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  Cylinder Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p>
                                    <span className="text-gray-600">Name:</span>{" "}
                                    <span className="font-medium">{booking.cylinder?.cylinderName || "N/A"}</span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Type:</span>{" "}
                                    <span className="font-medium">{booking.cylinder?.cylinderType || "N/A"}</span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Weight:</span>{" "}
                                    <span className="font-medium">{booking.cylinder?.weight || "N/A"} kg</span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Price per unit:</span>{" "}
                                    <span className="font-medium">₹{booking.cylinder?.price?.toLocaleString() || "N/A"}</span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Quantity:</span>{" "}
                                    <span className="font-medium">{booking.quantity || 0}</span>
                                  </p>
                                </div>
                              </div>

                            
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Order Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p>
                                    <span className="text-gray-600">Booking Date:</span>{" "}
                                    <span className="font-medium">{bookingDate.toLocaleDateString()}</span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Booking Time:</span>{" "}
                                    <span className="font-medium">{bookingDate.toLocaleTimeString()}</span>
                                  </p>
                                  {booking.deliveryDate && (
                                    <p>
                                      <span className="text-gray-600">Delivery Date:</span>{" "}
                                      <span className="font-medium">
                                        {new Date(booking.deliveryDate).toLocaleDateString()}
                                      </span>
                                    </p>
                                  )}
                                  <p>
                                    <span className="text-gray-600">Total Amount:</span>{" "}
                                    <span className="font-semibold text-green-600 text-lg">
                                      ₹{totalAmount.toLocaleString()}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Return Status:</span>{" "}
                                    <Badge variant={booking.isReturned ? "default" : "secondary"}>
                                      {booking.isReturned ? "Returned" : "Not Returned"}
                                    </Badge>
                                  </p>
                                </div>
                              </div>

                              
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Payment & Agent
                                </h4>
                                <div className="space-y-2 text-sm mb-4">
                                  <p>
                                    <span className="text-gray-600">Payment Method:</span>{" "}
                                    <Badge variant="outline" className="ml-1">
                                      {booking.paymentMethod === "online" ? "Online" : "Cash"}
                                    </Badge>
                                  </p>
                                  <p>
                                    <span className="text-gray-600">Payment Status:</span>{" "}
                                    <Badge
                                      variant={booking.paymentStatus === "paid" ? "default" : "secondary"}
                                      className={
                                        booking.paymentStatus === "paid"
                                          ? "bg-green-500 text-white"
                                          : "bg-yellow-500 text-white"
                                      }
                                    >
                                      {booking.paymentStatus?.toUpperCase() || "PENDING"}
                                    </Badge>
                                  </p>
                                  {booking.status === "delivered" && booking.paymentStatus !== "paid" && (
                                    <p className="text-xs text-orange-600 font-medium">
                                      {booking.paymentMethod === "online" 
                                        ? "Please complete your payment now"
                                        : "Please pay in cash to your agent"}
                                    </p>
                                  )}
                                  {booking.agent && (
                                    <>
                                      <p>
                                        <span className="text-gray-600">Agent Name:</span>{" "}
                                        <span className="font-medium">{booking.agent?.agentname || booking.agent?.username || "N/A"}</span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">Agent Email:</span>{" "}
                                        <span className="font-medium">{booking.agent?.email || "N/A"}</span>
                                      </p>
                                      {booking.agent?.phoneNo && (
                                        <p>
                                          <span className="text-gray-600">Agent Phone:</span>{" "}
                                          <span className="font-medium">{booking.agent.phoneNo}</span>
                                        </p>
                                      )}
                                      {booking.agent?.address && (
                                        <p>
                                          <span className="text-gray-600 flex items-start gap-1">
                                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>Address:</span>
                                          </span>{" "}
                                          <span className="font-medium block mt-1">
                                            {formatAddress(booking.agent.address)}
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                                
                            
                                <div className="flex flex-col gap-2 mt-4">
                                  {/* Payment button only shows for delivered bookings with online payment method */}
                                  {booking.status === "delivered" && booking.paymentStatus !== "paid" && booking.paymentMethod === "online" && (
                                    <PaymentButton
                                      booking={booking}
                                      onPaymentSuccess={() => {
                                        dispatch(fetchCustomerBookings());
                                        toast.success("Payment successful! Booking updated.");
                                      }}
                                    />
                                  )}
                                  {booking.status === "delivered" && booking.paymentStatus !== "paid" && booking.paymentMethod === "cash" && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <p className="text-sm text-blue-800 font-medium">
                                        Cash Payment Required
                                      </p>
                                      <p className="text-xs text-blue-600 mt-1">
                                        Please pay in cash to your agent: {booking.agent?.agentname || booking.agent?.username || "N/A"}
                                      </p>
                                    </div>
                                  )}
                                  {(booking.status === "pending" || booking.status === "requested") && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateBooking(booking)}
                                        disabled={updateLoading}
                                        className="flex-1"
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Update
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleCancelBooking(booking)}
                                        disabled={updateLoading}
                                        className="bg-red-600 hover:bg-red-700 text-white flex-1"
                                      >
                                        {updateLoading ? (
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                          <X className="w-4 h-4 mr-1" />
                                        )}
                                        Cancel
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>

            
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, array) => {
                            // Add ellipsis
                            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsisBefore && <span className="px-2">...</span>}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="min-w-[40px]"
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
