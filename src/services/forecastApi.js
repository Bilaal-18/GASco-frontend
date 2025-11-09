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
    console.error("Error fetching agent forecast:", error);
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
    console.error("Error fetching agent forecast stats:", error);
    throw error;
  }
};




