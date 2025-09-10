import { useMemo } from 'react';
import { format, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths } from 'date-fns';
import { Appointment, Staff, Service, Location } from '@/contexts/AppDataContext';
import { FilterState } from '@/components/reports/ReportFilters';

export interface ChartDataPoint {
  date: string;
  appointments: number;
  earnings: number;
}

export const useReportData = (
  appointments: Appointment[],
  staff: Staff[],
  services: Service[],
  locations: Location[],
  filters: FilterState
) => {
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Service filter
      if (filters.serviceId && appointment.serviceId !== filters.serviceId) {
        return false;
      }
      
      // Location filter
      if (filters.locationId && appointment.locationId !== filters.locationId) {
        return false;
      }
      
      // Staff filter
      if (filters.staffId && appointment.staffId !== filters.staffId) {
        return false;
      }
      
      // Status filter
      if (filters.status && appointment.status !== filters.status) {
        return false;
      }
      
      return true;
    });
  }, [appointments, filters]);

  const chartData = useMemo(() => {
    const now = new Date();
    let dateRange: Date[] = [];
    let formatString = 'dd/MM/yy';

    // Generate date range based on filter
    switch (filters.dateRange) {
      case 'DAILY':
        const startDaily = subDays(now, 10);
        dateRange = eachDayOfInterval({ start: startDaily, end: now });
        formatString = 'dd/MM/yy';
        break;
      case 'WEEKLY':
        const startWeekly = subWeeks(now, 8);
        dateRange = eachWeekOfInterval({ start: startWeekly, end: now });
        formatString = "'W'w yyyy";
        break;
      case 'MONTHLY':
        const startMonthly = subMonths(now, 11);
        dateRange = eachMonthOfInterval({ start: startMonthly, end: now });
        formatString = 'MMM yyyy';
        break;
    }

    // Group appointments by date
    const appointmentsByDate = filteredAppointments.reduce((acc, appointment) => {
      let groupKey: string;
      const appointmentDate = new Date(appointment.date);
      
      switch (filters.dateRange) {
        case 'DAILY':
          groupKey = format(appointmentDate, 'dd/MM/yy');
          break;
        case 'WEEKLY':
          groupKey = format(startOfWeek(appointmentDate), "'W'w yyyy");
          break;
        case 'MONTHLY':
          groupKey = format(startOfMonth(appointmentDate), 'MMM yyyy');
          break;
        default:
          groupKey = format(appointmentDate, 'dd/MM/yy');
      }

      if (!acc[groupKey]) {
        acc[groupKey] = { appointments: 0, earnings: 0 };
      }
      
      acc[groupKey].appointments += 1;
      // Apply group booking multiplier to earnings
      const basePrice = appointment.totalPrice || 0;
      acc[groupKey].earnings += basePrice;
      
      return acc;
    }, {} as Record<string, { appointments: number; earnings: number }>);

    // Create chart data points
    return dateRange.map(date => {
      const dateKey = format(date, formatString);
      const data = appointmentsByDate[dateKey] || { appointments: 0, earnings: 0 };
      
      return {
        date: dateKey,
        appointments: data.appointments,
        earnings: data.earnings
      };
    });
  }, [filteredAppointments, filters.dateRange]);

  const locationEarnings = useMemo(() => {
    const earningsByLocation = filteredAppointments
      .filter(apt => apt.status === 'Completed') // Only completed appointments
      .reduce((acc, appointment) => {
        if (!acc[appointment.locationId]) {
          acc[appointment.locationId] = 0;
        }
        // Apply group booking consideration - earnings already include group multiplier in totalPrice
        acc[appointment.locationId] += appointment.totalPrice || 0;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(earningsByLocation)
      .map(([locationId, earnings]) => {
        const location = locations.find(l => l.id === locationId);
        return {
          id: locationId,
          name: location?.name || 'Unknown Location',
          earnings
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10); // Top 10 locations
  }, [filteredAppointments, locations]);

  const staffEarnings = useMemo(() => {
    const earningsByStaff = filteredAppointments
      .filter(apt => apt.status === 'Completed') // Only completed appointments
      .reduce((acc, appointment) => {
        if (!acc[appointment.staffId]) {
          acc[appointment.staffId] = 0;
        }
        // Apply group booking consideration - earnings already include group multiplier in totalPrice
        acc[appointment.staffId] += appointment.totalPrice || 0;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(earningsByStaff)
      .map(([staffId, earnings]) => {
        const staffMember = staff.find(s => s.id === staffId);
        return {
          id: staffId,
          name: staffMember?.name || 'Unknown Staff',
          earnings
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10); // Top 10 staff
  }, [filteredAppointments, staff]);

  const totalStats = useMemo(() => {
    const completed = filteredAppointments.filter(apt => apt.status === 'Completed');
    return {
      totalAppointments: filteredAppointments.length,
      completedAppointments: completed.length,
      totalEarnings: completed.reduce((sum, apt) => sum + (apt.totalPrice || 0), 0),
      averageEarnings: completed.length > 0 ? 
        completed.reduce((sum, apt) => sum + (apt.totalPrice || 0), 0) / completed.length : 0
    };
  }, [filteredAppointments]);

  return {
    chartData,
    locationEarnings,
    staffEarnings,
    totalStats,
    filteredAppointments
  };
};