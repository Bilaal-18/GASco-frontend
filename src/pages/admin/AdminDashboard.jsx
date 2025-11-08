import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/config/config";
import userContext from "@/context/UserContext";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Users, UserCog, Package, Wallet, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useContext(userContext);
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    agents: 0,
    customers: 0,
    stock: 0,
    paymentsReceived: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized — please login again");
        return;
      }

      try {
        const [agentsRes, customersRes, stockRes, paymentsRes] = await Promise.all([
          axios.get("/api/distributors", {
            headers: { Authorization: token },
          }),
          axios.get("/api/customers", {
            headers: { Authorization: token },
          }),
          axios.get("/api/all", {
            headers: { Authorization: token },
          }),
          axios.get("/api/admin/agent-payments", {
            headers: { Authorization: token },
          }).catch(() => ({ data: { payments: [] } })),
        ]);

        const inventaryArray = stockRes.data?.Inventary || [];

        const totalStock = inventaryArray.reduce(
          (sum, item) => sum + (item.totalQuantity || 0),
          0
        );

        const payments = paymentsRes.data?.payments || [];
        const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        setSummary({
          agents: agentsRes.data?.length || 0,
          customers: customersRes.data?.length || 0,
          stock: totalStock,
          paymentsReceived: totalPayments,
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
      <Sidebar />

      <main className="flex-1 p-8">
        <h2 className="text-3xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
          Welcome, {user?.username || "Admin"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
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

          <Card 
            className="shadow-md border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-shadow hover:border-teal-400"
            onClick={() => navigate("/admin/payments")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Payments Received</CardTitle>
              <Wallet className="text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-slate-800 dark:text-white">
                  ₹{summary.paymentsReceived.toLocaleString()}
                </p>
                <ArrowRight className="text-teal-500 w-5 h-5" />
              </div>
              <p className="text-sm text-slate-500 mt-2">Click to view details</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
