import { useContext, useEffect, useState } from "react";
import axios from "@/config/config";
import userContext from "@/context/UserContext";
import Sidebar from "@/components/layout/SideBar";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Users, UserCog, Package } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useContext(userContext);
  const [summary, setSummary] = useState({
    agents: 0,
    customers: 0,
    stock: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized — please login again");
        return;
      }

      try {
        const [agentsRes, customersRes, stockRes] = await Promise.all([
          axios.get("/api/distributors", {
            headers: { Authorization: token },
          }),
          axios.get("/api/customers", {
            headers: { Authorization: token },
          }),
          axios.get("/api/all", {
            headers: { Authorization: token },
          }),
        ]);

        // ✅ Extract inventory from correct field
        const inventaryArray = stockRes.data?.Inventary || [];

        // ✅ Sum totalQuantity from all inventory items
        const totalStock = inventaryArray.reduce(
          (sum, item) => sum + (item.totalQuantity || 0),
          0
        );

        setSummary({
          agents: agentsRes.data?.length || 0,
          customers: customersRes.data?.length || 0,
          stock: totalStock,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Failed to load dashboard data");
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
          Welcome, {user?.username || "Admin"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agents */}
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Agents</CardTitle>
              <UserCog className="text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800 dark:text-white">
                {summary.agents}
              </p>
            </CardContent>
          </Card>

          {/* Customers */}
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Customers</CardTitle>
              <Users className="text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800 dark:text-white">
                {summary.customers}
              </p>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Stock</CardTitle>
              <Package className="text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800 dark:text-white">
                {summary.stock}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
