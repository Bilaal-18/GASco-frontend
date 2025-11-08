import { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import AgentForecastChart from "@/components/agent/AgentForecastChart";
import axios from "@/config/config";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * Agent Forecast Page
 * Displays demand forecast for the logged-in agent
 */
export default function Forecast() {
  const [agentId, setAgentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAgentId = async () => {
      try {
        // Get agent ID from account endpoint
        const response = await axios.get("/api/account", {
          headers: { Authorization: token },
        });
        
        // The account endpoint returns the user data with _id
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
      <div className="flex bg-gray-50 min-h-screen">
        <AgentSidebar />
        <div className="flex-1 ml-64 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!agentId) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <AgentSidebar />
        <div className="flex-1 ml-64 p-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-red-600 text-lg">Error: Agent ID not found</p>
                <p className="text-gray-500 mt-2">Please try logging in again</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AgentSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📊 Demand Prediction
          </h1>
          <p className="text-gray-600">
            AI-powered forecast showing how many cylinders you'll need for the next 7 days
          </p>
        </div>
        <AgentForecastChart agentId={agentId} horizon={7} />
      </div>
    </div>
  );
}

