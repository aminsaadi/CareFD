"use client";

import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  value: string;
  onChange: (time: string) => void;
  availableSlots?: string[];
}

const defaultSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export default function TimeSlotPicker({ value, onChange, availableSlots = defaultSlots }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {availableSlots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={cn(
            "px-3 py-2 rounded-xl text-sm font-medium transition-all",
            value === slot
              ? "bg-carefd-teal text-white shadow-glow"
              : "bg-white text-carefd-navy border border-slate-200 hover:border-carefd-teal hover:text-carefd-teal"
          )}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
