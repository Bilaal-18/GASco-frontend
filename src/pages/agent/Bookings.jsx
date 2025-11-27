import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText, 
  MapPin, 
  Package, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RotateCcw,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import axios from "@/config/config";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomDatePicker from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [updatingBooking, setUpdatingBooking] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [bookingFormData, setBookingFormData] = useState({
    customerId: "",
    cylinderId: "",
    quantity: 1,
    paymentMethod: "cash",
    deliveryDate: null,
  });
  const [creatingBooking, setCreatingBooking] = useState(false);
  const token = localStorage.getItem("token");
  const [agentId, setAgentId] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchAgentId();
  }, [token]);

  const fetchAgentId = async () => {
    try {
      const res = await axios.get("/api/account", {
        headers: { Authorization: token },
      });
      if (res.data && res.data._id) {
        setAgentId(res.data._id);
      }
    } catch (err) {
      console.error("Error fetching agent ID:", err);
    }
  };

  const fetchCustomers = async () => {
    if (!agentId) return;
    try {
      console.log(`Fetching customers for agent: ${agentId}`);
      const res = await axios.get(`/api/agentCustomers/${agentId}`, {
        headers: { Authorization: token },
      });
      const customersData = res.data?.customers || res.data || [];
      const customersArray = Array.isArray(customersData) ? customersData : [];
      
      console.log(`Fetched ${customersArray.length} customers for agent ${agentId}`);
      console.log("Customers:", customersArray.map(c => ({ id: c._id, name: c.username || c.businessname })));
      
      const validCustomers = customersArray.filter(customer => customer._id);
      setCustomers(validCustomers);
      
      if (validCustomers.length === 0) {
        console.warn("No customers found for this agent");
        toast.warning("No customers assigned to you. Please contact admin to assign customers.");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      console.error("Error response:", err.response?.data);
      toast.error("Failed to fetch customers. Please refresh the page.");
    }
  };

  const fetchAvailableStocks = async () => {
    if (!agentId) return;
    try {
      const res = await axios.get(`/api/ownStock/${agentId}`, {
        headers: { Authorization: token },
      });
      const stocksData = res.data?.Ownstock || res.data?.ownStock || res.data || [];
      const stocksArray = Array.isArray(stocksData) ? stocksData : [];
      const availableStocks = stocksArray.filter(stock => stock.quantity > 0);
      setAvailableStocks(availableStocks);
    } catch (err) {
      console.error("Error fetching available stocks:", err);
      toast.error("Failed to fetch available stocks");
    }
  };

  useEffect(() => {
    if (agentId && bookingDialogOpen) {
      fetchCustomers();
      fetchAvailableStocks();
    }
  }, [agentId, bookingDialogOpen, token]);

  const fetchBookings = async () => {
    if (!token) {
      toast.error("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const res = await axios.get("/api/agentBookings", {
        headers: { Authorization: token },
      });
      
      console.log("Bookings API Response:", res.data); 
      
      const bookingsData = res.data.bookings || res.data || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setFilteredBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      console.error("Error response:", err?.response);
      console.error("Error status:", err?.response?.status);
      console.error("Error data:", err?.response?.data);
      
      let errorMessage = "Failed to fetch bookings";
      
      if (err?.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        localStorage.removeItem("token");
      } else if (err?.response?.status === 403) {
        errorMessage = "Access denied.";
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bookings;

    if (selectedDate) {
      const selectedDateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      const startOfDay = new Date(selectedDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateObj);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        const deliveryDate = booking.deliveryDate ? new Date(booking.deliveryDate) : null;
        
        const bookingDateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
        const deliveryDateOnly = deliveryDate ? new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate()) : null;
        const selectedDateOnly = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), startOfDay.getDate());
        
    
        const matchesCreatedDate = bookingDateOnly.getTime() === selectedDateOnly.getTime();
        const matchesDeliveryDate = deliveryDateOnly && deliveryDateOnly.getTime() === selectedDateOnly.getTime();
        
        return matchesCreatedDate || matchesDeliveryDate;
      });
    }

    if (search) {
      filtered = filtered.filter((booking) => {
        const customerName = booking.customer?.username || booking.customer?.businessName || "";
        const cylinderType = booking.cylinder?.cylinderType || "";
        const customerPhone = booking.customer?.phoneNo || "";
        const searchLower = search.toLowerCase();
        return (
          customerName.toLowerCase().includes(searchLower) ||
          cylinderType.toLowerCase().includes(searchLower) ||
          customerPhone.includes(search)
        );
      });
    }

  
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

  
    if (paymentFilter !== "all") {
      filtered = filtered.filter((booking) => booking.paymentStatus === paymentFilter);
    }

    setFilteredBookings(filtered);
  }, [search, statusFilter, paymentFilter, selectedDate, bookings]);

  const handleViewMap = (booking) => {
    navigate(`/agent/bookings/map/${booking._id}`);
  };

  const handleUpdateBooking = async (bookingId, updates) => {
    try {
      setUpdatingBooking(bookingId);
      const res = await axios.put(`/api/updateBooking/${bookingId}`, updates, {
        headers: { Authorization: token },
      });
      
      toast.success("Booking updated successfully!");
      
    
      await fetchBookings();
      setUpdatingBooking(null);
    } catch (err) {
      console.error("Error updating booking:", err);
      const errorMessage = err?.response?.data?.error || "Failed to update booking";
      toast.error(errorMessage);
      setUpdatingBooking(null);
    }
  };

  const handleStatusChange = (bookingId, newStatus) => {
    handleUpdateBooking(bookingId, { status: newStatus });
  };

  const handlePaymentStatusChange = (bookingId, newPaymentStatus) => {
    handleUpdateBooking(bookingId, { paymentStatus: newPaymentStatus });
  };

  const handleReturnedToggle = (bookingId, currentStatus) => {
    handleUpdateBooking(bookingId, { isReturned: !currentStatus });
  };

  const handleReturnedChange = (bookingId, value) => {
    handleUpdateBooking(bookingId, { isReturned: value === "returned" });
  };

  const handleCreateBooking = async () => {
    if (!bookingFormData.customerId || !bookingFormData.cylinderId || bookingFormData.quantity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

  
    const selectedStock = availableStocks.find(s => s.cylinderId._id === bookingFormData.cylinderId);
    if (!selectedStock || selectedStock.quantity < bookingFormData.quantity) {
      toast.error("Insufficient stock available");
      return;
    }

    try {
      setCreatingBooking(true);
      
      if (!bookingFormData.customerId) {
        toast.error("Please select a customer");
        setCreatingBooking(false);
        return;
      }
      
      const bookingData = {
        customerId: bookingFormData.customerId,
        cylinderId: bookingFormData.cylinderId,
        quantity: parseInt(bookingFormData.quantity),
        paymentMethod: bookingFormData.paymentMethod,
        deliveryDate: bookingFormData.deliveryDate
          ? bookingFormData.deliveryDate.toISOString().split('T')[0]
          : undefined,
      };

      console.log("Creating booking with data:", bookingData);

      const res = await axios.post("/api/newBooking", bookingData, {
        headers: { Authorization: token },
      });

      toast.success(res.data.message || "Booking created successfully!");
      
      
      setBookingFormData({
        customerId: "",
        cylinderId: "",
        quantity: 1,
        paymentMethod: "cash",
        deliveryDate: null,
      });
      setBookingDialogOpen(false);

    
      await fetchBookings();
      await fetchAvailableStocks(); 
    } catch (err) {
      console.error("Error creating booking:", err);
      console.error("Error response:", err?.response?.data);
      const errorMessage = err?.response?.data?.error || "Failed to create booking";
      toast.error(errorMessage);
      
      if (errorMessage.includes("agent assigned") || errorMessage.includes("not assigned to you")) {
        await fetchCustomers();
      }
    } finally {
      setCreatingBooking(false);
    }
  };

  const getStatusLabel = (status) => {
    return status ? status.toUpperCase() : "N/A";
  };

  const getPaymentLabel = (paymentStatus) => {
    return paymentStatus ? paymentStatus.toUpperCase() : "N/A";
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "outline",
      confirmed: "secondary",
      delivered: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const getPaymentBadge = (paymentStatus) => {
    const variants = {
      pending: "outline",
      paid: "default",
    };
    return (
      <Badge variant={variants[paymentStatus] || "outline"} className={paymentStatus === "paid" ? "bg-green-600" : ""}>
        {paymentStatus === "paid" ? (
          <CheckCircle2 className="w-3 h-3 mr-1" />
        ) : (
          <Clock className="w-3 h-3 mr-1" />
        )}
        {paymentStatus.toUpperCase()}
      </Badge>
    );
  };

  const calculateTotalAmount = (booking) => {
    if (booking.cylinder?.price && booking.quantity) {
      return booking.cylinder.price * booking.quantity;
    }
    return 0;
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

  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAddress = (address) => {
    if (!address) return "No address";
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    return parts.length > 0 ? parts.join(", ") : "No address";
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-gray-500">Loading bookings...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const totalRevenue = filteredBookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + calculateTotalAmount(b), 0);

  const pendingRevenue = filteredBookings
    .filter((b) => b.paymentStatus === "pending")
    .reduce((sum, b) => sum + calculateTotalAmount(b), 0);

  const returnedCylindersCount = filteredBookings.filter((b) => b.isReturned === true).length;
  
  const deliveredCount = filteredBookings.filter((b) => b.status === "delivered").length;

  return (
    <SidebarProvider>
      <AgentSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Bookings
            </h1>
            {selectedDate && (
              <p className="text-sm text-gray-600 mt-1">
                Showing bookings for {selectedDate instanceof Date ? selectedDate.toLocaleDateString("en-US", { 
                  weekday: "long",
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                }) : new Date(selectedDate).toLocaleDateString()}
                {selectedDate instanceof Date && selectedDate > new Date() && (
                  <span className="ml-2 text-blue-600 font-semibold">(Future Date - Showing Scheduled Deliveries)</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setBookingDialogOpen(true)}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Book for Customer
            </Button>
            <Button
              onClick={fetchBookings}
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Bookings</div>
              <div className="text-2xl font-bold">{filteredBookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Delivered</div>
              <div className="text-2xl font-bold">{deliveredCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Revenue</div>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Pending Payments</div>
              <div className="text-2xl font-bold">₹{pendingRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Returned</div>
              <div className="text-2xl font-bold">{returnedCylindersCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex gap-2">
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentFilter}
            onValueChange={setPaymentFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <CustomDatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            placeholderText="Date"
            dateFormat="MMM d, yyyy"
            className="w-32"
          />
          {selectedDate && (
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
              Clear
            </Button>
          )}
        </div>

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500 text-lg">Booking not found.</div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Cylinder</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Directions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const customerLocation = booking.customer?.location?.coordinates
                        ? [booking.customer.location.coordinates[1], booking.customer.location.coordinates[0]]
                        : null;

                      return (
                        <TableRow key={booking._id}>
                          <TableCell>
                            {booking.customer?.username || booking.customer?.businessName || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {booking.customer?.phoneNo || "N/A"}
                          </TableCell>
                          <TableCell>
                            {booking.cylinder?.cylinderType || "N/A"} ({booking.cylinder?.weight || "N/A"} kg)
                          </TableCell>
                          <TableCell>
                            {booking.quantity || 0}
                          </TableCell>
                          <TableCell>
                            ₹{calculateTotalAmount(booking).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {booking.status || "N/A"}
                            {booking.isReturned && " (Returned)"}
                          </TableCell>
                          <TableCell>
                            {booking.paymentStatus || "N/A"} ({booking.paymentMethod === "online" ? "Online" : "Cash"})
                          </TableCell>
                          <TableCell>
                            {booking.deliveryDate ? formatDateOnly(booking.deliveryDate) : "N/A"}
                          </TableCell>
                          <TableCell>
                            {customerLocation ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMap(booking)}
                              >
                                <Navigation className="w-4 h-4 mr-1" />
                                Map
                              </Button>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="space-y-2 min-w-[220px]">
                            {/* Payment status */}
                            <Select
                              value={booking.paymentStatus || "pending"}
                              onValueChange={(value) =>
                                handlePaymentStatusChange(booking._id, value)
                              }
                              disabled={updatingBooking === booking._id}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Payment status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid"> Paid</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Delivery status */}
                            <Select
                              value={booking.status || "pending"}
                              onValueChange={(value) =>
                                handleStatusChange(booking._id, value)
                              }
                              disabled={updatingBooking === booking._id}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Delivery status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Return cylinder */}
                            <Select
                              value={booking.isReturned ? "returned" : "not_returned"}
                              onValueChange={(value) =>
                                handleReturnedChange(booking._id, value)
                              }
                              disabled={updatingBooking === booking._id}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Return cylinder" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_returned">
                                  Not Returned
                                </SelectItem>
                                <SelectItem value="returned">
                                  Returned
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Book Cylinder for Customer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
          
              <div>
                <Label htmlFor="customer">Select Customer *</Label>
                <select
                  id="customer"
                  value={bookingFormData.customerId}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  required
                  disabled={customers.length === 0}
                >
                  <option value="">-- Select Customer --</option>
                  {customers.length === 0 ? (
                    <option value="" disabled>No customers available</option>
                  ) : (
                    customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.businessname || customer.username} - {customer.phoneNo}
                      </option>
                    ))
                  )}
                </select>
                {customers.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    No customers assigned.
                  </p>
                )}
              </div>

              
              <div>
                <Label htmlFor="cylinder">Select Cylinder *</Label>
                <select
                  id="cylinder"
                  value={bookingFormData.cylinderId}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, cylinderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  required
                  disabled={availableStocks.length === 0}
                >
                  <option value="">-- Select Cylinder --</option>
                  {availableStocks.length === 0 ? (
                    <option value="" disabled>No stock available</option>
                  ) : (
                    availableStocks.map((stock) => (
                      <option key={stock.cylinderId._id} value={stock.cylinderId._id}>
                        {stock.cylinderId.cylinderName} - {stock.cylinderId.cylinderType} - Available: {stock.quantity} - ₹{stock.cylinderId.price}/unit
                      </option>
                    ))
                  )}
                </select>
                {availableStocks.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    No stock available. Please request stock from admin.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={bookingFormData.quantity}
                  onChange={(e) => {
                    const selectedStock = availableStocks.find(
                      s => s.cylinderId._id === bookingFormData.cylinderId
                    );
                    const maxQty = selectedStock ? selectedStock.quantity : 0;
                    const qty = Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1));
                    setBookingFormData({ ...bookingFormData, quantity: qty });
                  }}
                  className="mt-1"
                  required
                />
                {bookingFormData.cylinderId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {
                      availableStocks.find(s => s.cylinderId._id === bookingFormData.cylinderId)?.quantity || 0
                    } units
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  value={bookingFormData.paymentMethod}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <Label htmlFor="deliveryDate">Delivery Date (Optional)</Label>
                <CustomDatePicker
                  selected={bookingFormData.deliveryDate}
                  onChange={(date) => setBookingFormData({ ...bookingFormData, deliveryDate: date })}
                  minDate={new Date()}
                  placeholderText="Select delivery date"
                  className="w-full mt-1"
                />
              </div>

              {bookingFormData.cylinderId && bookingFormData.quantity > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{(
                      (availableStocks.find(s => s.cylinderId._id === bookingFormData.cylinderId)?.cylinderId.price || 0) *
                      bookingFormData.quantity
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingDialogOpen(false);
                    setBookingFormData({
                      customerId: "",
                      cylinderId: "",
                      quantity: 1,
                      paymentMethod: "cash",
                      deliveryDate: null,
                    });
                  }}
                  disabled={creatingBooking}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBooking}
                  disabled={
                    creatingBooking ||
                    !bookingFormData.customerId ||
                    !bookingFormData.cylinderId ||
                    bookingFormData.quantity <= 0
                  }
                >
                  {creatingBooking ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


