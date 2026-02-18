import React, { useState } from 'react';
import { format } from 'date-fns';

const TimeSlotPicker = ({ selectedDate, availability = [], onTimeSelect, bookedTimes = [] }) => {
  const [selectedTime, setSelectedTime] = useState('');

  // Default availability if provider hasn't set one
  const defaultAvailability = [
    { day: 'sunday', start_time: '09:00', end_time: '18:00', is_available: true },
    { day: 'monday', start_time: '09:00', end_time: '18:00', is_available: true },
    { day: 'tuesday', start_time: '09:00', end_time: '18:00', is_available: true },
    { day: 'wednesday', start_time: '09:00', end_time: '18:00', is_available: true },
    { day: 'thursday', start_time: '09:00', end_time: '18:00', is_available: true },
    { day: 'friday', start_time: '09:00', end_time: '14:00', is_available: true },
    { day: 'saturday', start_time: '00:00', end_time: '00:00', is_available: false },
  ];

  const effectiveAvailability = availability && availability.length > 0 ? availability : defaultAvailability;

  const generateTimeSlots = () => {
    if (!selectedDate) {
      return [];
    }

    const dayName = format(selectedDate, 'EEEE').toLowerCase();
    const dayAvailability = effectiveAvailability.find(
      slot => slot.day.toLowerCase() === dayName && slot.is_available
    );

    if (!dayAvailability) {
      return [];
    }

    const slots = [];
    const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')} ${timeStr}`;
      
      slots.push({
        time: timeStr,
        dateTime: dateTimeStr,
        isBooked: bookedTimes.includes(dateTimeStr)
      });

      // Add 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    if (onTimeSelect) {
      onTimeSelect(time);
    }
  };

  if (!selectedDate) {
    return (
      <div className="text-center text-carelink-gray py-8">
        אנא בחר תאריך תחילה
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center text-carelink-gray py-8">
        אין שעות פנויות בתאריך זה
      </div>
    );
  }

  return (
    <div className="time-slot-picker">
      <h3 className="text-lg font-semibold mb-4 text-carelink-navy">
        בחר שעה ל-{format(selectedDate, 'dd/MM/yyyy')}
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {timeSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => !slot.isBooked && handleTimeClick(slot.time)}
            disabled={slot.isBooked}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              slot.isBooked
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : selectedTime === slot.time
                ? 'bg-carelink-teal text-white shadow-lg'
                : 'bg-white border-2 border-carelink-teal-pale text-carelink-navy hover:bg-carelink-teal-pale hover:border-carelink-teal'
            }`}
            data-testid={`time-slot-${slot.time}`}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;