import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignedAgent } from "@/store/slices/customer/assignedAgentSlice";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Phone, Mail, MapPin, Loader2, AlertCircle } from "lucide-react";

export default function AssignedAgentDetails() {
  const dispatch = useDispatch();
  const { agent, loading, error } = useSelector((state) => state.assignedAgent);

  useEffect(() => {
    dispatch(fetchAssignedAgent());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <CustomerSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <CustomerSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-blue-600" />
            Assigned Agent Details
          </h1>
          <p className="text-gray-600">Contact information for your assigned gas delivery agent</p>
        </div>

        {error && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {agent ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                  Agent Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Agent Name</p>
                  <p className="text-xl font-semibold text-gray-800">{agent.agentname || "N/A"}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </p>
                  <p className="font-medium text-gray-800">{agent.email || "N/A"}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </p>
                  <p className="font-medium text-gray-800">{agent.phoneNo || "N/A"}</p>
                </div>
                {agent.vehicleNo && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Vehicle Number</p>
                    <Badge variant="outline" className="text-base px-3 py-1">{agent.vehicleNo}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {agent.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agent.address.street && (
                    <p>
                      <span className="font-semibold">Street:</span> {agent.address.street}
                    </p>
                  )}
                  {agent.address.city && (
                    <p>
                      <span className="font-semibold">City:</span> {agent.address.city}
                    </p>
                  )}
                  {agent.address.state && (
                    <p>
                      <span className="font-semibold">State:</span> {agent.address.state}
                    </p>
                  )}
                  {agent.address.pincode && (
                    <p>
                      <span className="font-semibold">Pincode:</span> {agent.address.pincode}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          !error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg">No agent assigned yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Please contact admin to get an agent assigned
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
