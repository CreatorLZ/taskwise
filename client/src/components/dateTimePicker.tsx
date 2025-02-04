"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  time: string;
  setTime: (time: string) => void;
}

export function DateTimePicker({
  date,
  setDate,
  time,
  setTime,
}: DateTimePickerProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                // Preserve the current time when setting a new date
                const currentTime = time.split(":").map(Number);
                newDate.setHours(currentTime[0], currentTime[1], 0, 0);
              }
              setDate(newDate);
            }}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={time}
        onChange={(e) => {
          setTime(e.target.value);
          if (date) {
            // Update the date object with the new time
            const newDate = new Date(date);
            const [hours, minutes] = e.target.value.split(":").map(Number);
            newDate.setHours(hours, minutes, 0, 0);
            setDate(newDate);
          }
        }}
        className="w-full sm:w-32"
      />
    </div>
  );
}
