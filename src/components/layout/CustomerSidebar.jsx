import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, ShoppingCart, CylinderIcon, UserCheck, Wallet, LogOut } from "lucide-react";
import { useContext } from "react";
import userContext from "@/context/UserContext";
import { Button } from "@/components/ui/button";

const CustomerSidebar = () => {
  const { handleLogout } = useContext(userContext);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-slate-900 text-white flex flex-col p-5 space-y-2 z-50 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-6 text-center">
        Customer Panel
      </h2>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/customer/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition ${
              isActive ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800"
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/customer/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition ${
              isActive ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800"
            }`
          }
        >
          <User size={18} />
          Profile
        </NavLink>

        <NavLink
          to="/customer/bookings"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition ${
              isActive ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800"
            }`
          }
        >
          <ShoppingCart size={18} />
          My Bookings
        </NavLink>

        <NavLink
          to="/customer/cylinders"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition ${
              isActive ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800"
            }`
          }
        >
          <CylinderIcon size={18} />
          Available Cylinders
        </NavLink>

        <NavLink
          to="/customer/agent"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition ${
              isActive ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800"
            }`
          }
        >
          <UserCheck size={18} />
          Assigned Agent
        </NavLink>

        <NavLink
          to="/customer/payments"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition ${
              isActive ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800"
            }`
          }
        >
          <Wallet size={18} />
          Payment Details
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-4">
        <Button
          onClick={handleLogoutClick}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Logout
        </Button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;




