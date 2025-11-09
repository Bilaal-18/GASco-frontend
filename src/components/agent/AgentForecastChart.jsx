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

      setForecasts(forecastData.forecasts || []);
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  // ============================================
  // FUNCTION: Format Tooltip Date
  // ============================================
  const formatTooltipDate = (dateString) => {
    const date = new Date(dateString);
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
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-3">
            {formatTooltipDate(label)}
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
  // PREPARE CHART DATA (Only next 7 days)
  // ============================================
  const chartData = forecasts.slice(0, 7).map((forecast) => ({
    date: forecast.date,
    dateLabel: formatDate(forecast.date),
    p50: forecast.p50,
    p80: forecast.p80,
    p95: forecast.p95,
    suggestedStock: forecast.suggestedStock
  }));

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ============================================
          Header Section with Stats
          ============================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Your Next Week's Demand Prediction
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                AI predicts how many cylinders you'll need each day for the next 7 days
              </p>
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Daily Need</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.averageDailyDemand?.toFixed(1) || "0"}
                      </p>
                      <p className="text-xs text-gray-500">cylinders/day</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Highest Day Need</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.maxDailyDemand || "0"}
                      </p>
                      <p className="text-xs text-gray-500">cylinders</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Week Need</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalForecastedDemand?.p50 || "0"}
                      </p>
                      <p className="text-xs text-gray-500">cylinders/week</p>
                    </div>
                    <Package className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recommended Stock</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.totalSuggestedStock || "0"}
                      </p>
                      <p className="text-xs text-gray-500">keep in stock</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Forecast Chart - Daily Bar Chart */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📊 Daily Prediction (Next 7 Days)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              See how many cylinders you'll likely need each day
            </p>
            <ResponsiveContainer width="100%" height={400}>
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
                  style={{ fontSize: "11px" }}
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

          {/* Forecast Legend */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              💡 What This Means
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-600 text-white mt-0.5">Expected Need</Badge>
                <span className="flex-1">The most likely number of cylinders you'll need that day. Based on your past booking patterns.</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-purple-600 text-white mt-0.5">Recommended Stock</Badge>
                <span className="flex-1">How many cylinders you should keep in stock to be safe. Includes a small buffer for unexpected demand.</span>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                <p className="text-xs text-gray-600">
                  <strong>💡 Tip:</strong> Keep your stock close to the "Recommended Stock" level to avoid running out while not overstocking.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================
          Forecast Table
          ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Day-by-Day Breakdown
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Detailed prediction for each day of the next week
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-semibold">Day</th>
                  <th className="p-3 text-right font-semibold">Expected Need</th>
                  <th className="p-3 text-right font-semibold">Keep Stock</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.slice(0, 7).map((forecast, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-blue-50 transition-colors"
                  >
                    <td className="p-3 font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {new Date(forecast.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(forecast.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold">
                        {forecast.p50} cylinders
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Badge className="bg-purple-600 text-white px-3 py-1 text-sm font-semibold">
                        {forecast.suggestedStock} cylinders
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>📌 Remember:</strong> These are predictions based on your past booking patterns. Actual demand may vary slightly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

