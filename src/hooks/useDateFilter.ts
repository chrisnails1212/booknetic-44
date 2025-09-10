
import { useState, useMemo } from 'react';
import { Appointment } from '@/contexts/AppDataContext';

export type DateFilterType = 'Today' | 'Yesterday' | 'Tomorrow' | 'This week' | 'Last week' | 'This month' | 'This year' | 'Custom';

export const useDateFilter = (appointments: Appointment[]) => {
  const [activeFilter, setActiveFilter] = useState<DateFilterType>('Today');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const getDateRange = (filter: DateFilterType): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'Today':
        return { 
          start: today, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) 
        };
      
      case 'Yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { 
          start: yesterday, 
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) 
        };
      
      case 'Tomorrow':
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        return { 
          start: tomorrow, 
          end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1) 
        };
      
      case 'This week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
      
      case 'Last week':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return { start: lastWeekStart, end: lastWeekEnd };
      
      case 'This month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { start: startOfMonth, end: endOfMonth };
      
      case 'This year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return { start: startOfYear, end: endOfYear };
      
      case 'Custom':
        return customDateRange || { start: today, end: today };
      
      default:
        return { start: today, end: today };
    }
  };

  const filteredAppointments = useMemo(() => {
    const { start, end } = getDateRange(activeFilter);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= start && appointmentDate <= end;
    });
  }, [appointments, activeFilter, customDateRange]);

  return {
    activeFilter,
    setActiveFilter,
    customDateRange,
    setCustomDateRange,
    filteredAppointments,
    getDateRange
  };
};
