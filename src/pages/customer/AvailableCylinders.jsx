import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAvailableCylinders } from "@/store/slices/customer/availableCylindersSlice";
import { bookCylinder } from "@/store/slices/customer/customerDashboardSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import CustomDatePicker from "@/components/ui/DatePicker";

export default function AvailableCylinders() {
  const dispatch = useDispatch();
  const { cylinders, loading, error } = useSelector((state) => state.availableCylinders);
  const { bookingLoading, bookingError } = useSelector((state) => state.customerDashboard);
  const [selectedCylinder, setSelectedCylinder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deliveryDate, setDeliveryDate] = useState(null);

  useEffect(() => {
    dispatch(fetchAvailableCylinders());
  }, [dispatch]);

  const handleBookCylinder = (cylinder) => {
    setSelectedCylinder(cylinder);
    setQuantity(1);
    setPaymentMethod("cash");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setDeliveryDate(tomorrow);
    setIsDialogOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCylinder) return;

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    try {
      await dispatch(bookCylinder({
        cylinderId: selectedCylinder._id,
        quantity: quantity,
        paymentMethod: paymentMethod,
        deliveryDate: deliveryDate ? deliveryDate.toISOString().split('T')[0] : undefined,
      })).unwrap();
      
      toast.success("Cylinder booked successfully! Payment will be required after delivery.");
      setIsDialogOpen(false);
      setSelectedCylinder(null);
      setQuantity(1);
      setPaymentMethod("cash");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      setDeliveryDate(tomorrow);
    } catch (err) {
      toast.error(err || "Failed to book cylinder");
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

  return (
    <SidebarProvider>
      <CustomerSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Available Cylinders</h1>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600">Error: {error}</div>
            </CardContent>
          </Card>
        )}

        {cylinders.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">No cylinders available</div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cylinders.map((cylinder) => {
                  let quantityValue = null;
                  if (cylinder.totalQuantity !== undefined && cylinder.totalQuantity !== null) {
                    if (typeof cylinder.totalQuantity === 'object' && cylinder.totalQuantity?.number !== undefined) {
                      quantityValue = cylinder.totalQuantity.number;
                    } else if (typeof cylinder.totalQuantity === 'number') {
                      quantityValue = cylinder.totalQuantity;
                    }
                  }
                  const isAvailable = quantityValue === null || quantityValue > 0;
                  
                  return (
                    <TableRow key={cylinder._id}>
                      <TableCell>{cylinder.cylinderName || "Gas Cylinder"}</TableCell>
                      <TableCell>{cylinder.cylinderType || "N/A"}</TableCell>
                      <TableCell>{cylinder.weight || "N/A"} kg</TableCell>
                      <TableCell>₹{cylinder.price?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>
                        {isAvailable ? (
                          <span className="text-green-600">Available</span>
                        ) : (
                          <span className="text-red-600">Not Available</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleBookCylinder(cylinder)}
                          disabled={quantityValue !== null && quantityValue === 0}
                        >
                          Book
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Cylinder</DialogTitle>
            </DialogHeader>
            {selectedCylinder && (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <Label>Cylinder</Label>
                  <div>{selectedCylinder.cylinderName || "Gas Cylinder"}</div>
                  <div className="text-sm text-gray-500">{selectedCylinder.cylinderType}</div>
                </div>
                <div>
                  <Label>Price</Label>
                  <div className="text-lg font-semibold text-green-600">
                    ₹{selectedCylinder.price?.toLocaleString() || "N/A"}
                  </div>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Quantity"
                    required
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{((quantity || 0) * (selectedCylinder.price || 0)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <CustomDatePicker
                    selected={deliveryDate}
                    onChange={(date) => setDeliveryDate(date)}
                    minDate={new Date()}
                    placeholderText="Select date"
                    dateFormat="MMM d, yyyy"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Cash</span>
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
                      <span>Online</span>
                    </label>
                  </div>
                </div>
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-600">{bookingError}</div>
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
                      "Book"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
