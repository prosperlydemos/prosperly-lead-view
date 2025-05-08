
import React from 'react';
import DatePicker from './DatePicker';
import { parseDateToISO } from '@/utils/dateUtils';
import { Button } from './ui/button';

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
  console.log(`DateInput rendered for ${label} with value:`, value);
  
  // Convert ISO string to Date object for the DatePicker
  const dateValue = value ? new Date(value) : undefined;
  
  const handleChange = (date: Date | undefined) => {
    console.log(`DateInput change for ${label}:`, date);
    
    if (!date) {
      console.log(`Setting ${label} to null`);
      onChange(null);
      return;
    }
    
    // Convert date to ISO string (YYYY-MM-DD format) using UTC values
    const isoDate = parseDateToISO(date);
    console.log(`Parsed ${label} to ISO:`, isoDate);
    onChange(isoDate);
  };

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
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
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Clearing ${label} date`);
              onChange(null);
            }}
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
