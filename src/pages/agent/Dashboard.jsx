import React, { useEffect, useMemo, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import axios from "@/config/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  RefreshCw,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
  const [dailyBookingData, setDailyBookingData] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalCylinders: 0,
    totalAmount: 0,
    averageDaily: 0,
    peakDay: { date: "", quantity: 0 },
  });
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
      
      
      const [statsRes, todayBookingsRes, allBookingsRes] = await Promise.all([
        axios.get("/api/getStats", { headers: { Authorization: token } }),
        axios.get("/api/todayBookings", { headers: { Authorization: token } }),
        axios.get("/api/agentBookings", { headers: { Authorization: token } }),
      ]);

      
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

      
      const todayBookings = todayBookingsRes.data?.bookings || todayBookingsRes.data || [];
      const todayBookingsArray = Array.isArray(todayBookings) ? todayBookings : [];
      setTodayBookings(todayBookingsArray);

      
      const allBookings = allBookingsRes.data?.bookings || allBookingsRes.data || [];
      const allBookingsArray = Array.isArray(allBookings) ? allBookings : [];
      setAllBookings(allBookingsArray);

    
      const bookingsByDate = {};
      
      allBookingsArray.forEach((booking) => {

        const bookingDate = new Date(booking.createdAt);
        const dateKey = bookingDate.toISOString().split('T')[0]; 
        
        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = {
            date: dateKey,
            dateLabel: bookingDate.toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric",
              weekday: "short"
            }),
            totalBookings: 0,
            totalCylinders: 0,
            totalAmount: 0,
            paidAmount: 0,
            deliveredCylinders: 0,
          };
        }
        
        bookingsByDate[dateKey].totalBookings += 1;
        bookingsByDate[dateKey].totalCylinders += booking.quantity || 0;
        const bookingAmount = (booking.cylinder?.price || 0) * (booking.quantity || 0);
        bookingsByDate[dateKey].totalAmount += bookingAmount;
        
        if (booking.paymentStatus === "paid" || booking.paymentStatus === "Paid") {
          bookingsByDate[dateKey].paidAmount += bookingAmount;
        }
        
        if (booking.status === "delivered") {
          bookingsByDate[dateKey].deliveredCylinders += booking.quantity || 0;
        }
      });


      const dailyData = Object.values(bookingsByDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30) 
        .reverse(); 
      
      setDailyBookingData(dailyData);

      if (allBookingsArray.length > 0) {
        const totalBookings = allBookingsArray.length;
        const totalCylinders = allBookingsArray.reduce((sum, b) => sum + (b.quantity || 0), 0);
        const totalAmount = allBookingsArray.reduce((sum, b) => {
          return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
        }, 0);
        
        const allDailyData = Object.values(bookingsByDate)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const peakDay = allDailyData.reduce((max, day) => {
          return day.totalCylinders > (max.totalCylinders || 0) ? day : max;
        }, { date: "", dateLabel: "", totalCylinders: 0 });
        
        const daysWithBookings = allDailyData.length;
        const averageDaily = daysWithBookings > 0 ? totalCylinders / daysWithBookings : 0;
        
        setBookingStats({
          totalBookings,
          totalCylinders,
          totalAmount,
          averageDaily: averageDaily.toFixed(1),
          peakDay: {
            date: peakDay.dateLabel || peakDay.date || "N/A",
            quantity: peakDay.totalCylinders || 0,
          },
        });
      } else {
        setBookingStats({
          totalBookings: 0,
          totalCylinders: 0,
          totalAmount: 0,
          averageDaily: 0,
          peakDay: { date: "N/A", quantity: 0 },
        });
      }

      console.log("Dashboard data loaded:", {
        stats: statsRes.data,
        todayBookingsCount: todayBookingsArray.length,
        allBookingsCount: allBookingsArray.length,
        dailyDataPoints: dailyData.length,
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
  }, [token]);

  const paymentChartData = useMemo(
    () => [
      { name: "Collected", value: stats.amountCollected || 0, fill: "#22c55e" },
      { name: "Pending", value: stats.pendingPayments || 0, fill: "#ef4444" },
    ],
    [stats.amountCollected, stats.pendingPayments]
  );

  const formatCurrency = (value) => `₹${(value || 0).toLocaleString()}`;

  return (
    <SidebarProvider>
      <AgentSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm">Stock Received</div>
                <div className="text-2xl font-bold">{stats.stockReceived || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm">Delivered</div>
                <div className="text-2xl font-bold">{stats.cylindersDelivered || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm">Pending Returns</div>
                <div className="text-2xl font-bold">{stats.pendingReturns || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm">Amount Collected</div>
                <div className="text-2xl font-bold">₹{(stats.amountCollected || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm">Pending Payments</div>
                <div className="text-2xl font-bold">₹{(stats.pendingPayments || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* {todayBookings.length > 0 && (
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
                      <th className="p-2 text-left">Payment Method</th>
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
                              booking.paymentMethod === "online"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {booking.paymentMethod === "online" ? "Online" : "Cash"}
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "delivered" && booking.paymentMethod === "cash"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {booking.paymentStatus === "paid" 
                              ? "Paid" 
                              : booking.status === "delivered" && booking.paymentMethod === "cash"
                              ? "Collect Cash"
                              : "Pending"}
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
        )} */}

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="text-sm mb-4">Payment Status</div>
            <ChartContainer>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={paymentChartData} barCategoryGap="30%">
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`
                    }
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    content={
                      <ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />
                    }
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {paymentChartData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Dashboard;
