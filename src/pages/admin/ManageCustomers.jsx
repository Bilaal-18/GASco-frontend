import { useEffect, useState } from "react";
import axios from "@/config/config";
import Sidebar from "@/components/layout/SideBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNo: "",
    password: "",
    agent: "",
    address: { street: "", city: "", state: "", pincode: "" },
  });

  const SEARCH_ENDPOINT = (role) => `/api/search/${role}`;

  // --------------- FETCH FULL CUSTOMER LIST ---------------
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/customers", {
        headers: { Authorization: token },
      });

      const data =
        res.data.customers ||
        res.data.customer ||
        res.data.Users ||
        res.data.list ||
        res.data ||
        [];

      setCustomers(Array.isArray(data) ? data : []);
      setFilteredCustomers(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  // --------------- FETCH AGENTS ---------------
  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/distributors", {
        headers: { Authorization: token },
      });
      setAgents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch agents");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchAgents();
  }, []);

  // --------------- SERVER SEARCH LOGIC ---------------
  const handleSearch = async (value) => {
    setSearch(value);
    setCurrentPage(1);

    if (!value.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    try {
      const res = await axios.get(SEARCH_ENDPOINT("customer"), {
        params: {
          search: value.trim(),
          page: 1,
          limit: itemsPerPage,
        },
        headers: { Authorization: token },
      });

      const data =
        res.data?.users ||
        res.data?.results ||
        res.data?.data ||
        res.data?.list ||
        res.data ||
        [];

      setFilteredCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Customer search failed:", err);
      toast.error(err.response?.data?.error || "Failed to search customers");
    }
  };

  // --------------- PAGINATION ---------------
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // --------------- CRUD HANDLERS ---------------
  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      username: "",
      email: "",
      phoneNo: "",
      password: "",
      agent: "",
      address: { street: "", city: "", state: "", pincode: "" },
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      username: customer.username,
      email: customer.email,
      phoneNo: customer.phoneNo,
      agent: customer.agent?._id || customer.agent || "",
      address: customer.address || { street: "", city: "", state: "", pincode: "" },
    });
    setFormDialogOpen(true);
  };

  const handleDelete = async (customerId) => {
    try {
      await axios.delete(`/api/remove/${customerId}`, {
        headers: { Authorization: token },
      });
      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.email || !formData.phoneNo)
      return toast.error("All fields required");

    if (!editingCustomer && !formData.password)
      return toast.error("Password required for new user");

    if (!formData.agent) return toast.error("Select an agent");

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      phoneNo: formData.phoneNo,
      agent: formData.agent,
      address: formData.address,
      role: "customer",
      ...(formData.password && { password: formData.password }),
    };

    try {
      if (editingCustomer) {
        await axios.put(`/api/updateCustomer/${editingCustomer._id}`, payload, {
          headers: { Authorization: token },
        });
        toast.success("Customer updated successfully");
      } else {
        await axios.post("/api/register", payload);
        toast.success("Customer added successfully");
      }

      setFormDialogOpen(false);
      fetchCustomers();

    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold mb-4">Manage Customers</h1>

          <Card>
            <CardContent className="p-4">

              {/* Search + Add */}
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={handleAdd}>Add Customer</Button>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>
                  ) : paginatedCustomers.length === 0 ? (
                    <TableRow><TableCell colSpan="5" className="text-center">No customers found</TableCell></TableRow>
                  ) : (
                    paginatedCustomers.map((cust) => (
                      <TableRow key={cust._id}>
                        <TableCell>{cust.username}</TableCell>
                        <TableCell>{cust.email}</TableCell>
                        <TableCell>{cust.phoneNo}</TableCell>
                        <TableCell>{cust.agent?.agentname || "Unassigned"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" onClick={() => handleView(cust)} variant="outline">View</Button>
                          <Button size="sm" onClick={() => handleEdit(cust)} variant="outline">Edit</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cust._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredCustomers.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                  </p>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {(() => {
                        const pages = [];
                        let lastPage = 0;
                        
                        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            if (pageNum > lastPage + 1) {
                              pages.push(
                                <PaginationItem key={`ellipsis-${lastPage}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            pages.push(
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(pageNum);
                                  }}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                            lastPage = pageNum;
                          }
                        }
                        
                        return pages;
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
