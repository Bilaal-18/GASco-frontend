import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Edit3, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import axios from "@/config/config";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

  // Fetch agent data first to get agent ID
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

  // Fetch cylinders for dropdown
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

  // Fetch all stocks
  useEffect(() => {
    const fetchStocks = async () => {
      if (!agentId) return;
      try {
        const res = await axios.get(`/api/ownStock/${agentId}`, { headers: { Authorization: token } });
        setStocks(res.data.Ownstock || []);
      } catch (err) {
        console.error("Error fetching stock data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [agentId, token]);

  // Fetch gas requests
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

  // Handle gas request creation
  const handleRequestGas = async () => {
    if (!agentId) {
      toast.error("Agent ID not found. Please refresh the page.");
      return;
    }
    
    // Validate inputs
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
      
      // Refresh requests list
      const requestsRes = await axios.get("/api/gasRequests/my", { 
        headers: { Authorization: token } 
      });
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.error("Error submitting gas request:", err);
      let errorMessage = "Failed to submit gas request";
      
      // Check if it's an axios error with response
      if (err.response) {
        const responseData = err.response.data;
        
        // If there are validation details, extract them
        if (responseData.details && Array.isArray(responseData.details)) {
          errorMessage = responseData.details
            .map(d => d.message || d.msg || (typeof d === 'string' ? d : JSON.stringify(d)))
            .join(", ");
        } 
        // Otherwise use the error message
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
      // Handle network errors, timeouts, or other axios errors
      else if (err.request) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Handle delete
  const handleDelete = async (stock) => {
    if (!confirm("Are you sure you want to delete this stock?")) return;
    if (!agentId) {
      toast.error("Agent ID not found");
      return;
    }
    try {
      const cylinderId = stock.cylinderId?._id || stock.cylinderId;
      await axios.delete(`/api/DeleteStock/${agentId}/${cylinderId}`, { 
        headers: { Authorization: token } 
      });
      toast.success("Stock deleted successfully");
      // Refresh stock list
      const res = await axios.get(`/api/ownStock/${agentId}`, { 
        headers: { Authorization: token } 
      });
      setStocks(res.data.Ownstock || []);
    } catch (err) {
      console.error("Error deleting stock:", err);
      const errorMessage = err.response?.data?.error || "Failed to delete stock";
      toast.error(errorMessage);
    }
  };

  if (loading || !agentId) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading stock data...</div>;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Manage Stock
          </h1>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowRequests(!showRequests)} 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              {showRequests ? "Hide Requests" : "View Requests"}
            </Button>
            <Button onClick={() => setOpenDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Request Gas
            </Button>
          </div>
        </div>

        {/* Gas Requests Section */}
        {showRequests && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Gas Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500">No gas requests found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {requests.map((request) => {
                  const statusIcons = {
                    pending: <Clock className="w-4 h-4 text-yellow-600" />,
                    approved: <CheckCircle className="w-4 h-4 text-green-600" />,
                    rejected: <XCircle className="w-4 h-4 text-red-600" />
                  };
                  const statusColors = {
                    pending: "bg-yellow-50 border-yellow-200",
                    approved: "bg-green-50 border-green-200",
                    rejected: "bg-red-50 border-red-200"
                  };
                  
                  return (
                    <Card key={request._id} className={`${statusColors[request.status]} shadow-md`}>
                      <CardHeader>
                        <CardTitle className="text-gray-700 flex justify-between items-center">
                          {request.cylinderId?.cylinderType || "Cylinder"}
                          {statusIcons[request.status]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">Weight: {request.cylinderId?.weight} kg</p>
                        <p className="text-gray-600">Price: ₹{request.cylinderId?.price}</p>
                        <p className="text-lg font-semibold mt-2">
                          Quantity: <span className="text-blue-600">{request.quantity}</span>
                        </p>
                        <p className="text-sm mt-2">
                          Status: <span className={`font-semibold ${
                            request.status === "pending" ? "text-yellow-600" :
                            request.status === "approved" ? "text-green-600" :
                            "text-red-600"
                          }`}>{request.status.toUpperCase()}</span>
                        </p>
                        {request.remarks && (
                          <p className="text-sm text-gray-500 mt-2">Remarks: {request.remarks}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stock Cards */}
        {stocks.length === 0 ? (
          <p className="text-gray-500 text-center">No stock available. Add new stock to begin.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stocks.map((stock) => (
              <Card key={stock._id} className="shadow-md hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-gray-700 flex justify-between items-center">
                    {stock.cylinderId?.cylinderType || "Cylinder"}
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-50">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(stock)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Weight: {stock.cylinderId?.weight} kg</p>
                  <p className="text-gray-600">Price: ₹{stock.cylinderId?.price}</p>
                  <p className="text-lg font-semibold mt-2">
                    Quantity: <span className="text-blue-600">{stock.quantity}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Request Gas Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Gas from Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Cylinder Type</Label>
                <Select
                  onValueChange={(value) => setNewStock({ ...newStock, cylinderId: value })}
                  value={newStock.cylinderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Cylinder Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cylinders.map((cylinder) => (
                      <SelectItem key={cylinder._id} value={cylinder._id}>
                        {cylinder.cylinderType} ({cylinder.weight}kg) - ₹{cylinder.price}
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
                  placeholder="Enter Quantity"
                />
              </div>
              <div>
                <Label>Remarks (Optional)</Label>
                <Input
                  value={newStock.remarks}
                  onChange={(e) => setNewStock({ ...newStock, remarks: e.target.value })}
                  placeholder="Any additional notes for admin"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestGas} className="bg-blue-600 hover:bg-blue-700">
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
