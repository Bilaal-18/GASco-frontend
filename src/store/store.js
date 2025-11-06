import { configureStore } from '@reduxjs/toolkit';
import customerProfileSlice from './slices/customer/customerProfileSlice';
import customerDashboardSlice from './slices/customer/customerDashboardSlice';
import customerBookingsSlice from './slices/customer/customerBookingsSlice';
import availableCylindersSlice from './slices/customer/availableCylindersSlice';
import assignedAgentSlice from './slices/customer/assignedAgentSlice';
import paymentDetailsSlice from './slices/customer/paymentDetailsSlice';
import paymentSlice from './slices/customer/paymentSlice';

export const store = configureStore({
  reducer: {
    customerProfile: customerProfileSlice,
    customerDashboard: customerDashboardSlice,
    customerBookings: customerBookingsSlice,
    availableCylinders: availableCylindersSlice,
    assignedAgent: assignedAgentSlice,
    paymentDetails: paymentDetailsSlice,
    payment: paymentSlice,
  },
});
