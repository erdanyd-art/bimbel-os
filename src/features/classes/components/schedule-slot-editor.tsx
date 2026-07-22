"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ScheduleSlot } from "@/features/classes/types";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function ScheduleSlotEditor({
  slots,
  onChange,
  disabled,
  errors,
}: {
  slots: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
  disabled?: boolean;
  errors?: Record<number, string>;
}) {
  function updateSlot(index: number, patch: Partial<ScheduleSlot>) {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  function addSlot() {
    onChange([...slots, { dayOfWeek: 1, startTime: "16:00", endTime: "17:30" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {slots.map((slot, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`schedule-day-${index}`}>Day</Label>
              <Select
                id={`schedule-day-${index}`}
                value={slot.dayOfWeek}
                disabled={disabled}
                onChange={(event) => updateSlot(index, { dayOfWeek: Number(event.target.value) })}
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`schedule-start-${index}`}>Start</Label>
              <Input
                id={`schedule-start-${index}`}
                type="time"
                value={slot.startTime}
                disabled={disabled}
                onChange={(event) => updateSlot(index, { startTime: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`schedule-end-${index}`}>End</Label>
              <Input
                id={`schedule-end-${index}`}
                type="time"
                value={slot.endTime}
                disabled={disabled}
                onChange={(event) => updateSlot(index, { endTime: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => removeSlot(index)}
              aria-label={`Remove time slot ${index + 1}`}
            >
              <X className="size-4" />
            </Button>
          </div>
          {errors?.[index] ? <p className="text-destructive text-xs">{errors[index]}</p> : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={addSlot}
        className="w-fit"
      >
        <Plus className="size-4" />
        Add time slot
      </Button>
    </div>
  );
}
