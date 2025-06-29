'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// --- Reused Type Definitions from FrontDesk ---
type Bookings = {
  booking_id: number;
  checkin_date: string;
  checkout_date: string;
  room_num: number[]; // This is an array of numbers
  total_price: number | string; 
  service_asked?: boolean;
}

type DueForSingleRoom = {
  account: {
    total_price: string;
    due: string | number;
  };
}

type Reservation = {
  reservation_id: number;
  checkin_date: string;
  checkout_date: string;
  room_num: number[];
}

type Room = {
  id: string;
  number: string;
  type: 'single' | 'double' | 'family';
  isActive: boolean;
}

// --- New Type for Booking with Due Info ---
type BookingWithDue = Bookings & {
  due: number; // Consolidated due for the entire booking
  fetchDueError?: boolean;
};

// --- Reused Icons (copy-pasted for self-containment, but ideally imported) ---
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 0 002-2V7a2 0 00-2-2H5a2 0 00-2 2v12a2 0 002 2z" />
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 0 002 2h10a2 0 002-2V7a2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
</svg>
);

// Navigation items (adjusted active state for this page)
const navigationItems = [
  { id: 'frontdesk', label: 'Front Desk', icon: Calendar, active: false },
  { id: 'bookings', label: 'Bookings', icon: Calendar, active: false },
  { id: 'reservation', label: 'Reservation', icon: Users, active: false },
  { id: 'accounts', label: 'Accounts', icon: CreditCard, active: true },
  { id: 'housekeeping', label: 'Housekeeping', icon: ClipboardList, active: false }, // Added Housekeeping
  { id: 'checkout', label: 'Check Out', icon: LogOut, active: false },
];

const AccountsPage: React.FC = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('accounts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsWithDue, setBookingsWithDue] = useState<BookingWithDue[]>([]);

  // Payment dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<BookingWithDue | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<'card' | 'cash' | 'online' | ''>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchBookingsAndDue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const bookingsRes = await axios.get<Bookings[]>("http://localhost:3000/booking/all");
      const fetchedBookings = bookingsRes.data;

      const bookingsWithDuePromises = fetchedBookings.map(async (booking) => {
        let totalDueForBooking = 0;
        let hasFetchError = false;

        if (!booking.room_num || booking.room_num.length === 0) {
            return { ...booking, due: 0, fetchDueError: false };
        }

        const roomDuePromises = booking.room_num.map(async (roomNumber) => {
            try {
                const dueApiUrl = `http://localhost:3000/booking/due/${roomNumber}`;
                
                const dueRes = await axios.get<DueForSingleRoom>(dueApiUrl);
                
                const rawDueValue = dueRes.data.account?.due; 

                const roomDue = typeof rawDueValue === 'string'
                    ? parseFloat(rawDueValue)
                    : (rawDueValue || 0);
                
                if (isNaN(roomDue) || rawDueValue === undefined || rawDueValue === null) {
                    hasFetchError = true;
                    return 0;
                }
                return roomDue;
            } catch (roomErr: any) {
                console.error(`Error fetching due for room ${roomNumber} of booking ${booking.booking_id}:`, roomErr.response?.data || roomErr.message);
                hasFetchError = true;
                return 0;
            }
        });

        const roomDues = await Promise.all(roomDuePromises);
        totalDueForBooking = roomDues.reduce((sum, currentDue) => sum + currentDue, 0);
        
        return { ...booking, due: totalDueForBooking, fetchDueError: hasFetchError };
      });

      const resolvedBookingsWithDue = await Promise.all(bookingsWithDuePromises);
      setBookingsWithDue(resolvedBookingsWithDue);
      
    } catch (err: any) {
      console.error('Error in fetchBookingsAndDue:', err.response?.data || err.message);
      setError('Failed to fetch data. Please check your network connection or the server status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingsAndDue();
  }, [fetchBookingsAndDue]);

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

  const handleMakePaymentClick = (booking: BookingWithDue) => {
    setSelectedBookingForPayment(booking);
    setPaidAmount('');
    setPaymentType('');
    setTransactionId('');
    setPaymentError(null);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedBookingForPayment) return;

    const currentDue = selectedBookingForPayment.due;
    const amountToPay = parseFloat(paidAmount.toString());

    if (paidAmount === '' || isNaN(amountToPay) || amountToPay <= 0) {
      setPaymentError('Please enter a valid amount.');
      return;
    }
    if (paymentType === '') {
      setPaymentError('Please select a payment type.');
      return;
    }

    if (amountToPay > currentDue) {
      setPaymentError(`Amount paid (৳${amountToPay.toFixed(2)}) cannot be greater than the outstanding due (৳${currentDue.toFixed(2)}).`);
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const payload = {
        paid: amountToPay,
        payment_type: paymentType,
        transaction_id: transactionId || null,
      };
      console.log(`Sending payment for booking ${selectedBookingForPayment.booking_id}:`, payload);
      // REVERTED: Changed axios.post back to axios.patch
      await axios.post(`http://localhost:3000/booking/account/${selectedBookingForPayment.booking_id}`, payload);
      
      alert(`Payment successful for Booking ID: ${selectedBookingForPayment.booking_id}`);
      setPaymentDialogOpen(false);
      fetchBookingsAndDue();

    } catch (err: any) {
      console.error('Error processing payment:', err.response?.data || err.message);
      // Ensure err.response?.data is handled gracefully if it's an empty object
      const errorMessage = err.response?.data?.message || err.message;
      setPaymentError(`Payment failed: ${errorMessage}`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleRetry = () => {
    fetchBookingsAndDue();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-5 text-lg font-medium text-gray-700">Loading account data...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Accounts Overview</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5">Bookings with Dues</h2>
            
            {bookingsWithDue.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No bookings with outstanding dues found.</p>
                <p className="text-gray-500 mt-2">All accounts are settled, or there are no active bookings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      {/* Centered headings */}
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Room Numbers
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Total Price
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Due Amount
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {bookingsWithDue.map((booking) => (
                      <tr key={booking.booking_id} className="hover:bg-gray-50 transition-colors">
                        {/* Centered data for most columns */}
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {booking.booking_id}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          {booking.room_num ? booking.room_num.join(', ') : 'N/A'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                          ৳{
                            typeof booking.total_price === 'string'
                              ? parseFloat(booking.total_price).toFixed(2)
                              : booking.total_price?.toFixed(2) || '0.00'
                          }
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-red-600 text-center">
                          ৳{booking.due ? booking.due.toFixed(2) : '0.00'}
                          {booking.fetchDueError && <span className="ml-1 text-xs text-yellow-600 font-medium" title="Error fetching some room dues">(Error)</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium"> {/* Action column centered */}
                          <button
                            onClick={() => handleMakePaymentClick(booking)}
                            disabled={booking.due <= 0}
                            className={`px-4 py-2 rounded-lg text-white text-sm transition-colors shadow-md ${
                              booking.due > 0
                                ? 'bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Make Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Payment Dialog */}
      {paymentDialogOpen && selectedBookingForPayment && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-7">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">Make Payment for Booking ID: {selectedBookingForPayment.booking_id}</h3>
              <button
                onClick={() => setPaymentDialogOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label htmlFor="paidAmount" className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid (৳)</label>
                <input
                  type="number"
                  id="paidAmount"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || '')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 shadow-sm"
                  placeholder="e.g., 100.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label htmlFor="paymentType" className="block text-sm font-semibold text-gray-700 mb-2">Payment Type</label>
                <select
                  id="paymentType"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as 'card' | 'cash' | 'online')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm"
                >
                  <option value="">Select type</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label htmlFor="transactionId" className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID (Optional)</label>
                <input
                  type="text"
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 shadow-sm"
                  placeholder="Enter transaction ID"
                />
              </div>

              {paymentError && (
                <p className="text-red-600 text-sm mt-3 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {paymentError}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-7">
                <button
                  onClick={() => setPaymentDialogOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors shadow-sm"
                  disabled={paymentProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-base font-semibold transition-colors shadow-md"
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? 'Processing...' : 'Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AccountsSystem() {
  return <AccountsPage />;
}