import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAvailableCylinders } from "@/store/slices/customer/availableCylindersSlice";
import { bookCylinder } from "@/store/slices/customer/customerDashboardSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CylinderIcon, Package, Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function AvailableCylinders() {
  const dispatch = useDispatch();
  const { cylinders, loading, error } = useSelector((state) => state.availableCylinders);
  const { bookingLoading, bookingError } = useSelector((state) => state.customerDashboard);
  const [selectedCylinder, setSelectedCylinder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    dispatch(fetchAvailableCylinders());
  }, [dispatch]);

  const handleBookCylinder = (cylinder) => {
    setSelectedCylinder(cylinder);
    setQuantity(1);
    setPaymentMethod("cash");
    setIsDialogOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCylinder) return;

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    try {
      await dispatch(bookCylinder({
        cylinderId: selectedCylinder._id,
        quantity: quantity,
        paymentMethod: paymentMethod,
      })).unwrap();
      
      toast.success("Cylinder booked successfully! Payment will be required after delivery.");
      setIsDialogOpen(false);
      setSelectedCylinder(null);
      setQuantity(1);
      setPaymentMethod("cash");
    } catch (err) {
      toast.error(err || "Failed to book cylinder");
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
            <CylinderIcon className="w-8 h-8 text-blue-600" />
            Available Cylinders
          </h1>
          <p className="text-gray-600">Browse available gas cylinder types and specifications</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {cylinders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">No cylinders available at the moment</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cylinders.map((cylinder) => (
              <Card key={cylinder._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{cylinder.cylinderName || "Gas Cylinder"}</CardTitle>
                    <CylinderIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Type</p>
                    <Badge variant="outline">{cylinder.cylinderType || "N/A"}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Weight</p>
                    <p className="text-lg font-semibold">{cylinder.weight || "N/A"} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{cylinder.price?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  {cylinder.totalQuantity !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Available Stock</p>
                      <p className="text-lg font-semibold">
                        {cylinder.totalQuantity > 0 ? (
                          <span className="text-green-600">{cylinder.totalQuantity} units</span>
                        ) : (
                          <span className="text-red-600">Out of Stock</span>
                        )}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => handleBookCylinder(cylinder)}
                    disabled={cylinder.totalQuantity !== undefined && cylinder.totalQuantity === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Book Cylinder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Cylinder</DialogTitle>
              <DialogDescription>
                Enter the quantity of cylinders you want to book
              </DialogDescription>
            </DialogHeader>
            {selectedCylinder && (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cylinder-name">Cylinder</Label>
                  <p className="text-sm font-semibold">{selectedCylinder.cylinderName || "Gas Cylinder"}</p>
                  <p className="text-xs text-gray-500">{selectedCylinder.cylinderType}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Unit</Label>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{selectedCylinder.price?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                  {selectedCylinder.totalQuantity !== undefined && (
                    <p className="text-xs text-gray-500">
                      Available: {selectedCylinder.totalQuantity} units
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{((quantity || 0) * (selectedCylinder.price || 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Payment will be required after delivery
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Cash (Pay on Delivery)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Online (Pay after Delivery)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {paymentMethod === "cash" 
                      ? "You will pay in cash when the cylinder is delivered"
                      : "You will pay online after the cylinder is delivered"}
                  </p>
                </div>
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{bookingError}</p>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedCylinder(null);
                      setQuantity(1);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bookingLoading}>
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Book Now
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
