import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { useContext } from "react";
import userContext from "./context/UserContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import { ThemeProvider } from "next-themes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageAgents from "./pages/admin/ManageAgents";
import ManageCustomers from "./pages/admin/ManageCustomers";
import ManageStocks from "./pages/admin/ManageStocks";
import ManageCylinders from "./pages/admin/ManageCylinders";
import AgentStock from "./pages/admin/AgentStock";
import GasRequests from "./pages/admin/GasRequests";
import Dashboard from "./pages/agent/Dashboard";
import ProfileDashboard from "./pages/agent/Profile";
import ManageStock from "./pages/agent/ManageStock";
import Customers from "./pages/agent/Customers";
import Bookings from "./pages/agent/Bookings";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerBookings from "./pages/customer/CustomerBookings";
import AvailableCylinders from "./pages/customer/AvailableCylinders";
import BookingStatus from "./pages/customer/BookingStatus";
import UpdateBooking from "./pages/customer/UpdateBooking";
import AssignedAgentDetails from "./pages/customer/AssignedAgentDetails";
import PaymentDetails from "./pages/customer/PaymentDetails";

export default function App() {
  const{user} = useContext(userContext)
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Routes>
        
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard/>}/>
            <Route path="/admin/manage-agents" element={<PrivateRoute><ManageAgents /></PrivateRoute>} />
            <Route path="/admin/manage-customers" element={<PrivateRoute><ManageCustomers/></PrivateRoute>}/>
            <Route path="/admin/manage-stocks" element={<PrivateRoute><ManageStocks/></PrivateRoute>}/>
            <Route path="/admin/manage-cylinders" element={<PrivateRoute><ManageCylinders/></PrivateRoute>}/>
            <Route path="/admin/manage-agentstock" element={<PrivateRoute><AgentStock/></PrivateRoute>}/>
            <Route path="/admin/gas-requests" element={<PrivateRoute><GasRequests/></PrivateRoute>}/>
            
            <Route path="/agent/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
            <Route path="/agent/profile" element={<PrivateRoute><ProfileDashboard/></PrivateRoute>}/>
            <Route path="/agent/myStock" element={<PrivateRoute><ManageStock/></PrivateRoute>}/>
            <Route path="/agent/customers" element={<PrivateRoute><Customers/></PrivateRoute>}/>
            <Route path="/agent/bookings" element={<PrivateRoute><Bookings/></PrivateRoute>}/>
            
            <Route path="/customer/dashboard" element={<PrivateRoute><CustomerDashboard/></PrivateRoute>}/>
            <Route path="/customer/profile" element={<PrivateRoute><CustomerProfile/></PrivateRoute>}/>
            <Route path="/customer/bookings/status/:bookingId" element={<PrivateRoute><BookingStatus/></PrivateRoute>}/>
            <Route path="/customer/bookings/update/:bookingId" element={<PrivateRoute><UpdateBooking/></PrivateRoute>}/>
            <Route path="/customer/bookings" element={<PrivateRoute><CustomerBookings/></PrivateRoute>}/>
            <Route path="/customer/cylinders" element={<PrivateRoute><AvailableCylinders/></PrivateRoute>}/>
            <Route path="/customer/agent" element={<PrivateRoute><AssignedAgentDetails/></PrivateRoute>}/>
            <Route path="/customer/payments" element={<PrivateRoute><PaymentDetails/></PrivateRoute>}/>
      </Routes>
    </ThemeProvider>
  );
}
