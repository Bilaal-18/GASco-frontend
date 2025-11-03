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
      </Routes>
    </ThemeProvider>
  );
}
