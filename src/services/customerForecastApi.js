import axios from "@/config/config";


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


