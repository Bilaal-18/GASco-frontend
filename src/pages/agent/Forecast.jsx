import { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AgentForecastChart from "@/components/agent/AgentForecastChart";
import axios from "@/config/config";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";


export default function Forecast() {
  const [agentId, setAgentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAgentId = async () => {
      try {
        const response = await axios.get("/api/account", {
          headers: { Authorization: token },
        });
        
    
        if (response.data && response.data._id) {
          setAgentId(response.data._id);
        } else {
          console.error("Agent ID not found in account data");
        }
      } catch (error) {
        console.error("Error fetching agent ID:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAgentId();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!agentId) {
    return (
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <div className="p-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-red-600 text-lg">Error: Agent ID not found</p>
                  <p className="text-gray-500 mt-2">Please try logging in again</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AgentSidebar />
      <SidebarInset>
        <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Demand Forecast</h1>
        </div>
        <AgentForecastChart agentId={agentId} horizon={7} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

