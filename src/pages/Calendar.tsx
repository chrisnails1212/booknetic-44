import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Plus, Filter, Palette, Search, CalendarIcon, X } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { ColorLegend } from '@/components/calendar/ColorLegend';
import { useAppData } from '@/contexts/AppDataContext';
import { getAppointmentColors, getStatusIcon } from '@/utils/appointmentColors';
import type { Appointment } from '@/contexts/AppDataContext';

export const Calendar = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeView, setActiveView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    status: 'all',
    staff: 'all',
    service: 'all',
    location: 'all',
    search: ''
  });

  // Helper function to get business hours range for time slots
  const getBusinessHoursRange = () => {
    // Get from localStorage or default business hours
    const defaultHours = {
      Monday: { enabled: true, start: '09:00', end: '17:00' },
      Tuesday: { enabled: true, start: '09:00', end: '17:00' },
      Wednesday: { enabled: true, start: '09:00', end: '17:00' },
      Thursday: { enabled: true, start: '09:00', end: '17:00' },
      Friday: { enabled: true, start: '09:00', end: '17:00' },
      Saturday: { enabled: false, start: '09:00', end: '17:00' },
      Sunday: { enabled: false, start: '09:00', end: '17:00' }
    };

    const savedHours = localStorage.getItem('businessHours');
    const businessHours = savedHours ? JSON.parse(savedHours).workingDays : defaultHours;
    
    // Find earliest start and latest end from enabled days
    let earliestStart = '09:00';
    let latestEnd = '17:00';
    
    Object.values(businessHours).forEach((day: any) => {
      if (day.enabled) {
        if (day.start < earliestStart) earliestStart = day.start;
        if (day.end > latestEnd) latestEnd = day.end;
      }
    });

    const startHour = parseInt(earliestStart.split(':')[0]);
    const endHour = parseInt(latestEnd.split(':')[0]);
    
    return { startHour, endHour, duration: endHour - startHour };
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { 
    appointments, 
    updateAppointment, 
    getCustomerById, 
    getServiceById, 
    getStaffById,
    staff,
    services,
    locations
  } = useAppData();

  const filteredAppointments = appointments.filter(appointment => {
    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
      const aptDate = new Date(appointment.date);
      if (aptDate < filters.dateFrom || aptDate > filters.dateTo) return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && appointment.status !== filters.status) return false;
    
    // Staff filter
    if (filters.staff !== 'all' && appointment.staffId !== filters.staff) return false;
    
    // Service filter
    if (filters.service !== 'all' && appointment.serviceId !== filters.service) return false;
    
    // Location filter
    if (filters.location !== 'all' && appointment.locationId !== filters.location) return false;
    
    // Search filter
    if (filters.search) {
      const customer = getCustomerById(appointment.customerId);
      const service = getServiceById(appointment.serviceId);
      const staffMember = getStaffById(appointment.staffId);
      const searchTerm = filters.search.toLowerCase();
      
      const customerName = `${customer?.firstName} ${customer?.lastName}`.toLowerCase();
      const serviceName = service?.name?.toLowerCase() || '';
      const staffName = staffMember?.name?.toLowerCase() || '';
      
      if (!customerName.includes(searchTerm) && 
          !serviceName.includes(searchTerm) && 
          !staffName.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });

  const clearFilter = (filterType: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'dateFrom' || filterType === 'dateTo' ? null : 
                   filterType === 'search' ? '' : 'all'
    }));
  };

  const resetAllFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
      status: 'all',
      staff: 'all',
      service: 'all',
      location: 'all',
      search: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.dateFrom || filters.dateTo || filters.status !== 'all' || 
           filters.staff !== 'all' || filters.service !== 'all' || 
           filters.location !== 'all' || filters.search;
  };

  const handleSave = () => {
    setIsSheetOpen(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setEditingAppointment(null);
  };

  const handleCancel = () => {
    setIsSheetOpen(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setEditingAppointment(null);
  };

  const handleCellClick = (date: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || null);
    setEditingAppointment(null);
    setIsSheetOpen(true);
  };

  const handleAppointmentClick = (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation();
    setEditingAppointment(appointment);
    setSelectedDate(null);
    setSelectedTime(null);
    setIsSheetOpen(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getAppointmentsForTimeSlot = (date: Date, hour: number) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      const aptHour = parseInt(apt.time.split(':')[0]);
      return aptDate.toDateString() === date.toDateString() && aptHour === hour;
    });
  };

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(appointment));
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedAppointment(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCell(cellId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only remove drag over state if we're actually leaving the cell
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newDate: Date, newTime?: string) => {
    e.preventDefault();
    setDragOverCell(null);
    
    if (draggedAppointment) {
      // Check if we're dropping on the same date/time
      const isSameDate = new Date(draggedAppointment.date).toDateString() === newDate.toDateString();
      const isSameTime = !newTime || draggedAppointment.time === newTime;
      
      if (isSameDate && isSameTime) {
        return; // Don't update if dropping on the same spot
      }

      const updatedAppointment = {
        ...draggedAppointment,
        date: newDate,
        ...(newTime && { time: newTime })
      };
      
      updateAppointment(draggedAppointment.id, updatedAppointment);
      setDraggedAppointment(null);
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const customer = getCustomerById(appointment.customerId);
    const service = getServiceById(appointment.serviceId);
    const staff = getStaffById(appointment.staffId);
    const colors = getAppointmentColors(appointment);
    const statusIcon = getStatusIcon(appointment.status);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, appointment)}
        onDragEnd={handleDragEnd}
        onClick={(e) => handleAppointmentClick(e, appointment)}
        className={`${colors.background} ${colors.border} p-2 mb-1 text-xs cursor-move hover:opacity-80 transition-all duration-200 hover:shadow-md select-none`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className={`font-semibold ${colors.text} truncate`}>
            {customer?.firstName} {customer?.lastName}
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <span className="text-xs">{statusIcon}</span>
            <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
          </div>
        </div>
        <div className="text-slate-600 mb-1 truncate">{service?.name}</div>
        <div className="flex items-center justify-between">
          <div className="text-slate-500">{appointment.time}</div>
          <div className="text-xs text-slate-500 truncate">{staff?.name}</div>
        </div>
      </div>
    );
  };

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const days = getDaysInMonth(currentDate);

  const renderMonthView = () => (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center text-sm font-medium text-slate-600 bg-slate-50">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
          const dayAppointments = cellDate ? getAppointmentsForDate(cellDate) : [];
          const cellId = cellDate ? `month-${cellDate.toDateString()}` : `empty-${index}`;
          const isDragOver = dragOverCell === cellId;
          
          return (
            <div
              key={index}
              className={`min-h-24 p-2 border-b border-r border-slate-200 cursor-pointer transition-colors duration-200 ${
                isDragOver ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => cellDate && handleDragEnter(e, cellId)}
              onDragLeave={handleDragLeave}
              onDrop={cellDate ? (e) => handleDrop(e, cellDate) : undefined}
              onClick={cellDate ? () => handleCellClick(cellDate) : undefined}
            >
              {day && (
                <>
                  <div className="text-sm text-slate-900 mb-1">{day}</div>
                  {dayAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const { startHour, duration } = getBusinessHoursRange();
    
    return (
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="grid grid-cols-8 border-b border-slate-200">
          <div className="p-4 border-r border-slate-200"></div>
          {weekDays.map((day, index) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + index);
            return (
              <div key={day} className="p-4 text-center text-sm font-medium text-slate-600 bg-slate-50">
                <div>{day}</div>
                <div className="text-xs text-slate-500">{dayDate.getDate()}</div>
              </div>
            );
          })}
        </div>
        {Array.from({ length: duration }, (_, hour) => {
          const timeSlot = `${hour + startHour}:00`;
          return (
            <div key={hour} className="grid grid-cols-8 border-b border-slate-200">
              <div className="p-2 text-xs text-slate-500 border-r border-slate-200">
                {timeSlot}
              </div>
              {Array.from({ length: 7 }, (_, day) => {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + day);
                const timeAppointments = getAppointmentsForTimeSlot(dayDate, hour + startHour);
                const cellId = `week-${dayDate.toDateString()}-${timeSlot}`;
                const isDragOver = dragOverCell === cellId;
                
                return (
                  <div 
                    key={day} 
                    className={`min-h-12 border-r border-slate-200 cursor-pointer p-1 transition-colors duration-200 ${
                      isDragOver ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, cellId)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayDate, timeSlot)}
                    onClick={() => handleCellClick(dayDate, timeSlot)}
                  >
                    {timeAppointments.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const { startHour, duration } = getBusinessHoursRange();
    
    return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="grid grid-cols-2 border-b border-slate-200">
        <div className="p-4 border-r border-slate-200"></div>
        <div className="p-4 text-center text-sm font-medium text-slate-600 bg-slate-50">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      {Array.from({ length: duration }, (_, hour) => {
        const timeSlot = `${hour + startHour}:00`;
        const timeAppointments = getAppointmentsForTimeSlot(currentDate, hour + startHour);
        const cellId = `day-${currentDate.toDateString()}-${timeSlot}`;
        const isDragOver = dragOverCell === cellId;
        
        return (
          <div key={hour} className="grid grid-cols-2 border-b border-slate-200">
            <div className="p-2 text-xs text-slate-500 border-r border-slate-200">
              {timeSlot}
            </div>
            <div 
              className={`min-h-12 cursor-pointer p-1 transition-colors duration-200 ${
                isDragOver ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, cellId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, currentDate, timeSlot)}
              onClick={() => handleCellClick(currentDate, timeSlot)}
            >
              {timeAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
    );
  };

  const renderListView = () => {
    const todayAppointments = getAppointmentsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg border border-slate-200">
        {todayAppointments.length > 0 ? (
          <div className="p-4 space-y-3">
            {todayAppointments.map((appointment) => {
              const customer = getCustomerById(appointment.customerId);
              const service = getServiceById(appointment.serviceId);
              const staff = getStaffById(appointment.staffId);
              const colors = getAppointmentColors(appointment);
              const statusIcon = getStatusIcon(appointment.status);
              
              return (
                <div 
                  key={appointment.id} 
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 ${colors.background} ${colors.border}`}
                  onClick={() => handleAppointmentClick({ stopPropagation: () => {} } as React.MouseEvent, appointment)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${colors.text}`}>
                          {customer?.firstName} {customer?.lastName}
                        </h3>
                        <span className="text-sm">{statusIcon}</span>
                        <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                      </div>
                      <p className="text-slate-600">{service?.name}</p>
                      <p className="text-sm text-slate-500">Staff: {staff?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{appointment.time}</p>
                      <p className="text-sm text-slate-500">${appointment.totalPrice}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center py-12">
            <p className="text-slate-500">No appointments scheduled</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => handleCellClick(currentDate)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <div className="flex space-x-3">
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className={`text-slate-600 ${hasActiveFilters() ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filter {hasActiveFilters() && '(Active)'}
              </Button>
              
              {showAdvancedFilter && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Filter</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAdvancedFilter(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Date Range */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Select Date</label>
                        {(filters.dateFrom || filters.dateTo) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 h-auto p-0 text-xs"
                            onClick={() => {
                              clearFilter('dateFrom');
                              clearFilter('dateTo');
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">From:</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal text-xs h-8"
                              >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {filters.dateFrom ? format(filters.dateFrom, "dd-MM-yyyy") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={filters.dateFrom}
                                onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">To:</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal text-xs h-8"
                              >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {filters.dateTo ? format(filters.dateTo, "dd-MM-yyyy") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={filters.dateTo}
                                onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* Service Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Service</label>
                        {filters.service !== 'all' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 h-auto p-0 text-xs"
                            onClick={() => clearFilter('service')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select 
                        value={filters.service} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, service: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Services</SelectItem>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        {filters.status !== 'all' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 h-auto p-0 text-xs"
                            onClick={() => clearFilter('status')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="no-show">No Show</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="rescheduled">Rescheduled</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Staff Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Staff</label>
                        {filters.staff !== 'all' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 h-auto p-0 text-xs"
                            onClick={() => clearFilter('staff')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select 
                        value={filters.staff} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, staff: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff</SelectItem>
                          {staff.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        {filters.location !== 'all' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 h-auto p-0 text-xs"
                            onClick={() => clearFilter('location')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select 
                        value={filters.location} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Search by Keywords</label>
                        {filters.search && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 h-auto p-0 text-xs"
                            onClick={() => clearFilter('search')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                        <Input
                          placeholder="Search"
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetAllFilters}
                        className="text-xs"
                      >
                        Reset
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setShowAdvancedFilter(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-slate-600">
                  <Palette className="w-4 h-4 mr-2" />
                  Legend
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <ColorLegend />
              </PopoverContent>
            </Popover>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[700px] sm:max-w-[700px] p-0">
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle>
                    {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
                  </SheetTitle>
                  <SheetDescription>
                    {editingAppointment 
                      ? 'Update the appointment details below.'
                      : 'Fill in the appointment details to create a new booking.'
                    }
                  </SheetDescription>
                </SheetHeader>
                <AppointmentForm 
                  onCancel={handleCancel} 
                  onSave={handleSave}
                  initialDate={selectedDate}
                  initialTime={selectedTime}
                  appointment={editingAppointment}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={goToToday}
            >
              TODAY
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-medium text-slate-900 min-w-32 text-center">
                {formatMonthYear(currentDate)}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="month" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                month
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                week
              </TabsTrigger>
              <TabsTrigger value="day" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                day
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                list
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsContent value="month" className="mt-0">
            {renderMonthView()}
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            {renderWeekView()}
          </TabsContent>
          <TabsContent value="day" className="mt-0">
            {renderDayView()}
          </TabsContent>
          <TabsContent value="list" className="mt-0">
            {renderListView()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Calendar;
