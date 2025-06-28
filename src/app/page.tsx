'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from "axios";
// Types
type Bookings = {
  booking_id: number;
  checkin_date: string;
  checkout_date: string;
  room_num: number[];
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

// Navigation items
const navigationItems = [
  { id: 'front-desk', label: 'Front Desk', icon: Calendar, active: true },
  { id: 'bookings', label: 'Bookings', icon: Calendar, active: false },
  { id: 'reception', label: 'Reception', icon: Users, active: false },
  { id: 'accounts', label: 'Accounts', icon: CreditCard, active: false },
  { id: 'checkout', label: 'Check Out', icon: LogOut, active: false },
];

// Main Component
const FrontDesk: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('front-desk');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Fixed useEffect with proper error handling
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);
        
  //       // Fetch both bookings and reservations
  //       const [bookingsResponse, reservationsResponse] = await Promise.all([
  //         axios.get("http://localhost:3000/booking/all"),
  //         axios.get("http://localhost:3000/reservation/getAllReservations")
  //       ]);
        
  //       setBookings(bookingsResponse.data);
  //       setReservations(reservationsResponse.data);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //       setError(error instanceof Error ? error.message : 'Failed to fetch data');
  //       // Set mock data for demonstration if API fails
  //       setBookings([]);
  //       setReservations([]);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);


  useEffect(() => { axios.get("http://localhost:3000/booking/all").then(res => {console.log('API Bookings Data:', res.data); setBookings(res.data)}); }, []);
  
  useEffect(() => { axios.get("http://localhost:3000/reservation/getAllReservations").then(res => setReservations(res.data)); }, []);
  
  if(!bookings || !reservations) {console.error('Error fetching data:');}

  // Generate dates starting from current date
  const generateDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    // Set the start date to today - 4 days
    today.setHours(0, 0, 0, 0); // Normalize time to midnight
    today.setDate(today.getDate() - 3); // Start from 4 days ago
    const startDate = new Date(today);
    
    // Generate dates based on screen size
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

  // Get current month name
  const currentMonthName = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Filter rooms based on search and type
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedRoomType === 'all' || room.type === selectedRoomType;
      return matchesSearch && matchesType && room.isActive;
    });
  }, [rooms, searchTerm, selectedRoomType]);

  // Check if a date falls within a booking/reservation period
  const isDateInPeriod = (date: string, checkinDate: string, checkoutDate: string): boolean => {
    return date >= checkinDate && date < checkoutDate;
  };

  // Get booking or reservation for specific room and date
  const getItemForRoomAndDate = (roomNumber: string, date: string): { type: 'booking' | 'reservation' | null, item: Bookings | Reservation | null } => {
    const roomNum = parseInt(roomNumber);
    
    
    // Check bookings first
    const booking = bookings.find(booking => 
      booking.room_num && 
      Array.isArray(booking.room_num) &&
      booking.room_num.includes(roomNum) &&
      isDateInPeriod(date, booking.checkin_date, booking.checkout_date)
    );
    
    if (booking) {
      return { type: 'booking', item: booking };
    }
    
    // Check reservations
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

  // Get item type color
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

  // Check if current date is the start of a booking/reservation
  const isItemStart = (roomNumber: string, date: string): boolean => {
    const { type, item } = getItemForRoomAndDate(roomNumber, date);
    if (!item || !type) return false;
    
    if (type === 'booking') {
      return (item as Bookings).checkin_date === date;
    } else {
      return (item as Reservation).checkin_date === date;
    }
  };

  // Calculate the span of days for a booking/reservation
  const calculateItemSpan = (roomNumber: string, startDate: string): number => {
    const { type, item } = getItemForRoomAndDate(roomNumber, startDate);
    if (!item || !type) return 0;

    let checkin: string;
    let checkout: string;

    if (type === 'booking') {
      const booking = item as Bookings;
      checkin = booking.checkin_date;
      checkout = booking.checkout_date;
    } else {
      const reservation = item as Reservation;
      checkin = reservation.checkin_date;
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

    return span;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Room type groups
  const roomTypeGroups = [
    { title: 'Single', type: 'single', color: 'bg-green-500' },
    { title: 'Double', type: 'double', color: 'bg-teal-500' },
    { title: 'Family', type: 'family', color: 'bg-emerald-600' }
  ];

  // Handle navigation item click
  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    setSidebarOpen(false);
  };

  // Retry function
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Trigger re-fetch by updating a dependency or calling the fetch function directly
    window.location.reload();
  };

  const cellWidth = 48; // Fixed cell width in pixels

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
              onClick={() => {setError(null); setIsLoading(false);}}
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-gray-900">Fillio</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeNav === item.id
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            </div>
          </div>
        </div>

        {/* Month Navigation */}
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
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs lg:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>
        </div>

        {/* Booking Grid */}
        <div className="flex-1 p-2 lg:p-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
            {/* Date Header */}
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

            {/* Room Groups */}
            {roomTypeGroups.map((group) => {
              const groupRooms = filteredRooms.filter(room => room.type === group.type);
              
              if (groupRooms.length === 0) return null;
              
              return (
                <div key={group.type} className="border-b border-gray-200 last:border-b-0">
                  {/* Group Header */}
                  <div className="bg-gray-50 border-b border-gray-300">
                    <div className="flex">
                      <div className="w-32 p-3 border-r border-gray-300 flex-shrink-0 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{group.title}</span>
                      </div>
                      <div className="flex-1"></div>
                    </div>
                  </div>

                  {/* Rooms in Group */}
                  {groupRooms.map((room) => (
                    <div key={room.id} className="border-b border-gray-200 last:border-b-0">
                      <div className="flex">
                        {/* Room Info */}
                        <div className="w-32 p-3 border-r border-gray-300 flex-shrink-0 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
                            <span className="font-medium text-gray-900 text-sm">{room.number}</span>
                          </div>
                          <button className="p-0.5 hover:bg-gray-100 rounded">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        {/* Booking Grid */}
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

        {/* Legend */}
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
    </div>
  );
};

// Export as default -
// Export as default - This is your main page component
export default function HotelBookingSystem() {
  return <FrontDesk />;
}