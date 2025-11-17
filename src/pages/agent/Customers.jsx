import { useEffect, useState } from "react";
import axios from "@/config/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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

  useEffect(() => {
    const filtered = customers.filter((c) =>
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNo?.includes(search)
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [search, customers]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

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
      setLoading(true);
      const accountRes = await axios.get("/api/account", {
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
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-gray-500">Loading customers...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AgentSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">My Customers</h1>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddCustomer}>Add Customer</Button>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8">No customers found</div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCustomers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>{customer.username || "N/A"}</TableCell>
                        <TableCell>{customer.email || "N/A"}</TableCell>
                        <TableCell>{customer.phoneNo || "N/A"}</TableCell>
                        <TableCell>
                          {customer.address
                            ? `${customer.address.street || ""} ${customer.address.city || ""} ${customer.address.state || ""} ${customer.address.pincode || ""}`.trim() || "N/A"
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewDetails(customer)}
                              variant="outline"
                              size="sm"
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => handleEditCustomer(customer)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => {
                                if (confirm("Delete this customer?")) {
                                  handleDeleteCustomer(customer._id);
                                }
                              }}
                              variant="outline"
                              size="sm"
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-2">
                <div>Name: {selectedCustomer.username || "N/A"}</div>
                <div>Email: {selectedCustomer.email || "N/A"}</div>
                <div>Phone: {selectedCustomer.phoneNo || "N/A"}</div>
                {selectedCustomer.address && (
                  <>
                    <div>Street: {selectedCustomer.address.street || "N/A"}</div>
                    <div>City: {selectedCustomer.address.city || "N/A"}</div>
                    <div>State: {selectedCustomer.address.state || "N/A"}</div>
                    <div>Pincode: {selectedCustomer.address.pincode || "N/A"}</div>
                  </>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  maxLength={10}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                />
              </div>
              <div>
                <Label>Street</Label>
                <Input
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  placeholder="Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                  placeholder="Pincode"
                  maxLength={6}
                />
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
                {isSubmitting ? "Saving..." : editingCustomer ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}





