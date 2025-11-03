import React, { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import AIBookingChatbot from "@/components/agent/AIBookingChatbot";
import axios from "@/config/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF6666"];

const Dashboard = () => {
  const [stats, setStats] = useState({
    stockReceived: 0,
    cylindersDelivered: 0,
    pendingReturns: 0,
    amountCollected: 0,
    pendingPayments: 0,
  });
  const [todayBookings, setTodayBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchDashboardData = async () => {
    if (!token) {
      toast.error("Authentication token not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch stats, today's bookings, and all bookings in parallel
      const [statsRes, bookingsRes, allBookingsRes] = await Promise.all([
        axios.get("/api/getStats", { headers: { Authorization: token } }),
        axios.get("/api/todayBookings", { headers: { Authorization: token } }),
        axios.get("/api/agentBookings", { headers: { Authorization: token } }).catch(() => ({ data: { bookings: [] } })),
      ]);

      // Set stats data
      if (statsRes.data) {
        setStats({
          stockReceived: statsRes.data.stockReceived || 0,
          cylindersDelivered: statsRes.data.cylindersDelivered || 0,
          pendingReturns: statsRes.data.pendingReturns || 0,
          amountCollected: statsRes.data.amountCollected || 0,
          pendingPayments: statsRes.data.pendingPayments || 0,
        });
      } else {
        setStats({
          stockReceived: 0,
          cylindersDelivered: 0,
          pendingReturns: 0,
          amountCollected: 0,
          pendingPayments: 0,
        });
      }

      // Set today's bookings
      const bookings = bookingsRes.data?.bookings || bookingsRes.data || [];
      const bookingsArray = Array.isArray(bookings) ? bookings : [];
      setTodayBookings(bookingsArray);

      // Set all bookings for chatbot
      const allBookingsData = allBookingsRes.data?.bookings || allBookingsRes.data || [];
      const allBookingsArray = Array.isArray(allBookingsData) ? allBookingsData : [];
      setAllBookings(allBookingsArray);

      // Generate monthly data from today's bookings
      if (bookingsArray.length > 0) {
        const today = new Date().toLocaleDateString();
        const monthlyFromToday = [{
          date: today,
          totalBookings: bookingsArray.length,
          deliveredCylinders: bookingsArray
            .filter(b => b.status === "delivered")
            .reduce((sum, b) => sum + (b.quantity || 0), 0),
          amountCollected: bookingsArray
            .filter(b => b.paymentStatus === "paid" || b.paymentStatus === "Paid")
            .reduce((sum, b) => sum + ((b.cylinder?.price || 0) * (b.quantity || 0)), 0),
        }];
        setMonthlyData(monthlyFromToday);
      } else {
        setMonthlyData([]);
      }

      console.log("Dashboard data loaded:", {
        stats: statsRes.data,
        bookingsCount: bookingsArray.length,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      toast.error(err.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Overview of your performance and statistics</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500 mb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p>Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {[
              { label: "Stock Received", value: stats.stockReceived || 0, color: "text-blue-600" },
              { label: "Cylinders Delivered", value: stats.cylindersDelivered || 0, color: "text-green-600" },
              { label: "Pending Returns", value: stats.pendingReturns || 0, color: "text-yellow-600" },
              { label: "Amount Collected", value: `₹${(stats.amountCollected || 0).toLocaleString()}`, color: "text-teal-600" },
              { label: "Pending Payments", value: `₹${(stats.pendingPayments || 0).toLocaleString()}`, color: "text-red-600" },
            ].map((item, idx) => (
              <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Today's Bookings */}
        {todayBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Today's Bookings ({todayBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Cylinder</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Payment</th>
                      <th className="p-2 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayBookings.slice(0, 5).map((booking) => (
                      <tr key={booking._id} className="border-t hover:bg-gray-50">
                        <td className="p-2">{booking.customer?.username || "N/A"}</td>
                        <td className="p-2">{booking.cylinder?.cylinderType || "N/A"}</td>
                        <td className="p-2">{booking.quantity || 0}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : booking.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : booking.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status || "pending"}
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {booking.paymentStatus || "pending"}
                          </span>
                        </td>
                        <td className="p-2">
                          ₹
                          {((booking.cylinder?.price || 0) * (booking.quantity || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {todayBookings.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Showing 5 of {todayBookings.length} bookings
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Loading chart data...
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No monthly data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deliveredCylinders" fill="#00C49F" name="Delivered Cylinders" />
                    <Bar dataKey="totalBookings" fill="#0088FE" name="Total Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Loading chart data...
                </div>
              ) : stats.amountCollected === 0 && stats.pendingPayments === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No payment data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Collected", value: stats.amountCollected || 0 },
                        { name: "Pending", value: stats.pendingPayments || 0 },
                      ].filter(item => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {[
                        { name: "Collected", value: stats.amountCollected || 0 },
                        { name: "Pending", value: stats.pendingPayments || 0 },
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Booking Chatbot */}
        <AIBookingChatbot bookings={allBookings} stats={stats} />
      </div>
    </div>
  );
};

export default Dashboard;
