
import { format, parse } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

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
    
    // Convert to Eastern Time
    const easternDate = toZonedTime(date, TIMEZONE);
    return format(easternDate, "yyyy-MM-dd");
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
    
    // Convert to Eastern Time
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
    
    // Get UTC date components to ensure consistent date handling
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    // Format as YYYY-MM-DD
    const isoDate = `${year}-${month}-${day}`;
    console.log(`Converting date: ${dateObj} to ISO format: ${isoDate}`);
    
    return isoDate;
  } catch (e) {
    console.error("Error parsing date to ISO:", e);
    return null;
  }
};
