'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from "axios";
import { useRouter } from 'next/navigation';
// Types
type Bookings = {
  booking_id: number;
  checkin_date: string;
  checkout_date: string;
  room_num: number[];
  service_asked?: boolean; // Added for housekeeping feature
}

type Reservation= {
  reservation_id: number;
  checkin_date: string;
  checkout_date: string;
  room_num: number[];
}

type Room={
  id: string;
  number: string;
  type: 'single' | 'double' | 'family';
  isActive: boolean;
}

// Icons (Inline SVG components)
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

// New Icon for Housekeeping
const ClipboardList = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

// Navigation items
const navigationItems = [
  { id: 'frontdesk', label: 'Front Desk', icon: Calendar, active: true },
  { id: 'bookings', label: 'Bookings', icon: Calendar, active: false },
  { id: 'reservation', label: 'Reservation', icon: Users, active: false },
  { id: 'accounts', label: 'Accounts', icon: CreditCard, active: false },
  { id: 'housekeeping', label: 'Housekeeping', icon: ClipboardList, active: false }, // Added Housekeeping
  { id: 'checkout', label: 'Check Out', icon: LogOut, active: false },
];

// Main Component
const FrontDesk: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('frontdesk');
  const [isLoading, setIsLoading] = useState(true); // Set to true initially to show loading state
  const [error, setError] = useState<string | null>(null);
  const [housekeepingDialogOpen, setHousekeepingDialogOpen] = useState(false); // State for housekeeping dialog
  
  // Room data - fixed room numbers
  const [rooms] = useState<Room[]>([
    // Single Rooms
    { id: '1', number: '101', type: 'single', isActive: true },
    { id: '2', number: '510', type: 'single', isActive: true },
    { id: '3', number: '204', type: 'single', isActive: true },
    
    // Double Rooms
    { id: '4', number: '102', type: 'double', isActive: true },
    { id: '5', number: '202', type: 'double', isActive: true },
    { id: '6', number: '307', type: 'double', isActive: true },
    { id: '7', number: '408', type: 'double', isActive: true },
    
    // Family Rooms
    { id: '8', number: '305', type: 'family', isActive: true },
    { id: '9', number: '601', type: 'family', isActive: true },
    { id: '10', number: '701', type: 'family', isActive: true },
  ]);

  // API Data States
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const fetchBookingData = async () => {
    try {
      setIsLoading(true);
      const bookingRes = await axios.get("http://localhost:3000/booking/all");
      setBookings(bookingRes.data);
      const reservationRes = await axios.get("http://localhost:3000/reservation/getAllReservations");
      setReservations(reservationRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please check your network connection or the server status.');
    } finally {
      setIsLoading(false);
    }
  };


  const refreshBookingData = async () => {
    const bookingRes = await axios.get("http://localhost:3000/booking/all");
    setBookings(bookingRes.data);
  };

  useEffect(() => {
    fetchBookingData();
  }, []);
  
  // Generate dates starting from current date
  const generateDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to midnight
    today.setDate(today.getDate() - 3); // Start from 4 days ago
    const startDate = new Date(today);
    today.setDate(today.getDate() + 3);
    
    const daysToShow = 23;
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push({
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return dates;
  }, [currentDate]);

  const currentMonthName = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedRoomType === 'all' || room.type === selectedRoomType;
      return matchesSearch && matchesType && room.isActive;
    });
  }, [rooms, searchTerm, selectedRoomType]);

  const isDateInPeriod = (date: string, checkinDate: string, checkoutDate: string): boolean => {
    const adjustedCheckinDate = new Date(checkinDate);
    adjustedCheckinDate.setDate(adjustedCheckinDate.getDate() - 1);
    const adjustedCheckinStr = adjustedCheckinDate.toISOString().split('T')[0];
    return date >= adjustedCheckinStr && date < checkoutDate;
  };

  const getItemForRoomAndDate = (roomNumber: string, date: string): { type: 'booking' | 'reservation' | null, item: Bookings | Reservation | null } => {
    const roomNum = parseInt(roomNumber);
    
    const booking = bookings.find(booking => 
      booking.room_num && 
      Array.isArray(booking.room_num) &&
      booking.room_num.includes(roomNum) &&
      isDateInPeriod(date, booking.checkin_date, booking.checkout_date)
    );
    
    if (booking) {
      return { type: 'booking', item: booking };
    }
    
    const reservation = reservations.find(reservation => 
      reservation.room_num && 
      Array.isArray(reservation.room_num) &&
      reservation.room_num.includes(roomNum) &&
      isDateInPeriod(date, reservation.checkin_date, reservation.checkout_date)
    );
    
    if (reservation) {
      return { type: 'reservation', item: reservation };
    }
    
    return { type: null, item: null };
  };

  const getItemTypeColor = (type: 'booking' | 'reservation' | null): string => {
    if (!type) return '';
    
    switch (type) {
      case 'booking':
        return 'bg-emerald-500 text-white';
      case 'reservation':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isItemStart = (roomNumber: string, date: string): boolean => {
    const { type, item } = getItemForRoomAndDate(roomNumber, date);
    if (!item || !type) return false;
    
    const adjustedCheckinDate = new Date(type === 'booking' ? (item as Bookings).checkin_date : (item as Reservation).checkin_date);
    adjustedCheckinDate.setDate(adjustedCheckinDate.getDate() - 1);
    const adjustedCheckinStr = adjustedCheckinDate.toISOString().split('T')[0];
    
    return adjustedCheckinStr === date;
  };

  const calculateItemSpan = (roomNumber: string, startDate: string): number => {
    const { type, item } = getItemForRoomAndDate(roomNumber, startDate);
    if (!item || !type) return 0;

    let checkin: string;
    let checkout: string;

    if (type === 'booking') {
      const booking = item as Bookings;
      const adjustedCheckinDate = new Date(booking.checkin_date);
      adjustedCheckinDate.setDate(adjustedCheckinDate.getDate() - 1);
      checkin = adjustedCheckinDate.toISOString().split('T')[0];
      checkout = booking.checkout_date;
    } else {
      const reservation = item as Reservation;
      const adjustedCheckinDate = new Date(reservation.checkin_date);
      adjustedCheckinDate.setDate(adjustedCheckinDate.getDate() - 1);
      checkin = adjustedCheckinDate.toISOString().split('T')[0];
      checkout = reservation.checkout_date;
    }
    
    const startIdx = generateDates.findIndex(d => d.fullDate === startDate);
    if (startIdx === -1) return 1;

    let span = 0;
    for (let i = startIdx; i < generateDates.length; i++) {
      if (isDateInPeriod(generateDates[i].fullDate, checkin, checkout)) {
        span++;
      } else {
        break;
      }
    }

    return span || 1;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const roomTypeGroups = [
    { title: 'Single Rooms', type: 'single', color: 'bg-green-500' },
    { title: 'Double Rooms', type: 'double', color: 'bg-teal-500' },
    { title: 'Family Romms', type: 'family', color: 'bg-emerald-600' }
  ];

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
    fetchBookingData();
  };

  const handleAskRoomService = async (bookingId: number) => {
    try {
      await axios.patch(`http://localhost:3000/booking/update/${bookingId}`, { service_asked: true });
      console.log(`Room service requested for booking ID: ${bookingId}`);
      alert(`Room service requested for booking ID: ${bookingId}`);
      // Optimistically update the local state or refetch bookings to reflect the change
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.booking_id === bookingId ? { ...booking, service_asked: true } : booking
        )
      );
    } catch (err) {
      console.error(`Error requesting room service for booking ${bookingId}:`, err);
      alert('Failed to request room service.');
    }
  };

  const cellWidth = 48;

  // Modified to get each room with its associated booking ID
  const getBookedRoomsForHousekeeping = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const bookedRoomsList: { roomNumber: number; bookingId: number; serviceAsked: boolean }[] = [];

    bookings.forEach(booking => {
      // Check if the booking is active today
      if (isDateInPeriod(todayStr, booking.checkin_date, booking.checkout_date)) {
        booking.room_num.forEach(roomNum => {
          bookedRoomsList.push({
            roomNumber: roomNum,
            bookingId: booking.booking_id,
            serviceAsked: booking.service_asked || false // Default to false if undefined
          });
        });
      }
    });

    // Sort by room number for better readability
    return bookedRoomsList.sort((a, b) => a.roomNumber - b.roomNumber);
  }, [bookings]); // Depend on bookings state

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={handleRetry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
            <div className="text-sm text-gray-500">
              Or continue with demo data:
            </div>
            <button 
              onClick={() => {setError(null); setIsLoading(false);}} // Allows continuing with empty data
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
        <div className="bg-white border-b border-gray-200 px-3 lg:px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Front Desk</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative text-black ">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black  w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-48 lg:w-64 text-sm"
                />
              </div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Booking</span>
                <span className="sm:hidden">Add</span>
              </button>
              {/* New "Reservation Check-in" button */}
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Reservation Check-in</span>
                <span className="sm:hidden">Check-in</span>
              </button>
              {/* New "Housekeeping" button - Removed from here as it's now in the sidebar */}
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-3 lg:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">{currentMonthName}</h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-black lg:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 lg:p-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
            <div className="border-b border-gray-300 bg-gray-50">
              <div className="flex">
                <div className="w-32 p-3 border-r border-gray-300 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">Rooms</span>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div className="flex" style={{ minWidth: `${generateDates.length * cellWidth}px` }}>
                    {generateDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 p-2 text-center border-r border-gray-300 last:border-r-0 ${
                          
                          dateObj.isToday ? 'bg-emerald-50' : ''
                        }`}
                        style={{ width: `${cellWidth}px` }}
                      >
                        <div className="text-xs text-gray-500 mb-0.5">{dateObj.dayName}</div>
                        <div className={`text-sm font-medium ${
                          dateObj.isToday ? 'text-emerald-600' : 'text-gray-900'
                        }`}>
                          {dateObj.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {roomTypeGroups.map((group) => {
              const groupRooms = filteredRooms.filter(room => room.type === group.type);
              
              if (groupRooms.length === 0) return null;
              
              return (
                <div key={group.type} className="border-b border-gray-200 last:border-b-0">
                  
                  {/* Group Header with centered text and darker background */}
                  <div className="bg-gray-200 border-b border-gray-300 flex items-center justify-center">
                  
                    <div className="w-32 p-3 border-r border-gray-300 flex-shrink-0 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700  text-center flex-1">{group.title}</span>
                      
                    </div>
                    <div className="flex-1"></div>
                  </div>

                  {groupRooms.map((room) => (
                    <div key={room.id} className="border-b border-gray-200 last:border-b-0">
                      <div className="flex">
                        <div className="w-32 p-3 border-r border-gray-300 flex-shrink-0 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
                            <span className="font-medium text-gray-900 text-sm">{room.number}</span>
                          </div>
                          <button className="p-0.5 hover:bg-gray-100 rounded">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto">
                          <div className="flex relative" style={{ minWidth: `${generateDates.length * cellWidth}px` }}>
                            {generateDates.map((dateObj, dateIndex) => {
                              const { type, item } = getItemForRoomAndDate(room.number, dateObj.fullDate);
                              const isStart = isItemStart(room.number, dateObj.fullDate);
                              const span = isStart ? calculateItemSpan(room.number, dateObj.fullDate) : 0;
                              
                              return (
                                <div
                                  key={dateIndex}
                                  className={`flex-shrink-0 h-12 border-r border-gray-300 last:border-r-0 relative ${
                                    dateObj.isToday ? 'bg-emerald-50' : 'bg-white'
                                  }`}
                                  style={{ width: `${cellWidth}px` }}
                                >
                                  {type && isStart && item && (
                                    <div 
                                      className={`absolute top-1 bottom-1 left-1 rounded-sm flex items-center justify-center text-xs font-medium ${getItemTypeColor(type)}`}
                                      style={{ 
                                        width: `${(span * cellWidth) - 8}px`,
                                        zIndex: 10
                                      }}
                                    >
                                      <span className="truncate px-1" title={`${type === 'booking' ? 'Booking' : 'Reservation'} ${type === 'booking' ? (item as Bookings).booking_id : (item as Reservation).reservation_id}`}>
                                        {type === 'booking' ? 'B' : 'R'}-{type === 'booking' ? (item as Bookings).booking_id : (item as Reservation).reservation_id}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-2 lg:px-3 pb-3">
          <div className="bg-white rounded-lg border border-gray-300 p-3">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-sm text-gray-600">Booking (B-ID)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Reservation (R-ID)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Single Room</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded"></div>
                <span className="text-sm text-gray-600">Double Room</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                <span className="text-sm text-gray-600">Family Room</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Housekeeping Dialog */}
      {housekeepingDialogOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Housekeeping Requests</h3>
              <button
                onClick={() => setHousekeepingDialogOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {getBookedRoomsForHousekeeping.length > 0 ? (
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {getBookedRoomsForHousekeeping.map((roomInfo, index) => (
                  <li key={`${roomInfo.bookingId}-${roomInfo.roomNumber}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Room Number: <span className="font-semibold">{roomInfo.roomNumber}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Booking ID: <span className="font-semibold">{roomInfo.bookingId}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAskRoomService(roomInfo.bookingId)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                        roomInfo.serviceAsked 
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                      disabled={roomInfo.serviceAsked}
                    >
                      {roomInfo.serviceAsked ? 'Service Asked' : 'Ask Room Service'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No active bookings requiring housekeeping.</p>
            )}
            <div className="mt-6 text-right">
              <button
                onClick={() => setHousekeepingDialogOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function HotelBookingSystem() {
  return <FrontDesk />;
}