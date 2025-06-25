
import { format, parse } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Eastern Time Zone identifier
const TIMEZONE = "America/New_York";

export const formatDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error("Invalid date format:", dateStr);
      return '';
    }
    
    // Convert to Eastern time and format as YYYY-MM-DD
    const easternDate = toZonedTime(date, TIMEZONE);
    const year = easternDate.getFullYear();
    const month = String(easternDate.getMonth() + 1).padStart(2, '0');
    const day = String(easternDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

export const formatDateForDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error("Invalid date format for display:", dateStr);
      return '';
    }
    
    // Convert to Eastern time for display
    const easternDate = toZonedTime(date, TIMEZONE);
    return format(easternDate, "MMM d, yyyy");
  } catch (e) {
    console.error("Error formatting date for display:", e);
    return '';
  }
};

export const parseDateToISO = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date for ISO conversion:", date);
      return null;
    }
    
    // Convert to Eastern time, then get the date components
    const easternDate = toZonedTime(dateObj, TIMEZONE);
    const year = easternDate.getFullYear();
    const month = String(easternDate.getMonth() + 1).padStart(2, '0');
    const day = String(easternDate.getDate()).padStart(2, '0');
    
    // Format as YYYY-MM-DD
    const isoDate = `${year}-${month}-${day}`;
    console.log(`Converting date: ${dateObj} to Eastern ISO format: ${isoDate}`);
    
    return isoDate;
  } catch (e) {
    console.error("Error parsing date to ISO:", e);
    return null;
  }
};

// Helper function to get start/end of day in Eastern time
export const getEasternDayBounds = (date: Date) => {
  const easternDate = toZonedTime(date, TIMEZONE);
  
  // Start of day in Eastern time
  const startOfDay = new Date(easternDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // End of day in Eastern time  
  const endOfDay = new Date(easternDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Convert back to UTC for comparison with database dates
  return {
    start: fromZonedTime(startOfDay, TIMEZONE),
    end: fromZonedTime(endOfDay, TIMEZONE)
  };
};
