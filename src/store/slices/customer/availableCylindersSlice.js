import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  cylinders: [],
  loading: false,
  error: null,
};


export const fetchAvailableCylinders = createAsyncThunk(
  'availableCylinders/fetchCylinders',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      let cylinders = [];
      
      try {
        const customerCylindersRes = await axios.get('/api/customer/agent-cylinders', {
          headers: { Authorization: token },
        });
        
        cylinders = customerCylindersRes.data?.cylinders || [];
        return cylinders; 
      } catch (customerError) {
        try {
          const response = await axios.get('/api/list', {
            headers: { Authorization: token },
          });
          cylinders = response.data || [];
        } catch (listError) {
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
            cylinders = [];
          }
        }
        
        try {
          const stockRes = await axios.get('/api/all', {
            headers: { Authorization: token },
          });
          const stocks = stockRes.data?.Inventary || stockRes.data || [];
          
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

    
    builder
      .addCase(fetchCylinderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCylinderById.fulfilled, (state, action) => {
        state.loading = false;
        
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
