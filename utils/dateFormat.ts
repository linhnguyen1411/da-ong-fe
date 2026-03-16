/**
 * Helper function to format date and time
 * Formats to: hh:mm dd/mm/yyyy
 * 
 * @param dateStr - Date string (ISO string or date string like "2025-12-23")
 * @param timeStr - Optional time string (ISO string or time string like "18:00")
 * @returns Formatted string in format "hh:mm dd/mm/yyyy" or "dd/mm/yyyy" if no time
 */
export const formatDateTime = (dateStr: string | null | undefined, timeStr?: string | null | undefined): string => {
  if (!dateStr) return '';
  
  // Handle date string (could be ISO string or date string)
  let date: Date;
  try {
    if (dateStr.includes('T')) {
      // ISO string like "2000-01-01T18:00:00.000Z" or "2025-12-23T18:00:00.000Z"
      date = new Date(dateStr);
    } else {
      // Date string like "2025-12-23"
      date = new Date(dateStr + 'T00:00:00');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if invalid
    }
  } catch (e) {
    return dateStr; // Return original if error
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  // Handle time string (could be ISO string or time string)
  let time = '';
  if (timeStr) {
    try {
      if (timeStr.includes('T') || timeStr.includes('Z')) {
        // ISO string - extract time part and convert to Vietnam timezone (UTC+7)
        const timeDate = new Date(timeStr);
        if (!isNaN(timeDate.getTime())) {
          // Convert to Vietnam timezone (UTC+7)
          const vnTime = new Date(timeDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
          const hours = String(vnTime.getHours()).padStart(2, '0');
          const minutes = String(vnTime.getMinutes()).padStart(2, '0');
          time = `${hours}:${minutes}`;
        } else {
          // Try to parse as time string
          time = timeStr.split(':').slice(0, 2).join(':');
        }
      } else if (timeStr.match(/^\d{2}:\d{2}/)) {
        // Time string like "18:00" - use directly (assumed to be in Vietnam timezone)
        time = timeStr;
      } else {
        // Try to extract time from string
        const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          time = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
    } catch (e) {
      // If error, try to extract time pattern
      const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2]}`;
      }
    }
    
    if (time) {
      return `${time} ${day}/${month}/${year}`;
    }
  }
  
  // If no timeStr but dateStr is ISO with time, extract time from dateStr
  if (dateStr.includes('T')) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    time = `${hours}:${minutes}`;
    return `${time} ${day}/${month}/${year}`;
  }
  
  return `${day}/${month}/${year}`;
};

/**
 * Format date only (without time)
 * Formats to: dd/mm/yyyy
 */
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    let date: Date;
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else {
      date = new Date(dateStr + 'T00:00:00');
    }
    
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

