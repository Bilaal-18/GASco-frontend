import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  agent: null,
  loading: false,
  error: null,
};


export const fetchAssignedAgent = createAsyncThunk(
  'assignedAgent/fetchAgent',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      
      const accountRes = await axios.get('/api/account', {
        headers: { Authorization: token },
      });
      
      const userRole = accountRes.data?.role;
      
      if (userRole === 'customer') {
        try {
          const response = await axios.get('/api/customer/assigned-agent', {
            headers: { Authorization: token },
          });
          return response.data?.agent || response.data;
        } catch (agentError) {
             const agentId = accountRes.data?.agent;
          if (agentId) {
            if (typeof agentId === 'object' && agentId._id) {
              return agentId;
            }
          }
          return rejectWithValue(agentError.response?.data?.error || 'No agent assigned');
        }
      } else {
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
