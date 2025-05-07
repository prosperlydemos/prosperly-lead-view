
import * as React from "react";
import { format } from "date-fns";
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
  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log("Date selected in DatePicker:", selectedDate);
    onSelect(selectedDate);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    console.log("DatePicker trigger clicked");
    e.stopPropagation();
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    console.log("Calendar clicked");
    e.stopPropagation();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal pointer-events-auto",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
          type="button"
          onClick={handleTriggerClick}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateForDisplay(date.toISOString()) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[200]" 
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          // Prevent auto focus to avoid closing the popover
          e.preventDefault();
        }}
        onClick={handleCalendarClick}
      >
        <div 
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
