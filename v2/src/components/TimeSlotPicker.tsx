"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';

// Shift time definitions
const SHIFT_TIMES = {
  morning: { start: '06:00', end: '12:00' },
  afternoon: { start: '12:00', end: '18:00' },
  evening: { start: '18:00', end: '22:00' },
  night: { start: '22:00', end: '23:59' }
};

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

  // Convert shift-based availability to time-based
  const convertShiftToTime = (shiftAvailability) => {
    if (!shiftAvailability || shiftAvailability.length === 0) {
      return null;
    }

    // Check if it's shift-based (has 'shift' property) or time-based (has 'start_time')
    const isShiftBased = shiftAvailability[0]?.shift !== undefined;
    
    if (!isShiftBased) {
      return shiftAvailability; // Already time-based
    }

    // Group shifts by day
    const dayShifts = {};
    shiftAvailability.forEach(slot => {
      if (slot.is_available && slot.shift) {
        if (!dayShifts[slot.day]) {
          dayShifts[slot.day] = [];
        }
        dayShifts[slot.day].push(slot.shift);
      }
    });

    // Convert to time-based format
    const timeBasedAvailability = [];
    Object.entries(dayShifts).forEach(([day, shifts]) => {
      // Sort shifts by start time
      shifts.sort((a, b) => {
        const aStart = parseInt(SHIFT_TIMES[a]?.start?.split(':')[0] || '0');
        const bStart = parseInt(SHIFT_TIMES[b]?.start?.split(':')[0] || '0');
        return aStart - bStart;
      });

      // Add each shift as a separate time slot
      shifts.forEach(shift => {
        const shiftTime = SHIFT_TIMES[shift];
        if (shiftTime) {
          timeBasedAvailability.push({
            day: day,
            start_time: shiftTime.start,
            end_time: shiftTime.end,
            is_available: true,
            shift: shift
          });
        }
      });
    });

    return timeBasedAvailability;
  };

  const effectiveAvailability = (() => {
    if (!availability || availability.length === 0) {
      return defaultAvailability;
    }
    const converted = convertShiftToTime(availability);
    return converted && converted.length > 0 ? converted : defaultAvailability;
  })();

  const generateTimeSlots = () => {
    if (!selectedDate) {
      return [];
    }

    const dayName = format(selectedDate, 'EEEE').toLowerCase();
    
    // Find all availability slots for this day
    const dayAvailabilitySlots = effectiveAvailability.filter(
      slot => slot.day?.toLowerCase() === dayName && slot.is_available
    );

    if (!dayAvailabilitySlots || dayAvailabilitySlots.length === 0) {
      return [];
    }

    const slots = [];
    const addedTimes = new Set(); // Prevent duplicates

    dayAvailabilitySlots.forEach(dayAvailability => {
      if (!dayAvailability.start_time || !dayAvailability.end_time) {
        return;
      }

      const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number);
      const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        
        if (!addedTimes.has(timeStr)) {
          addedTimes.add(timeStr);
          const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')} ${timeStr}`;
          
          slots.push({
            time: timeStr,
            dateTime: dateTimeStr,
            isBooked: bookedTimes.includes(dateTimeStr),
            shift: dayAvailability.shift
          });
        }

        // Add 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    });

    // Sort slots by time
    slots.sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number);
      const [bHour, bMin] = b.time.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });

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
      <div className="text-center text-carefd-gray py-8">
        אנא בחר תאריך תחילה
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center text-carefd-gray py-8">
        אין שעות פנויות בתאריך זה
      </div>
    );
  }

  return (
    <div className="time-slot-picker">
      <h3 className="text-lg font-semibold mb-4 text-carefd-navy">
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
                ? 'bg-carefd-teal text-white shadow-lg'
                : 'bg-white border-2 border-carefd-teal-pale text-carefd-navy hover:bg-carefd-teal-pale hover:border-carefd-teal'
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
