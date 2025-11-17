// ============================================
// FRONTEND: Agent Forecast Chart Component
// ============================================
// This component displays agent demand forecasts using Recharts
// Shows p50, p80, p95 predictions and suggested stock levels for the next 14 days

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { getAgentForecast, getAgentForecastStats } from "@/services/forecastApi";
import { toast } from "sonner";

/**
 * AgentForecastChart Component
 * 
 * @param {string} agentId - MongoDB ObjectId of the agent
 * @param {number} horizon - Number of days to forecast (default: 14)
 */
export default function AgentForecastChart({ agentId, horizon = 14 }) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [forecasts, setForecasts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // USE EFFECT: Fetch Forecast Data
  // ============================================
  useEffect(() => {
    if (agentId) {
      fetchForecastData();
    }
  }, [agentId, horizon]);

  // ============================================
  // FUNCTION: Fetch Forecast Data
  // ============================================
  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both forecast and stats in parallel
      // These functions now handle 404s gracefully and return empty data instead of throwing
      const results = await Promise.allSettled([
        getAgentForecast(agentId, horizon),
        getAgentForecastStats(agentId, horizon)
      ]);
      
      // Extract data from results - handle both fulfilled and rejected promises
      const forecastResult = results[0];
      const statsResult = results[1];
      
      const forecastData = forecastResult.status === 'fulfilled' 
        ? forecastResult.value 
        : {
            forecasts: [],
            generated: false,
            message: 'No forecasts found. Click refresh to generate forecasts.'
          };
      
      const statsData = statsResult.status === 'fulfilled'
        ? statsResult.value
        : {
            stats: {
              totalDays: 0,
              averageDailyDemand: 0,
              maxDailyDemand: 0,
              minDailyDemand: 0,
              totalForecastedDemand: { p50: 0, p80: 0, p95: 0 },
              totalSuggestedStock: 0
            },
            forecasts: []
          };

      // Sort forecasts by date (chronologically - earliest to latest)
      const sortedForecasts = (forecastData.forecasts || []).sort((a, b) => {
        const dateA = a.date ? new Date(a.date.split('T')[0]) : new Date(0);
        const dateB = b.date ? new Date(b.date.split('T')[0]) : new Date(0);
        return dateA - dateB;
      });
      
      setForecasts(sortedForecasts);
      setStats(statsData.stats || null);

      // Show success message if forecast was just generated
      if (forecastData.generated) {
        toast.success("Fresh forecast generated successfully");
      } else if ((forecastData.forecasts || []).length === 0) {
        // Only show info message, not error, when no forecasts exist
        console.log("No forecasts available. User can click refresh to generate.");
      }
    } catch (err) {
      // This catch should rarely trigger now since we handle 404s in the API service
      console.error("Unexpected error fetching forecast data:", err);
      setError(err?.response?.data?.error || "Failed to fetch forecast data");
      // Don't show error toast for empty forecasts - it's a valid state
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.error || "Failed to fetch forecast data");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCTION: Refresh Forecast
  // ============================================
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Force refresh by adding timestamp to cache bust
      await fetchForecastData();
      toast.success("Forecast refreshed");
    } catch (err) {
      toast.error("Failed to refresh forecast");
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================
  // FUNCTION: Format Date for Display
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    let date;
    
    // Backend sends dates as ISO strings (YYYY-MM-DD)
    if (typeof dateString === 'string') {
      // Parse ISO date string (YYYY-MM-DD) properly
      // Split and create date to avoid timezone issues
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        // Create date in local timezone (not UTC)
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        // Fallback to standard parsing
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "Invalid Date";
    }
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  // ============================================
  // FUNCTION: Format Tooltip Date
  // ============================================
  const formatTooltipDate = (dateString) => {
    if (!dateString) return "N/A";
    
    let date;
    if (typeof dateString === 'string') {
      // Parse ISO date string (YYYY-MM-DD) properly
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // ============================================
  // CUSTOM TOOLTIP COMPONENT
  // ============================================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Get the actual date from the payload data
      const dataPoint = payload[0]?.payload;
      const actualDate = dataPoint?.date || label;
      
      // Format the actual date properly
      let formattedDate = "N/A";
      if (actualDate) {
        if (typeof actualDate === 'string') {
          // Parse ISO date string (YYYY-MM-DD)
          const parts = actualDate.split('T')[0].split('-');
          if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              });
            }
          }
        } else if (dataPoint?.dateObj) {
          // Use the date object if available
          formattedDate = dataPoint.dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        }
      }
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-3">
            {formattedDate}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </p>
              <p className="text-lg font-bold" style={{ color: entry.color }}>
                {entry.value} cylinders
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Error Loading Forecast</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No forecast data available</p>
            <Button onClick={handleRefresh} variant="outline">
              Generate Forecast
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // PREPARE CHART DATA (Only next 7 days, sorted by date)
  // ============================================
  // Ensure forecasts are sorted by date before slicing
  const sortedForecasts = [...forecasts].sort((a, b) => {
    const dateA = a.date ? new Date(a.date.split('T')[0]) : new Date(0);
    const dateB = b.date ? new Date(b.date.split('T')[0]) : new Date(0);
    return dateA - dateB;
  });
  
  const chartData = sortedForecasts.slice(0, 7).map((forecast, index) => {
    // Parse date properly from ISO string format (YYYY-MM-DD)
    let date;
    const dateStr = forecast.date;
    
    if (typeof dateStr === 'string') {
      // Parse ISO date string (YYYY-MM-DD) - split to avoid timezone issues
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        // Create date in local timezone
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }
    
    // If date is still invalid, calculate from today
    if (isNaN(date.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date = new Date(today);
      date.setDate(today.getDate() + index + 1);
    }
    
    // Format date label for chart
    const dateLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    
    return {
      date: dateStr,
      dateLabel: dateLabel,
      dateObj: date, // Store date object for tooltip
      p50: forecast.p50 || 0,
      p80: forecast.p80 || 0,
      p95: forecast.p95 || 0,
      suggestedStock: forecast.suggestedStock || 0
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Next 7 Days Forecast</div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm">Average Daily Need</div>
                  <div className="text-2xl font-bold">{Math.round(stats.averageDailyDemand || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm">Total Week Need</div>
                  <div className="text-2xl font-bold">{stats.totalForecastedDemand?.p50 || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm">Recommended Stock</div>
                  <div className="text-2xl font-bold">{stats.totalSuggestedStock || 0}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="dateLabel"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="p50" 
                  fill="#3b82f6" 
                  name="Expected Need"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="suggestedStock" 
                  fill="#8b5cf6" 
                  name="Recommended Stock"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 font-semibold">Daily Breakdown</div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Expected Need</TableHead>
                  <TableHead>Recommended Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedForecasts.slice(0, 7).map((forecast, index) => {
                  const dateStr = forecast.date;
                  let date;
                  
                  if (typeof dateStr === 'string') {
                    const parts = dateStr.split('T')[0].split('-');
                    if (parts.length === 3) {
                      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                      date = new Date(dateStr);
                    }
                  } else {
                    date = new Date(dateStr);
                  }
                  
                  if (isNaN(date.getTime())) {
                    console.error("Invalid date in forecast:", dateStr, "at index:", index);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    date = new Date(today);
                    date.setDate(today.getDate() + index + 1);
                  }
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell>{forecast.p50 || 0}</TableCell>
                      <TableCell>{forecast.suggestedStock || 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

