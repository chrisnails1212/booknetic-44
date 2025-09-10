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

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Customer Portal</h1>
                <p className="text-slate-600 mt-2">Access your appointments and profile</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                
                {isPortalLockRequired(customerEmail) && (
                  <div className="space-y-2">
                    <Label htmlFor="portalLock">Portal Lock Password</Label>
                    <Input
                      id="portalLock"
                      type="password"
                      value={portalLock}
                      onChange={(e) => setPortalLock(e.target.value)}
                      placeholder="Enter portal lock password"
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
        </div>
      </div>
    );
  }

  // Main portal interface with admin layout style
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold">Customer Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Customer Portal</h1>
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profileImage || "/placeholder.svg"} />
              <AvatarFallback className="bg-slate-200">
                {currentCustomer?.firstName?.[0]}{currentCustomer?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-slate-700">
              {currentCustomer?.firstName} {currentCustomer?.lastName}
            </span>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-6">
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={profileImage || "/placeholder.svg"} />
                        <AvatarFallback className="text-lg bg-slate-200">
                          {currentCustomer?.firstName?.[0]}{currentCustomer?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const result = e.target?.result as string;
                                setProfileImage(result);
                                localStorage.setItem('customerProfileImage', result);
                                toast.success('Profile image updated!');
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Welcome back, {currentCustomer?.firstName}!
                      </h2>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {currentCustomer?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Appointment Button */}
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/book/demo-business')} 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="appointments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="history">Account</TabsTrigger>
              </TabsList>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-4">
                {customerAppointments.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Appointments Yet</h3>
                      <p className="text-slate-500 mb-4">You haven't booked any appointments yet.</p>
                      <Button onClick={() => navigate('/book/demo-business')}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Your First Appointment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {customerAppointments
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((appointment) => {
                        const service = getServiceById(appointment.serviceId);
                        const staff = getStaffById(appointment.staffId);
                        const location = getLocationById(appointment.locationId);
                        const appointmentDate = new Date(appointment.date);
                        const today = new Date();
                        const isUpcoming = appointmentDate > today && appointment.status !== 'Cancelled';
                        const availableSlots = editingAppointment === appointment.id 
                          ? getAvailableTimeSlots(selectedNewDate || appointmentDate, appointment.id)
                          : [];

                        return (
                          <Card key={appointment.id} className="shadow-sm">
                            <CardContent className="p-6">
                              {editingAppointment === appointment.id ? (
                                // Editing mode
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingAppointment(null);
                                        setSelectedNewDate(null);
                                        setSelectedNewTime('');
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Select New Date</Label>
                                      <Input
                                        type="date"
                                        value={selectedNewDate ? format(selectedNewDate, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            const date = new Date(e.target.value);
                                            setSelectedNewDate(date);
                                            setSelectedNewTime(''); // Reset time selection
                                          }
                                        }}
                                        min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                      />
                                    </div>
                                    
                                    {selectedNewDate && (
                                      <div className="space-y-2">
                                        <Label>Select New Time</Label>
                                        <select
                                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                          value={selectedNewTime}
                                          onChange={(e) => setSelectedNewTime(e.target.value)}
                                        >
                                          <option value="">Select a time</option>
                                          {availableSlots.map((slot) => (
                                            <option key={slot} value={slot}>
                                              {formatTimeSlot(slot)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => handleReschedule(appointment.id)}
                                      disabled={!selectedNewDate || !selectedNewTime}
                                    >
                                      Confirm Reschedule
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingAppointment(null);
                                        setSelectedNewDate(null);
                                        setSelectedNewTime('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold text-slate-900">{service?.name}</h3>
                                      <Badge variant={getStatusBadge(appointment.status)}>{appointment.status}</Badge>
                                    </div>
                                    {isUpcoming && (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setEditingAppointment(appointment.id)}
                                        >
                                          <Edit2 className="w-4 h-4 mr-1" />
                                          Reschedule
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCancel(appointment.id)}
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      <span>{format(appointmentDate, 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      <span>{appointment.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      <span>{staff?.name}</span>
                                    </div>
                                  </div>

                                  {location && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>{location.name} - {location.address}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-sm text-slate-600">Duration: {service?.duration || 60} minutes</span>
                                    <span className="font-semibold text-slate-900">{formatPrice(appointment.totalPrice)}</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Personal Information</CardTitle>
                      {!isEditingProfile ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditingProfile ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={profileForm.firstName}
                                onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                                placeholder="First Name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={profileForm.lastName}
                                onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                                placeholder="Last Name"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => handleProfileInputChange('email', e.target.value)}
                              placeholder="Email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={profileForm.phone}
                              onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                              placeholder="Phone Number"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="gender">Gender</Label>
                              <select
                                id="gender"
                                value={profileForm.gender}
                                onChange={(e) => handleProfileInputChange('gender', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dateOfBirth">Date of Birth</Label>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={profileForm.dateOfBirth}
                                onChange={(e) => handleProfileInputChange('dateOfBirth', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleProfileUpdate}>
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={handleCancelProfileEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-slate-600">First Name</Label>
                              <p className="font-medium">{currentCustomer?.firstName || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-slate-600">Last Name</Label>
                              <p className="font-medium">{currentCustomer?.lastName || 'Not provided'}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-slate-600">Email</Label>
                            <p className="font-medium">{currentCustomer?.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-slate-600">Phone</Label>
                            <p className="font-medium">{currentCustomer?.phone || 'Not provided'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-slate-600">Gender</Label>
                              <p className="font-medium capitalize">{currentCustomer?.gender || 'Not specified'}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-slate-600">Date of Birth</Label>
                              <p className="font-medium">
                                {currentCustomer?.dateOfBirth 
                                  ? format(new Date(currentCustomer.dateOfBirth), 'MMM dd, yyyy')
                                  : 'Not provided'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
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
                  
                  {/* Notifications Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <p className="text-sm text-muted-foreground">We will send you updates about your appointments, news and offers.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Appointment notifications</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sms-appointments">SMS</Label>
                            <Switch id="sms-appointments" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-appointments">Email</Label>
                            <Switch id="email-appointments" defaultChecked />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold">Marketing notifications</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-marketing">Email</Label>
                            <Switch id="email-marketing" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sms-marketing">SMS</Label>
                            <Switch id="sms-marketing" defaultChecked />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Account Tab */}
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
                      <CardTitle>Points Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Current Points</p>
                          <p className="text-3xl font-bold">{completedAppointments * 50}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Current Tier</p>
                          <p className="text-3xl font-bold">
                            {completedAppointments >= 10 ? 'Gold' : 
                             completedAppointments >= 5 ? 'Silver' : 'Bronze'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                          <p className="text-3xl font-bold">
                            {formatPrice(customerAppointments
                              .filter(apt => apt.status === 'Completed')
                              .reduce((sum, apt) => sum + apt.totalPrice, 0)
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Next Tier</p>
                          <p className="text-lg font-semibold">
                            {completedAppointments >= 10 
                              ? 'Max tier reached!' 
                              : completedAppointments >= 5 
                                ? `Gold: ${(10 - completedAppointments) * 50} more points`
                                : `Silver: ${(5 - completedAppointments) * 50} more points`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}