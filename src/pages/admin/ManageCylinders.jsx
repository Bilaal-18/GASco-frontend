import { useEffect, useState } from "react";
import axios from "@/config/config";
import Sidebar from "@/components/layout/SideBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageCylinders() {
  const [cylinders, setCylinders] = useState([]);
  const [filteredCylinders, setFilteredCylinders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="domestic">Domestic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchCylinders}
              disabled={loading}
            >
              <RefreshCcw
                size={16}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCylinders.map((cylinder) => (
              <Card key={cylinder._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{cylinder.cylinderName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">{cylinder.cylinderType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weight:</span>
                      <span className="text-sm font-medium">{cylinder.weight} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-semibold text-green-600">₹{cylinder.price}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(cylinder)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the cylinder
                            "{cylinder.cylinderName}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cylinder._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
