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
  RotateCcw
} from "lucide-react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import axios from "@/config/config";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle map bounds when a marker is selected
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
  const [updatingBooking, setUpdatingBooking] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookings();
  }, [token]);

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
      
      console.log("Bookings API Response:", res.data); // Debug log
      
      // Handle different response formats
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

    // Apply search filter
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

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Apply payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((booking) => booking.paymentStatus === paymentFilter);
    }

    setFilteredBookings(filtered);
  }, [search, statusFilter, paymentFilter, bookings]);

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
      
      // Refresh bookings
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
    // Check if backend supports isReturned update
    // For now, we'll try to update it along with status
    handleUpdateBooking(bookingId, { isReturned: !currentStatus });
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
        <div className="flex-1 flex justify-center items-center">
          <div className="text-gray-500">Loading bookings...</div>
        </div>
      </div>
    );
  }

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + calculateTotalAmount(b), 0);

  const pendingRevenue = bookings
    .filter((b) => b.paymentStatus === "pending")
    .reduce((sum, b) => sum + calculateTotalAmount(b), 0);

  const returnedCylindersCount = bookings.filter((b) => b.isReturned === true).length;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Bookings
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {bookings.filter((b) => b.status === "delivered").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">₹{pendingRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cylinders Returned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{returnedCylindersCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-sm text-gray-500 flex items-center">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {search || statusFilter !== "all" || paymentFilter !== "all"
                    ? "No bookings found matching your filters."
                    : "No bookings found."}
                </p>
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
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {booking.customer?.username || booking.customer?.businessName || "Unknown Customer"}
                          </CardTitle>
                          {getStatusBadge(booking.status)}
                          {getPaymentBadge(booking.paymentStatus)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.createdAt)}
                          </span>
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
                      {/* Customer Details */}
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

                      {/* Cylinder Details */}
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
                        </div>
                      </div>

                      {/* Financial Details & Actions */}
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
                          
                          {/* Payment Status Update */}
                          <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-gray-600">Payment Status:</span>
                            <div className="flex items-center gap-2">
                              {getPaymentBadge(booking.paymentStatus)}
                              <select
                                value={booking.paymentStatus}
                                onChange={(e) => handlePaymentStatusChange(booking._id, e.target.value)}
                                disabled={updatingBooking === booking._id}
                                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>
                          </div>

                          {/* Delivery Status Update */}
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

                          {/* Cylinder Returned Update */}
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

        {/* Map Dialog */}
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

