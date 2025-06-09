/**
 * Date formatting utilities for TickTick API
 */

/**
 * Format a date to TickTick API format: "yyyy-MM-dd'T'HH:mm:ssZ"
 * Example: "2019-11-13T03:00:00+0000"
 * 
 * @param date - Date string, Date object, or ISO string
 * @returns Formatted date string or undefined if input is invalid
 */
export function formatTickTickDate(date: string | Date | undefined): string | undefined {
  if (!date) {
    return undefined;
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return undefined;
    }

    // Format date components using UTC to avoid timezone confusion
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const hours = String(dateObj.getUTCHours()).padStart(2, '0');
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');

    // Use +0000 (UTC) format as shown in TickTick API examples
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+0000`;
  } catch (error) {
    return undefined;
  }
}

/**
 * Parse a TickTick API date format to a Date object
 * 
 * @param dateStr - Date string in TickTick format
 * @returns Date object or undefined if parsing fails
 */
export function parseTickTickDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) {
    return undefined;
  }

  try {
    // TickTick format: "yyyy-MM-dd'T'HH:mm:ssZ" where Z is ±HHMM
    // Convert to ISO format by inserting colon in timezone offset
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2})(\d{2})$/);
    if (match) {
      const isoDate = `${match[1]}${match[2]}:${match[3]}`;
      return new Date(isoDate);
    }
    
    // Try parsing as-is if it doesn't match expected format
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch (error) {
    return undefined;
  }
}