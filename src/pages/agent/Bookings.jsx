import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import AgentSidebar from "@/components/layout/AgentSidebar";
import axios from "@/config/config";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomDatePicker from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapBounds({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}


export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
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
        errorMessage = "You don't have permission to access this resource.";
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
    setSelectedBooking(booking);
    setMapDialogOpen(true);
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
      <div className="flex bg-gray-50 min-h-screen">
        <AgentSidebar />
        <div className="flex-1 ml-64 flex justify-center items-center">
          <div className="text-gray-500">Loading bookings...</div>
        </div>
      </div>
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
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
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

        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedDate 
                  ? selectedDate instanceof Date && selectedDate > new Date()
                    ? "Scheduled Bookings (Future)"
                    : "Bookings (Selected Date)"
                  : "Total Bookings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{filteredBookings.length}</p>
              {selectedDate && bookings.length > filteredBookings.length && (
                <p className="text-xs text-gray-500 mt-1">
                  of {bookings.length} total
                </p>
              )}
              {selectedDate && selectedDate instanceof Date && selectedDate > new Date() && (
                <p className="text-xs text-blue-600 mt-1 font-semibold">
                  Scheduled deliveries
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{deliveredCount}</p>
              {selectedDate && (
                <p className="text-xs text-gray-500 mt-1">
                  for selected date
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedDate ? "Revenue (Selected Date)" : "Total Revenue"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
              {selectedDate && (
                <p className="text-xs text-gray-500 mt-1">
                  paid bookings
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">₹{pendingRevenue.toLocaleString()}</p>
              {selectedDate && (
                <p className="text-xs text-gray-500 mt-1">
                  for selected date
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cylinders Returned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{returnedCylindersCount}</p>
              {selectedDate && (
                <p className="text-xs text-gray-500 mt-1">
                  for selected date
                </p>
              )}
            </CardContent>
          </Card>
        </div>

      
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 lg:col-span-1">
                  <CustomDatePicker
                    label="Filter by Date"
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholderText="Select date to view bookings"
                    dateFormat="MMMM d, yyyy"
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                      className="text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setSelectedDate(yesterday);
                      }}
                      className="text-xs"
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setSelectedDate(tomorrow);
                      }}
                      className="text-xs bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      Tomorrow
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                      className="text-xs"
                    >
                      All Dates
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search bookings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{filteredBookings.length}</span> of <span className="font-semibold text-gray-700">{bookings.length}</span> bookings
                  {selectedDate && (
                    <span className="ml-2 text-blue-600">
                      for {selectedDate instanceof Date ? selectedDate.toLocaleDateString("en-US", { 
                        weekday: "long",
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                      }) : new Date(selectedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="text-xs"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Reset to Today
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {selectedDate || search || statusFilter !== "all" || paymentFilter !== "all"
                    ? "No bookings found matching your filters."
                    : "No bookings found."}
                </p>
                {selectedDate && (
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Today's Bookings
                    </Button>
                    {selectedDate instanceof Date && selectedDate <= new Date() && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setSelectedDate(tomorrow);
                        }}
                        className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View Tomorrow's Bookings
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDate(null)}
                    >
                      View All Bookings
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map((booking) => {
              const customerLocation = booking.customer?.location?.coordinates
                ? [booking.customer.location.coordinates[1], booking.customer.location.coordinates[0]]
                : null;

              return (
                <Card key={booking._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl">
                            {booking.customer?.username || booking.customer?.businessName || "Unknown Customer"}
                          </CardTitle>
                          {getStatusBadge(booking.status)}
                          <Badge variant="outline" className={booking.paymentMethod === "online" ? "bg-purple-50 text-purple-700 border-purple-300" : "bg-gray-50 text-gray-700 border-gray-300"}>
                            {booking.paymentMethod === "online" ? "Online" : "Cash"}
                          </Badge>
                          {getPaymentBadge(booking.paymentStatus)}
                          {booking.status === "delivered" && booking.paymentStatus === "pending" && booking.paymentMethod === "cash" && (
                            <Badge className="bg-orange-500 text-white">
                              Collect Cash
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Booked: {formatDate(booking.createdAt)}</span>
                          </span>
                          {booking.deliveryDate && (
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              <span className={new Date(booking.deliveryDate) > new Date() ? "text-blue-600 font-semibold" : ""}>
                                Delivery: {formatDate(booking.deliveryDate)}
                                {new Date(booking.deliveryDate) > new Date() && (
                                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300">
                                    Upcoming
                                  </Badge>
                                )}
                              </span>
                            </span>
                          )}
                          {booking.isReturned && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Returned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Customer Details
                        </h3>
                        <div className="text-sm space-y-1 text-gray-600">
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {booking.customer?.phoneNo || "N/A"}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {booking.customer?.email || "N/A"}
                          </p>
                          <p className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1" />
                            <span>{formatAddress(booking.customer?.address)}</span>
                          </p>
                          {customerLocation && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewMap(booking)}
                              className="mt-2 w-full"
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              View on Map
                            </Button>
                          )}
                        </div>
                      </div>

                    
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Cylinder Details
                        </h3>
                        <div className="text-sm space-y-1 text-gray-600">
                          <p><strong>Type:</strong> {booking.cylinder?.cylinderType || "N/A"}</p>
                          <p><strong>Weight:</strong> {booking.cylinder?.weight ? `${booking.cylinder.weight} kg` : "N/A"}</p>
                          <p><strong>Quantity:</strong> {booking.quantity || 0}</p>
                          <p><strong>Price per unit:</strong> ₹{booking.cylinder?.price ? booking.cylinder.price.toLocaleString() : 0}</p>
                          {booking.deliveryDate && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-blue-800">
                                <strong>📅 Scheduled Delivery:</strong> {new Date(booking.deliveryDate).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })}
                                {new Date(booking.deliveryDate) > new Date() && (
                                  <span className="ml-2 text-blue-600 font-semibold">(Upcoming)</span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Financial Details & Actions
                        </h3>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-bold text-lg text-blue-600">
                              ₹{calculateTotalAmount(booking).toLocaleString()}
                            </span>
                          </div>
                          
                        
                          <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-gray-600">Payment Method:</span>
                            <Badge variant="outline" className={booking.paymentMethod === "online" ? "bg-purple-50 text-purple-700 border-purple-300" : "bg-gray-50 text-gray-700 border-gray-300"}>
                              {booking.paymentMethod === "online" ? "Online" : "Cash"}
                            </Badge>
                          </div>

                          
                          <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-gray-600">Payment Status:</span>
                            <div className="flex items-center gap-2">
                              {getPaymentBadge(booking.paymentStatus)}
                              {booking.status === "delivered" && booking.paymentStatus === "pending" && booking.paymentMethod === "cash" && (
                                <span className="text-xs text-orange-600 font-medium">Collect Cash</span>
                              )}
                              {booking.status === "delivered" && booking.paymentStatus === "pending" && booking.paymentMethod === "online" && (
                                <span className="text-xs text-blue-600 font-medium">Customer will pay online</span>
                              )}
                              <select
                                value={booking.paymentStatus}
                                onChange={(e) => handlePaymentStatusChange(booking._id, e.target.value)}
                                disabled={updatingBooking === booking._id || (booking.status !== "delivered" && booking.paymentStatus === "pending")}
                                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>
                          </div>

                      
                          <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-gray-600">Delivery Status:</span>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(booking.status)}
                              <select
                                value={booking.status}
                                onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                disabled={updatingBooking === booking._id}
                                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          
                          <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-gray-600">Cylinder Returned:</span>
                            <div className="flex items-center gap-2">
                              {booking.isReturned ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-400" />
                              )}
                              <Button
                                size="sm"
                                variant={booking.isReturned ? "outline" : "default"}
                                onClick={() => handleReturnedToggle(booking._id, booking.isReturned)}
                                disabled={updatingBooking === booking._id}
                                className="h-7 text-xs"
                              >
                                {updatingBooking === booking._id ? (
                                  "Updating..."
                                ) : booking.isReturned ? (
                                  <>
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Mark Unreturned
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Mark Returned
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
                    No customers assigned to you. Please contact admin to assign customers.
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
                        {stock.cylinderId.cylinderType} - Available: {stock.quantity} - ₹{stock.cylinderId.price}/unit
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

  
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Customer Location & Directions
              </DialogTitle>
            </DialogHeader>
            {selectedBooking && selectedBooking.customer?.location?.coordinates && (
              <div className="mt-4">
                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    <strong>Customer:</strong> {selectedBooking.customer?.username || selectedBooking.customer?.businessName}
                  </p>
                  <p>
                    <strong>Address:</strong> {formatAddress(selectedBooking.customer?.address)}
                  </p>
                </div>
                <div className="h-[500px] w-full rounded-lg overflow-hidden border">
                  <MapContainer
                    center={[
                      selectedBooking.customer.location.coordinates[1],
                      selectedBooking.customer.location.coordinates[0],
                    ]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapBounds
                      center={[
                        selectedBooking.customer.location.coordinates[1],
                        selectedBooking.customer.location.coordinates[0],
                      ]}
                      zoom={13}
                    />
                    <Marker
                      position={[
                        selectedBooking.customer.location.coordinates[1],
                        selectedBooking.customer.location.coordinates[0],
                      ]}
                    >
                      <Popup>
                        <div>
                          <strong>{selectedBooking.customer?.username || selectedBooking.customer?.businessName}</strong>
                          <p className="text-sm text-gray-600">{formatAddress(selectedBooking.customer?.address)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const lat = selectedBooking.customer.location.coordinates[1];
                      const lon = selectedBooking.customer.location.coordinates[0];
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
                    }}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


