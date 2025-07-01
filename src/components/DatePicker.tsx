
import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onSelect,
  disabled = false,
  placeholder = "Select date"
}) => {
  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      console.log('DatePicker selected date:', newDate);
      
      // Create a new UTC date with the same day to avoid timezone shifts
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      const day = newDate.getDate();
      const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
      
      console.log('DatePicker creating UTC date:', utcDate);
      onSelect(utcDate);
    } else {
      onSelect(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateForDisplay(date.toISOString()) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[300] pointer-events-auto" 
        align="start" 
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
