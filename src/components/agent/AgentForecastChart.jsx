// ============================================
// FRONTEND: Agent Forecast Chart Component
// ============================================
// This component displays agent demand forecasts using Recharts
// Shows p50, p80, p95 predictions and suggested stock levels for the next 14 days

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";
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

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading forecast data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-red-600 text-lg mb-2">Error Loading Forecast</p>
            <p className="text-gray-500">{error}</p>
            <Button
              onClick={handleRefresh}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!forecasts || forecasts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No forecast data available</p>
            <Button
              onClick={handleRefresh}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
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

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ============================================
          Header Section - Simplified
          ============================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Next 7 Days Demand Prediction
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                See how many cylinders you'll need each day
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Simple Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Average Daily Need</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.averageDailyDemand || 0)}
                </p>
                <p className="text-xs text-gray-500">cylinders</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Total Week Need</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalForecastedDemand?.p50 || 0}
                </p>
                <p className="text-xs text-gray-500">cylinders</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Recommended Stock</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalSuggestedStock || 0}
                </p>
                <p className="text-xs text-gray-500">cylinders</p>
              </div>
            </div>
          )}

          {/* Forecast Chart - Simplified */}
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

      {/* ============================================
          Forecast Table - Simplified
          ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-right font-semibold">Expected Need</th>
                  <th className="p-3 text-right font-semibold">Recommended Stock</th>
                </tr>
              </thead>
              <tbody>
                {sortedForecasts.slice(0, 7).map((forecast, index) => {
                  // Parse date properly from ISO string format (YYYY-MM-DD)
                  const dateStr = forecast.date;
                  let date;
                  
                  if (typeof dateStr === 'string') {
                    // Parse ISO date string (YYYY-MM-DD) - split to avoid timezone issues
                    const parts = dateStr.split('T')[0].split('-');
                    if (parts.length === 3) {
                      // Create date in local timezone using year, month, day
                      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                      date = new Date(dateStr);
                    }
                  } else {
                    date = new Date(dateStr);
                  }
                  
                  // Validate date - if invalid, log error but don't calculate from today
                  // Use the actual date from forecast data
                  if (isNaN(date.getTime())) {
                    console.error("Invalid date in forecast:", dateStr, "at index:", index);
                    // Only fallback to today if date is completely invalid
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    date = new Date(today);
                    date.setDate(today.getDate() + index + 1);
                  }
                  
                  return (
                    <tr
                      key={index}
                      className="border-t hover:bg-blue-50 transition-colors"
                    >
                      <td className="p-3 font-medium">
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold">
                          {forecast.p50 || 0}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Badge className="bg-purple-600 text-white px-3 py-1 text-sm font-semibold">
                          {forecast.suggestedStock || 0}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

