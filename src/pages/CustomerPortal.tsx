import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, Mail, Phone, Edit2, X, CheckCircle, AlertCircle, Star, ArrowLeft, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { getAvailableTimeSlotsForDate, isDateAvailable, formatTimeSlot } from '@/utils/availabilityHelper';
import { useAppData, Customer, Appointment } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';

export default function CustomerPortal() {
  const [customerEmail, setCustomerEmail] = useState('');
  const [portalLock, setPortalLock] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [customerAppointments, setCustomerAppointments] = useState<Appointment[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
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

  const navigate = useNavigate();

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

  const { formatPrice } = useCurrency();

  // Portal Lock Settings Component
  const PortalLockSettings = ({ customerEmail }: { customerEmail: string }) => {
    const [isEnabled, setIsEnabled] = useState(isPortalLockEnabled(customerEmail));
    const [newLockPassword, setNewLockPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleTogglePortalLock = (enabled: boolean) => {
      if (enabled) {
        setIsChangingPassword(true);
      } else {
        setPortalLockForCustomer(customerEmail, '', false);
        setIsEnabled(false);
        setNewLockPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
        toast.success('Portal lock disabled');
      }
    };

    const handleSetPassword = () => {
      if (!newLockPassword.trim()) {
        toast.error('Please enter a portal lock password');
        return;
      }

      if (newLockPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newLockPassword.length < 4) {
        toast.error('Portal lock password must be at least 4 characters');
        return;
      }

      setPortalLockForCustomer(customerEmail, newLockPassword, true);
      setIsEnabled(true);
      setNewLockPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      toast.success('Portal lock enabled successfully');
    };

    const handleCancelPasswordChange = () => {
      setNewLockPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Portal Lock</h4>
            <p className="text-sm text-muted-foreground">
              Require an additional password to access your portal
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleTogglePortalLock}
            disabled={isChangingPassword}
          />
        </div>

        {isChangingPassword && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h5 className="font-medium">Set Portal Lock Password</h5>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newLockPassword">New Portal Lock Password</Label>
                <Input
                  id="newLockPassword"
                  type="password"
                  value={newLockPassword}
                  onChange={(e) => setNewLockPassword(e.target.value)}
                  placeholder="Enter new portal lock password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm portal lock password"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetPassword} size="sm">
                  Enable Portal Lock
                </Button>
                <Button onClick={handleCancelPasswordChange} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEnabled && !isChangingPassword && (
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-400">
                Portal lock is enabled
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your portal requires an additional password for access
            </p>
            <Button 
              onClick={() => setIsChangingPassword(true)} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Change Password
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Portal lock functions
  const getPortalLockKey = (email: string) => `portal_lock_${email.toLowerCase()}`;
  const getPortalLockEnabledKey = (email: string) => `portal_lock_enabled_${email.toLowerCase()}`;

  const isPortalLockEnabled = (email: string) => {
    return localStorage.getItem(getPortalLockEnabledKey(email)) === 'true';
  };

  const isAdminPortalLockEnabled = (email: string) => {
    try {
      const stored = localStorage.getItem(`portalLock_${email}`);
      const settings = stored ? JSON.parse(stored) : { enabled: false };
      return settings.enabled;
    } catch {
      return false;
    }
  };

  const isPortalLockRequired = (email: string) => {
    // Both customer and admin must enable portal lock for password to be required
    return isPortalLockEnabled(email) && isAdminPortalLockEnabled(email);
  };

  const getStoredPortalLock = (email: string) => {
    return localStorage.getItem(getPortalLockKey(email));
  };

  const setPortalLockForCustomer = (email: string, lockPassword: string, enabled: boolean) => {
    if (enabled) {
      localStorage.setItem(getPortalLockKey(email), lockPassword);
      localStorage.setItem(getPortalLockEnabledKey(email), 'true');
    } else {
      localStorage.removeItem(getPortalLockKey(email));
      localStorage.setItem(getPortalLockEnabledKey(email), 'false');
    }
  };

  // Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customer = customers.find(c => 
      c.email.toLowerCase() === customerEmail.toLowerCase() && c.allowLogin
    );
    
    if (!customer) {
      toast.error('Email not found or login not allowed. Please contact the business.');
      return;
    }

    // Check if portal lock is required (both customer and admin must enable it)
    if (isPortalLockRequired(customerEmail)) {
      const storedLock = getStoredPortalLock(customerEmail);
      if (!storedLock || portalLock !== storedLock) {
        toast.error('Incorrect portal lock password');
        return;
      }
    }

    setCurrentCustomer(customer);
    setIsAuthenticated(true);
    setCustomerAppointments(getCustomerAppointments(customer.id));
    toast.success('Welcome back!');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentCustomer(null);
    setCustomerEmail('');
    setPortalLock('');
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
        dateOfBirth: currentCustomer.dateOfBirth 
          ? format(new Date(currentCustomer.dateOfBirth), 'yyyy-MM-dd')
          : ''
      });
    }
  }, [currentCustomer]);

  // Load profile image from localStorage on component mount
  useEffect(() => {
    const savedProfileImage = localStorage.getItem('customerProfileImage');
    if (savedProfileImage) {
      setProfileImage(savedProfileImage);
    }
  }, []);

  // Handle profile form changes
  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
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
    const existingCustomer = customers.find(c => 
      c.email.toLowerCase() === profileForm.email.toLowerCase() && c.id !== currentCustomer.id
    );
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
    setCurrentCustomer(prev => prev ? { ...prev, ...updatedData } : null);
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
        dateOfBirth: currentCustomer.dateOfBirth 
          ? format(new Date(currentCustomer.dateOfBirth), 'yyyy-MM-dd')
          : ''
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
          date: apt.date,
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

    // Check if new date/time is at least 24 hours in the future
    const newDateTime = new Date(selectedNewDate);
    newDateTime.setHours(parseInt(selectedNewTime.split(':')[0]), parseInt(selectedNewTime.split(':')[1]));
    
    const minRescheduleTime = addDays(new Date(), 1);
    if (isBefore(newDateTime, minRescheduleTime)) {
      toast.error('Appointments can only be rescheduled at least 24 hours in advance');
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

  // Handle appointment cancellation
  const handleCancel = (appointmentId: string) => {
    const appointment = customerAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Check if appointment is at least 24 hours away
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(parseInt(appointment.time.split(':')[0]), parseInt(appointment.time.split(':')[1]));
    
    const minCancelTime = addDays(new Date(), 1);
    if (isBefore(appointmentDateTime, minCancelTime)) {
      toast.error('Appointments can only be cancelled at least 24 hours in advance');
      return;
    }

    updateAppointment(appointmentId, { status: 'Cancelled' });
    setCustomerAppointments(getCustomerAppointments(currentCustomer!.id));
    toast.success('Appointment cancelled successfully');
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
  const upcomingAppointments = customerAppointments.filter(apt => 
    new Date(apt.date) > new Date() && apt.status !== 'Cancelled'
  ).length;
  const rescheduledAppointments = customerAppointments.filter(apt => apt.status === 'Rescheduled').length;
  const canceledAppointments = customerAppointments.filter(apt => apt.status === 'Cancelled').length;
  const lastAppointmentDate = customerAppointments.length > 0 
    ? new Date(Math.max(...customerAppointments.map(apt => new Date(apt.date).getTime())))
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Customer Portal</h1>
            </div>
            {isAuthenticated && (
              <Button variant="outline" onClick={handleLogout}>
                <X className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          // Login Form
          <div className="max-w-md mx-auto space-y-6 py-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Access Your Account</h2>
              <p className="text-muted-foreground">
                Enter your email to view and manage your appointments
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  {customerEmail && isPortalLockRequired(customerEmail) && (
                    <div className="space-y-2">
                      <Label htmlFor="portalLock">Portal Lock Password</Label>
                      <Input
                        id="portalLock"
                        type="password"
                        value={portalLock}
                        onChange={(e) => setPortalLock(e.target.value)}
                        placeholder="Enter your portal lock password"
                        required
                      />
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full">
                    Access Portal
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only customers with login access enabled can use this portal. 
                Contact us if you need access.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Authenticated Customer Dashboard
          <div className="space-y-6">
            {/* Customer Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profileImage || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {currentCustomer?.firstName?.[0]}{currentCustomer?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => document.getElementById('profile-upload')?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const imageData = e.target?.result as string;
                              setProfileImage(imageData);
                              localStorage.setItem('customerProfileImage', imageData);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-lg truncate">
                        Welcome back, {currentCustomer?.firstName}
                      </h2>
                      <p className="text-muted-foreground text-sm truncate">{currentCustomer?.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="appointments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="history">History & Stats</TabsTrigger>
              </TabsList>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{upcomingAppointments}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{completedAppointments}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalAppointments}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Book New Appointment Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.open('/book/demo', '_blank')}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book New Appointment
                  </Button>
                </div>

                <div className="space-y-4">
                  {customerAppointments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No appointments found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    customerAppointments
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((appointment) => {
                        const service = getServiceById(appointment.serviceId);
                        const staff = getStaffById(appointment.staffId);
                        const location = getLocationById(appointment.locationId);
                        const appointmentDate = new Date(appointment.date);
                        const isUpcoming = isAfter(appointmentDate, new Date()) && appointment.status !== 'Cancelled';
                        const canModify = isUpcoming && isAfter(appointmentDate, addDays(new Date(), 1));

                        return (
                          <Card key={appointment.id}>
                            <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row items-start gap-4">
                                <div className="space-y-3 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={getStatusBadge(appointment.status)}>
                                      {appointment.status}
                                    </Badge>
                                    {isUpcoming && (
                                      <Badge variant="outline">Upcoming</Badge>
                                    )}
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-lg">{service?.name || 'Unknown Service'}</h3>
                                    <p className="text-muted-foreground">{formatPrice(appointment.totalPrice)}</p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{format(appointmentDate, 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{appointment.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{location?.name || 'Unknown Location'}</span>
                                    </div>
                                  </div>

                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">Staff:</span> {staff?.name || 'Unknown Staff'}
                                  </div>
                                </div>

                                {canModify && (
                                  <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingAppointment(appointment.id)}
                                      className="flex-1 lg:flex-none"
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Reschedule
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancel(appointment.id)}
                                      className="flex-1 lg:flex-none"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Reschedule Form */}
                              {editingAppointment === appointment.id && (
                                <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-4">
                                  <h4 className="font-medium">Reschedule Appointment</h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                       <Label>New Date</Label>
                                       <Input
                                         type="date"
                                         min={format(addDays(new Date(), 2), 'yyyy-MM-dd')}
                                         value={selectedNewDate ? format(selectedNewDate, 'yyyy-MM-dd') : ''}
                                         onChange={(e) => {
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
                                         onChange={(e) => setSelectedNewTime(e.target.value)}
                                       >
                                         <option value="">Select time</option>
                                         {selectedNewDate && getAvailableTimeSlots(selectedNewDate, appointment.id).map(time => (
                                           <option key={time} value={time}>{formatTimeSlot(time)}</option>
                                         ))}
                                       </select>
                                     </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleReschedule(appointment.id)}
                                      disabled={!selectedNewDate || !selectedNewTime}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Confirm Reschedule
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingAppointment(null)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                  )}
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
                    {!isEditingProfile ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelProfileEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleProfileUpdate}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        {isEditingProfile ? (
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                            placeholder="Enter first name"
                            required
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded">{currentCustomer?.firstName}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        {isEditingProfile ? (
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                            placeholder="Enter last name"
                            required
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded">{currentCustomer?.lastName}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        {isEditingProfile ? (
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => handleProfileInputChange('email', e.target.value)}
                            placeholder="Enter email address"
                            required
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded">{currentCustomer?.email}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        {isEditingProfile ? (
                          <Input
                            id="phone"
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded">{currentCustomer?.phone || 'Not provided'}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        {isEditingProfile ? (
                          <select
                            id="gender"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={profileForm.gender}
                            onChange={(e) => handleProfileInputChange('gender', e.target.value)}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                        ) : (
                          <div className="p-3 bg-muted rounded capitalize">{currentCustomer?.gender || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        {isEditingProfile ? (
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={profileForm.dateOfBirth}
                            onChange={(e) => handleProfileInputChange('dateOfBirth', e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded">
                            {currentCustomer?.dateOfBirth 
                              ? format(new Date(currentCustomer.dateOfBirth), 'MMM dd, yyyy')
                              : 'Not provided'
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditingProfile && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Fields marked with * are required. Changes will be saved to your profile and updated in the business system.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Portal Security</CardTitle>
                    <CardDescription>
                      Manage access security for your customer portal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <PortalLockSettings customerEmail={currentCustomer?.email || ''} />
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
                        {customerAppointments.length > 0 
                          ? format(new Date(Math.min(...customerAppointments.map(apt => new Date(apt.date).getTime()))), 'MMM yyyy')
                          : 'New Customer'
                        }
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
                      <span>Upcoming Appointments</span>
                      <span className="font-medium">{upcomingAppointments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rescheduled</span>
                      <span className="font-medium">{rescheduledAppointments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Canceled</span>
                      <span className="font-medium">{canceledAppointments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Appointment Date</span>
                      <span className="font-medium">
                        {lastAppointmentDate 
                          ? format(lastAppointmentDate, 'MMM dd, yyyy')
                          : 'No appointments yet'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Spent</span>
                      <span className="font-medium">
                        {formatPrice(customerAppointments
                          .filter(apt => apt.status === 'Completed')
                          .reduce((sum, apt) => sum + apt.totalPrice, 0)
                        )}
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
                            {completedAppointments >= 10 ? 'VIP Customer' : 
                             completedAppointments >= 5 ? 'Valued Customer' : 'Welcome Customer'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {completedAppointments >= 10 
                            ? 'Thank you for your continued loyalty!' 
                            : `${10 - completedAppointments} more appointments to reach VIP status`
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}