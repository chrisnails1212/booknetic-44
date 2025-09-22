/**
 * Converts minutes to a readable time format
 * @param minutes - The time duration in minutes
 * @returns Formatted string (e.g., "30 min", "1 hour", "1 hour 30 min", "2 hours")
 */
export const formatMinutesToReadable = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} min`;
};

/**
 * Converts readable time format back to minutes
 * @param timeString - Formatted time string
 * @returns Number of minutes
 */
export const parseReadableTimeToMinutes = (timeString: string): number => {
  // Handle simple "X min" format
  const minMatch = timeString.match(/^(\d+)\s*min$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // Handle "X hour(s)" format
  const hourOnlyMatch = timeString.match(/^(\d+)\s*hours?$/);
  if (hourOnlyMatch) {
    return parseInt(hourOnlyMatch[1], 10) * 60;
  }

  // Handle "X hour(s) Y min" format
  const fullMatch = timeString.match(/^(\d+)\s*hours?\s+(\d+)\s*min$/);
  if (fullMatch) {
    const hours = parseInt(fullMatch[1], 10);
    const minutes = parseInt(fullMatch[2], 10);
    return hours * 60 + minutes;
  }

  // Fallback: return 0 if format is not recognized
  console.warn(`Unable to parse time string: ${timeString}`);
  return 0;
};

/**
 * Common time duration options in minutes for dropdowns
 */
export const TIME_DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 75, label: '1 hour 15 min' },
  { value: 90, label: '1 hour 30 min' },
  { value: 105, label: '1 hour 45 min' },
  { value: 120, label: '2 hours' },
  { value: 135, label: '2 hours 15 min' },
  { value: 150, label: '2 hours 30 min' },
  { value: 165, label: '2 hours 45 min' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
];