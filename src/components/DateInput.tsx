
import React from 'react';
import { Button } from '@/components/ui/button';
import DatePicker from './DatePicker';
import { parseDateToISO } from '@/utils/dateUtils';

interface DateInputProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({ 
  label, 
  value, 
  onChange,
  className 
}) => {
  // Convert ISO string to Date object for the DatePicker
  const dateValue = value ? new Date(value) : undefined;
  
  const handleChange = (date: Date | undefined) => {
    console.log("DateInput handleChange called with date:", date);
    if (!date) {
      onChange(null);
      return;
    }
    
    // Convert date to ISO string at midnight UTC
    const isoDate = parseDateToISO(date);
    console.log("Converted to ISO:", isoDate);
    onChange(isoDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("DateInput clearing value");
    onChange(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <div className="w-full">
          <DatePicker
            date={dateValue}
            onSelect={handleChange}
            placeholder="Select date"
          />
        </div>
        {value && (
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleClear}
            tabIndex={0}
          >
            <span className="sr-only">Clear</span>
            <span aria-hidden="true">×</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateInput;
