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
import { Search, RefreshCcw } from "lucide-react";

export default function ManageCylinders() {
  const [cylinders, setCylinders] = useState([]);
  const [filteredCylinders, setFilteredCylinders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewCylinder, setViewCylinder] = useState(null);

  const [formData, setFormData] = useState({
    cylinderName: "",
    cylinderType: "",
    weight: "",
    price: "",
  });

  const token = localStorage.getItem("token");

  // 🔹 Fetch cylinders
  const fetchCylinders = async () => {
    try {
      const res = await axios.get("/api/list", {
        headers: { Authorization: token },
      });
      setCylinders(res.data || []);
      setFilteredCylinders(res.data || []);
    } catch (err) {
      console.error("Error fetching cylinders:", err);
      toast.error("Failed to fetch cylinders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCylinders();
  }, []);

  // 🔹 Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Add or Update cylinder
  const handleSubmit = async () => {
    if (!formData.cylinderName || !formData.cylinderType || !formData.weight || !formData.price) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      if (editing) {
        await axios.put(`/api/updateCylinder/${editing._id}`, formData, {
          headers: { Authorization: token },
        });
        toast.success("Cylinder updated successfully!");
      } else {
        await axios.post("/api/create", formData, {
          headers: { Authorization: token },
        });
        toast.success("Cylinder added successfully!");
      }

      setOpen(false);
      setEditing(null);
      setFormData({
        cylinderName: "",
        cylinderType: "",
        weight: "",
        price: "",
      });
      fetchCylinders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  // 🔹 Delete cylinder
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this cylinder?")) return;
    try {
      await axios.delete(`/api/delete/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Cylinder deleted successfully!");
      fetchCylinders();
    } catch (err) {
      toast.error("Failed to delete cylinder");
    }
  };

  // 🔹 Edit cylinder
  const openEditDialog = (cylinder) => {
    setEditing(cylinder);
    setFormData({
      cylinderName: cylinder.cylinderName || "",
      cylinderType: cylinder.cylinderType || "",
      weight: cylinder.weight || "",
      price: cylinder.price || "",
    });
    setOpen(true);
  };

  // 🔹 Search + Filter
  useEffect(() => {
    let result = cylinders;

    if (filterType !== "all") {
      result = result.filter(
        (c) => c.cylinderType?.toLowerCase() === filterType.toLowerCase()
      );
    }

    if (search.trim()) {
      result = result.filter(
        (c) =>
          c.cylinderName?.toLowerCase().includes(search.toLowerCase()) ||
          c.cylinderType?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredCylinders(result);
  }, [search, filterType, cylinders]);

  return (
    <div>
      <Sidebar />

      <div className="p-6 bg-gray-50 min-h-screen ml-64 max-w-[calc(100%-16rem)]">
        {/* 🔹 Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Manage Cylinders</h1>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchCylinders}
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
                  setFormData({
                    cylinderName: "",
                    cylinderType: "",
                    weight: "",
                    price: "",
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormData({
                      cylinderName: "",
                      cylinderType: "",
                      weight: "",
                      price: "",
                    });
                  }}
                >
                  Add Cylinder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Cylinder" : "Add Cylinder"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-3">
                  <div>
                    <Label>Cylinder Name</Label>
                    <Select
                      value={formData.cylinderName}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cylinderName: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Cylinder Name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bharath">Bharath</SelectItem>
                        <SelectItem value="HP">HP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={formData.cylinderType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cylinderType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Cylinder Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="private Commercial">Private Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                    />
                  </div>

                  <Button className="w-full mt-3" onClick={handleSubmit}>
                    {editing ? "Update Cylinder" : "Add Cylinder"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 🔍 Search + Filter */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Search className="text-gray-500" size={18} />
            <Input
              placeholder="Search by name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-md px-3 py-2 bg-white text-gray-700"
          >
            <option value="all">All Types</option>
            <option value="commercial">Commercial</option>
            <option value="domestic">Domestic</option>
          </select>
        </div>

        {/* 🔹 Cylinder Cards */}
        {loading ? (
          <p className="text-gray-600">Loading cylinders...</p>
        ) : filteredCylinders.length === 0 ? (
          <p className="text-gray-600">No cylinders found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredCylinders.map((cylinder) => (
              <Card
                key={cylinder._id}
                className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-4"
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    {cylinder.cylinderName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-1">
                  <p><strong>Type:</strong> {cylinder.cylinderType}</p>
                  <p><strong>Weight:</strong> {cylinder.weight} kg</p>
                  <p><strong>Price:</strong> ₹{cylinder.price}</p>

                  <div className="flex gap-3 mt-5 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewCylinder(cylinder)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(cylinder)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(cylinder._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 🔹 View Cylinder Dialog */}
        {viewCylinder && (
          <Dialog open={!!viewCylinder} onOpenChange={() => setViewCylinder(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cylinder Details</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-2">
                <p><strong>Name:</strong> {viewCylinder.cylinderName}</p>
                <p><strong>Type:</strong> {viewCylinder.cylinderType}</p>
                <p><strong>Weight:</strong> {viewCylinder.weight} kg</p>
                <p><strong>Price:</strong> ₹{viewCylinder.price}</p>
                <p><strong>ID:</strong> {viewCylinder._id}</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
