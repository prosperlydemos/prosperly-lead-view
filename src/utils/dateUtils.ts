
import { format } from "date-fns";
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

// Simple function to standardize date formats for storing in database
export const formatDateForStorage = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  
  try {
    // Parse the date and ensure it's in YYYY-MM-DD format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error("Invalid date for storage:", dateStr);
      return null;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date for storage:", e);
    return null;
  }
};
