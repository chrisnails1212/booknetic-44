import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Search, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  CalendarIcon, 
  AlertTriangle,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { useAppData, Appointment } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { useDateFilter, DateFilterType } from '@/hooks/useDateFilter';
import { format, addMinutes, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

const Appointments = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Batch operations state
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // Date filter state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { 
    appointments, 
    customers, 
    staff, 
    services, 
    locations,
    deleteAppointment,
    updateAppointment,
    getCustomerById,
    getStaffById,
    getServiceById,
    getLocationById
  } = useAppData();
  
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { 
    activeFilter, 
    setActiveFilter, 
    filteredAppointments: dateFilteredAppointments,
    customDateRange,
    setCustomDateRange
  } = useDateFilter(appointments);

  const handleSave = () => {
    setIsSheetOpen(false);
    setEditingAppointment(undefined);
  };

  const handleCancel = () => {
    setIsSheetOpen(false);
    setEditingAppointment(undefined);
  };

  const handleAddAppointment = () => {
    setEditingAppointment(undefined);
    setIsSheetOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsSheetOpen(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointment(appointment.id);
      setSelectedAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointment.id);
        return newSet;
      });
      toast({
        title: "Success",
        description: "Appointment deleted successfully"
      });
    }
  };

  // Batch operations
  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    setSelectedAppointments(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(appointmentId);
      } else {
        newSet.delete(appointmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(new Set(paginatedAppointments.map(apt => apt.id)));
      setIsAllSelected(true);
    } else {
      setSelectedAppointments(new Set());
      setIsAllSelected(false);
    }
  };

  const handleBulkStatusUpdate = (status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled' | 'Rejected' | 'No-show' | 'Emergency') => {
    const selectedIds = Array.from(selectedAppointments);
    selectedIds.forEach(id => {
      const appointment = appointments.find(apt => apt.id === id);
      if (appointment) {
        updateAppointment(appointment.id, { ...appointment, status });
      }
    });
    setSelectedAppointments(new Set());
    setIsAllSelected(false);
    toast({
      title: "Success",
      description: `Updated ${selectedIds.length} appointments to ${status}`
    });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedAppointments.size} appointments?`)) {
      Array.from(selectedAppointments).forEach(id => {
        deleteAppointment(id);
      });
      setSelectedAppointments(new Set());
      setIsAllSelected(false);
      toast({
        title: "Success",
        description: `Deleted ${selectedAppointments.size} appointments`
      });
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Time', 'Customer', 'Service', 'Staff', 'Location', 'Status', 'Price'],
      ...filteredAppointments.map(appointment => {
        const customer = getCustomerById(appointment.customerId);
        const service = getServiceById(appointment.serviceId);
        const staffMember = getStaffById(appointment.staffId);
        const location = getLocationById(appointment.locationId);
        
        return [
          format(new Date(appointment.date), 'MMM dd, yyyy'),
          appointment.time,
          customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
          service?.name || 'Unknown',
          staffMember?.name || 'Unknown',
          location?.name || 'Unknown',
          appointment.status,
          formatPrice(appointment.totalPrice)
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Appointments exported to CSV"
    });
  };

  // Detect conflicts
  const detectConflicts = (appointment: Appointment) => {
    const conflicts = appointments.filter(apt => 
      apt.id !== appointment.id &&
      apt.staffId === appointment.staffId &&
      isSameDay(new Date(apt.date), new Date(appointment.date)) &&
      apt.status !== 'Cancelled'
    );

    const appointmentStart = parseISO(`${format(new Date(appointment.date), 'yyyy-MM-dd')}T${appointment.time}`);
    const service = getServiceById(appointment.serviceId);
    const appointmentEnd = addMinutes(appointmentStart, service?.duration || 30);

    return conflicts.filter(conflict => {
      const conflictStart = parseISO(`${format(new Date(conflict.date), 'yyyy-MM-dd')}T${conflict.time}`);
      const conflictService = getServiceById(conflict.serviceId);
      const conflictEnd = addMinutes(conflictStart, conflictService?.duration || 30);
      
      return (appointmentStart < conflictEnd && appointmentEnd > conflictStart);
    });
  };

  // Filter appointments based on search, status, and date range
  const filteredAppointments = useMemo(() => {
    let filtered = dateFilteredAppointments;
    
    // Apply custom date range if set
    if (dateRange.from || dateRange.to) {
      filtered = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        const from = dateRange.from || new Date('1900-01-01');
        const to = dateRange.to || new Date('2100-12-31');
        return appointmentDate >= from && appointmentDate <= to;
      });
    }
    
    return filtered.filter(appointment => {
      const customer = getCustomerById(appointment.customerId);
      const staffMember = getStaffById(appointment.staffId);
      const service = getServiceById(appointment.serviceId);
      const location = getLocationById(appointment.locationId);
      
      const matchesSearch = searchTerm === '' || 
        customer?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || appointment.status.toLowerCase() === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [dateFilteredAppointments, appointments, dateRange, searchTerm, statusFilter, getCustomerById, getStaffById, getServiceById, getLocationById]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeFilter, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            Appointments
            <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {appointments.length}
            </span>
          </h1>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" className="text-slate-600" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAddAppointment}>
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
                  appointment={editingAppointment}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="space-y-4">
              {/* Search and Filters Row */}
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input 
                    placeholder="Search customers, staff, services, or locations" 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No-show</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filters Row */}
              <div className="flex flex-wrap gap-2">
                {(['Today', 'Yesterday', 'This week', 'Last week', 'This month'] as DateFilterType[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateRange.from || dateRange.to ? "default" : "outline"}
                      size="sm"
                      className={cn("justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Custom Range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                      onSelect={(range) => setDateRange(range || {})}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({});
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Batch Operations */}
              {selectedAppointments.size > 0 && (
                <Alert>
                  <CheckSquare className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{selectedAppointments.size} appointments selected</span>
                    <div className="flex gap-2">
                      <Select onValueChange={handleBulkStatusUpdate}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Mark as Pending</SelectItem>
                          <SelectItem value="Confirmed">Mark as Confirmed</SelectItem>
                          <SelectItem value="Completed">Mark as Completed</SelectItem>
                          <SelectItem value="Cancelled">Mark as Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {paginatedAppointments.length === 0 ? (
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {appointments.length === 0 ? "No Appointments" : "No Results Found"}
                  </h3>
                  <p className="text-slate-500 mb-4">
                    {appointments.length === 0 
                      ? "Get started by creating your first appointment"
                      : "Try adjusting your search or filter criteria"
                    }
                  </p>
                  {appointments.length === 0 && (
                    <Button onClick={handleAddAppointment} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Appointment
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected && paginatedAppointments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.map((appointment) => {
                    const customer = getCustomerById(appointment.customerId);
                    const staffMember = getStaffById(appointment.staffId);
                    const service = getServiceById(appointment.serviceId);
                    const location = getLocationById(appointment.locationId);
                    const conflicts = detectConflicts(appointment);
                    
                    return (
                      <TableRow key={appointment.id} className="hover:bg-slate-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedAppointments.has(appointment.id)}
                            onCheckedChange={(checked) => handleSelectAppointment(appointment.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(appointment.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{service?.name || 'Unknown Service'}</div>
                          <div className="text-sm text-gray-500">
                            {(() => {
                              const baseDuration = service?.duration || 0;
                              const totalDuration = baseDuration;
                              const basePrice = service?.price || 0;
                              const totalPrice = basePrice;
                              
                              return `${totalDuration} min • ${formatPrice(totalPrice)}`;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {staffMember?.name || 'Unknown Staff'}
                        </TableCell>
                        <TableCell>
                          {location?.name || 'Unknown Location'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            {conflicts.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Conflict
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(appointment.totalPrice)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteAppointment(appointment)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <span className="px-4 py-2">...</span>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="p-6 border-t bg-slate-50">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div>
                Total: {appointments.length} | Filtered: {filteredAppointments.length}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span>Conflict</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Appointments;
