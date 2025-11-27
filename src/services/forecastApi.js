import axios from "@/config/config";

export const getAgentForecast = async (agentId, horizon = 14, refresh = false) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`/api/agents/${agentId}/forecast`, {
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
    const status = error.response?.status;
    const isNotFound = status === 404 || 
                       (error.response?.data?.error && 
                        error.response.data.error.toLowerCase().includes('not found'));
    
    if (isNotFound) {
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
    
  
    console.error("Error fetching agent forecast (non-404 error):", error);
    throw error;
  }
};


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
    const status = error.response?.status;
    const isNotFound = status === 404 || 
                       (error.response?.data?.error && 
                        error.response.data.error.toLowerCase().includes('not found'));
    
    if (isNotFound) {
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
    
    console.error("Error fetching agent forecast stats (non-404 error):", error);
    throw error;
  }
};




