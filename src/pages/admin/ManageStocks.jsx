import { useEffect, useState } from "react";
import axios from "@/config/config";
import Sidebar from "@/components/layout/SideBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


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

  
  const openEditDialog = (stock) => {
    setEditing(stock);
    setFormData({
      cylinderId: stock.cylinderId?._id || "",
      totalQuantity: stock.totalQuantity || "",
    });
    setOpen(true);
  };

  return (
    <SidebarProvider>
      <Sidebar />

      <SidebarInset>
        <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Manage Stock</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => {
              fetchStocks();
              fetchCylinders();
            }}
          >
            Refresh
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

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : stocks.length === 0 ? (
          <p className="text-gray-600">No stock data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cylinder Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.cylinderId?.cylinderName || "Unnamed Cylinder"}
                    </TableCell>
                    <TableCell>{item.cylinderId?.cylinderType}</TableCell>
                    <TableCell>{item.cylinderId?.weight} kg</TableCell>
                    <TableCell>₹{item.cylinderId?.price}</TableCell>
                    <TableCell>{item.totalQuantity}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
