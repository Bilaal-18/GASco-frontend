import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingById, updateBooking } from "@/store/slices/customer/customerBookingsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function UpdateBooking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedBooking, loading, updateLoading } = useSelector(
    (state) => state.customerBookings
  );
  const [formData, setFormData] = useState({
    quantity: 0,
  });

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingById(bookingId));
    }
  }, [dispatch, bookingId]);

  useEffect(() => {
    if (selectedBooking) {
      setFormData({
        quantity: selectedBooking.quantity || 0,
      });
    }
  }, [selectedBooking]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    try {
      await dispatch(updateBooking({ bookingId, updateData: formData })).unwrap();
      toast.success("Booking updated successfully!");
      navigate("/customer/bookings");
    } catch (err) {
      toast.error(err || "Failed to update booking");
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

  if (!selectedBooking) {
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
              <p className="text-red-600">Booking not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalAmount = formData.quantity * (selectedBooking.cylinder?.price || 0);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <CustomerSidebar />
      <div className="flex-1 ml-64 p-8">
        <Button variant="outline" onClick={() => navigate("/customer/bookings")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Update Booking</h1>
          <p className="text-gray-600">Booking ID: #{selectedBooking._id?.slice(-8).toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cylinder</p>
                <p className="font-semibold">{selectedBooking.cylinder?.cylinderName || "N/A"}</p>
                <p className="text-sm text-gray-500">{selectedBooking.cylinder?.cylinderType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Price per Unit</p>
                <p className="font-semibold">₹{selectedBooking.cylinder?.price?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current quantity: {selectedBooking.quantity || 0}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={updateLoading} className="flex-1">
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Booking
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/customer/bookings")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
