import { useEffect, useState } from "react";
import axios from "@/config/config";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, RefreshCcw } from "lucide-react";
import Sidebar from "@/components/layout/SideBar";

export default function ManageAgents() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [viewAgent, setViewAgent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    agentname: "",
    email: "",
    password: "",
    phoneNo: "",
    vehicleNo: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const token = localStorage.getItem("token");

  // 🔹 Fetch agents
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/distributors", {
        headers: { Authorization: token },
      });

      const formatted = res.data.map((a) => ({
        ...a,
        agentname: a.agentname || "Unnamed Agent",
      }));

      setAgents(formatted);
      setFilteredAgents(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["street", "city", "state", "pincode"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Validation
  const validateForm = () => {
    const { agentname, email, password, phoneNo, vehicleNo } = formData;
    if (!agentname.trim()) return "Agent name is required";
    if (!email.trim() || !email.includes("@")) return "Valid email is required";
    if (!editing && (!password || password.length < 6))
      return "Password must be at least 6 characters";
    if (!/^[0-9]{10}$/.test(phoneNo))
      return "Phone number must be 10 digits";
    if (!vehicleNo.trim()) return "Vehicle number is required";
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    try {
      if (editing) {
        await axios.put(`/api/updateAgent/${editing._id}`, formData, {
          headers: { Authorization: token },
        });
        toast.success("Agent updated successfully!");
      } else {
        await axios.post(
          "/api/register",
          { ...formData, role: "agent" },
          { headers: { Authorization: token } }
        );
        toast.success("Agent added successfully!");
      }
      setOpen(false);
      setEditing(null);
      fetchAgents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/removeAgent/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Agent deleted successfully!");
      fetchAgents();
    } catch (err) {
      toast.error("Failed to delete agent");
    }
  };

  const openEditDialog = (agent) => {
    setEditing(agent);
    setFormData({
      agentname: agent.agentname || "",
      email: agent.email,
      phoneNo: agent.phoneNo,
      vehicleNo: agent.vehicleNo || "",
      address: agent.address || {},
    });
    setOpen(true);
  };

  const totalPages = Math.ceil(filteredAgents.length / perPage);
  const displayedAgents = filteredAgents.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // 🔍 Search
  useEffect(() => {
    const result = agents.filter(
      (a) =>
        a.agentname?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAgents(result);
    setPage(1);
  }, [search, agents]);

  return (
    <div>
      <Sidebar />
      <div className="p-6 ml-64 max-w-[calc(100%-16rem)]">
        <Card className="p-6">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Manage Agents</CardTitle>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchAgents}
                disabled={loading}
                title="Refresh list"
              >
                <RefreshCcw
                  size={16}
                  className={`mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditing(null)}>Add Agent</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editing ? "Edit Agent" : "Add Agent"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3 mt-3">
                    <div>
                      <Label>Agent Name</Label>
                      <Input
                        name="agentname"
                        value={formData.agentname}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    {!editing && (
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        name="phoneNo"
                        value={formData.phoneNo}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label>Vehicle No</Label>
                      <Input
                        name="vehicleNo"
                        value={formData.vehicleNo}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Street</Label>
                        <Input
                          name="street"
                          value={formData.address.street || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          name="city"
                          value={formData.address.city || ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>State</Label>
                        <Input
                          name="state"
                          value={formData.address.state || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>Pincode</Label>
                        <Input
                          name="pincode"
                          value={formData.address.pincode || ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <Button className="w-full mt-3" onClick={handleSubmit}>
                      {editing ? "Update Agent" : "Add Agent"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-2 mb-4">
              <Search className="text-gray-500" size={18} />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Agent Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Phone</th>
                    <th className="p-2 text-left">Vehicle No</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAgents.map((agent) => (
                    <tr key={agent._id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{agent.agentname}</td>
                      <td className="p-2">{agent.email}</td>
                      <td className="p-2">{agent.phoneNo}</td>
                      <td className="p-2">{agent.vehicleNo}</td>
                      <td className="p-2 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(agent)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setViewAgent(agent)}
                        >
                          View
                        </Button>

                        {/* ✅ Fixed Delete Dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
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
                                permanently delete the agent.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(agent._id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔹 View Details Dialog */}
        {viewAgent && (
          <Dialog open={!!viewAgent} onOpenChange={() => setViewAgent(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Agent Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {viewAgent.agentname}</p>
                <p><strong>Email:</strong> {viewAgent.email}</p>
                <p><strong>Phone:</strong> {viewAgent.phoneNo}</p>
                <p><strong>Vehicle No:</strong> {viewAgent.vehicleNo}</p>
                {viewAgent.address && (
                  <>
                    <p><strong>Street:</strong> {viewAgent.address.street}</p>
                    <p><strong>City:</strong> {viewAgent.address.city}</p>
                    <p><strong>State:</strong> {viewAgent.address.state}</p>
                    <p><strong>Pincode:</strong> {viewAgent.address.pincode}</p>
                  </>
                )}
                <p><strong>Role:</strong> {viewAgent.role}</p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(viewAgent.createdAt).toLocaleString()}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
