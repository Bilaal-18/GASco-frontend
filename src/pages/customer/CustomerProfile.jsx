import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerProfile, updateCustomerProfile } from "@/store/slices/customer/customerProfileSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProfileImageUpload from "@/components/ProfileImageUpload";

export default function CustomerProfile() {
  const dispatch = useDispatch();
  const { profile, loading, updateLoading, error, updateError } = useSelector(
    (state) => state.customerProfile
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNo: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  useEffect(() => {
    dispatch(fetchCustomerProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        email: profile.email || "",
        phoneNo: profile.phoneNo || "",
        address: {
          street: profile.address?.street || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          pincode: profile.address?.pincode || "",
        },
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateCustomerProfile(formData)).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <CustomerSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <CustomerSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600">Error: {error}</div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-2xl">
          <CardContent className="p-4">
            <div className="flex gap-8">
              <div>
                <ProfileImageUpload
                  currentImage={profile?.profilepic}
                  onImageUploaded={async (imageUrl) => {
                    await dispatch(fetchCustomerProfile());
                    toast.success("Profile picture updated!");
                  }}
                  userId={profile?._id}
                  updateEndpoint="/api/account"
                />
              </div>
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      name="phoneNo"
                      value={formData.phoneNo}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Phone"
                    />
                  </div>
                  <div>
                    <Label>Street</Label>
                    <Input
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Pincode"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-4">
                      <Button type="submit" disabled={updateLoading}>
                        {updateLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
