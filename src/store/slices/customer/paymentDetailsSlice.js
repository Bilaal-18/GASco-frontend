import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  payments: [],
  selectedPayment: null,
  loading: false,
  error: null,
  paymentLoading: false,
  paymentError: null,
};

// Fetch all payment details/history
export const fetchPaymentDetails = createAsyncThunk(
  'paymentDetails/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      // Get customer ID from account
      const accountRes = await axios.get('/api/account', {
        headers: { Authorization: token },
      });
      const customerId = accountRes.data._id;
      
      // Get user role to handle authorization
      const userRole = accountRes.data.role;
      
      let customerBookings = [];
      
      // Use customer-specific endpoint for customers, allBookings for admin/agent
      if (userRole === 'customer') {
        const bookingsRes = await axios.get('/api/customerBookings', {
          headers: { Authorization: token },
        });
        customerBookings = bookingsRes.data?.bookings || bookingsRes.data || [];
      } else {
        // For admin/agent, use allBookings and filter
        const bookingsRes = await axios.get('/api/allBookings', {
          headers: { Authorization: token },
        });
        const allBookings = bookingsRes.data?.listAll || bookingsRes.data || [];
        
        // Filter bookings for this customer
        customerBookings = Array.isArray(allBookings) 
          ? allBookings.filter(booking => {
              const bookingCustomerId = booking.customer?._id || booking.customer;
              return bookingCustomerId?.toString() === customerId?.toString();
            })
          : [];
      }
      
      // Transform bookings into payment records
      const payments = customerBookings.map(booking => ({
        _id: booking._id,
        bookingId: booking._id,
        amount: (booking.quantity || 0) * (booking.cylinder?.price || 0),
        paymentStatus: booking.paymentStatus || 'pending',
        paymentMethod: 'cash', // Default, can be updated if backend has this field
        createdAt: booking.createdAt || booking.bookingDate,
        paymentDate: booking.createdAt || booking.bookingDate,
      }));
      
      return payments;
    } catch (error) {
      // For customers, return empty array instead of error
      try {
        const accountRes = await axios.get('/api/account', {
          headers: { Authorization: token },
        }).catch(() => ({ data: { role: 'customer' } }));
        
        if (accountRes.data?.role === 'customer') {
          return [];
        }
      } catch (e) {
        // Ignore
      }
      
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch payment details'
      );
    }
  }
);

// Fetch payment details by booking ID
export const fetchPaymentByBookingId = createAsyncThunk(
  'paymentDetails/fetchPaymentByBookingId',
  async (bookingId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/customer/payments/booking/${bookingId}`,
        {
          headers: { Authorization: token },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch payment details'
      );
    }
  }
);

// Fetch payment details by payment ID
export const fetchPaymentById = createAsyncThunk(
  'paymentDetails/fetchPaymentById',
  async (paymentId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/customer/payments/${paymentId}`, {
        headers: { Authorization: token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch payment details'
      );
    }
  }
);

// Process payment (create payment)
export const processPayment = createAsyncThunk(
  'paymentDetails/processPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/customer/payments', paymentData, {
        headers: { Authorization: token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to process payment'
      );
    }
  }
);

const paymentDetailsSlice = createSlice({
  name: 'paymentDetails',
  initialState,
  reducers: {
    setSelectedPayment: (state, action) => {
      state.selectedPayment = action.payload;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.paymentError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all payments
    builder
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch payment by booking ID
    builder
      .addCase(fetchPaymentByBookingId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentByBookingId.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPaymentByBookingId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch payment by ID
    builder
      .addCase(fetchPaymentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Process payment
    builder
      .addCase(processPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.payments.unshift(action.payload);
        state.selectedPayment = action.payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      });
  },
});

export const {
  setSelectedPayment,
  clearSelectedPayment,
  clearErrors,
} = paymentDetailsSlice.actions;
export default paymentDetailsSlice.reducer;
