
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
      
      // Create a new date using local time to preserve the exact selected date
      const selectedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        12, 0, 0
      );
      
      console.log('DatePicker preserved date:', selectedDate);
      onSelect(selectedDate);
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
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateForDisplay(date.toISOString()) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[300]" 
        align="start" 
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
