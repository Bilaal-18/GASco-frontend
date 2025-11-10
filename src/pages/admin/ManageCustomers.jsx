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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNo: "",
    password: "",
    agent: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/customers", {
        headers: { Authorization: token },
      });
      
      const customersData =
        res.data.customers ||
        res.data.customer ||
        res.data.Users ||
        res.data.list ||
        res.data ||
        [];

      setCustomers(Array.isArray(customersData) ? customersData : []);
      setFilteredCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/distributors", {
        headers: { Authorization: token },
      });
      setAgents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch agents");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchAgents();
  }, []);

  
  useEffect(() => {
    const filtered = customers.filter((c) =>
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNo?.includes(search)
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [search, customers]);


  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      username: "",
      email: "",
      phoneNo: "",
      password: "",
      agent: "",
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      username: customer.username || "",
      email: customer.email || "",
      phoneNo: customer.phoneNo || "",
      password: "", 
      agent: customer.agent?._id || customer.agent || "",
      address: customer.address || {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
    });
    setFormDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
  
    if (!formData.username || !formData.email || !formData.phoneNo) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!editingCustomer && !formData.password) {
      toast.error("Password is required for new customers");
      return;
    }

    if (!formData.agent) {
      toast.error("Please select an agent");
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNo: formData.phoneNo,
        agent: formData.agent,
        address: formData.address,
        role: "customer",
      };

      
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingCustomer) {
        await axios.put(`/api/updateCustomer/${editingCustomer._id}`, submitData, {
          headers: { Authorization: token },
        });
        toast.success("Customer updated successfully!");
      } else {
        await axios.post("/api/register", submitData);
        toast.success("Customer added successfully!");
      }

      setFormDialogOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const errorMessage = Array.isArray(err.response?.data?.error)
        ? err.response.data.error.map((e) => e.message || e).join(", ")
        : err.response?.data?.error || "Operation failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    try {
      await axios.delete(`/api/remove/${customerId}`, {
        headers: { Authorization: token },
      });
      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customer");
    }
  };

  return (
    <div>
      <Sidebar />

      <div className="p-6 space-y-6 ml-64 max-w-[calc(100%-16rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Manage Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>

          
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center text-gray-500">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((cust) => (
                    <TableRow key={cust._id}>
                      <TableCell>{cust.username || "Unnamed"}</TableCell>
                      <TableCell>{cust.email}</TableCell>
                      <TableCell>{cust.phoneNo}</TableCell>
                      <TableCell>{cust.agent?.agentname || "unassigned"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleView(cust)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            title="View customer"
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => handleEdit(cust)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            title="Edit customer"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-1"
                                title="Delete customer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the customer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(cust._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

        
            {filteredCustomers.length > itemsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(filteredCustomers.length / itemsPerPage)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === Math.ceil(filteredCustomers.length / itemsPerPage)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedCustomer.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedCustomer.phoneNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-semibold capitalize">
                      {selectedCustomer.role || "customer"}
                    </p>
                  </div>
                </div>
                {selectedCustomer.address && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Address</p>
                    <div className="space-y-1">
                      <p>
                        <strong>Street:</strong> {selectedCustomer.address.street || "N/A"}
                      </p>
                      <p>
                        <strong>City:</strong> {selectedCustomer.address.city || "N/A"}
                      </p>
                      <p>
                        <strong>State:</strong> {selectedCustomer.address.state || "N/A"}
                      </p>
                      <p>
                        <strong>Pincode:</strong> {selectedCustomer.address.pincode || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
                {selectedCustomer.agent && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Assigned Agent</p>
                    <div className="space-y-1">
                      <p>
                        <strong>Name:</strong> {selectedCustomer.agent.agentname || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedCustomer.agent.email || "N/A"}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedCustomer.agent.phoneNo || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-semibold">
                    {new Date(selectedCustomer.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

    
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="phoneNo">Phone Number *</Label>
                <Input
                  id="phoneNo"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Password {!editingCustomer && "*"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={
                    editingCustomer
                      ? "Leave blank to keep current password"
                      : "Enter password (min 8 characters)"
                  }
                />
              </div>
              <div>
                <Label htmlFor="agent">Agent *</Label>
                <Select
                  value={formData.agent}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, agent: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent._id} value={agent._id}>
                        {agent.agentname} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">
                  Address
                </Label>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setFormDialogOpen(false);
                  setEditingCustomer(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingCustomer
                  ? "Update Customer"
                  : "Add Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

