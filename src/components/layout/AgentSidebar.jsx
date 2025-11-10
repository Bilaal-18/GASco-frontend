import { NavLink, useNavigate } from "react-router-dom";
import { Home, User, Package, Users, FileText, Wallet, DollarSign, ShoppingCart, TrendingUp, Download, Calendar, LogOut, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "@/config/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CustomDatePicker from "@/components/ui/DatePicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const AgentSidebar = () => {
  const navigate = useNavigate();
  const [paymentStats, setPaymentStats] = useState({
    stockSold: 0,
    amountReceived: 0,
    amountToBePaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [generating, setGenerating] = useState(false);
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.info("Logout success!");

    navigate("/login");
  };

  useEffect(() => {
    const fetchPaymentStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("/api/agentBookings", {
          headers: { Authorization: token },
        });

        const bookingsData = res.data.bookings || res.data || [];
        setBookings(bookingsData);
        
        let totalStockSold = 0;
        let totalAmountReceived = 0;
        let totalAmountToBePaid = 0;

        bookingsData.forEach((booking) => {
          const quantity = booking.quantity || 0;
          const price = booking.cylinder?.price || 0;
          const totalAmount = quantity * price;

    
          totalStockSold += quantity;

          if (booking.paymentStatus === "paid") {
            totalAmountReceived += totalAmount;
          }
          if (booking.paymentStatus === "pending") {
            totalAmountToBePaid += totalAmount;
          }
        });

        setPaymentStats({
          stockSold: totalStockSold,
          amountReceived: totalAmountReceived,
          amountToBePaid: totalAmountToBePaid,
        });
      } catch (err) {
        console.error("Error fetching payment stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStats();
    const interval = setInterval(fetchPaymentStats, 30000);
    return () => clearInterval(interval);
  }, [token]);


  const generateDailyReport = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    setGenerating(true);
    try {
      const selectedDateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      const selectedDateStr = selectedDateObj.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });

      const dailyBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getDate() === selectedDateObj.getDate() &&
          bookingDate.getMonth() === selectedDateObj.getMonth() &&
          bookingDate.getFullYear() === selectedDateObj.getFullYear()
        );
      });

      if (dailyBookings.length === 0) {
        toast.warning("No cylinders sold on the selected date");
        setGenerating(false);
        return;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      
      doc.setFontSize(18);
      doc.text("GasCo Daily Sales Report", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Date: ${selectedDateStr}`, 105, 28, { align: "center" });

    
      const totalCylinders = dailyBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const totalAmount = dailyBookings.reduce((sum, b) => {
        return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
      }, 0);
      const paidAmount = dailyBookings
        .filter(b => b.paymentStatus === "paid")
        .reduce((sum, b) => {
          return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
        }, 0);

      const summaryData = [
        ["Total Cylinders Sold", totalCylinders],
        ["Total Sales Amount (₹)", totalAmount.toFixed(2)],
        ["Amount Received (₹)", paidAmount.toFixed(2)],
        ["Pending Amount (₹)", (totalAmount - paidAmount).toFixed(2)],
      ];

      autoTable(doc, {
        body: summaryData,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      const startY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Sales Details", 14, startY);

      const tableData = dailyBookings.map((b) => [
        b.customer?.username || b.customer?.businessName || "N/A",
        b.cylinder?.cylinderName || b.cylinder?.cylinderType || "N/A",
        b.cylinder?.weight || "N/A",
        b.quantity || 0,
        `₹${(b.cylinder?.price || 0).toFixed(2)}`,
        `₹${((b.cylinder?.price || 0) * (b.quantity || 0)).toFixed(2)}`,
        b.paymentStatus === "paid" ? "Paid" : "Pending",
      ]);

      autoTable(doc, {
        head: [["Customer", "Cylinder", "Weight", "Qty", "Price", "Total", "Status"]],
        body: tableData,
        startY: startY + 5,
        theme: "striped",
        styles: { fontSize: 8 },
      });

      doc.setFontSize(10);
      doc.text("Generated by GasCo Agent Panel", 105, doc.lastAutoTable.finalY + 10, { align: "center" });
      
      doc.save(`Daily_Sales_Report_${selectedDateStr.replace(/\//g, '-')}.pdf`);
      toast.success("Daily report generated successfully!");
      setReportDialogOpen(false);
    } catch (err) {
      console.error("Error generating daily report:", err);
      toast.error("Failed to generate daily report");
    } finally {
      setGenerating(false);
    }
  };

  const generateDateRangeReport = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDateObj = startDate instanceof Date ? startDate : new Date(startDate);
    const endDateObj = endDate instanceof Date ? endDate : new Date(endDate);

    if (startDateObj > endDateObj) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setGenerating(true);
    try {
      endDateObj.setHours(23, 59, 59, 999); 

      const rangeBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= startDateObj && bookingDate <= endDateObj;
      });

      if (rangeBookings.length === 0) {
        toast.warning("No cylinders sold in the selected date range");
        setGenerating(false);
        return;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
      doc.setFontSize(18);
      doc.text("GasCo Sales Report (Date Range)", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`From: ${startDateObj.toLocaleDateString('en-GB')} To: ${endDateObj.toLocaleDateString('en-GB')}`, 105, 28, { align: "center" });

      const totalCylinders = rangeBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const totalAmount = rangeBookings.reduce((sum, b) => {
        return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
      }, 0);
      const paidAmount = rangeBookings
        .filter(b => b.paymentStatus === "paid")
        .reduce((sum, b) => {
          return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
        }, 0);

      const summaryData = [
        ["Total Cylinders Sold", totalCylinders],
        ["Total Sales Amount (₹)", totalAmount.toFixed(2)],
        ["Amount Received (₹)", paidAmount.toFixed(2)],
        ["Pending Amount (₹)", (totalAmount - paidAmount).toFixed(2)],
        ["Total Transactions", rangeBookings.length],
      ];

      autoTable(doc, {
        body: summaryData,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      const startY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Sales Details", 14, startY);

      const tableData = rangeBookings.map((b) => [
        new Date(b.createdAt).toLocaleDateString('en-GB'),
        b.customer?.username || b.customer?.businessName || "N/A",
        b.cylinder?.cylinderName || b.cylinder?.cylinderType || "N/A",
        b.quantity || 0,
        `₹${(b.cylinder?.price || 0).toFixed(2)}`,
        `₹${((b.cylinder?.price || 0) * (b.quantity || 0)).toFixed(2)}`,
        b.paymentStatus === "paid" ? "Paid" : "Pending",
      ]);

      autoTable(doc, {
        head: [["Date", "Customer", "Cylinder", "Qty", "Price", "Total", "Status"]],
        body: tableData,
        startY: startY + 5,
        theme: "striped",
        styles: { fontSize: 8 },
      });

      doc.setFontSize(10);
      doc.text("Generated by GasCo Agent Panel", 105, doc.lastAutoTable.finalY + 10, { align: "center" });
      
      const startDateStr = startDateObj.toISOString().split('T')[0];
      const endDateStr = endDateObj.toISOString().split('T')[0];
      doc.save(`Sales_Report_${startDateStr}_to_${endDateStr}.pdf`);
      toast.success("Date range report generated successfully!");
      setReportDialogOpen(false);
    } catch (err) {
      console.error("Error generating date range report:", err);
      toast.error("Failed to generate date range report");
    } finally {
      setGenerating(false);
    }
  };

  const generateMonthlyReport = () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setGenerating(true);
    try {
      const monthDate = selectedMonth instanceof Date ? selectedMonth : new Date(selectedMonth);
      const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

      const monthlyBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === monthDate.getMonth() &&
          bookingDate.getFullYear() === monthDate.getFullYear()
        );
      });

      if (monthlyBookings.length === 0) {
        toast.warning("No cylinders sold in the selected month");
        setGenerating(false);
        return;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      doc.setFontSize(18);
      doc.text("GasCo Monthly Sales Report", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Month: ${monthName}`, 105, 28, { align: "center" });

      const totalCylinders = monthlyBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const totalAmount = monthlyBookings.reduce((sum, b) => {
        return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
      }, 0);
      const paidAmount = monthlyBookings
        .filter(b => b.paymentStatus === "paid")
        .reduce((sum, b) => {
          return sum + ((b.cylinder?.price || 0) * (b.quantity || 0));
        }, 0);

      const summaryData = [
        ["Total Cylinders Sold", totalCylinders],
        ["Total Sales Amount (₹)", totalAmount.toFixed(2)],
        ["Amount Received (₹)", paidAmount.toFixed(2)],
        ["Pending Amount (₹)", (totalAmount - paidAmount).toFixed(2)],
        ["Total Transactions", monthlyBookings.length],
      ];

      autoTable(doc, {
        body: summaryData,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      const dailyBreakdown = {};
      monthlyBookings.forEach((b) => {
        const date = new Date(b.createdAt).toLocaleDateString('en-GB');
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = {
            date,
            quantity: 0,
            amount: 0,
            transactions: 0,
          };
        }
        dailyBreakdown[date].quantity += b.quantity || 0;
        dailyBreakdown[date].amount += (b.cylinder?.price || 0) * (b.quantity || 0);
        dailyBreakdown[date].transactions += 1;
      });

      const startY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Daily Breakdown", 14, startY);

      const breakdownData = Object.values(dailyBreakdown).map((d) => [
        d.date,
        d.transactions,
        d.quantity,
        `₹${d.amount.toFixed(2)}`,
      ]);

      autoTable(doc, {
        head: [["Date", "Transactions", "Cylinders Sold", "Amount (₹)"]],
        body: breakdownData,
        startY: startY + 5,
        theme: "striped",
        styles: { fontSize: 8 },
      });

      doc.setFontSize(10);
      doc.text("Generated by GasCo Agent Panel", 105, doc.lastAutoTable.finalY + 10, { align: "center" });
      
      doc.save(`Monthly_Sales_Report_${monthName.replace(/\s+/g, '_')}.pdf`);
      toast.success("Monthly report generated successfully!");
      setReportDialogOpen(false);
    } catch (err) {
      console.error("Error generating monthly report:", err);
      toast.error("Failed to generate monthly report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col p-4 z-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Agent Panel</h1>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800 hover:text-red-400 flex items-center gap-1"
          title="Logout"
        >
          <LogOut size={18} />
        </Button>
      </div>
      <nav className="flex flex-col gap-3 flex-1">
        <NavLink to="/agent/dashboard" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <Home size={18}/> Dashboard
        </NavLink>
        <NavLink to="/agent/profile" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <User size={18}/> Profile
        </NavLink>
        <NavLink to="/agent/myStock" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <Package size={18}/> My Stock
        </NavLink>
        <NavLink to="/agent/customers" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <Users size={18}/> Customers
        </NavLink>
        <NavLink to="/agent/bookings" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <FileText size={18}/> Bookings
        </NavLink>
        <NavLink to="/agent/payments" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <Wallet size={18}/> Customer Payments
        </NavLink>
        <NavLink to="/agent/pay-admin" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <DollarSign size={18}/> Pay Admin
        </NavLink>
        <NavLink to="/agent/forecast" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded">
          <BarChart3 size={18}/> Demand Forecast
        </NavLink>
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded w-full text-left">
              <FileText size={18}/> Reports
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download size={20} />
                Generate Sales Report
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="mb-2 block">Report Type</Label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value="daily"
                      checked={reportType === "daily"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Daily Report</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value="monthly"
                      checked={reportType === "monthly"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Monthly Report</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value="range"
                      checked={reportType === "range"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Date Range</span>
                  </label>
                </div>
              </div>

              {reportType === "daily" ? (
                <div>
                  <CustomDatePicker
                    label="Select Date"
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    maxDate={new Date()}
                    placeholderText="Select date for daily report"
                    dateFormat="MMMM d, yyyy"
                    className="w-full"
                  />
                </div>
              ) : reportType === "monthly" ? (
                <div>
                  <CustomDatePicker
                    label="Select Month"
                    selected={selectedMonth}
                    onChange={(date) => setSelectedMonth(date)}
                    maxDate={new Date()}
                    showMonthYearPicker={true}
                    placeholderText="Select month and year"
                    dateFormat="MMMM yyyy"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <CustomDatePicker
                    label="Start Date"
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      if (date && endDate && date > endDate) {
                        setEndDate(date);
                      }
                    }}
                    maxDate={endDate || new Date()}
                    placeholderText="Select start date"
                    dateFormat="MMMM d, yyyy"
                    className="w-full"
                  />
                  <CustomDatePicker
                    label="End Date"
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate}
                    maxDate={new Date()}
                    placeholderText="Select end date"
                    dateFormat="MMMM d, yyyy"
                    className="w-full"
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportDialogOpen(false);
                    setReportType("daily");
                  }}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (reportType === "daily") {
                      generateDailyReport();
                    } else if (reportType === "monthly") {
                      generateMonthlyReport();
                    } else {
                      generateDateRangeReport();
                    }
                  }}
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </nav>

      {/* Payment Summary Section */}
      <div className="mt-auto border-t border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-green-400" />
          <h2 className="text-sm font-semibold text-gray-300">Payment Summary</h2>
        </div>
        
        {loading ? (
          <div className="text-xs text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-3">
            {/* Stock Sold */}
            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <ShoppingCart size={12} className="text-blue-400" />
                  <span className="text-xs text-gray-400">Stock Sold</span>
                </div>
              </div>
              <p className="text-lg font-bold text-white">{paymentStats.stockSold}</p>
            </div>

            {/* Amount Received */}
            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <DollarSign size={12} className="text-green-400" />
                  <span className="text-xs text-gray-400">Amount Received</span>
                </div>
              </div>
              <p className="text-lg font-bold text-green-400">
                ₹{paymentStats.amountReceived.toLocaleString()}
              </p>
            </div>

            {/* Amount To Be Paid */}
            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Wallet size={12} className="text-orange-400" />
                  <span className="text-xs text-gray-400">Amount To Be Paid</span>
                </div>
              </div>
              <p className="text-lg font-bold text-orange-400">
                ₹{paymentStats.amountToBePaid.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentSidebar;
