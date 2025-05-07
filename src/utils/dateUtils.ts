
/**
 * Utility functions for date handling in forms
 */

/**
 * Format a date string for datetime-local input
 * @param dateStr Date string to format
 * @returns Formatted date string for datetime-local input (YYYY-MM-DDThh:mm)
 */
export const formatDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error("Invalid date format:", dateStr);
      return '';
    }
    // Format as YYYY-MM-DDThh:mm (format required by datetime-local)
    return date.toISOString().slice(0, 16);
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

/**
 * Parse a date string from an input and convert to ISO format
 * @param value Date string from input
 * @returns ISO date string or null if invalid/empty
 */
export const parseDateInput = (value: string): string | null => {
  if (!value || value.trim() === '') return null;
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.error("Invalid date input:", value);
      return null;
    }
    return date.toISOString();
  } catch (e) {
    console.error("Error parsing date input:", value, e);
    return null;
  }
};
