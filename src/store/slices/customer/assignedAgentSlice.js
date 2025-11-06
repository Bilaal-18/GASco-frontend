import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  agent: null,
  loading: false,
  error: null,
};

// Fetch assigned agent details
export const fetchAssignedAgent = createAsyncThunk(
  'assignedAgent/fetchAgent',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Get user role first
      const accountRes = await axios.get('/api/account', {
        headers: { Authorization: token },
      });
      
      const userRole = accountRes.data?.role;
      
      // Use customer-specific endpoint if customer, otherwise use account endpoint
      if (userRole === 'customer') {
        try {
          const response = await axios.get('/api/customer/assigned-agent', {
            headers: { Authorization: token },
          });
          return response.data?.agent || response.data;
        } catch (agentError) {
          // If agent endpoint fails, try to get from account
          const agentId = accountRes.data?.agent;
          if (agentId) {
            // If agent is populated in account, use it
            if (typeof agentId === 'object' && agentId._id) {
              return agentId;
            }
          }
          return rejectWithValue(agentError.response?.data?.error || 'No agent assigned');
        }
      } else {
        // For non-customers, try to get agent from account if available
        const agentId = accountRes.data?.agent;
        if (agentId && typeof agentId === 'object' && agentId._id) {
          return agentId;
        }
        return rejectWithValue('No agent assigned');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch assigned agent'
      );
    }
  }
);

// Fetch agent details by ID
export const fetchAgentById = createAsyncThunk(
  'assignedAgent/fetchAgentById',
  async (agentId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/distributors/${agentId}`, {
        headers: { Authorization: token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch agent details'
      );
    }
  }
);

const assignedAgentSlice = createSlice({
  name: 'assignedAgent',
  initialState,
  reducers: {
    clearAgent: (state) => {
      state.agent = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch assigned agent
    builder
      .addCase(fetchAssignedAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agent = action.payload;
      })
      .addCase(fetchAssignedAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch agent by ID
    builder
      .addCase(fetchAgentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        state.loading = false;
        state.agent = action.payload;
      })
      .addCase(fetchAgentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAgent, clearError } = assignedAgentSlice.actions;
export default assignedAgentSlice.reducer;
