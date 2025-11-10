import React, { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import axios from "@/config/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAgentCustomersForecasts } from "@/services/customerForecastApi";

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
  const [dailyBookingData, setDailyBookingData] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalCylinders: 0,
    totalAmount: 0,
    averageDaily: 0,
    peakDay: { date: "", quantity: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [customerForecasts, setCustomerForecasts] = useState([]);
  const [loadingForecasts, setLoadingForecasts] = useState(false);
  const [agentId, setAgentId] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [forecastsLastUpdated, setForecastsLastUpdated] = useState(null);

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

  const fetchCustomerForecasts = async (refresh = false) => {
    if (!agentId || !token) return;

    try {
      setLoadingForecasts(true);
      const data = await getAgentCustomersForecasts(agentId, 7, refresh);
      setCustomerForecasts(data.customerForecasts || []);
      if (data.lastUpdatedAt) {
        setForecastsLastUpdated(new Date(data.lastUpdatedAt));
        if (refresh) {
          toast.success(`Forecasts refreshed successfully`);
        }
      }
    } catch (err) {
      console.error("Error fetching customer forecasts:", err);
      toast.error("Failed to load customer forecasts");
    } finally {
      setLoadingForecasts(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    

    const fetchAgentId = async () => {
      try {
        const res = await axios.get("/api/account", {
          headers: { Authorization: token },
        });
        if (res.data && res.data._id) {
          setAgentId(res.data._id);
        }
      } catch (err) {
        console.error("Error fetching agent ID:", err);
      }
    };
    
    if (token) {
      fetchAgentId();
    }
  }, [token]);


  useEffect(() => {
    if (agentId && token) {
      fetchCustomerForecasts(false); 
    }
  }, [agentId, token]);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Dashboard</h1>
            <p className="text-gray-600">Overview of your performance and statistics</p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

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
        )}

      
        {dailyBookingData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📊 Booking Statistics (Based on Actual Bookings)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-600">{bookingStats.totalBookings}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Cylinders</p>
                  <p className="text-2xl font-bold text-green-600">{bookingStats.totalCylinders}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-600">₹{(bookingStats.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Avg Daily (Days with Bookings)</p>
                  <p className="text-2xl font-bold text-orange-600">{bookingStats.averageDaily}</p>
                  <p className="text-xs text-gray-500">cylinders/day</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Peak Day</p>
                  <p className="text-lg font-bold text-red-600">{bookingStats.peakDay.quantity}</p>
                  <p className="text-xs text-gray-500">{bookingStats.peakDay.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        
        {dailyBookingData.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>📈 Daily Bookings (Last 30 Days with Bookings)</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Only showing days when customers made bookings
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyBookingData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dateLabel" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ fontSize: "12px" }}
                      formatter={(value, name) => {
                        if (name === "totalAmount" || name === "paidAmount") {
                          return `₹${value.toLocaleString()}`;
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalCylinders" fill="#3b82f6" name="Cylinders Booked" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalBookings" fill="#10b981" name="Total Bookings" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deliveredCylinders" fill="#f59e0b" name="Delivered" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💰 Daily Revenue (Days with Bookings)</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Amount collected and pending from bookings
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyBookingData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dateLabel" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ fontSize: "12px" }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="totalAmount" fill="#8b5cf6" name="Total Amount" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paidAmount" fill="#10b981" name="Paid Amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💵 Payment Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.amountCollected === 0 && stats.pendingPayments === 0 ? (
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
                        label={(entry) => `${entry.name}: ₹${entry.value.toLocaleString()}`}
                      >
                        {[
                          { name: "Collected", value: stats.amountCollected || 0 },
                          { name: "Pending", value: stats.pendingPayments || 0 },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📅 Booking Trend (Last 30 Days)</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Shows only days when bookings were made
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyBookingData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dateLabel" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ fontSize: "12px" }}
                    />
                    <Legend />
                    <Bar dataKey="totalBookings" fill="#3b82f6" name="Bookings Count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle>📊 Booking Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No booking data available</p>
                  <p className="text-sm mt-2">Charts will appear when customers make bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

    
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle>Your Customers' Next Week Predictions</CardTitle>
                </div>
                <p className="text-sm text-gray-500">
                  See how many cylinders each customer will likely need
                  {forecastsLastUpdated && (
                    <span className="ml-2 text-gray-400">
                      • Last updated: {forecastsLastUpdated.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={() => fetchCustomerForecasts(true)}
                variant="outline"
                size="sm"
                disabled={loadingForecasts}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingForecasts ? "animate-spin" : ""}`} />
                Refresh Forecasts
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingForecasts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading customer forecasts...</span>
              </div>
            ) : customerForecasts.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No customer forecasts available</p>
                <p className="text-gray-400 text-sm mt-2">Click the "Refresh Forecasts" button above to generate forecasts</p>
                <Button
                  onClick={() => fetchCustomerForecasts(true)}
                  variant="default"
                  size="sm"
                  className="mt-4"
                  disabled={loadingForecasts}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingForecasts ? "animate-spin" : ""}`} />
                  Generate Forecasts Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerForecasts.map((customerForecast, index) => {
                  const isExpanded = expandedCustomer === index;
                  const { customer, summary, forecasts } = customerForecast;

                  return (
                    <Card key={customer._id} className="border-l-4 border-l-blue-500">
                      <CardHeader
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedCustomer(isExpanded ? null : index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg">
                                {customer.businessname || customer.username || "Customer"}
                              </CardTitle>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {customer.email || "N/A"}
                              </Badge>
                            </div>
                            {forecasts.length === 0 ? (
                              <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  <AlertCircle className="w-4 h-4 inline mr-2" />
                                  No forecasts available for this customer. Click "Refresh Forecasts" button above to generate predictions.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <p className="text-xs text-gray-600 mb-1">📊 Average Daily</p>
                                  <p className="text-xl font-bold text-blue-600">
                                    {summary.averageDailyDemand.toFixed(1)}
                                  </p>
                                  <p className="text-xs text-gray-500">cylinders/day</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                  <p className="text-xs text-gray-600 mb-1">📈 Highest Day</p>
                                  <p className="text-xl font-bold text-orange-600">
                                    {summary.maxDailyDemand}
                                  </p>
                                  <p className="text-xs text-gray-500">cylinders</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <p className="text-xs text-gray-600 mb-1">🔮 Week Total</p>
                                  <p className="text-xl font-bold text-green-600">
                                    {summary.totalForecastedDemand.p50}
                                  </p>
                                  <p className="text-xs text-gray-500">cylinders/week</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <p className="text-xs text-gray-600 mb-1">📦 Keep Stock</p>
                                  <p className="text-xl font-bold text-purple-600">
                                    {summary.totalSuggestedStock}
                                  </p>
                                  <p className="text-xs text-gray-500">recommended</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && forecasts.length > 0 && (
                        <CardContent>
                          <div className="space-y-4">
                                    {/* Forecast Chart - Daily Bar Chart */}
                                    <div>
                                      <div className="mb-3">
                                        <h4 className="text-base font-semibold text-gray-800 mb-1">
                                          📅 Next 7 Days Prediction
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                          How many cylinders this customer will likely need each day
                                        </p>
                                      </div>
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart 
                                  data={forecasts.slice(0, 7).map(f => ({
                                    ...f,
                                    dateLabel: new Date(f.date).toLocaleDateString("en-US", { 
                                      month: "short", 
                                      day: "numeric" 
                                    })
                                  }))}
                                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis
                                    dataKey="dateLabel"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    style={{ fontSize: "10px" }}
                                  />
                                  <YAxis style={{ fontSize: "10px" }} />
                                  <Tooltip
                                    contentStyle={{ fontSize: "12px" }}
                                    labelFormatter={(label) => {
                                      const forecast = forecasts.find(f => 
                                        new Date(f.date).toLocaleDateString("en-US", { 
                                          month: "short", 
                                          day: "numeric" 
                                        }) === label
                                      );
                                      if (forecast) {
                                        return new Date(forecast.date).toLocaleDateString("en-US", { 
                                          weekday: "long",
                                          month: "short", 
                                          day: "numeric",
                                          year: "numeric"
                                        });
                                      }
                                      return label;
                                    }}
                                  />
                                  <Legend 
                                    wrapperStyle={{ fontSize: '12px' }}
                                  />
                                          <Bar
                                            dataKey="p50"
                                            fill="#3b82f6"
                                            name="Expected Need"
                                            radius={[4, 4, 0, 0]}
                                          />
                                          <Bar
                                            dataKey="suggestedStock"
                                            fill="#8b5cf6"
                                            name="Recommended Stock"
                                            radius={[4, 4, 0, 0]}
                                          />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>

                                    {/* Forecast Table */}
                                    <div>
                                      <div className="mb-3">
                                        <h4 className="text-base font-semibold text-gray-800 mb-1">
                                          📋 Day-by-Day Details
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-2">
                                          See exactly how many cylinders this customer needs each day
                                        </p>
                                      </div>
                                      <div className="overflow-x-auto border rounded-lg">
                                        <table className="w-full text-sm">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="p-3 text-left font-semibold">Day</th>
                                              <th className="p-3 text-right font-semibold">Expected Need</th>
                                              <th className="p-3 text-right font-semibold">Keep Stock</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {forecasts.slice(0, 7).map((forecast, idx) => (
                                              <tr key={idx} className="border-t hover:bg-blue-50 transition-colors">
                                                <td className="p-3 font-medium">
                                                  <div className="flex flex-col">
                                                    <span className="font-semibold">
                                                      {new Date(forecast.date).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                      })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      {new Date(forecast.date).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                      })}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold">
                                                    {forecast.p50} cylinders
                                                  </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                  <Badge className="bg-purple-600 text-white px-3 py-1 text-sm font-semibold">
                                                    {forecast.suggestedStock} cylinders
                                                  </Badge>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs text-gray-700">
                                          <strong>💡 Simple Guide:</strong>
                                          <br />
                                          • <span className="text-blue-600 font-semibold">Expected Need</span> = How many cylinders the customer will likely order
                                          <br />
                                          • <span className="text-purple-600 font-semibold">Keep Stock</span> = How many you should keep ready (includes safety buffer)
                                        </p>
                                      </div>
                                    </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
