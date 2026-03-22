import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import '../styles/calendar.css';

const BookingCalendar = ({ onDateSelect, availability = [], bookedSlots = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      // Disable past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return true;
      }

      // Check if provider is available on this day
      if (availability.length > 0) {
        const dayName = format(date, 'EEEE').toLowerCase();
        const isAvailable = availability.some(
          slot => slot.day.toLowerCase() === dayName && slot.is_available
        );
        return !isAvailable;
      }
    }
    return false;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (bookedSlots.includes(dateStr)) {
        return 'booked-date';
      }
    }
    return null;
  };

  return (
    <div className="booking-calendar overflow-hidden">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileDisabled={tileDisabled}
        tileClassName={tileClassName}
        minDate={new Date()}
        className="carefd-calendar"
        locale="he-IL"
        formatShortWeekday={(locale, date) => {
          const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
          return days[date.getDay()];
        }}
      />
    </div>
  );
};

export default BookingCalendar;