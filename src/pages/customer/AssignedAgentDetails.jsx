import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignedAgent } from "@/store/slices/customer/assignedAgentSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AssignedAgentDetails() {
  const dispatch = useDispatch();
  const { agent, loading, error } = useSelector((state) => state.assignedAgent);

  useEffect(() => {
    dispatch(fetchAssignedAgent());
  }, [dispatch]);

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
          <h1 className="text-2xl font-bold mb-4">Assigned Agent</h1>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600">Error: {error}</div>
            </CardContent>
          </Card>
        )}

        {agent ? (
          <Card className="max-w-2xl">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-semibold">{agent.agentname || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div>{agent.email || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div>{agent.phoneNo || "N/A"}</div>
                </div>
                {agent.vehicleNo && (
                  <div>
                    <div className="text-sm text-gray-600">Vehicle Number</div>
                    <div>{agent.vehicleNo}</div>
                  </div>
                )}
                {agent.address && (
                  <>
                    {agent.address.street && (
                      <div>
                        <div className="text-sm text-gray-600">Street</div>
                        <div>{agent.address.street}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {agent.address.city && (
                        <div>
                          <div className="text-sm text-gray-600">City</div>
                          <div>{agent.address.city}</div>
                        </div>
                      )}
                      {agent.address.state && (
                        <div>
                          <div className="text-sm text-gray-600">State</div>
                          <div>{agent.address.state}</div>
                        </div>
                      )}
                    </div>
                    {agent.address.pincode && (
                      <div>
                        <div className="text-sm text-gray-600">Pincode</div>
                        <div>{agent.address.pincode}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          !error && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">No agent assigned yet</div>
              </CardContent>
            </Card>
          )
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
