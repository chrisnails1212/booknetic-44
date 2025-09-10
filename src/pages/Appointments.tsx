import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { useAppData, Appointment } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Appointments = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { 
    appointments, 
    customers, 
    staff, 
    services, 
    locations,
    deleteAppointment,
    getCustomerById,
    getStaffById,
    getServiceById,
    getLocationById
  } = useAppData();
  
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

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
      toast({
        title: "Success",
        description: "Appointment deleted successfully"
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

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(appointment => {
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
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredAppointments.length === 0 ? (
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
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const customer = getCustomerById(appointment.customerId);
                    const staffMember = getStaffById(appointment.staffId);
                    const service = getServiceById(appointment.serviceId);
                    const location = getLocationById(appointment.locationId);
                    
                    return (
                      <TableRow key={appointment.id} className="hover:bg-slate-50">
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
                              const multiplier = 1 + (appointment.additionalGuests || 0);
                              const totalDuration = baseDuration * multiplier;
                              const basePrice = service?.price || 0;
                              const totalPrice = basePrice * multiplier;
                              
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
                          {appointment.additionalGuests ? (
                            <div className="text-center">
                              <div className="font-medium text-blue-600">
                                +{appointment.additionalGuests}
                              </div>
                              <div className="text-xs text-gray-500">
                                guest{appointment.additionalGuests > 1 ? 's' : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">-</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
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

          <div className="p-6 border-t">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div>
                Showing {filteredAppointments.length} of {appointments.length} total appointments
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Appointments;
