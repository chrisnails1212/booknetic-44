import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, Mail, Phone, Edit2, X, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { getAvailableTimeSlotsForDate, isDateAvailable, formatTimeSlot } from '@/utils/availabilityHelper';
import { cn } from '@/lib/utils';
import { useAppData, Customer, Appointment } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { canCancelAppointment, canRescheduleAppointment } from '@/utils/businessSettings';
import { toast } from 'sonner';
interface CustomerSelfServicePanelProps {
  trigger?: React.ReactNode;
  className?: string;
}
export const CustomerSelfServicePanel = ({
  trigger,
  className
}: CustomerSelfServicePanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [customerAppointments, setCustomerAppointments] = useState<Appointment[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [selectedNewDate, setSelectedNewDate] = useState<Date | null>(null);
  const [selectedNewTime, setSelectedNewTime] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: ''
  });
  const {
    customers,
    appointments,
    getCustomerAppointments,
    updateAppointment,
    updateCustomer,
    getServiceById,
    getStaffById,
    getLocationById
  } = useAppData();
  const {
    formatPrice
  } = useCurrency();

  // Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase() && c.allowLogin);
    if (customer) {
      setCurrentCustomer(customer);
      setIsAuthenticated(true);
      setCustomerAppointments(getCustomerAppointments(customer.id));
      toast.success('Welcome back!');
    } else {
      toast.error('Email not found or login not allowed. Please contact the business.');
    }
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentCustomer(null);
    setCustomerEmail('');
    setCustomerAppointments([]);
    setEditingAppointment(null);
    setIsEditingProfile(false);
  };

  // Initialize profile form when customer logs in
  useEffect(() => {
    if (currentCustomer) {
      setProfileForm({
        firstName: currentCustomer.firstName || '',
        lastName: currentCustomer.lastName || '',
        email: currentCustomer.email || '',
        phone: currentCustomer.phone || '',
        gender: currentCustomer.gender || '',
        dateOfBirth: currentCustomer.dateOfBirth ? format(new Date(currentCustomer.dateOfBirth), 'yyyy-MM-dd') : ''
      });
    }
  }, [currentCustomer]);

  // Handle profile form changes
  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle profile update
  const handleProfileUpdate = () => {
    if (!currentCustomer) return;

    // Basic validation
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.email.trim()) {
      toast.error('First name, last name, and email are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if email is already taken by another customer
    const existingCustomer = customers.find(c => c.email.toLowerCase() === profileForm.email.toLowerCase() && c.id !== currentCustomer.id);
    if (existingCustomer) {
      toast.error('This email is already in use by another customer');
      return;
    }

    // Update customer
    const updatedData = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      gender: profileForm.gender.toLowerCase(),
      dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth) : undefined
    };
    updateCustomer(currentCustomer.id, updatedData);

    // Update current customer state
    setCurrentCustomer(prev => prev ? {
      ...prev,
      ...updatedData
    } : null);
    setIsEditingProfile(false);
    toast.success('Profile updated successfully!');
  };

  // Cancel profile editing
  const handleCancelProfileEdit = () => {
    if (currentCustomer) {
      setProfileForm({
        firstName: currentCustomer.firstName || '',
        lastName: currentCustomer.lastName || '',
        email: currentCustomer.email || '',
        phone: currentCustomer.phone || '',
        gender: currentCustomer.gender || '',
        dateOfBirth: currentCustomer.dateOfBirth ? format(new Date(currentCustomer.dateOfBirth), 'yyyy-MM-dd') : ''
      });
    }
    setIsEditingProfile(false);
  };

  // Get available time slots for rescheduling using proper availability logic
  const getAvailableTimeSlots = (date: Date, appointmentId?: string) => {
    if (!date) return [];

    // Find the appointment to get staff and service info
    const appointment = customerAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) return [];

    // Get staff member's schedule
    const staffMember = getStaffById(appointment.staffId);
    if (!staffMember?.schedule) return [];

    // Get service duration
    const service = getServiceById(appointment.serviceId);
    if (!service) return [];

    // Calculate total service duration including extras
    const totalServiceDuration = service.duration + 
      (appointment.selectedExtras || []).reduce((total, extraId) => {
        const extra = service.extras?.find(e => e.id === extraId);
        return total + (extra?.duration || 0);
      }, 0);

    // Get all booked appointments for availability checking (excluding the current appointment being rescheduled)
    const bookedAppointments = appointments
      .filter(apt => apt.id !== appointmentId && apt.status !== 'Cancelled')
      .map(apt => {
        const aptService = getServiceById(apt.serviceId);
        const baseDuration = aptService?.duration || 60;
        const extrasDuration = (apt.selectedExtras || []).reduce((total, extraId) => {
          const extra = aptService?.extras?.find(e => e.id === extraId);
          return total + (extra?.duration || 0);
        }, 0);
        const appointmentDuration = baseDuration + extrasDuration;
        
        return {
          id: apt.id,
          staffId: apt.staffId,
          serviceId: apt.serviceId,
          date: normalizeAppointmentDate(apt.date),
          time: apt.time,
          duration: appointmentDuration
        };
      });

    // Use the proper availability helper function
    return getAvailableTimeSlotsForDate(
      date,
      staffMember.schedule,
      totalServiceDuration,
      bookedAppointments,
      staffMember.id
    );
  };

  // Handle appointment rescheduling
  const handleReschedule = (appointmentId: string) => {
    if (!selectedNewDate || !selectedNewTime) {
      toast.error('Please select both date and time');
      return;
    }

    const appointment = customerAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Check reschedule policy
    const rescheduleCheck = canRescheduleAppointment(normalizeAppointmentDate(appointment.date), appointment.time);
    if (!rescheduleCheck.allowed) {
      toast.error(rescheduleCheck.reason || 'Cannot reschedule this appointment');
      return;
    }

    updateAppointment(appointmentId, {
      date: selectedNewDate,
      time: selectedNewTime,
      status: 'Rescheduled'
    });
    
    // Update the appointment in local state immediately
    const updatedAppointments = customerAppointments.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, date: selectedNewDate, time: selectedNewTime, status: 'Rescheduled' as const }
        : apt
    );
    setCustomerAppointments(updatedAppointments);
    
    setEditingAppointment(null);
    setSelectedNewDate(null);
    setSelectedNewTime('');
    toast.success('Appointment rescheduled successfully!');
  };

  const [cancellingAppointment, setCancellingAppointment] = useState<string | null>(null);

  // Handle appointment cancellation
  const handleCancel = (appointmentId: string) => {
    setCancellingAppointment(appointmentId);
  };

  const confirmCancel = () => {
    if (!cancellingAppointment) return;
    
    const appointment = customerAppointments.find(apt => apt.id === cancellingAppointment);
    if (!appointment) return;

    // Check cancellation policy
    const cancelCheck = canCancelAppointment(appointment.date, appointment.time);
    if (!cancelCheck.allowed) {
      toast.error(cancelCheck.reason || 'Cannot cancel this appointment');
      setCancellingAppointment(null);
      return;
    }

    updateAppointment(cancellingAppointment, {
      status: 'Cancelled'
    });
    setCustomerAppointments(getCustomerAppointments(currentCustomer!.id));
    toast.success('Appointment cancelled successfully');
    setCancellingAppointment(null);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants = {
      'Pending': 'secondary',
      'Confirmed': 'default',
      'Completed': 'default',
      'Cancelled': 'destructive',
      'Rescheduled': 'secondary',
      'No-show': 'destructive'
    } as const;
    return variants[status as keyof typeof variants] || 'secondary';
  };

  // Calculate customer stats
  const totalAppointments = customerAppointments.length;
  const completedAppointments = customerAppointments.filter(apt => apt.status === 'Completed').length;
  const upcomingAppointments = customerAppointments.filter(apt => new Date(apt.date) > new Date() && apt.status !== 'Cancelled').length;
  const defaultTrigger = (
    <Button variant="outline">
      <User className="h-4 w-4 mr-2" />
      Customer Portal
    </Button>
  );
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] h-full md:h-auto overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Self-Service Portal
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ?
      // Login Form
      <div className="max-w-md mx-auto space-y-6 py-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Access Your Account</h3>
              <p className="text-muted-foreground">
                Enter your email to view and manage your appointments
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              
              <Button type="submit" className="w-full">
                Access Portal
              </Button>
            </form>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only customers with login access enabled can use this portal. 
                Contact us if you need access.
              </AlertDescription>
            </Alert>
          </div> :
      // Authenticated Customer Dashboard
      <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg truncate">
                    {currentCustomer?.firstName} {currentCustomer?.lastName}
                  </h3>
                  <p className="text-muted-foreground text-sm truncate">{currentCustomer?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex-shrink-0">
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>

            <Separator />

            <Tabs defaultValue="appointments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="appointments" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">My Appointments</span>
                  <span className="sm:hidden">Appointments</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 py-2">Profile</TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">History & Stats</span>
                  <span className="sm:hidden">History</span>
                </TabsTrigger>
              </TabsList>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{upcomingAppointments}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{completedAppointments}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalAppointments}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Book New Appointment Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.open('/book/demo', '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book New Appointment
                  </Button>
                </div>

                <div className="space-y-4">
                  {customerAppointments.length === 0 ? <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No appointments found</p>
                      </CardContent>
                    </Card> : customerAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appointment => {
                const service = getServiceById(appointment.serviceId);
                const staff = getStaffById(appointment.staffId);
                const location = getLocationById(appointment.locationId);
                const appointmentDate = new Date(appointment.date); 
                const isUpcoming = isAfter(appointmentDate, new Date()) && appointment.status !== 'Cancelled';
                const canCancel = isUpcoming && canCancelAppointment(appointment.date, appointment.time).allowed;
                const canReschedule = isUpcoming && canRescheduleAppointment(appointment.date, appointment.time).allowed;
                const cancelPolicy = canCancelAppointment(appointment.date, appointment.time);
                const reschedulePolicy = canRescheduleAppointment(appointment.date, appointment.time);
                return <Card key={appointment.id}>
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col lg:flex-row items-start gap-4">
                                <div className="space-y-3 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={getStatusBadge(appointment.status)}>
                                      {appointment.status}
                                    </Badge>
                                    {isUpcoming && <Badge variant="outline">Upcoming</Badge>}
                                  </div>

                                   <div>
                                    <h4 className="font-semibold text-base sm:text-lg">{service?.name || 'Unknown Service'}</h4>
                                    <p className="text-muted-foreground">{formatPrice(appointment.totalPrice)}</p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{format(appointmentDate, 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{appointment.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 sm:col-span-2 lg:col-span-1">
                                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{location?.name || 'Unknown Location'}</span>
                                    </div>
                                  </div>

                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">Staff:</span> {staff?.name || 'Unknown Staff'}
                                  </div>
                                </div>

                                {(canCancel || canReschedule) && <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto lg:ml-4">
                                    {canReschedule && (
                                      <Button variant="outline" size="sm" onClick={() => setEditingAppointment(appointment.id)} className="flex-1 lg:flex-none">
                                        <Edit2 className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Reschedule</span>
                                      </Button>
                                    )}
                                    {canCancel && (
                                      <Button variant="outline" size="sm" onClick={() => handleCancel(appointment.id)} className="flex-1 lg:flex-none">
                                        <X className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Cancel</span>
                                      </Button>
                                    )}
                                  </div>}
                                
                                {/* Policy Information */}
                                {isUpcoming && (!canCancel || !canReschedule) && (
                                  <div className="text-xs text-muted-foreground space-y-1 w-full lg:w-auto">
                                    {!canCancel && (
                                      <p className="text-orange-600 dark:text-orange-400">
                                        Cancel: {cancelPolicy.reason}
                                      </p>
                                    )}
                                    {!canReschedule && (
                                      <p className="text-orange-600 dark:text-orange-400">
                                        Reschedule: {reschedulePolicy.reason}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Reschedule Form */}
                              {editingAppointment === appointment.id && <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-4">
                                  <h5 className="font-medium">Reschedule Appointment</h5>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                       <Label>New Date</Label>
                                       <Input 
                                         type="date" 
                                         min={format(addDays(new Date(), 2), 'yyyy-MM-dd')} 
                                         value={selectedNewDate ? format(selectedNewDate, 'yyyy-MM-dd') : ''} 
                                         onChange={e => {
                                           const newDate = new Date(e.target.value);
                                           // Check if date is available for this staff member
                                           const staffMember = getStaffById(appointment.staffId);
                                           if (staffMember?.schedule && isDateAvailable(newDate, staffMember.schedule)) {
                                             setSelectedNewDate(newDate);
                                             setSelectedNewTime(''); // Clear time when date changes
                                           } else {
                                             toast.error('This date is not available for the assigned staff member');
                                           }
                                         }} 
                                       />
                                     </div>
                                     
                                     <div className="space-y-2">
                                       <Label>New Time</Label>
                                       <select 
                                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                         value={selectedNewTime} 
                                         onChange={e => setSelectedNewTime(e.target.value)}
                                       >
                                         <option value="">Select time</option>
                                         {selectedNewDate && getAvailableTimeSlots(selectedNewDate, appointment.id).map(time => 
                                           <option key={time} value={time}>{formatTimeSlot(time)}</option>
                                         )}
                                       </select>
                                     </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button size="sm" onClick={() => handleReschedule(appointment.id)} disabled={!selectedNewDate || !selectedNewTime} className="flex-1 sm:flex-none">
                                      <CheckCircle className="h-4 w-4 sm:mr-2" />
                                      <span className="hidden sm:inline">Confirm Reschedule</span>
                                      <span className="sm:hidden">Confirm</span>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setEditingAppointment(null)} className="flex-1 sm:flex-none">
                                      Cancel
                                    </Button>
                                  </div>
                                </div>}
                            </CardContent>
                          </Card>;
              })}
                </div>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Your account details on file</CardDescription>
                    </div>
                    {!isEditingProfile ? <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button> : <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelProfileEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleProfileUpdate}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        {isEditingProfile ? <Input id="firstName" value={profileForm.firstName} onChange={e => handleProfileInputChange('firstName', e.target.value)} placeholder="Enter first name" required /> : <div className="p-2 bg-muted rounded">{currentCustomer?.firstName}</div>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        {isEditingProfile ? <Input id="lastName" value={profileForm.lastName} onChange={e => handleProfileInputChange('lastName', e.target.value)} placeholder="Enter last name" required /> : <div className="p-2 bg-muted rounded">{currentCustomer?.lastName}</div>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        {isEditingProfile ? <Input id="email" type="email" value={profileForm.email} onChange={e => handleProfileInputChange('email', e.target.value)} placeholder="Enter email address" required /> : <div className="p-2 bg-muted rounded">{currentCustomer?.email}</div>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        {isEditingProfile ? <Input id="phone" type="tel" value={profileForm.phone} onChange={e => handleProfileInputChange('phone', e.target.value)} placeholder="Enter phone number" /> : <div className="p-2 bg-muted rounded">{currentCustomer?.phone || 'Not provided'}</div>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        {isEditingProfile ? <select id="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={profileForm.gender} onChange={e => handleProfileInputChange('gender', e.target.value)}>
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select> : <div className="p-2 bg-muted rounded capitalize">{currentCustomer?.gender || 'Not specified'}</div>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        {isEditingProfile ? <Input id="dateOfBirth" type="date" value={profileForm.dateOfBirth} onChange={e => handleProfileInputChange('dateOfBirth', e.target.value)} max={format(new Date(), 'yyyy-MM-dd')} /> : <div className="p-2 bg-muted rounded">
                            {currentCustomer?.dateOfBirth ? format(new Date(currentCustomer.dateOfBirth), 'MMM dd, yyyy') : 'Not provided'}
                          </div>}
                      </div>
                    </div>

                    {isEditingProfile && <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Fields marked with * are required. Changes will be saved to your profile and updated in the business system.
                        </AlertDescription>
                      </Alert>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History & Stats Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Customer Since</span>
                        <span className="font-medium">
                          {customerAppointments.length > 0 ? format(new Date(Math.min(...customerAppointments.map(apt => new Date(apt.date).getTime()))), 'MMM yyyy') : 'New Customer'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Appointments</span>
                        <span className="font-medium">{totalAppointments}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Completed Appointments</span>
                        <span className="font-medium">{completedAppointments}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Spent</span>
                        <span className="font-medium">
                          {formatPrice(customerAppointments.filter(apt => apt.status === 'Completed').reduce((sum, apt) => sum + apt.totalPrice, 0))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Loyalty Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          <span className="font-semibold">
                            {completedAppointments >= 10 ? 'VIP Customer' : completedAppointments >= 5 ? 'Valued Customer' : 'Welcome Customer'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {completedAppointments >= 10 ? 'Thank you for your continued loyalty!' : `${10 - completedAppointments} more appointments to reach VIP status`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>}
      </DialogContent>

      <AlertDialog open={!!cancellingAppointment} onOpenChange={() => setCancellingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone. Please note that appointments can only be cancelled at least 24 hours in advance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>;
};