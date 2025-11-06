import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/config/config';

const initialState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
  createLoading: false,
  createError: null,
};

// Fetch all customer bookings
export const fetchCustomerBookings = createAsyncThunk(
  'customerBookings/fetchBookings',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      // First get user role to determine which endpoint to use
      const accountRes = await axios.get('/api/account', {
        headers: { Authorization: token },
      });
      const userRole = accountRes.data.role;
      
      let bookings = [];
      
      // Use customer-specific endpoint for customers, allBookings for admin/agent
      if (userRole === 'customer') {
        const response = await axios.get('/api/customerBookings', {
          headers: { Authorization: token },
        });
        bookings = response.data?.bookings || response.data || [];
      } else {
        // For admin/agent, use allBookings and filter
        const customerId = accountRes.data._id;
        const response = await axios.get('/api/allBookings', {
          headers: { Authorization: token },
        });
        const allBookings = response.data?.listAll || response.data || [];
        
        // Filter bookings for this customer
        bookings = Array.isArray(allBookings) 
          ? allBookings.filter(booking => {
              const bookingCustomerId = booking.customer?._id || booking.customer;
              return bookingCustomerId?.toString() === customerId?.toString();
            })
          : [];
      }
      
      return bookings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || 'Failed to fetch bookings'
      );
    }
  }
);

// Fetch single booking by ID
export const fetchBookingById = createAsyncThunk(
  'customerBookings/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Check user role first
      const accountRes = await axios.get('/api/account', {
        headers: { Authorization: token },
      }).catch(() => ({ data: { role: 'customer' } }));
      
      const userRole = accountRes.data?.role;
      
      // SingleBooking endpoint only allows admin/agent
      if (userRole === 'customer') {
        // Customers can't access SingleBooking endpoint
        // They can only update/delete their own bookings, but can't view them via this endpoint
        return rejectWithValue('Customer bookings require backend support. Please contact administrator.');
      }
      
      const response = await axios.get(`/api/SingleBooking/${bookingId}`, {
        headers: { Authorization: token },
      });
      return response.data?.booking || response.data;
    } catch (error) {
      // Check if it's an authorization error for customers
      if (error.response?.status === 403 || error.response?.status === 401) {
        return rejectWithValue('Access denied. Customer booking viewing requires backend support.');
      }
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch booking'
      );
    }
  }
);

// Create new booking
export const createBooking = createAsyncThunk(
  'customerBookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/newBooking', bookingData, {
        headers: { Authorization: token },
      });
      return response.data?.booking || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create booking'
      );
    }
  }
);

// Update booking
export const updateBooking = createAsyncThunk(
  'customerBookings/updateBooking',
  async ({ bookingId, updateData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/updateBooking/${bookingId}`,
        updateData,
        {
          headers: { Authorization: token },
        }
      );
      return response.data?.booking || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update booking'
      );
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'customerBookings/cancelBooking',
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
      
      // Refresh bookings list after cancellation
      dispatch(fetchCustomerBookings());
      
      return response.data?.booking || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to cancel booking'
      );
    }
  }
);

const customerBookingsSlice = createSlice({
  name: 'customerBookings',
  initialState,
  reducers: {
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    clearSelectedBooking: (state) => {
      state.selectedBooking = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.updateError = null;
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all bookings
    builder
      .addCase(fetchCustomerBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchCustomerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch booking by ID
    builder
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.createLoading = false;
        state.bookings.unshift(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });

    // Update booking
    builder
      .addCase(updateBooking.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.bookings.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.bookings.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Handle booking created from dashboard (bookCylinder)
      // Must be after all addCase calls
      .addMatcher(
        (action) => action.type === 'customerDashboard/bookCylinder/fulfilled',
        (state, action) => {
          // Add the booking to the list if it's not already there
          const booking = action.payload;
          if (booking && booking._id) {
            const existingIndex = state.bookings.findIndex(
              (b) => b._id === booking._id
            );
            if (existingIndex === -1) {
              // Add to the beginning of the list
              state.bookings.unshift(booking);
            } else {
              // Update existing booking
              state.bookings[existingIndex] = booking;
            }
          }
        }
      );
  },
});

export const {
  setSelectedBooking,
  clearSelectedBooking,
  clearErrors,
} = customerBookingsSlice.actions;
export default customerBookingsSlice.reducer;
