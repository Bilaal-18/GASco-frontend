import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
} from "lucide-react";
import axios from "@/config/config";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ProfileImageUpload from "@/components/ProfileImageUpload";

export default function ProfileDashboard() {
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState({
    totalStock: 0,
    customersCount: 0,
    pendingPayments: 0,
    todayBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agentname: "",
    email: "",
    phoneNo: "",
    vehicleNo: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const token = localStorage.getItem("token");

  // Fetch agent profile
  const fetchAgent = async () => {
    try {
      const res = await axios.get("/api/account", {
        headers: { Authorization: token },
      });
      setAgent(res.data);
      setFormData({
        agentname: res.data.agentname || "",
        email: res.data.email || "",
        phoneNo: res.data.phoneNo || "",
        vehicleNo: res.data.vehicleNo || "",
        address: res.data.address || {
          street: "",
          city: "",
          state: "",
          pincode: "",
        },
      });
    } catch (err) {
      console.error("Error fetching agent details", err);
      toast.error("Failed to fetch agent profile");
    }
  };


  const fetchStats = async () => {
    try {
      const agentId = agent?._id;
      if (!agentId || !token) return;

      
      const [stockRes, customersRes, bookingsRes] = await Promise.all([
        axios.get(`/api/ownStock/${agentId}`, {
          headers: { Authorization: token },
        }).catch(() => ({ data: { Ownstock: [] } })),
        axios.get(`/api/agentCustomers/${agentId}`, {
          headers: { Authorization: token },
        }).catch(() => ({ data: { customers: [] } })),
        axios.get("/api/agentBookings", {
          headers: { Authorization: token },
        }).catch(() => ({ data: { bookings: [] } })),
      ]);

      
      const stocks = stockRes.data?.Ownstock || stockRes.data?.ownStock || stockRes.data || [];
      const stocksArray = Array.isArray(stocks) ? stocks : [];
      const totalStock = stocksArray.reduce((sum, stock) => sum + (stock.quantity || 0), 0);

    
      const customers = customersRes.data?.customers || customersRes.data || [];
      const customersArray = Array.isArray(customers) ? customers : [];
      const customersCount = customersArray.length;

      
      const bookings = bookingsRes.data?.bookings || bookingsRes.data || [];
      const bookingsArray = Array.isArray(bookings) ? bookings : [];
      
      
      const pendingPayments = bookingsArray
        .filter((b) => b.paymentStatus === "pending" && b.cylinder?.price)
        .reduce((sum, b) => {
          const price = b.cylinder.price || 0;
          const quantity = b.quantity || 0;
          return sum + (price * quantity);
        }, 0);

      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayBookings = bookingsArray.filter((b) => {
        const bookingDate = new Date(b.createdAt || b.created_at);
        return bookingDate >= today;
      }).length;

      setStats({
        totalStock,
        customersCount,
        pendingPayments,
        todayBookings,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      
      setStats({
        totalStock: 0,
        customersCount: 0,
        pendingPayments: 0,
        todayBookings: 0,
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAgent();
      setLoading(false);
    };
    loadData();
  }, [token]);

  useEffect(() => {
    if (agent?._id) {
      fetchStats();
    }
  }, [agent?._id, token]);

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

  const handleUpdateProfile = async () => {
    if (!formData.agentname || !formData.email || !formData.phoneNo) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.vehicleNo) {
      toast.error("Vehicle number is required");
      return;
    }

    if (!agent?._id) {
      toast.error("Agent ID not found");
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData = {
        agentname: formData.agentname.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNo: formData.phoneNo,
        vehicleNo: formData.vehicleNo.trim(),
        address: formData.address,
      };

      await axios.put(`/api/updateAgent/${agent._id}`, updateData, {
        headers: { Authorization: token },
      });

      toast.success("Profile updated successfully!");
      setEditDialogOpen(false);
      await fetchAgent();
      await fetchStats();
    } catch (err) {
      console.error("Update profile error:", err);
      const errorMessage = Array.isArray(err.response?.data?.error)
        ? err.response.data.error.map((e) => e.message || e).join(", ")
        : err.response?.data?.error || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!agent?._id) {
      toast.error("Agent ID not found");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.put(
        `/api/updatePassword/${agent._id}`,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Password updated successfully!");
      setPasswordDialogOpen(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Update password error:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (!agent) {
    return (
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center text-red-500">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Agent profile not found</p>
            </div>
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
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              Change Password
            </Button>
            <Button onClick={() => setEditDialogOpen(true)}>Edit Profile</Button>
          </div>
        </div>

        <Card className="mb-6 max-w-2xl">
          <CardContent className="p-4">
            <div className="flex gap-8">
              <div>
                <ProfileImageUpload
                  currentImage={agent?.profilepic}
                  onImageUploaded={async (imageUrl) => {
                    await fetchAgent();
                    toast.success("Profile picture updated!");
                  }}
                  userId={agent?._id}
                  updateEndpoint="/api/updateAgent"
                />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold mb-4">{agent.agentname || "Agent"}</div>
                <div className="space-y-2">
                  <div>Email: {agent.email}</div>
                  <div>Phone: {agent.phoneNo || "N/A"}</div>
                  <div>Vehicle: {agent.vehicleNo || "N/A"}</div>
                  {agent.address && (
                    <>
                      <div>Street: {agent.address.street || "N/A"}</div>
                      <div>City: {agent.address.city || "N/A"}</div>
                      <div>State: {agent.address.state || "N/A"}</div>
                      <div>Pincode: {agent.address.pincode || "N/A"}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  name="agentname"
                  value={formData.agentname}
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
                <Label>Vehicle Number</Label>
                <Input
                  name="vehicleNo"
                  value={formData.vehicleNo}
                  onChange={handleInputChange}
                  placeholder="Vehicle Number"
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
                  setEditDialogOpen(false);
                  if (agent) {
                    setFormData({
                      agentname: agent.agentname || "",
                      email: agent.email || "",
                      phoneNo: agent.phoneNo || "",
                      vehicleNo: agent.vehicleNo || "",
                      address: agent.address || {
                        street: "",
                        city: "",
                        state: "",
                        pincode: "",
                      },
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  placeholder="Current Password"
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="New Password"
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm Password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdatePassword} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
