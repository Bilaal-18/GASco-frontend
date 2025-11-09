import axios from "@/config/config";

/**
 * Forecast API Service
 * Handles API calls for agent demand forecasting
 */

/**
 * Get forecast for a specific agent
 * 
 * @param {string} agentId - MongoDB ObjectId of the agent
 * @param {number} horizon - Number of days to forecast (default: 14, range: 7-14)
 * @returns {Promise<Object>} Forecast data with forecasts array
 */
export const getAgentForecast = async (agentId, horizon = 14) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`/api/agents/${agentId}/forecast`, {
      params: {
        horizon: horizon
      },
      headers: {
        Authorization: token
      }
    });

    return response.data;
  } catch (error) {
    // Handle 404 and other "not found" errors gracefully
    // Return empty forecast instead of throwing error
    const status = error.response?.status;
    const isNotFound = status === 404 || 
                       (error.response?.data?.error && 
                        error.response.data.error.toLowerCase().includes('not found'));
    
    if (isNotFound) {
      // Silently handle 404 - this is expected when no forecasts exist yet
      return {
        message: 'No forecasts found. Click refresh to generate forecasts.',
        agentId: agentId,
        horizon: horizon,
        forecasts: [],
        generated: false,
        lastUpdatedAt: null,
        refreshed: false
      };
    }
    
    // Only log and throw for unexpected errors (not 404)
    console.error("Error fetching agent forecast (non-404 error):", error);
    throw error;
  }
};

/**
 * Get forecast statistics for a specific agent
 * 
 * @param {string} agentId - MongoDB ObjectId of the agent
 * @param {number} horizon - Number of days to forecast (default: 14)
 * @returns {Promise<Object>} Forecast statistics
 */
export const getAgentForecastStats = async (agentId, horizon = 14) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`/api/agents/${agentId}/forecast/stats`, {
      params: {
        horizon: horizon
      },
      headers: {
        Authorization: token
      }
    });

    return response.data;
  } catch (error) {
    // Handle 404 and other "not found" errors gracefully
    // Return empty stats instead of throwing error
    const status = error.response?.status;
    const isNotFound = status === 404 || 
                       (error.response?.data?.error && 
                        error.response.data.error.toLowerCase().includes('not found'));
    
    if (isNotFound) {
      // Silently handle 404 - this is expected when no forecasts exist yet
      return {
        agentId: agentId,
        horizon: horizon,
        stats: {
          totalDays: 0,
          averageDailyDemand: 0,
          maxDailyDemand: 0,
          minDailyDemand: 0,
          totalForecastedDemand: {
            p50: 0,
            p80: 0,
            p95: 0
          },
          totalSuggestedStock: 0
        },
        forecasts: [],
        message: 'No forecasts found. Click refresh to generate forecasts.'
      };
    }
    
    // Only log and throw for unexpected errors (not 404)
    console.error("Error fetching agent forecast stats (non-404 error):", error);
    throw error;
  }
};




