import axios from "@/config/config";

/**
 * Customer Forecast API Service
 * Handles API calls for customer demand forecasting
 */

/**
 * Get forecasts for all customers assigned to an agent
 * 
 * @param {string} agentId - MongoDB ObjectId of the agent
 * @param {number} horizon - Number of days to forecast (default: 14, range: 7-14)
 * @param {boolean} refresh - If true, force regenerate forecasts (default: false)
 * @returns {Promise<Object>} Forecast data with customer forecasts array
 */
export const getAgentCustomersForecasts = async (agentId, horizon = 14, refresh = false) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`/api/agents/${agentId}/customers/forecasts`, {
      params: {
        horizon: horizon,
        refresh: refresh
      },
      headers: {
        Authorization: token
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching customer forecasts:", error);
    throw error;
  }
};


