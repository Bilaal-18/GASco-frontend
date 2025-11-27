import { useEffect, useState } from "react";
import AgentSidebar from "@/components/layout/AgentSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import axios from "@/config/config";
import { toast } from "sonner";
import { getAgentForecast } from "@/services/forecastApi";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Forecast() {
  const [agentId, setAgentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const getAgentId = async () => {
      try {
        const response = await axios.get("/api/account", {
          headers: { Authorization: token },
        });
        
        if (response.data && response.data._id) {
          setAgentId(response.data._id);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      getAgentId();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (agentId) {
      fetchForecast();
    }
  }, [agentId]);

  const fetchForecast = async (refresh = false) => {
    if (!agentId) return;

    try {
      if (refresh) {
        setRefreshing(true);
      }

      const data = await getAgentForecast(agentId, 7, refresh);

      if (data.forecasts && data.forecasts.length > 0) {
        const formattedData = data.forecasts
          .slice(0, 7)
          .map((f) => {
            const date = new Date(f.date);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const fullDate = `${day}/${month}/${date.getFullYear()}`;
            
            return {
              date: fullDate,
              dateShort: `${day}/${month}`,
              expected: f.p50 || 0,
              high: f.p80 || 0,
              peak: f.p95 || 0,
              suggestedStock: f.suggestedStock || 0,
            };
          });
        setForecastData(formattedData);
        
        if (refresh && data.generated) {
          toast.success("Forecast generated successfully!");
        }
      } else {
        setForecastData([]);
        if (data.message) {
          toast.info(data.message);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error("Cannot connect to server. Please check if the backend is running on port 3090.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load forecast. Please try again.");
      }
      
      setForecastData([]);
    } finally {
      setRefreshing(false);
    }
  };

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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">7-Day Demand Forecast</h1>
              <p className="text-sm text-gray-500 mt-1">Next week's predicted demand</p>
            </div>
            <Button
              onClick={() => fetchForecast(true)}
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Forecast
                </>
              )}
            </Button>
          </div>

          {forecastData.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-2">No forecast data available</p>
                  <p className="text-gray-500">
                    Click "Generate Forecast" to create a 7-day demand forecast
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>7-Day Forecast Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastData}>
                        <XAxis dataKey="dateShort" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="suggestedStock" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7-Day Forecast Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Expected Demand</TableHead>
                        <TableHead>High Demand</TableHead>
                        <TableHead>Peak Demand</TableHead>
                        <TableHead>Suggested Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecastData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.date}</TableCell>
                          <TableCell>{item.expected}</TableCell>
                          <TableCell>{item.high}</TableCell>
                          <TableCell>{item.peak}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {item.suggestedStock}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

