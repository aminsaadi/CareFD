"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface BookingCalendarProps {
  onDateSelect: (date: string) => void;
  availability?: { day: number; available: boolean }[];
  bookedSlots?: string[];
  selectedDate?: string;
}

const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function BookingCalendar({
  onDateSelect,
  availability = [],
  bookedSlots = [],
  selectedDate,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monthName = currentMonth.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

    return days;
  }, [currentMonth]);

  const isDateAvailable = (date: Date) => {
    if (date < today) return false;
    if (availability.length > 0) {
      const dayOfWeek = date.getDay();
      const dayConfig = availability.find((a) => a.day === dayOfWeek);
      if (dayConfig && !dayConfig.available) return false;
    }
    return true;
  };

  const isDateBooked = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return bookedSlots.includes(dateStr);
  };

  const isSelected = (date: Date) => {
    return selectedDate === date.toISOString().split("T")[0];
  };

  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-carefd-teal-pale/30 transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-5 h-5 text-carefd-navy" />
        </button>
        <h3 className="font-bold text-carefd-navy">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-carefd-teal-pale/30 transition"
        >
          <ChevronLeft className="w-5 h-5 text-carefd-navy" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-carefd-gray py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const available = isDateAvailable(date);
          const booked = isDateBooked(date);
          const selected = isSelected(date);
          const isPast = date < today;
          const dateStr = date.toISOString().split("T")[0];

          return (
            <button
              key={dateStr}
              onClick={() => available && !booked && onDateSelect(dateStr)}
              disabled={!available || booked}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                selected
                  ? "bg-carefd-teal text-white shadow-md"
                  : booked
                  ? "bg-red-50 text-red-300 cursor-not-allowed"
                  : isPast || !available
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-carefd-navy hover:bg-carefd-teal-pale/40 hover:text-carefd-teal"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-carefd-gray">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-carefd-teal" />
          <span>נבחר</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span>תפוס</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100" />
          <span>לא זמין</span>
        </div>
      </div>
    </div>
  );
}
