
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
    return format(date, "PPP"); // e.g., "May 7, 2025"
  } catch (e) {
    console.error("Error formatting date for display:", e);
    return '';
  }
};

/**
 * Parse a date and convert to ISO format at midnight UTC
 * @param date Date object or string
 * @returns ISO date string at midnight UTC or null if invalid
 */
export const parseDateToISO = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date for ISO conversion:", date);
      return null;
    }
    
    // Create date at midnight UTC - strip time component
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    // This creates a date at midnight UTC for the specified date
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    console.log(`Converting date: ${dateObj} to UTC midnight: ${utcDate.toISOString()}`);
    
    return utcDate.toISOString();
  } catch (e) {
    console.error("Error parsing date to ISO:", e);
    return null;
  }
};
