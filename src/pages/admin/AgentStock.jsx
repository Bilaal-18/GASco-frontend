import React, { useEffect, useState } from "react";
import axios from "@/config/config";
import Sidebar from "@/components/layout/Sidebar";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog"
import { toast } from "sonner";
import { Edit, Trash2, Plus, FileDown, Receipt } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AgentStock = () => {
  const [stocks, setStocks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [cylinders, setCylinders] = useState([]);
  const [formData, setFormData] = useState({
    agentId: "",
    cylinderId: "",
    quantity: "",
  });
  const [selectedCylinder, setSelectedCylinder] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [filteredStocks, setFilteredStocks] = useState([]);

  const token = localStorage.getItem("token");

  // 🟢 Fetch Stocks
  const fetchStocks = async () => {
    try {
      const res = await axios.get("/api/ListAll", {
        headers: { Authorization: token },
      });
      if (res.data.AgentStock) {
        setStocks(res.data.AgentStock);
        setFilteredStocks(res.data.AgentStock);
      }
    } catch (err) {
      toast.error("Failed to fetch stock data");
    }
  };

  // 🟢 Fetch Agents + Cylinders
  const fetchDropdownData = async () => {
    try {
      const [agentsRes, cylindersRes] = await Promise.all([
        axios.get("/api/distributors", { headers: { Authorization: token } }),
        axios.get("/api/list", { headers: { Authorization: token } }),
      ]);
      setAgents(agentsRes.data);
      setCylinders(cylindersRes.data);
    } catch {
      toast.error("Failed to load agents or cylinders");
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchDropdownData();
  }, []);

  // 🟢 Handle Change
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 🟢 Handle Cylinder Select
  const handleCylinderSelect = (id) => {
    const cylinder = cylinders.find((c) => c._id === id);
    setSelectedCylinder(cylinder);
    setFormData({ ...formData, cylinderId: id });
  };

  // 🟢 Add Stock
  const handleAddStock = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/addStock", formData, {
        headers: { Authorization: token },
      });
      toast.success(res.data.message || "Stock added successfully");
      fetchStocks();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  // 🟡 Update Stock
  const handleUpdateStock = async () => {
    try {
      setLoading(true);
      const { agentId, cylinderId, quantity } = formData;
      const res = await axios.put(
        `/api/updateStock/${agentId}`,
        { cylinderId, quantity },
        { headers: { Authorization: token } }
      );
      toast.success(res.data.message || "Stock updated successfully");
      fetchStocks();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Delete Stock
  const handleDelete = async (agentId, cylinderId) => {
    // if (!window.confirm("Are you sure you want to delete this stock?")) return;
    try {
      const res = await axios.delete(`/api/DeleteStock/${agentId}/${cylinderId}`, {
        headers: { Authorization: token },
      });
      toast.success(res.data.message || "Stock deleted");
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete stock");
    }
  };

  // 🟢 Reset form
  const resetForm = () => {
    setFormData({ agentId: "", cylinderId: "", quantity: "" });
    setSelectedCylinder(null);
    setEditingStock(null);
    setOpen(false);
  };

  // 🟢 Edit Click
  const handleEditClick = (stock) => {
    setEditingStock(stock);
    setFormData({
      agentId: stock.agentId?._id || stock.agentId,
      cylinderId: stock.cylinderId?._id,
      quantity: stock.quantity,
    });
    const cylinder = cylinders.find((c) => c._id === stock.cylinderId?._id);
    setSelectedCylinder(cylinder || null);
    setOpen(true);
  };

  // 🟢 Filter by Agent (Dropdown version)
  const handleAgentSelect = (value) => {
    setSelectedAgent(value);
    if (value === "all") {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(
        (s) => s.agentId?._id === value || s.agentId === value
      );
      setFilteredStocks(filtered);
    }
  };

  // 📄 Full Report for all agents
  const generateReport = () => {
    const doc = new jsPDF();
    doc.text("Agent Stock Report", 14, 16);

    const reportData = filteredStocks.map((s) => [
      typeof s.agentId === "object" ? s.agentId.agentname : s.agentId,
      s.cylinderId?.cylinderType || "N/A",
      s.cylinderId?.weight || "N/A",
      s.cylinderId?.price || "N/A",
      s.quantity,
      s.totalAmount,
    ]);

    autoTable(doc, {
      head: [["Agent", "Cylinder Type", "Weight", "Price", "Quantity", "Total Amount"]],
      body: reportData,
      startY: 25,
    });

    doc.save(`AgentStockReport_${selectedAgent || "All"}.pdf`);
  };

  // 📄 Single Agent Bill Generation
  const generateAgentBill = () => {
    if (selectedAgent === "all") {
      toast.error("Please select an agent to generate their bill.");
      return;
    }

    const agent = agents.find((a) => a._id === selectedAgent);
    const agentStocks = filteredStocks.filter(
      (s) => s.agentId?._id === selectedAgent || s.agentId === selectedAgent
    );
    const totalAmount = agentStocks.reduce(
      (acc, s) => acc + (s.totalAmount || 0),
      0
    );

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GasCo Distribution Pvt Ltd", 14, 18);
    doc.setFontSize(12);
    doc.text("Official Agent Billing Receipt", 14, 26);

    doc.line(14, 28, 195, 28);
    doc.text(`Agent Name: ${agent?.agentname || "N/A"}`, 14, 36);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 36);
    doc.text(`Address: ${agent?.address || "Registered Location"}`, 14, 43);

    const tableData = agentStocks.map((s) => [
      s.cylinderId?.cylinderType || "N/A",
      s.cylinderId?.weight || "-",
      s.cylinderId?.price || "-",
      s.quantity,
      s.totalAmount,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Cylinder Type", "Weight", "Price", "Quantity", "Total"]],
      body: tableData,
    });

    doc.text(`Total Amount Payable: ₹${totalAmount.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text("Thank you for your partnership!", 14, doc.lastAutoTable.finalY + 20);
    doc.text("GasCo Official Seal", 150, doc.lastAutoTable.finalY + 30);

    doc.save(`AgentBill_${agent?.agentname || "Agent"}.pdf`);
  };

  const totalSum = filteredStocks.reduce(
    (acc, s) => acc + (s.totalAmount || 0),
    0
  );

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-6 flex flex-col gap-6 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Agent Stock Management</h2>
          <div className="flex items-center gap-3">
            {/* 🔍 Filter by Agent Dropdown */}
            <Select onValueChange={handleAgentSelect} value={selectedAgent}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filter by Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.agentname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={generateReport} variant="outline" className="flex items-center gap-2">
              <FileDown size={16} /> Full Report
            </Button>

            <Button onClick={generateAgentBill} className="flex items-center gap-2">
              <Receipt size={16} /> Generate Bill
            </Button>

            {/* Existing Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} /> {editingStock ? "Edit Stock" : "Add Stock"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingStock ? "Update Agent Stock" : "Assign Agent Stock"}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  {/* Agent Select */}
                  <Select
                    disabled={!!editingStock}
                    onValueChange={(value) => setFormData({ ...formData, agentId: value })}
                    value={formData.agentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.agentname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Cylinder Select */}
                  <Select
                    disabled={!!editingStock}
                    onValueChange={handleCylinderSelect}
                    value={formData.cylinderId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Cylinder" />
                    </SelectTrigger>
                    <SelectContent>
                      {cylinders.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.cylinderType} ({c.weight}kg)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Cylinder Info */}
                  {selectedCylinder && (
                    <div className="bg-gray-50 border p-3 rounded-md text-sm text-gray-700">
                      <p><strong>Type:</strong> {selectedCylinder.cylinderType}</p>
                      <p><strong>Weight:</strong> {selectedCylinder.weight} kg</p>
                      <p><strong>Price:</strong> ₹{selectedCylinder.price}</p>
                    </div>
                  )}

                  {/* Quantity */}
                  <Input
                    name="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </div>

                <DialogFooter>
                  <Button
                    onClick={editingStock ? handleUpdateStock : handleAddStock}
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
                      : editingStock
                      ? "Update Stock"
                      : "Add Stock"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Agent Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStocks.length === 0 ? (
              <p className="text-gray-500 text-sm">No stock available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Cylinder Type</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => (
                    <TableRow key={stock._id}>
                      <TableCell>
                        {typeof stock.agentId === "object"
                          ? stock?.agentId?.agentname
                          : stock?.agentId}
                      </TableCell>
                      <TableCell>{stock.cylinderId?.cylinderType}</TableCell>
                      <TableCell>{stock.cylinderId?.weight}</TableCell>
                      <TableCell>₹{stock.cylinderId?.price}</TableCell>
                      <TableCell>{stock.quantity}</TableCell>
                      <TableCell>₹{stock.totalAmount}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(stock)}
                          >
                            <Edit size={16} />
                          </Button>
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash2 size={16} /></Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure...! 
                                This action cannot be undone. This will permanently delete the agent.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() =>
                              handleDelete(
                                stock.agentId?._id || stock.agentId,
                                stock.cylinderId?._id
                              )}className="bg-red-600 hover:bg-red-700 text-white">Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex justify-end">
          <Card className="p-4">
            <h3 className="text-lg font-semibold">
              Total Stock Value: ₹{totalSum.toFixed(2)}
            </h3>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentStock;

