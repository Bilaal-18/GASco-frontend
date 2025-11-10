import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  cylinders: [],
  loading: false,
  error: null,
};

// Fetch available cylinder types
export const fetchAvailableCylinders = createAsyncThunk(
  'availableCylinders/fetchCylinders',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      let cylinders = [];
      
      // Check user role from state or try to determine it
      // For customers, fetch from their assigned agent's stock
      try {
        const customerCylindersRes = await axios.get('/api/customer/agent-cylinders', {
          headers: { Authorization: token },
        });
        
        // If successful, this is a customer and we got agent stock
        cylinders = customerCylindersRes.data?.cylinders || [];
        return cylinders; // Already has totalQuantity from agent stock
      } catch (customerError) {
        // Not a customer or endpoint doesn't exist, try other methods
        // Try /api/list first (for admin/agent)
        try {
          const response = await axios.get('/api/list', {
            headers: { Authorization: token },
          });
          cylinders = response.data || [];
        } catch (listError) {
          // If unauthorized, try alternative: fetch by type to get all types
          // We'll fetch commercial and private Commercial separately
          try {
            const [commercialRes, privateRes] = await Promise.all([
              axios.get('/api/listOf/type', {
                headers: { Authorization: token },
                params: { type: 'commercial' },
              }).catch(() => ({ data: [] })),
              axios.get('/api/listOf/type', {
                headers: { Authorization: token },
                params: { type: 'private Commercial' },
              }).catch(() => ({ data: [] })),
            ]);
            
            cylinders = [
              ...(Array.isArray(commercialRes.data) ? commercialRes.data : []),
              ...(Array.isArray(privateRes.data) ? privateRes.data : []),
            ];
          } catch (typeError) {
            // If both fail, return empty array
            cylinders = [];
          }
        }
        
        // Add totalQuantity if needed from inventory (optional, might fail for customers)
        try {
          const stockRes = await axios.get('/api/all', {
            headers: { Authorization: token },
          });
          const stocks = stockRes.data?.Inventary || stockRes.data || [];
          
          // Map cylinders with stock quantities
          return cylinders.map(cylinder => {
            const stock = Array.isArray(stocks) 
              ? stocks.find(s => s.cylinderId?._id === cylinder._id || s.cylinderId === cylinder._id)
              : null;
            return {
              ...cylinder,
              totalQuantity: stock?.totalQuantity || 0,
            };
          });
        } catch (stockError) {
          // If stock fetch fails, just return cylinders without quantity
          return cylinders.map(cylinder => ({ ...cylinder, totalQuantity: undefined }));
        }
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch available cylinders'
      );
    }
  }
);

// Fetch cylinder details by ID
export const fetchCylinderById = createAsyncThunk(
  'availableCylinders/fetchCylinderById',
  async (cylinderId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cylinders/${cylinderId}`, {
        headers: { Authorization: token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch cylinder details'
      );
    }
  }
);

const availableCylindersSlice = createSlice({
  name: 'availableCylinders',
  initialState,
  reducers: {
    clearCylinders: (state) => {
      state.cylinders = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch available cylinders
    builder
      .addCase(fetchAvailableCylinders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableCylinders.fulfilled, (state, action) => {
        state.loading = false;
        state.cylinders = action.payload;
      })
      .addCase(fetchAvailableCylinders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch cylinder by ID
    builder
      .addCase(fetchCylinderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCylinderById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the cylinder in the list if it exists
        const index = state.cylinders.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.cylinders[index] = action.payload;
        }
      })
      .addCase(fetchCylinderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCylinders, clearError } = availableCylindersSlice.actions;
export default availableCylindersSlice.reducer;
