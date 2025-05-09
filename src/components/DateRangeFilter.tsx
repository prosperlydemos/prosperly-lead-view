
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type DateFilterOption = 'this-month' | 'last-month' | 'this-year' | 'all';
export type DateFieldOption = 'demo_date' | 'signup_date';

interface DateRangeFilterProps {
  selectedDateFilter: DateFilterOption;
  onDateFilterChange: (filter: DateFilterOption) => void;
  selectedDateField: DateFieldOption;
  onDateFieldChange: (field: DateFieldOption) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedDateFilter,
  onDateFilterChange,
  selectedDateField,
  onDateFieldChange,
}) => {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 items-start md:items-center">
      <div className="flex space-x-1">
        <Button
          variant={selectedDateFilter === 'this-month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onDateFilterChange('this-month')}
        >
          This Month
        </Button>
        <Button
          variant={selectedDateFilter === 'last-month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onDateFilterChange('last-month')}
        >
          Last Month
        </Button>
        <Button
          variant={selectedDateFilter === 'this-year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onDateFilterChange('this-year')}
        >
          This Year
        </Button>
        <Button
          variant={selectedDateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onDateFilterChange('all')}
        >
          All
        </Button>
      </div>
      <div className="flex items-center">
        <span className="text-sm mr-2">Filter by:</span>
        <Select
          value={selectedDateField}
          onValueChange={(value) => onDateFieldChange(value as DateFieldOption)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select date field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="demo_date">Demo Date</SelectItem>
            <SelectItem value="signup_date">Signup Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DateRangeFilter;
