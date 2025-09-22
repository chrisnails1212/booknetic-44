// Helper function to normalize appointment dates and avoid timezone shifts
export const normalizeAppointmentDate = (date: Date | string): Date => {
  if (date instanceof Date) {
    return date;
  }
  // Parse date string as local date to avoid timezone shifts
  const dateStr = String(date);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};