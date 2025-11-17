import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

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
        b.cylinder?.cylinderType || "N/A",
        b.cylinder?.cylinderName || "N/A",
        b.cylinder?.weight || "N/A",
        b.quantity || 0,
        `₹${(b.cylinder?.price || 0).toFixed(2)}`,
        `₹${((b.cylinder?.price || 0) * (b.quantity || 0)).toFixed(2)}`,
        b.paymentStatus === "paid" ? "Paid" : "Pending",
      ]);

      autoTable(doc, {
        head: [["Customer", "Cylinder Type", "Cylinder Name", "Weight", "Qty", "Price", "Total", "Status"]],
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
        b.cylinder?.cylinderType || "N/A",
        b.cylinder?.cylinderName || "N/A",
        b.quantity || 0,
        `₹${(b.cylinder?.price || 0).toFixed(2)}`,
        `₹${((b.cylinder?.price || 0) * (b.quantity || 0)).toFixed(2)}`,
        b.paymentStatus === "paid" ? "Paid" : "Pending",
      ]);

      autoTable(doc, {
        head: [["Date", "Customer", "Cylinder Type", "Cylinder Name", "Qty", "Price", "Total", "Status"]],
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
        const cylinderType = b.cylinder?.cylinderType || "N/A";
        const key = `${date}_${cylinderType}`;
        
        if (!dailyBreakdown[key]) {
          dailyBreakdown[key] = {
            date,
            cylinderType,
            quantity: 0,
            price: b.cylinder?.price || 0,
            amount: 0,
          };
        }
        dailyBreakdown[key].quantity += b.quantity || 0;
        dailyBreakdown[key].amount += (b.cylinder?.price || 0) * (b.quantity || 0);
      });

      const startY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Daily Breakdown", 14, startY);

      const breakdownData = Object.values(dailyBreakdown)
        .sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-'));
          const dateB = new Date(b.date.split('/').reverse().join('-'));
          return dateA - dateB;
        })
        .map((d) => [
          d.date,
          d.cylinderType,
          d.quantity,
          `₹${d.price.toFixed(2)}`,
          `₹${d.amount.toFixed(2)}`,
        ]);

      autoTable(doc, {
        head: [["Date", "Cylinder Type", "Quantity", "Price", "Total Amount"]],
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

  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", icon: Home, url: "/agent/dashboard" },
    { title: "Profile", icon: User, url: "/agent/profile" },
    { title: "My Stock", icon: Package, url: "/agent/myStock" },
    { title: "Customers", icon: Users, url: "/agent/customers" },
    { title: "Bookings", icon: FileText, url: "/agent/bookings" },
    { title: "Customer Payments", icon: Wallet, url: "/agent/payments" },
    { title: "Pay Admin", icon: DollarSign, url: "/agent/pay-admin" },
    { title: "Demand Forecast", icon: BarChart3, url: "/agent/forecast" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Agent Panel</h1>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="hover:text-red-400"
            title="Logout"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink to={item.url}>
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <SidebarMenuButton>
                      <FileText size={18} />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Generate Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Report Type</Label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="reportType"
                              value="daily"
                              checked={reportType === "daily"}
                              onChange={(e) => setReportType(e.target.value)}
                              className="w-4 h-4"
                            />
                            <span>Daily</span>
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
                            <span>Monthly</span>
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
                          <Label>Select Date</Label>
                          <CustomDatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            maxDate={new Date()}
                            placeholderText="Select date"
                            dateFormat="MMM d, yyyy"
                            className="w-full mt-2"
                          />
                        </div>
                      ) : reportType === "monthly" ? (
                        <div>
                          <Label>Select Month</Label>
                          <CustomDatePicker
                            selected={selectedMonth}
                            onChange={(date) => setSelectedMonth(date)}
                            maxDate={new Date()}
                            showMonthYearPicker={true}
                            placeholderText="Select month"
                            dateFormat="MMMM yyyy"
                            className="w-full mt-2"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label>Start Date</Label>
                            <CustomDatePicker
                              selected={startDate}
                              onChange={(date) => {
                                setStartDate(date);
                                if (date && endDate && date > endDate) {
                                  setEndDate(date);
                                }
                              }}
                              maxDate={endDate || new Date()}
                              placeholderText="Start date"
                              dateFormat="MMM d, yyyy"
                              className="w-full mt-2"
                            />
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <CustomDatePicker
                              selected={endDate}
                              onChange={(date) => setEndDate(date)}
                              minDate={startDate}
                              maxDate={new Date()}
                              placeholderText="End date"
                              dateFormat="MMM d, yyyy"
                              className="w-full mt-2"
                            />
                          </div>
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
                        >
                          {generating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate PDF"
                          )}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AgentSidebar;
