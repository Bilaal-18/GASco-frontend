import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPaymentDetails } from "@/store/slices/customer/paymentDetailsSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";

export default function PaymentDetails() {
  const dispatch = useDispatch();
  const { payments, loading, error } = useSelector((state) => state.paymentDetails);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchPaymentDetails());
  }, [dispatch]);

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    return payment.paymentStatus === filter || payment.status === filter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  const getPaymentStatusText = (status) => {
    const statusMap = {
      paid: "Paid",
      pending: "Pending",
      failed: "Failed",
    };
    return statusMap[status?.toLowerCase()] || status || "Pending";
  };

  const getPaymentStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "paid") return "text-green-600";
    if (statusLower === "pending") return "text-yellow-600";
    if (statusLower === "failed") return "text-red-600";
    return "text-gray-600";
  };

  const totalPaid = payments
    .filter((p) => p.paymentStatus === "paid" || p.status === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.paymentStatus === "pending" || p.status === "pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Payment Details</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Payments</div>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm">Pending Payments</div>
              <div className="text-2xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "paid", "pending", "failed"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600">Error: {error}</div>
            </CardContent>
          </Card>
        )}

        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">No payments found</div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>#{payment._id?.slice(-8).toUpperCase()}</TableCell>
                      <TableCell>
                        {payment.bookingId ? `#${payment.bookingId.slice(-8).toUpperCase()}` : "N/A"}
                      </TableCell>
                      <TableCell>₹{payment.amount?.toLocaleString() || 0}</TableCell>
                      <TableCell>{payment.paymentMethod || "N/A"}</TableCell>
                      <TableCell>
                        <span className={getPaymentStatusColor(payment.paymentStatus || payment.status)}>
                          {getPaymentStatusText(payment.paymentStatus || payment.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.createdAt || payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === pageNumber}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.min(totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
