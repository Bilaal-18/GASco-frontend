import { useEffect, useState } from "react";
import axios from "@/config/config";
import Sidebar from "@/components/layout/SideBar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Filter, Search } from "lucide-react";

export default function GasRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialog, setRejectDialog] = useState({ open: false, requestId: null });
  const [rejectRemarks, setRejectRemarks] = useState("");
  const token = localStorage.getItem("token");

  // Fetch all gas requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/gasRequests", {
        headers: { Authorization: token },
      });
      setRequests(res.data.requests || []);
      setFilteredRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching gas requests:", err);
      toast.error("Failed to fetch gas requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on status and search term
  useEffect(() => {
    let filtered = requests;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search term (agent name, cylinder type)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.agentId?.agentname?.toLowerCase().includes(search) ||
          req.cylinderId?.cylinderType?.toLowerCase().includes(search) ||
          req.cylinderId?.cylinderName?.toLowerCase().includes(search)
      );
    }

    setFilteredRequests(filtered);
  }, [statusFilter, searchTerm, requests]);

  // Handle approve request
  const handleApprove = async (requestId) => {
    try {
      const res = await axios.put(
        `/api/gasRequest/approve/${requestId}`,
        {},
        { headers: { Authorization: token } }
      );
      toast.success(res.data.message || "Request approved successfully");
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      toast.error(err.response?.data?.error || "Failed to approve request");
    }
  };

  // Handle reject request
  const handleReject = async () => {
    if (!rejectDialog.requestId) return;

    try {
      const res = await axios.put(
        `/api/gasRequest/reject/${rejectDialog.requestId}`,
        { remarks: rejectRemarks },
        { headers: { Authorization: token } }
      );
      toast.success(res.data.message || "Request rejected successfully");
      setRejectDialog({ open: false, requestId: null });
      setRejectRemarks("");
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error(err.response?.data?.error || "Failed to reject request");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      ),
      approved: (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      ),
      rejected: (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 max-w-[calc(100%-16rem)] p-8 flex items-center justify-center">
          <p className="text-gray-500">Loading gas requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="p-8 ml-64 max-w-[calc(100%-16rem)]">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">
            Gas Requests Management
          </h1>
          <p className="text-gray-600">
            View and manage gas requests from agents
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by agent name or cylinder type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {requests.length === 0
                  ? "No gas requests found."
                  : "No requests match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card
                key={request._id}
                className={`shadow-md transition ${
                  request.status === "pending"
                    ? "border-l-4 border-yellow-500"
                    : request.status === "approved"
                    ? "border-l-4 border-green-500"
                    : "border-l-4 border-red-500"
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {request.cylinderId?.cylinderType || "Cylinder"}
                    </CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Agent Name</p>
                    <p className="font-semibold">
                      {request.agentId?.agentname || "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-semibold">
                        {request.cylinderId?.weight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-semibold">
                        ₹{request.cylinderId?.price}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity Requested</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {request.quantity}
                    </p>
                  </div>
                  {request.remarks && (
                    <div>
                      <p className="text-sm text-gray-500">Remarks</p>
                      <p className="text-sm italic">{request.remarks}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Requested:{" "}
                    {new Date(request.requestedAt).toLocaleString()}
                  </div>
                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleApprove(request._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          setRejectDialog({ open: true, requestId: request._id })
                        }
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {request.status === "rejected" && request.remarks && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                      <p className="text-red-700">
                        <strong>Rejection reason:</strong> {request.remarks}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialog.open}
          onOpenChange={(open) =>
            setRejectDialog({ open, requestId: open ? rejectDialog.requestId : null })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Gas Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Rejection Remarks (Optional)</Label>
                <Input
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Enter reason for rejection"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialog({ open: false, requestId: null });
                  setRejectRemarks("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleReject} variant="destructive">
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

