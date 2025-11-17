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
import { RefreshCcw } from "lucide-react";

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


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  
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
    <SidebarProvider>
      <Sidebar />

      <SidebarInset>
        <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Manage Cylinders</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="commercial">Commercial</option>
              <option value="domestic">Domestic</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchCylinders}
            >
              Refresh
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

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : filteredCylinders.length === 0 ? (
          <p className="text-gray-600">No cylinders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cylinder Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCylinders.map((cylinder) => (
                  <TableRow key={cylinder._id}>
                    <TableCell className="font-medium">{cylinder.cylinderName}</TableCell>
                    <TableCell>{cylinder.cylinderType}</TableCell>
                    <TableCell>{cylinder.weight} kg</TableCell>
                    <TableCell>₹{cylinder.price}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        
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
      </SidebarInset>
    </SidebarProvider>
  );
}
