import { useEffect, useState } from "react";
import axios from "@/config/config";
import Sidebar from "@/components/layout/SideBar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

export default function ManageStocks() {
  const [stocks, setStocks] = useState([]);
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    cylinderId: "",
    totalQuantity: "",
  });

  const token = localStorage.getItem("token");

  // 🔹 Fetch all stocks
  const fetchStocks = async () => {
    try {
      const res = await axios.get("/api/all", {
        headers: { Authorization: token },
      });
      setStocks(res.data.Inventary || []);
    } catch (err) {
      console.error("Error fetching stocks:", err);
      toast.error("Failed to fetch stocks");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch all cylinders
  const fetchCylinders = async () => {
    try {
      const res = await axios.get("/api/list", {
        headers: { Authorization: token },
      });
      setCylinders(res.data || []);
    } catch (err) {
      console.error("Error fetching cylinders:", err);
      toast.error("Failed to fetch cylinders");
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchCylinders();
  }, []);

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Add or Update stock
  const handleSubmit = async () => {
    if (!formData.cylinderId || !formData.totalQuantity) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      if (editing) {
        await axios.put(`/api/update/${editing._id}`, formData, {
          headers: { Authorization: token },
        });
        toast.success("Stock updated successfully!");
      } else {
        await axios.post("/api/stock", formData, {
          headers: { Authorization: token },
        });
        toast.success("Stock added successfully!");
      }

      setOpen(false);
      setEditing(null);
      setFormData({ cylinderId: "", totalQuantity: "" });
      fetchStocks();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  // 🔹 Delete stock
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this stock?")) return;
    try {
      await axios.delete(`/api/deleteInventary/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Stock deleted successfully!");
      fetchStocks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete stock");
    }
  };

  // 🔹 Edit stock
  const openEditDialog = (stock) => {
    setEditing(stock);
    setFormData({
      cylinderId: stock.cylinderId?._id || "",
      totalQuantity: stock.totalQuantity || "",
    });
    setOpen(true);
  };

  return (
    <div>
      <Sidebar />

      <div className="p-6 bg-gray-50 min-h-screen ml-64 max-w-[calc(100%-16rem)]">
        {/* 🔹 Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Manage Stock</h1>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                fetchStocks();
                fetchCylinders();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCcw size={16} /> Refresh
            </Button>

            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                  setEditing(null);
                  setFormData({ cylinderId: "", totalQuantity: "" });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormData({ cylinderId: "", totalQuantity: "" });
                  }}
                >
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Stock" : "Add Stock"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-3">
                  <div>
                    <Label>Select Cylinder</Label>
                    {cylinders.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading cylinders...</p>
                    ) : (
                      <Select
                        value={formData.cylinderId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, cylinderId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cylinder" />
                        </SelectTrigger>
                        <SelectContent>
                          {cylinders.map((cylinder) => (
                            <SelectItem key={cylinder._id} value={cylinder._id}>
                              {cylinder.cylinderName} - {cylinder.cylinderType} ({cylinder.weight}kg) - ₹{cylinder.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label>Total Quantity</Label>
                    <Input
                      type="number"
                      name="totalQuantity"
                      value={formData.totalQuantity}
                      onChange={handleChange}
                      placeholder="Enter Quantity"
                    />
                  </div>

                  <Button className="w-full mt-3" onClick={handleSubmit}>
                    {editing ? "Update Stock" : "Add Stock"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 🔹 Stock Cards */}
        {loading ? (
          <p className="text-gray-600">Loading stocks...</p>
        ) : stocks.length === 0 ? (
          <p className="text-gray-600">No stock data available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {stocks.map((item) => (
              <Card
                key={item._id}
                className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-4"
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    {item.cylinderId?.cylinderName || "Unnamed Cylinder"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-1">
                  <p><strong>Type:</strong> {item.cylinderId?.cylinderType}</p>
                  <p><strong>Weight:</strong> {item.cylinderId?.weight} kg</p>
                  <p><strong>Price:</strong> ₹{item.cylinderId?.price}</p>
                  <p><strong>Quantity:</strong> {item.totalQuantity}</p>

                  <div className="flex gap-3 mt-5 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
