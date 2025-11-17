import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerDashboard } from "@/store/slices/customer/customerDashboardSlice";
import { fetchCustomerBookings } from "@/store/slices/customer/customerBookingsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import CustomerChatbot from "@/components/customer/CustomerChatbot";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const { summary, loading, error } = useSelector((state) => state.customerDashboard);
  const { bookings } = useSelector((state) => state.customerBookings);

  useEffect(() => {
    dispatch(fetchCustomerDashboard());
    dispatch(fetchCustomerBookings());
  }, [dispatch]);

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

  if (error) {
    return (
      <SidebarProvider>
        <CustomerSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-600">Error: {error}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }


  const recentBookings = bookings.slice(0, 5);

  return (
    <SidebarProvider>
      <CustomerSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Bookings</div>
              <div className="text-2xl font-bold">{summary.totalBookings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Active Bookings</div>
              <div className="text-2xl font-bold">{summary.activeBookings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Completed</div>
              <div className="text-2xl font-bold">{summary.completedBookings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Pending</div>
              <div className="text-2xl font-bold">{summary.pendingBookings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Spent</div>
              <div className="text-2xl font-bold">₹{summary.totalSpent?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 font-semibold">Recent Bookings</div>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Cylinder</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>{booking._id?.slice(-8) || "N/A"}</TableCell>
                        <TableCell>{booking.cylinder?.cylinderName || booking.cylinder?.cylinderType || "N/A"}</TableCell>
                        <TableCell>{booking.quantity || 0}</TableCell>
                        <TableCell>₹{((booking.quantity || 0) * (booking.cylinder?.price || 0)).toLocaleString()}</TableCell>
                        <TableCell>
                          {booking.status === "delivered" || booking.status === "completed"
                            ? "Completed"
                            : booking.status === "pending" || booking.status === "requested"
                            ? "Pending"
                            : booking.status || "Pending"}
                        </TableCell>
                        <TableCell>{new Date(booking.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

    
        <CustomerChatbot bookings={bookings} summary={summary} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
