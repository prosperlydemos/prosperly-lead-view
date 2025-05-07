
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateForInput, parseDateInput } from '@/utils/dateUtils';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = parseDateInput(e.target.value);
    onChange(dateValue);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <Input
          type="datetime-local"
          value={formatDateForInput(value)}
          onChange={handleChange}
          className="w-full"
        />
        {value && (
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleClear}
          >
            <span className="sr-only">Clear</span>
            <span>×</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateInput;
