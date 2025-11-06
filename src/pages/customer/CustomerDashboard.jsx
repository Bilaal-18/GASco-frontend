import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerDashboard } from "@/store/slices/customer/customerDashboardSlice";
import { fetchCustomerBookings } from "@/store/slices/customer/customerBookingsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, CheckCircle2, Clock, DollarSign, Loader2 } from "lucide-react";

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
      <div className="flex bg-gray-50 min-h-screen">
        <CustomerSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <CustomerSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Card className="p-8">
            <p className="text-red-600">Error: {error}</p>
          </Card>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Bookings",
      value: summary.totalBookings,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Active Bookings",
      value: summary.activeBookings,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Completed",
      value: summary.completedBookings,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Pending",
      value: summary.pendingBookings,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Total Spent",
      value: `₹${summary.totalSpent.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <CustomerSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Customer Dashboard</h1>
          <p className="text-gray-600">Overview of your bookings and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">Booking #{booking._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        {booking.cylinder?.cylinderName || "Gas Cylinder"} - Qty: {booking.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === "delivered" || booking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending" || booking.status === "requested"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {booking.status || "Pending"}
                      </span>
                      <p className="text-sm font-semibold mt-1">
                        ₹{((booking.quantity || 0) * (booking.cylinder?.price || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
