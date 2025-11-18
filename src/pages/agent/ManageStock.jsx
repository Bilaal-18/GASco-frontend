import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import axios from "@/config/config";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ManageStock() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStock, setNewStock] = useState({ cylinderId: "", quantity: "", remarks: "" });
  const [agentId, setAgentId] = useState(null);
  const [cylinders, setCylinders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const token = localStorage.getItem("token");

  
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await axios.get("/api/account", { headers: { Authorization: token } });
        setAgentId(res.data._id);
      } catch (err) {
        console.error("Error fetching agent data:", err);
      }
    };
    fetchAgent();
  }, [token]);

  
  useEffect(() => {
    const fetchCylinders = async () => {
      try {
        const res = await axios.get("/api/list", { headers: { Authorization: token } });
        setCylinders(res.data || []);
      } catch (err) {
        console.error("Error fetching cylinders:", err);
      }
    };
    if (token) {
      fetchCylinders();
    }
  }, [token]);

  
  useEffect(() => {
    const fetchStocks = async () => {
      if (!agentId) return;
      try {
        const res = await axios.get(`/api/ownStock/${agentId}`, { headers: { Authorization: token } });
        setStocks(res.data.Ownstock || []);
        console.log(res);
      } catch (err) {
        console.error("Error fetching stock data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [agentId, token]);


  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("/api/gasRequests/my", { headers: { Authorization: token } });
        setRequests(res.data.requests || []);
      } catch (err) {
        console.error("Error fetching gas requests:", err);
      }
    };
    fetchRequests();
  }, [token]);


  const handleRequestGas = async () => {
    if (!agentId) {
      toast.error("Agent ID not found. Please refresh the page.");
      return;
    }
    
    if (!newStock.cylinderId) {
      toast.error("Please select a cylinder type");
      return;
    }
    
    if (!newStock.quantity || newStock.quantity <= 0) {
      toast.error("Please enter a valid quantity (greater than 0)");
      return;
    }

    const parsedQuantity = parseInt(newStock.quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Please enter a valid quantity (must be a positive number)");
      return;
    }

    try {
      const requestData = {
        cylinderId: newStock.cylinderId,
        quantity: parsedQuantity,
        remarks: newStock.remarks || ""
      };

      const res = await axios.post("/api/gasRequest", requestData, { 
        headers: { Authorization: token } 
      });
      
      toast.success(res.data.message || "Gas request submitted successfully");
      setOpenDialog(false);
      setNewStock({ cylinderId: "", quantity: "", remarks: "" });
      
      const requestsRes = await axios.get("/api/gasRequests/my", { 
        headers: { Authorization: token } 
      });
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.error("Error submitting gas request:", err);
      let errorMessage = "Failed to submit gas request";
      
      if (err.response) {
        const responseData = err.response.data;
        if (responseData.details && Array.isArray(responseData.details)) {
          errorMessage = responseData.details
            .map(d => d.message || d.msg || (typeof d === 'string' ? d : JSON.stringify(d)))
            .join(", ");
        } 
        else if (responseData.error) {
          if (typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if (typeof responseData.error === 'object') {
            errorMessage = JSON.stringify(responseData.error);
          } else {
            errorMessage = String(responseData.error);
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } 
      else if (err.request) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
  };


  const handleDelete = async (stock) => {
    if (!confirm("Are you sure you want to return this stock?")) return;
    if (!agentId) {
      toast.error("Agent ID not found");
      return;
    }
    try {
      const cylinderId = stock.cylinderId?._id || stock.cylinderId;
      await axios.delete(`/api/DeleteStock/${agentId}/${cylinderId}`, { 
        headers: { Authorization: token } 
      });
      toast.success("Stock returned successfully");
      const res = await axios.get(`/api/ownStock/${agentId}`, { 
        headers: { Authorization: token } 
      });
      setStocks(res.data.Ownstock || []);
    } catch (err) {
      console.error("Error returning stock:", err);
      const errorMessage = err.response?.data?.error || "Failed to return stock";
      toast.error(errorMessage);
    }
  };

  if (loading || !agentId) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading stock data...</div>;
  }

  return (
    <SidebarProvider>
      <AgentSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">My Stock</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowRequests(!showRequests)} variant="outline">
              {showRequests ? "Hide Requests" : "View Requests"}
            </Button>
            <Button onClick={() => setOpenDialog(true)}>Request Gas</Button>
          </div>
        </div>

        {showRequests && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-sm mb-4">My Gas Requests</div>
              {requests.length === 0 ? (
                <div className="text-center py-4">No requests found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Cylinder</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Admin Response</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell>{request.cylinderId?.cylinderName}</TableCell>
                          <TableCell>{request.cylinderId?.cylinderType || "N/A"}</TableCell>
                          <TableCell>{request.cylinderId?.weight || "N/A"} kg</TableCell>
                          <TableCell>₹{request.cylinderId?.price || "N/A"}</TableCell>
                          <TableCell>{request.quantity || 0}</TableCell>
                          <TableCell>{request.status || "N/A"}</TableCell>
                          <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {request.status === "rejected" && request.remarks
                              ? request.remarks
                              : request.status === "approved"
                              ? "Approved"
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
  {stocks.length === 0 ? (
    <p className="text-center text-muted-foreground col-span-full">No stock available</p>
  ) : (
    stocks.map((item) => {
      const totalValue = item.totalAmount || (item.quantity * item.price);

      return (
        <Card
          key={item._id}
          className="p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
        >
          <CardContent className="space-y-4">

            {/* Cylinder Title */}
            <div>
              <h2 className="text-lg font-bold">
                {item.cylinderId?.cylinderName ||"Cylinder"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {item.cylinderId?.cylinderType || "Unknown Type"}
              </p>
            </div>

            {/* Item Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{item.quantity}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">₹{item.cylinderId?.price.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold text-primary">₹{totalValue.toLocaleString()}</span>
              </div>

            
            </div>

            {/* Return Button */}
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={() => handleDelete(item)}  // same function you used before
            >
              Return Stock
            </Button>
          </CardContent>
        </Card>
      );
    })
  )}
</div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Gas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cylinder Type</Label>
                <Select
                  onValueChange={(value) => setNewStock({ ...newStock, cylinderId: value })}
                  value={newStock.cylinderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Cylinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {cylinders.map((cylinder) => (
                      <SelectItem key={cylinder._id} value={cylinder._id}>
                       {cylinder.cylinderName} {cylinder.cylinderType} ({cylinder.weight}kg) - ₹{cylinder.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newStock.quantity}
                  onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                  placeholder="Quantity"
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <Input
                  value={newStock.remarks}
                  onChange={(e) => setNewStock({ ...newStock, remarks: e.target.value })}
                  placeholder="Remarks"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestGas}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
