import { useEffect, useState } from "react";
import axios from "@/config/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, MapPin, Eye, Plus, Edit, Trash2 } from "lucide-react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNo: "",
    password: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });
  const token = localStorage.getItem("token");

  // Fetch agent data first to get agent ID
  useEffect(() => {
    const fetchAgentId = async () => {
      try {
        const res = await axios.get("/api/account", {
          headers: { Authorization: token },
        });
        setAgentId(res.data._id);
      } catch (err) {
        console.error("Error fetching agent ID:", err);
        toast.error("Failed to fetch agent information");
      }
    };
    fetchAgentId();
  }, [token]);

  // Fetch customers assigned to this agent
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!agentId) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/agentCustomers/${agentId}`, {
          headers: { Authorization: token },
        });
        
        const customersData = res.data?.customers || res.data || [];
        const customersArray = Array.isArray(customersData) ? customersData : [];
        
        setCustomers(customersArray);
        setFilteredCustomers(customersArray);
      } catch (err) {
        console.error("Error fetching customers:", err);
        toast.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [agentId, token]);

  // Search filter
  useEffect(() => {
    const filtered = customers.filter((c) =>
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNo?.includes(search)
    );
    setFilteredCustomers(filtered);
  }, [search, customers]);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
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

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      username: "",
      email: "",
      phoneNo: "",
      password: "",
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
    });
    setAddDialogOpen(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      username: customer.username || "",
      email: customer.email || "",
      phoneNo: customer.phoneNo || "",
      password: "",
      address: customer.address || {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
    });
    setAddDialogOpen(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await axios.delete(`/api/remove/${customerId}`, {
        headers: { Authorization: token },
      });
      toast.success("Customer deleted successfully!");
      const res = await axios.get(`/api/agentCustomers/${agentId}`, {
        headers: { Authorization: token },
      });
      const customersData = res.data?.customers || res.data || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setFilteredCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("Failed to delete customer");
    }
  };

  const handleSubmitCustomer = async () => {
    if (!formData.username || !formData.email || !formData.phoneNo) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!editingCustomer && !formData.password) {
      toast.error("Password is required for new customers");
      return;
    }

    if (!agentId) {
      toast.error("Agent ID not found");
      return;
    }

    try {
      setIsSubmitting(true);
      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNo: formData.phoneNo,
        agent: agentId,
        role: "customer",
        address: formData.address,
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

      setAddDialogOpen(false);
      setEditingCustomer(null);
      setFormData({
        username: "",
        email: "",
        phoneNo: "",
        password: "",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
        },
      });

      const res = await axios.get(`/api/agentCustomers/${agentId}`, {
        headers: { Authorization: token },
      });
      const customersData = res.data?.customers || res.data || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setFilteredCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error("Error submitting customer:", err);
      const errorMessage = Array.isArray(err.response?.data?.error)
        ? err.response.data.error.map((e) => e.message || e).join(", ")
        : err.response?.data?.error || "Operation failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !agentId) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <AgentSidebar />
        <div className="flex-1 flex justify-center items-center ml-64">
          <div className="text-gray-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            My Customers
          </h1>
          <Button onClick={handleAddCustomer} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, email, or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {search ? "No customers found matching your search." : "No customers assigned to you yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">
                          {customer.username || "Unnamed Customer"}
                        </TableCell>
                        <TableCell>{customer.email || "N/A"}</TableCell>
                        <TableCell>{customer.phoneNo || "N/A"}</TableCell>
                        <TableCell>
                          {customer.address ? (
                            <div className="text-sm">
                              {customer.address.street && <span>{customer.address.street}, </span>}
                              {customer.address.city && <span>{customer.address.city}, </span>}
                              {customer.address.state && <span>{customer.address.state}</span>}
                              {customer.address.pincode && <span> - {customer.address.pincode}</span>}
                              {!customer.address.street && !customer.address.city && !customer.address.state && !customer.address.pincode && (
                                <span className="text-gray-400">No address</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No address</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewDetails(customer)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleEditCustomer(customer)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the customer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCustomer(customer._id)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base font-semibold">{selectedCustomer.username || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{selectedCustomer.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-base">{selectedCustomer.phoneNo || "N/A"}</p>
                  </div>
                </div>
                {selectedCustomer.address && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Street:</strong> {selectedCustomer.address.street || "N/A"}</p>
                      <p><strong>City:</strong> {selectedCustomer.address.city || "N/A"}</p>
                      <p><strong>State:</strong> {selectedCustomer.address.state || "N/A"}</p>
                      <p><strong>Pincode:</strong> {selectedCustomer.address.pincode || "N/A"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setEditingCustomer(null);
            setFormData({
              username: "",
              email: "",
              phoneNo: "",
              password: "",
              address: {
                street: "",
                city: "",
                state: "",
                pincode: "",
              },
            });
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
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
                  placeholder="Enter email address"
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
                <Label htmlFor="password">{editingCustomer ? "Password (leave blank to keep current)" : "Password *"}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editingCustomer ? "Enter new password (leave blank to keep current)" : "Enter password (min 8 characters)"}
                />
              </div>
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Address</Label>
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
                  setAddDialogOpen(false);
                  setEditingCustomer(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitCustomer} disabled={isSubmitting}>
                {isSubmitting 
                  ? (editingCustomer ? "Updating..." : "Adding...") 
                  : (editingCustomer ? "Update Customer" : "Add Customer")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

