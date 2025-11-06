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
      const response = await axios.get('/api/customerBookings', {
        headers: { Authorization: token },
      });
      // Backend returns { message, bookings }, so extract bookings array
      return response.data?.bookings || response.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch bookings'
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
      const response = await axios.get(`/api/SingleBooking/${bookingId}`, {
        headers: { Authorization: token },
      });
      // Backend returns { message, booking }, so extract booking object
      return response.data?.booking || response.data;
    } catch (error) {
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
      const response = await axios.post('/api/customer/bookings', bookingData, {
        headers: { Authorization: token },
      });
      return response.data;
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
      // Backend returns { message, booking }, so extract booking object
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
  async (bookingId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/cancelBooking/${bookingId}`,
        {},
        {
          headers: { Authorization: token },
        }
      );
      // Backend returns { message, booking }, so extract booking object
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
      });
  },
});

export const {
  setSelectedBooking,
  clearSelectedBooking,
  clearErrors,
} = customerBookingsSlice.actions;
export default customerBookingsSlice.reducer;
