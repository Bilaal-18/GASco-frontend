import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import userContext from "@/context/UserContext";
import { LogOut, Users, Package, UserCog, LayoutDashboard, CylinderIcon, ShoppingCart } from "lucide-react";

export default function Sidebar() {
  const { handleLogout, user } = useContext(userContext);
  const navigate = useNavigate();

  const Logout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col p-5 space-y-2">
      <h2 className="text-xl font-semibold mb-6 text-center">
        Admin Panel
      </h2>

      <nav className="flex flex-col gap-2">
        <Link
          to="/admin"
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          to="/admin/manage-agents"
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
          <UserCog size={18} />
          Manage Agents
        </Link>

        <Link
          to="/admin/manage-customers"
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
          <Users size={18} />
          Manage Customers
        </Link>

        <Link
          to="/admin/manage-stocks"
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
          <Package size={18} />
          Manage Stocks
        </Link>

        <Link
          to="/admin/manage-cylinders"
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
          <CylinderIcon size={18} />
          Manage Cylinders
        </Link>

        <Link
        to="/admin/manage-agentstock"
       className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
        <Package className="w-5 h-5" />
        Agent Stock
        </Link>

        <Link
          to="/admin/gas-requests"
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition"
        >
          <ShoppingCart size={18} />
          Gas Requests
        </Link>
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-4">
        {user && (
          <div className="text-sm text-slate-300 mb-3">
            <p>{user.username}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        )}

        <button
          onClick={Logout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-2 rounded-md font-medium transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
