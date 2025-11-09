import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  paymentLoading: false,
  paymentError: null,
  paymentHistory: [],
  historyLoading: false,
  historyError: null,
  currentOrder: null,
};

// Create Razorpay order
export const createPaymentOrder = createAsyncThunk(
  'payment/createOrder',
  async (bookingId, { rejectWithValue }) => {
    try {
      if (!bookingId) {
        return rejectWithValue('Booking ID is required');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required. Please login again.');
      }

      const response = await axios.post(
        '/api/payment/create-order',
        { bookingId },
        {
          headers: { Authorization: token },
        }
      );

      if (!response.data || !response.data.orderId) {
        return rejectWithValue(response.data?.error || 'Invalid response from server');
      }

      return response.data;
    } catch (error) {
      console.error('Create payment order error:', error);
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Failed to create payment order';
      return rejectWithValue(errorMessage);
    }
  }
);

// Verify payment
export const verifyPayment = createAsyncThunk(
  'payment/verify',
  async (paymentData, { rejectWithValue, dispatch }) => {
    try {
      if (!paymentData || !paymentData.razorpayOrderId || !paymentData.razorpayPaymentId || !paymentData.razorpaySignature || !paymentData.bookingId) {
        return rejectWithValue('Missing payment verification data');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required. Please login again.');
      }

      const response = await axios.post(
        '/api/payment/verify',
        paymentData,
        {
          headers: { Authorization: token },
        }
      );

      if (!response.data) {
        return rejectWithValue('Invalid response from server');
      }
      
      // Refresh bookings after successful payment
      try {
        const { fetchCustomerBookings } = await import('./customerBookingsSlice');
        dispatch(fetchCustomerBookings());
      } catch (importError) {
        console.warn('Failed to refresh bookings after payment:', importError);
        // Don't fail payment verification if booking refresh fails
      }
      
      return response.data;
    } catch (error) {
      console.error('Verify payment error:', error);
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Failed to verify payment';
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch payment history
export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payment/history', {
        headers: { Authorization: token },
      });
      return response.data?.payments || response.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch payment history'
      );
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.paymentError = null;
      state.historyError = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    // Create order
    builder
      .addCase(createPaymentOrder.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.paymentLoading = false;
        state.currentOrder = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      // Fetch history
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.paymentHistory = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });
  },
});

export const { clearPaymentError, clearCurrentOrder } = paymentSlice.actions;
export default paymentSlice.reducer;


