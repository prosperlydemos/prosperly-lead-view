
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
      
      // Create a new Date object at noon UTC to avoid timezone issues
      // Use UTC methods to get the components
      const selectedYear = newDate.getUTCFullYear();
      const selectedMonth = newDate.getUTCMonth();
      const selectedDay = newDate.getUTCDate();
      
      // Create date at noon UTC to avoid timezone shifts
      const preservedDate = new Date(Date.UTC(selectedYear, selectedMonth, selectedDay, 12, 0, 0));
      console.log('DatePicker preserved date (UTC):', preservedDate);
      
      onSelect(preservedDate);
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
