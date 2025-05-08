
import * as React from "react";
import { format, isAfter, isBefore, isEqual, isToday, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DateRangePickerValue = {
  from: Date | undefined;
  to: Date | undefined;
};

export type DateRangePreset = {
  name: string;
  label: string;
  value: () => DateRangePickerValue;
};

export type DateRangePickerProps = {
  value: DateRangePickerValue;
  onChange: (value: DateRangePickerValue) => void;
  presets?: DateRangePreset[];
  align?: "start" | "center" | "end";
  className?: string;
};

export const defaultPresets: DateRangePreset[] = [
  {
    name: "today",
    label: "Today",
    value: () => {
      const today = new Date();
      return {
        from: today,
        to: today,
      };
    },
  },
  {
    name: "yesterday",
    label: "Yesterday",
    value: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: yesterday,
        to: yesterday,
      };
    },
  },
  {
    name: "last7",
    label: "Last 7 days",
    value: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    name: "last30",
    label: "Last 30 days",
    value: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    name: "thisMonth",
    label: "This month",
    value: () => {
      const now = new Date();
      return {
        from: startOfMonth(now),
        to: now,
      };
    },
  },
  {
    name: "lastMonth",
    label: "Last month",
    value: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    name: "allTime",
    label: "All time",
    value: () => ({
      from: new Date(2020, 0, 1), // Arbitrary past date
      to: new Date(),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  align = "end",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Find the active preset based on the current value
  const activePreset = React.useMemo(() => {
    if (!value.from || !value.to) return undefined;
    
    return presets.find((preset) => {
      const presetValue = preset.value();
      
      if (!presetValue.from || !presetValue.to) return false;
      
      // Special case for "All time"
      if (preset.name === "allTime") {
        const now = new Date();
        return (
          isBefore(presetValue.from, value.from) &&
          (isEqual(presetValue.to, now) || 
           isToday(presetValue.to) && isToday(value.to))
        );
      }
      
      // Compare dates (ignoring time)
      const fromMatch = 
        presetValue.from.getFullYear() === value.from.getFullYear() &&
        presetValue.from.getMonth() === value.from.getMonth() &&
        presetValue.from.getDate() === value.from.getDate();
      
      const toMatch = 
        presetValue.to.getFullYear() === value.to.getFullYear() &&
        presetValue.to.getMonth() === value.to.getMonth() &&
        presetValue.to.getDate() === value.to.getDate();
      
      return fromMatch && toMatch;
    });
  }, [value, presets]);

  const formattedDate = React.useMemo(() => {
    if (!value.from) return "Select date range";
    
    if (value.to) {
      // If from and to are the same date
      if (
        value.from.getDate() === value.to.getDate() &&
        value.from.getMonth() === value.to.getMonth() &&
        value.from.getFullYear() === value.to.getFullYear()
      ) {
        return format(value.from, "MMM d, yyyy");
      }
      
      // Date range
      return `${format(value.from, "MMM d, yyyy")} - ${format(
        value.to,
        "MMM d, yyyy"
      )}`;
    }
    
    // Only from date
    return format(value.from, "MMM d, yyyy");
  }, [value]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2">
          {/* Calendar Popup Trigger */}
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant="outline"
              className="justify-between text-left w-[300px] font-normal"
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {activePreset?.label || formattedDate}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          
          {/* Dropdown Menu for Quick Selections */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hidden sm:flex" // Hide on mobile
              >
                <span className="sr-only">Quick select</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.name}
                  className={cn(
                    "cursor-pointer",
                    activePreset?.name === preset.name && "font-medium bg-accent"
                  )}
                  onClick={() => {
                    const newValue = preset.value();
                    onChange(newValue);
                  }}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Calendar Popover Content */}
        <PopoverContent align={align} className="flex flex-col w-auto p-0" side="bottom">
          <div className="flex flex-col sm:flex-row">
            {/* Preset options */}
            <div className="border-r p-2">
              <div className="flex flex-col space-y-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={activePreset?.name === preset.name ? "default" : "ghost"}
                    className="justify-start text-left font-normal"
                    onClick={() => {
                      const newValue = preset.value();
                      onChange(newValue);
                      setIsOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="justify-start text-left font-normal"
                  onClick={() => {
                    // Reset the selection for custom date range
                    onChange({ from: undefined, to: undefined });
                  }}
                >
                  Custom
                </Button>
              </div>
            </div>
            
            {/* Calendar */}
            <div>
              <Calendar
                mode="range"
                selected={{
                  from: value.from,
                  to: value.to,
                }}
                onSelect={onChange}
                numberOfMonths={1}
                initialFocus
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between p-3 border-t">
            {value.from && value.to && (
              <p className="text-sm text-muted-foreground">
                {Math.abs(
                  Math.floor(
                    (value.to.getTime() - value.from.getTime()) / (24 * 60 * 60 * 1000)
                  )
                ) + 1}{" "}
                days
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange({ from: undefined, to: undefined });
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
