'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; 
import { useRouter } from 'next/navigation';


type Booking = {
  booking_id: number;
  checkin_date: string;
  checkout_date: string;
  room_num: number[];
  user_id: number;
  number_of_guests: number;
  total_price: number;
  payment_status: 'paid' | 'pending' | 'cancelled';
  coupon_code: string | null;
  booking_date: string;
  typeOfBooking: 'self' | 'website' | null;
  customer_name: string;
  contact_info: string; // Assuming email or phone number as contact info
};

// The EnrichedBooking type is no longer strictly necessary if data comes pre-enriched,
// but we'll keep it as a type alias for clarity and consistency with previous structure
type EnrichedBooking = Booking;

// --- Reused Icons (copy-pasted for self-containment, but ideally imported from a shared components file) ---
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const Search = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const MoreHorizontal = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
  </svg>
);
const Menu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 0114 0z" />
  </svg>
);
const CreditCard = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const LogOut = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
  </svg>
);
const ClipboardList = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

// Navigation items (adjusted active state for this page)
const navigationItems = [
  { id: 'frontdesk', label: 'Front Desk', icon: Calendar, active: false },
  { id: 'bookings', label: 'Bookings', icon: Calendar, active: true },
  { id: 'reservation', label: 'Reservation', icon: Users, active: false },
  { id: 'accounts', label: 'Accounts', icon: CreditCard, active: false },
  { id: 'housekeeping', label: 'Housekeeping', icon: ClipboardList, active: false }, // Added Housekeeping
  { id: 'checkout', label: 'Check Out', icon: LogOut, active: false },
];

const BookingPage: React.FC = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('bookings'); // Set active nav to 'bookings'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allBookings, setAllBookings] = useState<EnrichedBooking[]>([]); // Now directly use EnrichedBooking type

  // Filter states
  const [dateRangeStartDate, setDateRangeStartDate] = useState<Date | null>(null);
  const [dateRangeEndDate, setDateRangeEndDate] = useState<Date | null>(null);
  const [roomNumberFilter, setRoomNumberFilter] = useState<string>('');
  const [typeOfBookingFilter, setTypeOfBookingFilter] = useState<string>(''); // New filter
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>(''); // New filter

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all bookings
      const bookingsRes = await axios.get<Booking[]>("http://localhost:3000/booking/all");
      const fetchedBookings = bookingsRes.data;

      setAllBookings(fetchedBookings);

    } catch (err: any) {
      console.error('Error fetching bookings:', err.response?.data || err.message);
      setError('Failed to fetch bookings. Please check your network connection or the server status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    setSidebarOpen(false);
    // Use Next.js router to navigate
    if (navId === 'frontdesk') router.push('/frontdesk'); // Assuming a /front-desk route
    else if (navId === 'bookings') router.push('/bookings'); // Assuming a /bookings route
    else if (navId === 'reservation') router.push('/reservation'); // Assuming a /reservation route
    else if (navId === 'accounts') router.push('/accounts'); // Assuming a /accounts route
    else if (navId === 'housekeeping') router.push('/housekeeping'); // Assuming a /housekeeping route
    else if (navId === 'checkout') router.push('/checkout'); // Current page, could just re-render
  };

  const handleRetry = () => {
    fetchBookings();
  };

  // Filtered bookings based on current filter states
  const filteredBookings = useMemo(() => {
    return allBookings.filter((booking) => {
      // Ensure dates are valid Date objects before comparison
      const bookingCheckinDate = new Date(booking.checkin_date);
      const bookingCheckoutDate = new Date(booking.checkout_date);
      const bookingCreationDate = new Date(booking.booking_date);

      // Date range filter (based on booking creation date)
      if (dateRangeStartDate && bookingCreationDate < dateRangeStartDate) {
        return false;
      }
      if (dateRangeEndDate) {
        const endOfDayEndDate = new Date(dateRangeEndDate);
        endOfDayEndDate.setHours(23, 59, 59, 999);
        if (bookingCreationDate > endOfDayEndDate) {
          return false;
        }
      }

      // Room number filter
      if (roomNumberFilter) {
        const roomNumbers = booking.room_num.map(String);
        if (!roomNumbers.some(room => room.includes(roomNumberFilter))) {
          return false;
        }
      }

      // Type of Booking filter
      // Now handles null and empty string filter value, and case-insensitive comparison
      if (typeOfBookingFilter) { // Only apply filter if a specific type is selected (not 'All' or empty)
        // Normalize the booking type to lowercase for comparison. Treat null as empty string for comparison.
        const normalizedBookingType = (booking.typeOfBooking || '').toLowerCase();
        const normalizedFilterType = typeOfBookingFilter.toLowerCase();
        if (normalizedBookingType !== normalizedFilterType) {
          return false;
        }
      }


      // Payment Status filter
      if (paymentStatusFilter && paymentStatusFilter !== 'All') {
        if (booking.payment_status !== paymentStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allBookings, dateRangeStartDate, dateRangeEndDate, roomNumberFilter, typeOfBookingFilter, paymentStatusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-5 text-lg font-medium text-gray-700">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Failed to Load Data</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleRetry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              Retry
            </button>
            <button
              onClick={() => { setError(null); setIsLoading(false); }}
              className="border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-sm"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 shadow-lg lg:shadow-none transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">Amin International</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                      activeNav === item.id
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Bookings Overview</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          {/* Filter Section */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-5">Filter Bookings</h2>
            {/* UPDATED: Changed xl:grid-cols-4 to xl:grid-cols-5 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <div>
                <label htmlFor="dateRangeStartDate" className="block text-sm font-medium text-gray-700 mb-2">Booking Date (From)</label>
                <DatePicker
                  id="dateRangeStartDate"
                  selected={dateRangeStartDate}
                  onChange={(date: Date | null) => setDateRangeStartDate(date)}
                  selectsStart
                  startDate={dateRangeStartDate}
                  endDate={dateRangeEndDate}
                  placeholderText="DD/MM/YYYY"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>
              <div>
                <label htmlFor="dateRangeEndDate" className="block text-sm font-medium text-gray-700 mb-2">Booking Date (To)</label>
                <DatePicker
                  id="dateRangeEndDate"
                  selected={dateRangeEndDate}
                  onChange={(date: Date | null) => setDateRangeEndDate(date)}
                  selectsEnd
                  startDate={dateRangeStartDate}
                  endDate={dateRangeEndDate}
                  minDate={dateRangeStartDate}
                  placeholderText="DD/MM/YYYY"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>
              <div>
                <label htmlFor="roomNumberFilter" className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                <input
                  type="text"
                  id="roomNumberFilter"
                  value={roomNumberFilter}
                  onChange={(e) => setRoomNumberFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm"
                  placeholder="e.g., 101"
                />
              </div>
              <div>
                <label htmlFor="typeOfBookingFilter" className="block text-sm font-medium text-gray-700 mb-2">Type of Booking</label>
                   <select
                   id="typeOfBookingFilter"
                   value={typeOfBookingFilter}
                   onChange={(e) => setTypeOfBookingFilter(e.target.value)}
                   className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm bg-white">
                  <option value="">All</option>
                  <option value="website">Website</option>
                  <option value="self">Self</option>
                </select>
              </div>
              <div>
                <label htmlFor="paymentStatusFilter" className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  id="paymentStatusFilter"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm bg-white"
                >
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setDateRangeStartDate(null);
                  setDateRangeEndDate(null);
                  setRoomNumberFilter('');
                  setTypeOfBookingFilter('');
                  setPaymentStatusFilter('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm border border-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </section>

          {/* Bookings Table Section */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5">All Bookings</h2>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No bookings found.</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or add a new booking.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Rooms
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Guests
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Total Price
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Coupon
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Booking Date
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.booking_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {booking.booking_id}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {booking.customer_name}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {booking.room_num ? booking.room_num.join(', ') : 'N/A'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {booking.number_of_guests}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {new Date(booking.checkin_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {new Date(booking.checkout_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {/* Handles number or string for total_price, and null/undefined for 'N/A' */}
                          ৳{typeof booking.total_price === 'number'
                            ? booking.total_price.toFixed(2)
                            : (typeof booking.total_price === 'string' && !isNaN(parseFloat(booking.total_price)))
                              ? parseFloat(booking.total_price).toFixed(2)
                              : 'N/A'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {/* Handles null/undefined payment_status */}
                            {booking.payment_status
                                ? booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)
                                : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {booking.coupon_code || 'N/A'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {new Date(booking.booking_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            
                            (booking.typeOfBooking?.toLowerCase() === 'self') ? 'bg-blue-100 text-blue-800' :
                            (booking.typeOfBooking?.toLowerCase() === 'website') ? 'bg-purple-100 text-purple-800' :
                            // Fallback for null or unexpected types
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {/* Displays 'N/A' if typeofBooking is null or undefined, otherwise formats it */}
                            {booking.typeOfBooking
                                ? booking.typeOfBooking.charAt(0).toUpperCase() + booking.typeOfBooking.slice(1)
                                : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default function BookingSystem() {
  return <BookingPage />;
}