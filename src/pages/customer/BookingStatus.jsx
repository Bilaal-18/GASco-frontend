import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingById, fetchCustomerBookings } from "@/store/slices/customer/customerBookingsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle2, Clock, Package } from "lucide-react";
import PaymentButton from "@/components/PaymentButton";
import { toast } from "sonner";

export default function BookingStatus() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedBooking, loading, error } = useSelector((state) => state.customerBookings);

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingById(bookingId));
    }
  }, [dispatch, bookingId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "in-progress":
      case "active":
        return <Clock className="w-6 h-6 text-blue-600" />;
      default:
        return <Package className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in-progress":
      case "active":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
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

  if (error || !selectedBooking) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <CustomerSidebar />
        <div className="flex-1 ml-64 p-8">
          <Button variant="outline" onClick={() => navigate("/customer/bookings")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error || "Booking not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalAmount = (selectedBooking.quantity || 0) * (selectedBooking.cylinder?.price || 0);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <CustomerSidebar />
      <div className="flex-1 ml-64 p-8">
        <Button variant="outline" onClick={() => navigate("/customer/bookings")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Status</h1>
          <p className="text-gray-600">Booking ID: #{selectedBooking._id?.slice(-8).toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(selectedBooking.status)}
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${getStatusColor(selectedBooking.status)} text-lg px-4 py-2`}>
                {selectedBooking.status || "Pending"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cylinder Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <span className="font-semibold">Name:</span> {selectedBooking.cylinder?.cylinderName || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Type:</span> {selectedBooking.cylinder?.cylinderType || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Weight:</span> {selectedBooking.cylinder?.weight || "N/A"} kg
              </p>
              <p>
                <span className="font-semibold">Quantity:</span> {selectedBooking.quantity || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <span className="font-semibold">Booking Date:</span>{" "}
                {new Date(selectedBooking.createdAt || selectedBooking.bookingDate).toLocaleString()}
              </p>
              {selectedBooking.deliveryDate && (
                <p>
                  <span className="font-semibold">Delivery Date:</span>{" "}
                  {new Date(selectedBooking.deliveryDate).toLocaleDateString()}
                </p>
              )}
              <p>
                <span className="font-semibold">Total Amount:</span>{" "}
                <span className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge
                  variant={selectedBooking.paymentStatus === "paid" ? "default" : "secondary"}
                  className={
                    selectedBooking.paymentStatus === "paid"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }
                >
                  {selectedBooking.paymentStatus?.toUpperCase() || "PENDING"}
                </Badge>
              </div>
              {selectedBooking.paymentStatus !== "paid" && (
                <div>
                  <PaymentButton
                    booking={selectedBooking}
                    onPaymentSuccess={async () => {
                      await dispatch(fetchBookingById(selectedBooking._id));
                      await dispatch(fetchCustomerBookings());
                      toast.success("Payment successful! Booking updated.");
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
