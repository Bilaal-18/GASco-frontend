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

export default function GasRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialog, setRejectDialog] = useState({ open: false, requestId: null });
  const [rejectRemarks, setRejectRemarks] = useState("");
  const token = localStorage.getItem("token");

  
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

  
  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

  
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

  const getStatusText = (status) => {
    return status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected";
  };

  const getStatusColor = (status) => {
    return status === "pending" ? "text-yellow-600" : status === "approved" ? "text-green-600" : "text-red-600";
  };

  if (loading) {
    return (
      <SidebarProvider>
        <Sidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Loading gas requests...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Gas Requests</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Cylinder Type</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{request.agentId?.agentname || "N/A"}</TableCell>
                    <TableCell>{request.cylinderId?.cylinderType || "N/A"}</TableCell>
                    <TableCell>{request.cylinderId?.weight} kg</TableCell>
                    <TableCell>₹{request.cylinderId?.price}</TableCell>
                    <TableCell className="font-semibold">{request.quantity}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(request.status)}>
                        {getStatusText(request.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(request._id)}
                            variant="outline"
                            size="sm"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              setRejectDialog({ open: true, requestId: request._id })
                            }
                            variant="destructive"
                            size="sm"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <Label>Remarks</Label>
                <Input
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Remarks"
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
      </SidebarInset>
    </SidebarProvider>
  );
}

