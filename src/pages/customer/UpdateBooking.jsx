import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingById, updateBooking } from "@/store/slices/customer/customerBookingsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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

  if (!selectedBooking) {
    return (
      <SidebarProvider>
        <CustomerSidebar />
        <SidebarInset>
          <div className="p-8">
            <Button variant="outline" onClick={() => navigate("/customer/bookings")} className="mb-4">
              Back
            </Button>
            <Card>
              <CardContent className="p-4">
                <div className="text-red-600">Booking not found</div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const totalAmount = formData.quantity * (selectedBooking.cylinder?.price || 0);

  return (
    <SidebarProvider>
      <CustomerSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Update Booking</h1>
          <Button variant="outline" onClick={() => navigate("/customer/bookings")}>
            Back
          </Button>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="p-4">
            <div className="mb-4">
              <div className="text-sm text-gray-600">Booking ID</div>
              <div className="font-semibold">#{selectedBooking._id?.slice(-8).toUpperCase()}</div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600">Cylinder</div>
              <div className="font-semibold">{selectedBooking.cylinder?.cylinderName || selectedBooking.cylinder?.cylinderType || "N/A"}</div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600">Price per Unit</div>
              <div className="font-semibold">₹{selectedBooking.cylinder?.price?.toLocaleString() || 0}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Quantity"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  Current: {selectedBooking.quantity || 0}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={updateLoading} className="flex-1">
                  {updateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
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
      </SidebarInset>
    </SidebarProvider>
  );
}
