import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';
import { fetchCustomerBookings } from './customerBookingsSlice';

const initialState = {
  summary: {
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalSpent: 0,
  },
  loading: false,
  error: null,
  bookingLoading: false,
  bookingError: null,
};

// Fetch customer dashboard summary
export const fetchCustomerDashboard = createAsyncThunk(
  'customerDashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      // Get customer ID from account
      const accountRes = await axios.get('/api/account', {
        headers: { Authorization: token },
      });
      const customerId = accountRes.data._id;
      const userRole = accountRes.data.role;
      
      let bookings = [];
      
      // Use customer-specific endpoint for customers, allBookings for admin/agent
      if (userRole === 'customer') {
        const bookingsRes = await axios.get('/api/customerBookings', {
          headers: { Authorization: token },
        });
        bookings = bookingsRes.data?.bookings || bookingsRes.data || [];
      } else {
        // For admin/agent, use allBookings and filter
        const bookingsRes = await axios.get('/api/allBookings', {
          headers: { Authorization: token },
        });
        const allBookings = bookingsRes.data?.listAll || bookingsRes.data || [];
        
        // Filter bookings for this customer
        bookings = Array.isArray(allBookings) 
          ? allBookings.filter(booking => {
              const bookingCustomerId = booking.customer?._id || booking.customer;
              return bookingCustomerId?.toString() === customerId?.toString();
            })
          : [];
      }
      
      // Calculate total spent from bookings
      const totalSpent = bookings
        .filter(b => (b.status === 'completed' || b.status === 'delivered') && b.cylinder?.price)
        .reduce((sum, b) => {
          const price = b.cylinder?.price || 0;
          const quantity = b.quantity || 0;
          return sum + (price * quantity);
        }, 0);
      
      return {
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length,
        completedBookings: bookings.filter(b => b.status === 'completed' || b.status === 'delivered').length,
        pendingBookings: bookings.filter(b => b.status === 'pending' || b.status === 'requested').length,
        totalSpent: totalSpent,
      };
    } catch (error) {
      // For customers, return default empty summary instead of error
      try {
        const accountRes = await axios.get('/api/account', {
          headers: { Authorization: token },
        });
        if (accountRes.data?.role === 'customer') {
          return {
            totalBookings: 0,
            activeBookings: 0,
            completedBookings: 0,
            pendingBookings: 0,
            totalSpent: 0,
          };
        }
      } catch (e) {
        // Ignore
      }
      
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch dashboard data'
      );
    }
  }
);

// Book a cylinder
export const bookCylinder = createAsyncThunk(
  'customerDashboard/bookCylinder',
  async (bookingData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/newBooking', bookingData, {
        headers: { Authorization: token },
      });
      
      const booking = response.data?.booking || response.data;
      
      // Refresh dashboard summary after booking
      dispatch(fetchCustomerDashboard());
      
      // Also refresh customer bookings to show the new booking
      dispatch(fetchCustomerBookings());
      
      return booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to book cylinder'
      );
    }
  }
);

// Update booking (dashboard version - refreshes dashboard after update)
export const updateBookingFromDashboard = createAsyncThunk(
  'customerDashboard/updateBooking',
  async ({ bookingId, updateData }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/updateBooking/${bookingId}`,
        updateData,
        {
          headers: { Authorization: token },
        }
      );
      
      // Refresh dashboard summary after update
      dispatch(fetchCustomerDashboard());
      
      return response.data?.booking || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update booking'
      );
    }
  }
);

// Cancel booking (dashboard version - refreshes dashboard after cancellation)
export const cancelBookingFromDashboard = createAsyncThunk(
  'customerDashboard/cancelBooking',
  async (bookingId, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/cancelBooking/${bookingId}`,
        {},
        {
          headers: { Authorization: token },
        }
      );
      
      // Refresh dashboard summary after cancellation
      dispatch(fetchCustomerDashboard());
      
      return response.data?.booking || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to cancel booking'
      );
    }
  }
);

const customerDashboardSlice = createSlice({
  name: 'customerDashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.summary = initialState.summary;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
      state.bookingError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchCustomerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Book cylinder
      .addCase(bookCylinder.pending, (state) => {
        state.bookingLoading = true;
        state.bookingError = null;
      })
      .addCase(bookCylinder.fulfilled, (state) => {
        state.bookingLoading = false;
        state.bookingError = null;
      })
      .addCase(bookCylinder.rejected, (state, action) => {
        state.bookingLoading = false;
        state.bookingError = action.payload;
      })
      // Update booking
      .addCase(updateBookingFromDashboard.pending, (state) => {
        state.bookingLoading = true;
        state.bookingError = null;
      })
      .addCase(updateBookingFromDashboard.fulfilled, (state) => {
        state.bookingLoading = false;
        state.bookingError = null;
      })
      .addCase(updateBookingFromDashboard.rejected, (state, action) => {
        state.bookingLoading = false;
        state.bookingError = action.payload;
      })
      // Cancel booking
      .addCase(cancelBookingFromDashboard.pending, (state) => {
        state.bookingLoading = true;
        state.bookingError = null;
      })
      .addCase(cancelBookingFromDashboard.fulfilled, (state) => {
        state.bookingLoading = false;
        state.bookingError = null;
      })
      .addCase(cancelBookingFromDashboard.rejected, (state, action) => {
        state.bookingLoading = false;
        state.bookingError = action.payload;
      });
  },
});

export const { clearDashboard, clearError } = customerDashboardSlice.actions;
export default customerDashboardSlice.reducer;
