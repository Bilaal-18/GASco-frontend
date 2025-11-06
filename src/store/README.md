# Customer Panel Redux Structure

This Redux store structure is dedicated to managing customer panel state without affecting existing admin/agent pages.

## Store Structure

```
store/
├── store.js                    # Main Redux store configuration
├── hooks.js                    # Typed Redux hooks (useAppDispatch, useAppSelector)
├── index.js                    # Central export file
└── slices/
    └── customer/
        ├── customerProfileSlice.js          # Customer profile management
        ├── customerDashboardSlice.js        # Dashboard summary data
        ├── customerBookingsSlice.js         # Bookings CRUD operations
        ├── availableCylindersSlice.js       # Available cylinder types
        ├── assignedAgentSlice.js            # Assigned agent details
        └── paymentDetailsSlice.js           # Payment information
```

## Available Slices

### 1. Customer Profile (`customerProfile`)
**Actions:**
- `fetchCustomerProfile()` - Fetch customer profile
- `updateCustomerProfile(formData)` - Update profile
- `clearProfile()` - Clear profile data
- `clearErrors()` - Clear error messages

**State:**
```javascript
{
  profile: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null
}
```

### 2. Customer Dashboard (`customerDashboard`)
**Actions:**
- `fetchCustomerDashboard()` - Fetch dashboard summary
- `clearDashboard()` - Clear dashboard data
- `clearError()` - Clear error

**State:**
```javascript
{
  summary: {
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalSpent: 0
  },
  loading: false,
  error: null
}
```

### 3. Customer Bookings (`customerBookings`)
**Actions:**
- `fetchCustomerBookings()` - Fetch all bookings
- `fetchBookingById(bookingId)` - Fetch single booking
- `createBooking(bookingData)` - Create new booking
- `updateBooking({ bookingId, updateData })` - Update booking
- `cancelBooking(bookingId)` - Cancel booking
- `setSelectedBooking(booking)` - Set selected booking
- `clearSelectedBooking()` - Clear selected booking
- `clearErrors()` - Clear errors

**State:**
```javascript
{
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
  createLoading: false,
  createError: null
}
```

### 4. Available Cylinders (`availableCylinders`)
**Actions:**
- `fetchAvailableCylinders()` - Fetch available cylinder types
- `fetchCylinderById(cylinderId)` - Fetch cylinder details
- `clearCylinders()` - Clear cylinders data
- `clearError()` - Clear error

**State:**
```javascript
{
  cylinders: [],
  loading: false,
  error: null
}
```

### 5. Assigned Agent (`assignedAgent`)
**Actions:**
- `fetchAssignedAgent()` - Fetch assigned agent details
- `fetchAgentById(agentId)` - Fetch agent by ID
- `clearAgent()` - Clear agent data
- `clearError()` - Clear error

**State:**
```javascript
{
  agent: null,
  loading: false,
  error: null
}
```

### 6. Payment Details (`paymentDetails`)
**Actions:**
- `fetchPaymentDetails()` - Fetch all payments
- `fetchPaymentByBookingId(bookingId)` - Fetch payment by booking
- `fetchPaymentById(paymentId)` - Fetch payment by ID
- `processPayment(paymentData)` - Process new payment
- `setSelectedPayment(payment)` - Set selected payment
- `clearSelectedPayment()` - Clear selected payment
- `clearErrors()` - Clear errors

**State:**
```javascript
{
  payments: [],
  selectedPayment: null,
  loading: false,
  error: null,
  paymentLoading: false,
  paymentError: null
}
```

## Usage Example

### In a React Component:

```javascript
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchCustomerDashboard, 
  fetchCustomerBookings,
  createBooking 
} from '@/store';

function CustomerDashboard() {
  const dispatch = useAppDispatch();
  
  // Access state
  const { summary, loading, error } = useAppSelector(
    (state) => state.customerDashboard
  );
  
  const { bookings } = useAppSelector(
    (state) => state.customerBookings
  );

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCustomerDashboard());
    dispatch(fetchCustomerBookings());
  }, [dispatch]);

  // Handle actions
  const handleCreateBooking = async (bookingData) => {
    try {
      await dispatch(createBooking(bookingData)).unwrap();
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total Bookings: {summary.totalBookings}</p>
      {/* Rest of component */}
    </div>
  );
}
```

## Notes

- All API calls are handled asynchronously using `createAsyncThunk`
- Error handling is built into each slice
- Loading states are available for all async operations
- The store is isolated to customer panel features only
- Admin and agent pages remain unchanged and use their existing state management

## API Endpoints

**Note:** Update the API endpoints in each slice to match your backend routes. The current endpoints are placeholders:

- `/api/customer/bookings` - Customer bookings
- `/api/customer/cylinders/available` - Available cylinders
- `/api/customer/payments` - Payment details
- `/api/account` - Customer profile
- `/api/distributors/:id` - Agent details
