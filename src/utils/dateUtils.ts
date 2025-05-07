
/**
 * Utility functions for date handling in forms
 */
import { format, parse } from "date-fns";

/**
 * Format a date string for display or input
 * @param dateStr Date string to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error("Invalid date format:", dateStr);
      return '';
    }
    // Format as YYYY-MM-DD (without time component)
    return format(date, "yyyy-MM-dd");
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

/**
 * Format a date for display to users
 * @param dateStr Date string to format
 * @returns User-friendly formatted date string (e.g., "May 7, 2025")
 */
export const formatDateForDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error("Invalid date format for display:", dateStr);
      return '';
    }
    return format(date, "MMM d, yyyy"); // e.g., "May 7, 2025"
  } catch (e) {
    console.error("Error formatting date for display:", e);
    return '';
  }
};

/**
 * Parse a date and convert to ISO format YYYY-MM-DD (without time component)
 * @param date Date object or string
 * @returns ISO date string format YYYY-MM-DD or null if invalid
 */
export const parseDateToISO = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    console.log("parseDateToISO input:", date);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date for ISO conversion:", date);
      return null;
    }
    
    // Create date in local timezone
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    // Format as YYYY-MM-DD
    const isoDate = `${year}-${month}-${day}`;
    console.log(`Converting date: ${dateObj} to ISO format: ${isoDate}`);
    
    return isoDate;
  } catch (e) {
    console.error("Error parsing date to ISO:", e);
    return null;
  }
};
