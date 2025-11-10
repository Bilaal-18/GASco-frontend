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
  Phone,
  Mail,
  MapPin,
  Edit,
  Package,
  Users,
  DollarSign,
  ClipboardList,
  User,
  Lock,
  Truck,
} from "lucide-react";
import axios from "@/config/config";
import AgentSidebar from "@/components/layout/AgentSidebar";
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
      <div className="flex bg-gray-50 min-h-screen">
        <AgentSidebar />
        <div className="flex-1 ml-64 flex justify-center items-center">
          <div className="text-center text-red-500">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Agent profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />

      <div className="flex-1 ml-64 p-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information and view your statistics</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
            <Button onClick={() => setEditDialogOpen(true)} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              
              <div className="flex-shrink-0">
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
              
            
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {agent.agentname || "Agent"}
                </h2>
                <div className="space-y-2 mt-4">
                  <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{agent.email}</span>
                  </p>
                  <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{agent.phoneNo || "Not provided"}</span>
                  </p>
                  <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span>Vehicle: {agent.vehicleNo || "Not provided"}</span>
                  </p>
                  {agent.address && (
                    <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>
                        {agent.address.street
                          ? `${agent.address.street}, ${agent.address.city || ""}, ${agent.address.state || ""}`
                          : "Address not provided"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Total Stock</CardTitle>
              <Package className="w-6 h-6 opacity-90" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.totalStock}</p>
              <p className="text-sm opacity-90 mt-1">Cylinders in inventory</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Customers</CardTitle>
              <Users className="w-6 h-6 opacity-90" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.customersCount}</p>
              <p className="text-sm opacity-90 mt-1">Assigned customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Pending Payments</CardTitle>
              <DollarSign className="w-6 h-6 opacity-90" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">₹{stats.pendingPayments.toLocaleString()}</p>
              <p className="text-sm opacity-90 mt-1">Amount to be collected</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Today's Bookings</CardTitle>
              <ClipboardList className="w-6 h-6 opacity-90" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.todayBookings}</p>
              <p className="text-sm opacity-90 mt-1">New bookings today</p>
            </CardContent>
          </Card>
        </div>

      
        {agent.address && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Street</p>
                  <p className="font-semibold">{agent.address.street || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-semibold">{agent.address.city || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-semibold">{agent.address.state || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pincode</p>
                  <p className="font-semibold">{agent.address.pincode || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="agentname">Agent Name *</Label>
                <Input
                  id="agentname"
                  name="agentname"
                  value={formData.agentname}
                  onChange={handleInputChange}
                  placeholder="Enter agent name"
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
                <Label htmlFor="vehicleNo">Vehicle Number *</Label>
                <Input
                  id="vehicleNo"
                  name="vehicleNo"
                  value={formData.vehicleNo}
                  onChange={handleInputChange}
                  placeholder="Enter vehicle number"
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
                {isSubmitting ? "Updating..." : "Update Profile"}
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
                <Label htmlFor="oldPassword">Current Password *</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
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
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
