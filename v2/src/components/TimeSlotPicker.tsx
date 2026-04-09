"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sun, Sunset, Moon, Clock } from "lucide-react";

interface TimeSlotPickerProps {
  value: string;
  onChange: (time: string) => void;
  availableSlots?: string[];
  showShifts?: boolean;
}

const shifts = [
  { id: "morning", label: "בוקר", icon: Sun, color: "text-amber-500 bg-amber-50", times: ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30"] },
  { id: "afternoon", label: "צהריים", icon: Clock, color: "text-blue-500 bg-blue-50", times: ["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30"] },
  { id: "evening", label: "ערב", icon: Sunset, color: "text-orange-500 bg-orange-50", times: ["17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30"] },
  { id: "night", label: "לילה", icon: Moon, color: "text-indigo-500 bg-indigo-50", times: ["21:00","21:30","22:00","22:30","23:00"] },
];

const defaultSlots = shifts.flatMap((s) => s.times);

export default function TimeSlotPicker({ value, onChange, availableSlots, showShifts = true }: TimeSlotPickerProps) {
  const [activeShift, setActiveShift] = useState<string | null>(null);
  const slots = availableSlots || defaultSlots;

  const getShiftForTime = (time: string) => shifts.find((s) => s.times.includes(time));

  const visibleSlots = activeShift
    ? shifts.find((s) => s.id === activeShift)?.times.filter((t) => slots.includes(t)) || []
    : slots;

  return (
    <div className="space-y-3">
      {/* Shift Selector */}
      {showShifts && (
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setActiveShift(null)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
              !activeShift ? "bg-carefd-teal text-white shadow-glow" : "bg-white text-slate-600 border border-slate-200 hover:border-carefd-teal")}>
            <Clock className="w-3.5 h-3.5" />הכל
          </button>
          {shifts.map((shift) => {
            const available = shift.times.filter((t) => slots.includes(t)).length;
            if (available === 0) return null;
            return (
              <button key={shift.id} type="button" onClick={() => setActiveShift(activeShift === shift.id ? null : shift.id)}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                  activeShift === shift.id ? "bg-carefd-teal text-white shadow-glow" : `bg-white text-slate-600 border border-slate-200 hover:border-carefd-teal`)}>
                <shift.icon className="w-3.5 h-3.5" />{shift.label}
                <span className="text-[10px] opacity-70">({available})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Time Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {visibleSlots.map((slot) => {
          const shift = getShiftForTime(slot);
          const isSelected = value === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              className={cn(
                "px-2 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                isSelected
                  ? "bg-carefd-teal text-white shadow-glow scale-105"
                  : "bg-white text-carefd-navy border-2 border-slate-100 hover:border-carefd-teal hover:text-carefd-teal"
              )}
            >
              {slot}
              {/* Shift indicator dot */}
              {!isSelected && shift && (
                <span className={cn("absolute top-1 end-1 w-1.5 h-1.5 rounded-full",
                  shift.id === "morning" ? "bg-amber-400" :
                  shift.id === "afternoon" ? "bg-blue-400" :
                  shift.id === "evening" ? "bg-orange-400" : "bg-indigo-400"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {visibleSlots.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">אין שעות זמינות</p>
      )}
    </div>
  );
}
