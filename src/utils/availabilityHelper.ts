import { format, getDay, isSameDay, addMinutes, parse } from 'date-fns';

interface WorkingHours {
  start: string;
  end: string;
  isWorking: boolean;
}

interface SpecialDay {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface Holiday {
  id: string;
  date: Date;
  name: string;
}

interface BreakTime {
  id: string;
  startTime: string;
  endTime: string;
  name: string;
}

interface StaffSchedule {
  weekly: Record<string, WorkingHours>;
  specialDays: SpecialDay[];
  holidays: Holiday[];
  breakTimes: BreakTime[];
}

interface BookedAppointment {
  id: string;
  staffId: string;
  serviceId: string;
  date: Date;
  time: string;
  duration: number;
}

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number = 30): string[] => {
  const slots: string[] = [];
  let currentTime = parse(startTime, 'HH:mm', new Date());
  const endDateTime = parse(endTime, 'HH:mm', new Date());

  while (currentTime < endDateTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, slotDuration);
  }

  return slots;
};

export const formatTimeSlot = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

export const isTimeSlotAvailable = (
  timeSlot: string,
  serviceDuration: number,
  breakTimes: BreakTime[],
  bookedAppointments: BookedAppointment[] = [],
  targetDate: Date,
  staffId: string
): boolean => {
  const slotTime = parse(timeSlot, 'HH:mm', new Date());
  const serviceEndTime = addMinutes(slotTime, serviceDuration);

  // Check if the service would overlap with any break times
  for (const breakTime of breakTimes) {
    const breakStart = parse(breakTime.startTime, 'HH:mm', new Date());
    const breakEnd = parse(breakTime.endTime, 'HH:mm', new Date());

    // Check if service time overlaps with break time
    if (
      (slotTime >= breakStart && slotTime < breakEnd) ||
      (serviceEndTime > breakStart && serviceEndTime <= breakEnd) ||
      (slotTime < breakStart && serviceEndTime > breakEnd)
    ) {
      return false;
    }
  }

  // Check if the service would overlap with any booked appointments
  for (const appointment of bookedAppointments) {
    // Only check appointments for the same staff member on the same date
    if (appointment.staffId === staffId && isSameDay(new Date(appointment.date), targetDate)) {
      // Handle both HH:mm and formatted time (e.g., "10:30 AM")
      let appointmentTimeStr = appointment.time;
      if (appointmentTimeStr.includes('AM') || appointmentTimeStr.includes('PM')) {
        // Convert from "10:30 AM" format to "10:30" format
        const [time, period] = appointmentTimeStr.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        appointmentTimeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
      }
      
      const appointmentTime = parse(appointmentTimeStr, 'HH:mm', new Date());
      const appointmentEndTime = addMinutes(appointmentTime, appointment.duration);

      // Check if new service time overlaps with existing appointment
      if (
        (slotTime >= appointmentTime && slotTime < appointmentEndTime) ||
        (serviceEndTime > appointmentTime && serviceEndTime <= appointmentEndTime) ||
        (slotTime < appointmentTime && serviceEndTime > appointmentEndTime)
      ) {
        return false;
      }
    }
  }

  return true;
};

export const getAvailableTimeSlotsForDate = (
  date: Date,
  staffSchedule: StaffSchedule,
  serviceDuration: number,
  bookedAppointments: BookedAppointment[] = [],
  staffId: string
): string[] => {
  if (!staffSchedule) return [];

  // Check if date is a holiday
  const isHoliday = staffSchedule.holidays.some(holiday => 
    isSameDay(new Date(holiday.date), date)
  );
  if (isHoliday) return [];

  // Check for special working day
  const specialDay = staffSchedule.specialDays.find(special => 
    isSameDay(new Date(special.date), date)
  );

  let workingHours: { start: string; end: string; isWorking: boolean };

  if (specialDay) {
    if (specialDay.isOff) return [];
    workingHours = {
      start: specialDay.startTime,
      end: specialDay.endTime,
      isWorking: true
    };
  } else {
    // Get regular weekly schedule
    const dayIndex = getDay(date);
    const dayName = DAYS_OF_WEEK[dayIndex];
    workingHours = staffSchedule.weekly[dayName];
  }

  if (!workingHours || !workingHours.isWorking) return [];

  // Generate all possible time slots
  const allSlots = generateTimeSlots(workingHours.start, workingHours.end, 30);

  // Filter slots that can accommodate the service duration
  const availableSlots = allSlots.filter(slot => {
    const slotTime = parse(slot, 'HH:mm', new Date());
    const serviceEndTime = addMinutes(slotTime, serviceDuration);
    const workingEndTime = parse(workingHours.end, 'HH:mm', new Date());

    // Check if service fits within working hours
    if (serviceEndTime > workingEndTime) return false;

    // Check if slot conflicts with break times and booked appointments
    return isTimeSlotAvailable(slot, serviceDuration, staffSchedule.breakTimes, bookedAppointments, date, staffId);
  });

  return availableSlots;
};

export const isDateAvailable = (date: Date, staffSchedule: StaffSchedule): boolean => {
  if (!staffSchedule) return false;

  // Check if date is a holiday
  const isHoliday = staffSchedule.holidays.some(holiday => 
    isSameDay(new Date(holiday.date), date)
  );
  if (isHoliday) return false;

  // Check for special working day
  const specialDay = staffSchedule.specialDays.find(special => 
    isSameDay(new Date(special.date), date)
  );

  if (specialDay) {
    return !specialDay.isOff;
  }

  // Check regular weekly schedule
  const dayIndex = getDay(date);
  const dayName = DAYS_OF_WEEK[dayIndex];
  const workingHours = staffSchedule.weekly[dayName];

  return workingHours?.isWorking || false;
};

export const findNextAvailableDate = (
  startDate: Date,
  staffSchedules: StaffSchedule[],
  serviceDuration: number,
  bookedAppointments: BookedAppointment[] = [],
  maxDaysToCheck: number = 30
): Date | null => {
  const currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow
  
  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + i);
    
    // Check if any staff member is available on this date
    for (const staffSchedule of staffSchedules) {
      if (!staffSchedule) continue;
      
      // Check if the date is available for this staff member
      if (isDateAvailable(checkDate, staffSchedule)) {
        // Get available time slots for this staff member on this date
        const staffId = 'staff-id'; // This would need to be passed in or derived
        const availableSlots = getAvailableTimeSlotsForDate(
          checkDate,
          staffSchedule,
          serviceDuration,
          bookedAppointments,
          staffId
        );
        
        // If there are available slots, return this date
        if (availableSlots.length > 0) {
          return checkDate;
        }
      }
    }
  }
  
  return null; // No available date found within the search range
};