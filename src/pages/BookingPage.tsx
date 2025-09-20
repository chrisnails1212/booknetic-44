import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../contexts/AppDataContext';
import { useBookingTheme } from '../contexts/BookingThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useToast } from '../hooks/use-toast';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, Star, Check, AlertCircle, Gift, Users } from 'lucide-react';
import { format, addDays, startOfDay, isAfter } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { HorizontalCalendar } from '../components/booking/HorizontalCalendar';
import { isDateAvailable, getAvailableTimeSlotsForDate, findNextAvailableDate } from '../utils/availabilityHelper';
import { InteractiveFormRenderer } from '../components/forms/InteractiveFormRenderer';

const BookingPage = () => {
  const { toast } = useToast();
  const { 
    services, 
    staff, 
    locations, 
    addAppointment, 
    coupons, 
    giftcards,
    appointments,
    getCustomerById,
    customers 
  } = useAppData();
  const { theme } = useBookingTheme();
  const { formatPrice } = useCurrency();
  const [searchParams] = useSearchParams();
  
  // Get settings from localStorage
  const [groupBookingEnabled, setGroupBookingEnabled] = useState(true);
  const [guestLimit, setGuestLimit] = useState(10);

  useEffect(() => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setGroupBookingEnabled(parsedSettings.groupBooking !== false);
        setGuestLimit(parsedSettings.groupBookingGuestLimit || 10);
      } catch (error) {
        console.error('Error parsing general settings:', error);
        setGroupBookingEnabled(true);
        setGuestLimit(10);
      }
    }
  }, []);

  const [bookingData, setBookingData] = useState({
    location: locations.length === 1 ? locations[0].id : '',
    staff: '',
    service: '',
    date: '',
    time: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    couponCode: '',
    giftcardCode: '',
    notes: ''
  });
  
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [bringPeopleEnabled, setBringPeopleEnabled] = useState(false);
  const [guestServices, setGuestServices] = useState<{[guestIndex: number]: string}>({});
  const [guestServiceExtras, setGuestServiceExtras] = useState<{[guestIndex: number]: string[]}>({});
  const [guestStaffSelections, setGuestStaffSelections] = useState<{[guestIndex: number]: string}>({});

  const steps = [
    'Location',
    'Service',
    'Service Extras',
    'Staff Selection', 
    'Date & Time',
    'Information',
    'Confirmation'
  ];

  // Get service forms data
  const [serviceForms, setServiceForms] = useState<any[]>([]);

  useEffect(() => {
    const savedForms = JSON.parse(localStorage.getItem('customForms') || '[]');
    setServiceForms(savedForms);
  }, []);

  // Get available staff for selected service and location
  const getAvailableStaff = () => {
    if (!bookingData.service || !bookingData.location) return [];
    
    const selectedService = services.find(s => s.id === bookingData.service);
    const selectedLocation = locations.find(l => l.id === bookingData.location);
    
    if (!selectedService || !selectedLocation) return [];
    
    return staff.filter(s => 
      s.services.includes(bookingData.service) && 
      s.locations.includes(bookingData.location)
    );
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    const selectedService = services.find(s => s.id === bookingData.service);
    if (!selectedService) return 0;

    let subtotal = selectedService.price;
    
    // Add extras
    selectedExtras.forEach(extraId => {
      const extra = selectedService.extras?.find(e => e.id === extraId);
      if (extra) subtotal += extra.price;
    });

    // Add guest services
    Object.values(guestServices).forEach(guestServiceId => {
      const guestService = services.find(s => s.id === guestServiceId);
      if (guestService) subtotal += guestService.price;
    });

    // Add guest service extras
    Object.entries(guestServiceExtras).forEach(([guestIndex, guestExtras]) => {
      const guestServiceId = guestServices[parseInt(guestIndex)];
      const guestService = services.find(s => s.id === guestServiceId);
      
      guestExtras.forEach(extraId => {
        const extra = guestService?.extras?.find(e => e.id === extraId);
        if (extra) subtotal += extra.price;
      });
    });

    let totalDiscount = 0;

    // Apply coupon discount
    if (availableCoupon) {
      if (availableCoupon.discount.type === 'percentage') {
        totalDiscount += (subtotal * availableCoupon.discount.value) / 100;
      } else {
        totalDiscount += availableCoupon.discount.value;
      }
    }

    // Apply giftcard balance
    if (availableGiftcard) {
      totalDiscount += Math.min(availableGiftcard.balance, subtotal - totalDiscount);
    }

    return totalDiscount;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    const selectedService = services.find(s => s.id === bookingData.service);
    if (!selectedService) return 0;

    let total = selectedService.price;
    
    // Add extras
    selectedExtras.forEach(extraId => {
      const extra = selectedService.extras?.find(e => e.id === extraId);
      if (extra) total += extra.price;
    });

    // Add guest services
    Object.values(guestServices).forEach(guestServiceId => {
      const guestService = services.find(s => s.id === guestServiceId);
      if (guestService) total += guestService.price;
    });

    // Add guest service extras
    Object.entries(guestServiceExtras).forEach(([guestIndex, guestExtras]) => {
      const guestServiceId = guestServices[parseInt(guestIndex)];
      const guestService = services.find(s => s.id === guestServiceId);
      
      guestExtras.forEach(extraId => {
        const extra = guestService?.extras?.find(e => e.id === extraId);
        if (extra) total += extra.price;
      });
    });

    return Math.max(0, total - calculateDiscountAmount());
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formResponses, setFormResponses] = useState<{ [fieldId: string]: any }>({});

  // Get current location details
  const currentLocation = locations.find(l => l.id === bookingData.location);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get available coupon
  const availableCoupon = bookingData.couponCode 
    ? coupons.find(c => c.code.toLowerCase() === bookingData.couponCode.toLowerCase())
    : null;

  // Get available giftcard
  const availableGiftcard = bookingData.giftcardCode 
    ? giftcards.find(g => g.code.toLowerCase() === bookingData.giftcardCode.toLowerCase() && g.balance > 0)
    : null;

  // Auto-select service and staff from URL params
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const staffParam = searchParams.get('staff');
    
    if (serviceParam && services.some(s => s.id === serviceParam)) {
      setBookingData(prev => ({ ...prev, service: serviceParam }));
    }
    
    if (staffParam && staff.some(s => s.id === staffParam)) {
      setBookingData(prev => ({ ...prev, staff: staffParam }));
    }
  }, [searchParams, services, staff]);

  const handleNext = () => {
    const errors: string[] = [];

    // Step validation
    switch (currentStep) {
      case 0: // Location
        if (!bookingData.location) errors.push('Please select a location');
        break;
      case 1: // Service
        if (!bookingData.service) errors.push('Please select a service');
        break;
      case 2: // Service Extras - no validation needed, extras are optional
        break;
      case 3: // Staff Selection
        if (!bookingData.staff) errors.push('Please select a staff member for your service');
        // Validate guest staff selections
        if (bringPeopleEnabled && additionalGuests > 0) {
          Object.entries(guestServices).forEach(([guestIndex, guestServiceId]) => {
            if (!guestStaffSelections[parseInt(guestIndex)]) {
              errors.push(`Please select a staff member for Guest ${parseInt(guestIndex) + 1}'s service`);
            }
          });
        }
        break;
      case 4: // Date & Time
        if (!bookingData.date) errors.push('Please select a date');
        if (!bookingData.time) errors.push('Please select a time');
        break;
      case 5: // Information
        if (!bookingData.customerName) errors.push('Please enter your name');
        if (!bookingData.customerEmail) errors.push('Please enter your email');
        if (!bookingData.customerPhone) errors.push('Please enter your phone number');
        break;
    }

    setValidationErrors(errors);

    if (errors.length === 0) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    try {
      const selectedService = services.find(s => s.id === bookingData.service);
      if (!selectedService) {
        toast({
          title: "Error",
          description: "Selected service not found",
          variant: "destructive"
        });
        return;
      }

      // Create main appointment
      const appointmentData = {
        serviceId: bookingData.service,
        staffId: bookingData.staff,
        customerId: '',
        locationId: bookingData.location,
        date: bookingData.date,
        time: bookingData.time,
        status: 'Scheduled' as const,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        notes: bookingData.notes,
        selectedExtras: selectedExtras,
        formResponses: formResponses,
        additionalGuests: additionalGuests,
        guestServices: guestServices,
        guestServiceExtras: guestServiceExtras,
        guestStaffSelections: guestStaffSelections,
        couponCode: bookingData.couponCode,
        giftcardCode: bookingData.giftcardCode,
        totalPrice: calculateTotalPrice(),
        appliedCoupons: availableCoupon ? [availableCoupon.id] : [],
        customFields: formResponses
      };

      addAppointment(appointmentData);

      toast({
        title: "Booking Confirmed",
        description: "Your appointment has been successfully booked!",
      });

      // Reset form
      setBookingData({
        location: locations.length === 1 ? locations[0].id : '',
        staff: '',
        service: '',
        date: '',
        time: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        couponCode: '',
        giftcardCode: '',
        notes: ''
      });
      setSelectedExtras([]);
      setFormResponses({});
      setAdditionalGuests(0);
      setGuestServices({});
      setGuestServiceExtras({});
      setGuestStaffSelections({});
      setCurrentStep(0);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Location
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Location</h3>
            {locations.map((location) => (
              <div
                key={location.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  bookingData.location === location.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setBookingData({ ...bookingData, location: location.id })}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.address}</p>
                    {location.phone && (
                      <p className="text-sm text-gray-500">{location.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 1: // Service Selection
        const availableServices = bookingData.location 
          ? services.filter(service => 
              staff.some(s => 
                s.services.includes(service.id) && 
                s.locations.includes(bookingData.location)
              )
            )
          : [];

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Select Service</h3>
            
            {/* Main Service Selection */}
            <div className="space-y-4">
              {availableServices.map((service) => (
                <div
                  key={service.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    bookingData.service === service.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setBookingData({ ...bookingData, service: service.id, staff: '' });
                    setSelectedExtras([]);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} min
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>
                    {bookingData.service === service.id && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Group Booking Toggle */}
            {groupBookingEnabled && bookingData.service && (
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="bring-people"
                    checked={bringPeopleEnabled}
                    onCheckedChange={(checked) => {
                      setBringPeopleEnabled(!!checked);
                      if (!checked) {
                        setAdditionalGuests(0);
                        setGuestServices({});
                        setGuestServiceExtras({});
                        setGuestStaffSelections({});
                      }
                    }}
                  />
                  <Label htmlFor="bring-people" className="text-sm font-medium cursor-pointer">
                    I want to bring people with me
                  </Label>
                </div>

                {bringPeopleEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">Additional Guests:</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newCount = Math.max(0, additionalGuests - 1);
                              setAdditionalGuests(newCount);
                              const newGuestServices = { ...guestServices };
                              const newGuestExtras = { ...guestServiceExtras };
                              const newGuestStaff = { ...guestStaffSelections };
                              for (let i = newCount; i < additionalGuests; i++) {
                                delete newGuestServices[i];
                                delete newGuestExtras[i];
                                delete newGuestStaff[i];
                              }
                              setGuestServices(newGuestServices);
                              setGuestServiceExtras(newGuestExtras);
                              setGuestStaffSelections(newGuestStaff);
                            }}
                            disabled={additionalGuests === 0}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">
                            {additionalGuests}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdditionalGuests(Math.min(guestLimit, additionalGuests + 1))}
                            disabled={additionalGuests >= guestLimit}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      {additionalGuests > 0 && (
                        <span className="text-sm text-gray-600">
                          Total: {1 + additionalGuests} people (you + {additionalGuests} guest{additionalGuests > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>

                    {additionalGuests > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Select services for your guests:</h5>
                        {Array.from({ length: additionalGuests }, (_, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <Label className="text-sm font-medium mb-2 block">
                              Guest {index + 1} Service:
                            </Label>
                            <Select
                              value={guestServices[index] || ''}
                              onValueChange={(value) => {
                                setGuestServices(prev => ({
                                  ...prev,
                                  [index]: value
                                }));
                                // Clear extras when service changes
                                setGuestServiceExtras(prev => ({
                                  ...prev,
                                  [index]: []
                                }));
                                // Clear staff selection when service changes
                                setGuestStaffSelections(prev => ({
                                  ...prev,
                                  [index]: ''
                                }));
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableServices.map((service) => (
                                  <SelectItem key={service.id} value={service.id}>
                                    <div className="flex justify-between items-center w-full">
                                      <span>{service.name}</span>
                                      <span className="text-green-600 font-medium">
                                        {formatPrice(service.price)}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2: // Service Extras (Combined)
        const selectedService = services.find(s => s.id === bookingData.service);
        const guestServicesWithExtras = Object.entries(guestServices).filter(([_, guestServiceId]) => {
          const guestService = services.find(s => s.id === guestServiceId);
          return guestService?.extras && guestService.extras.length > 0;
        });

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Service Extras</h3>
            
            {/* Main Service Extras */}
            {selectedService?.extras && selectedService.extras.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-4">Your Service Extras: {selectedService.name}</h4>
                <div className="space-y-3">
                  {selectedService.extras.map((extra) => (
                    <div key={extra.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedExtras.includes(extra.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedExtras([...selectedExtras, extra.id]);
                            } else {
                              setSelectedExtras(selectedExtras.filter(id => id !== extra.id));
                            }
                          }}
                        />
                        <div>
                          <Label className="font-medium">{extra.name}</Label>
                          {extra.description && (
                            <p className="text-sm text-gray-600">{extra.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-600">+{formatPrice(extra.price)}</span>
                        {extra.duration && (
                          <p className="text-xs text-gray-500">+{extra.duration} min</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Service Extras */}
            {bringPeopleEnabled && guestServicesWithExtras.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Guest Service Extras</h4>
                {guestServicesWithExtras.map(([guestIndex, guestServiceId]) => {
                  const guestService = services.find(s => s.id === guestServiceId);
                  if (!guestService?.extras) return null;

                  return (
                    <div key={guestIndex} className="border rounded-lg p-4 bg-blue-50">
                      <h5 className="font-medium mb-4">
                        Guest {parseInt(guestIndex) + 1} Extras: {guestService.name}
                      </h5>
                      <div className="space-y-3">
                        {guestService.extras.map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={guestServiceExtras[parseInt(guestIndex)]?.includes(extra.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentExtras = guestServiceExtras[parseInt(guestIndex)] || [];
                                  if (checked) {
                                    setGuestServiceExtras(prev => ({
                                      ...prev,
                                      [parseInt(guestIndex)]: [...currentExtras, extra.id]
                                    }));
                                  } else {
                                    setGuestServiceExtras(prev => ({
                                      ...prev,
                                      [parseInt(guestIndex)]: currentExtras.filter(id => id !== extra.id)
                                    }));
                                  }
                                }}
                              />
                              <div>
                                <Label className="font-medium">{extra.name}</Label>
                                {extra.description && (
                                  <p className="text-sm text-gray-600">{extra.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-green-600">+{formatPrice(extra.price)}</span>
                              {extra.duration && (
                                <p className="text-xs text-gray-500">+{extra.duration} min</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No extras available message */}
            {(!selectedService?.extras || selectedService.extras.length === 0) && 
             (!bringPeopleEnabled || guestServicesWithExtras.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-700">No Service Extras Available</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    The selected service{bringPeopleEnabled && additionalGuests > 0 ? 's' : ''} do not have any additional extras to choose from.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Click Next to continue with staff selection.</p>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Staff Selection (Per Service Per Guest)
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Select Staff</h3>
            
            {/* Main Service Staff Selection */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">
                  Your Service: {services.find(s => s.id === bookingData.service)?.name}
                </h4>
                <Select 
                  value={bookingData.staff} 
                  onValueChange={(value) => {
                    setBookingData({ ...bookingData, staff: value });
                  }}
                >
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <span>Any available professional</span>
                      </div>
                    </SelectItem>
                    {getAvailableStaff().map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            {staffMember.avatar ? (
                              <AvatarImage src={staffMember.avatar} alt={staffMember.name} className="object-cover" />
                            ) : (
                              <AvatarFallback 
                                className="text-white font-semibold text-xs"
                                style={{ backgroundColor: theme.primaryColor }}
                              >
                                {staffMember.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>{staffMember.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Services Staff Selection */}
              {bringPeopleEnabled && additionalGuests > 0 && Object.keys(guestServices).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Guest Services Staff</h4>
                  {Object.entries(guestServices).map(([guestIndex, guestServiceId]) => {
                    const guestService = services.find(s => s.id === guestServiceId);
                    if (!guestService) return null;

                    // Get available staff for this guest's service
                    const availableStaffForGuest = staff.filter(s => 
                      s.services.includes(guestServiceId) && 
                      s.locations.includes(bookingData.location)
                    );

                    return (
                      <div key={guestIndex} className="border rounded-lg p-4 bg-blue-50">
                        <h5 className="font-medium mb-3">
                          Guest {parseInt(guestIndex) + 1}: {guestService.name}
                        </h5>
                        <Select 
                          value={guestStaffSelections[parseInt(guestIndex)] || ''} 
                          onValueChange={(value) => {
                            setGuestStaffSelections(prev => ({
                              ...prev,
                              [parseInt(guestIndex)]: value
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full bg-white border-gray-200">
                            <User className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select staff member for guest" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-gray-500" />
                                </div>
                                <span>Any available professional</span>
                              </div>
                            </SelectItem>
                            {availableStaffForGuest.map((staffMember) => (
                              <SelectItem key={staffMember.id} value={staffMember.id}>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="w-6 h-6">
                                    {staffMember.avatar ? (
                                      <AvatarImage src={staffMember.avatar} alt={staffMember.name} className="object-cover" />
                                    ) : (
                                      <AvatarFallback 
                                        className="text-white font-semibold text-xs"
                                        style={{ backgroundColor: theme.primaryColor }}
                                      >
                                        {staffMember.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span>{staffMember.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Date & Time
        // Get selected staff for availability calculation
        const selectedStaffForTime = bookingData.staff === 'any' ? null : staff.find(s => s.id === bookingData.staff);

        // Calculate total service duration including extras
        const selectedServiceForTime = services.find(s => s.id === bookingData.service);
        if (!selectedServiceForTime) return null;

        let totalServiceDuration = selectedServiceForTime.duration + 
          selectedExtras.reduce((total, extraId) => {
            const extra = selectedServiceForTime.extras?.find(e => e.id === extraId);
            return total + (extra?.duration || 0);
          }, 0);

        // Apply group booking duration multiplier
        const durationMultiplier = 1 + additionalGuests;
        totalServiceDuration = totalServiceDuration * durationMultiplier;

        // Convert appointments to BookedAppointment format
        const bookedAppointments = appointments.map(appointment => {
          const service = services.find(s => s.id === appointment.serviceId);
          let appointmentDuration = service?.duration || 60;
          
          // Add extra duration if any
          if (appointment.selectedExtras) {
            appointment.selectedExtras.forEach(extraId => {
              const extra = service?.extras?.find(e => e.id === extraId);
              if (extra) appointmentDuration += extra.duration || 30;
            });
          }
          
          // Apply group booking duration multiplier if appointment has additional guests
          const appointmentMultiplier = 1 + (appointment.additionalGuests || 0);
          appointmentDuration = appointmentDuration * appointmentMultiplier;
          
          return {
            id: appointment.id,
            staffId: appointment.staffId,
            serviceId: appointment.serviceId,
            date: appointment.date,
            time: appointment.time,
            duration: appointmentDuration
          };
        });

        // Get available time slots for selected date
        const availableTimeSlots = bookingData.date && selectedStaffForTime?.schedule 
          ? getAvailableTimeSlotsForDate(
              new Date(bookingData.date), 
              selectedStaffForTime.schedule, 
              totalServiceDuration,
              bookedAppointments,
              selectedStaffForTime.id
            )
          : [];

        // For "any staff", we should combine availability from all available staff
        const getAnyStaffAvailability = (date: Date) => {
          if (bookingData.staff !== 'any') return [];
          
          const availableStaff = getAvailableStaff();
          const allTimeSlots = new Set<string>();
          
          availableStaff.forEach(staffMember => {
            if (staffMember.schedule) {
              const slots = getAvailableTimeSlotsForDate(
                date, 
                staffMember.schedule, 
                totalServiceDuration,
                bookedAppointments,
                staffMember.id
              );
              slots.forEach(slot => allTimeSlots.add(slot));
            }
          });
          
          return Array.from(allTimeSlots).sort();
        };

        const finalAvailableSlots = bookingData.staff === 'any' && bookingData.date
          ? getAnyStaffAvailability(new Date(bookingData.date))
          : availableTimeSlots;

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Select Date & Time</h3>
            
            {/* Calendar Icon */}
            <div className="flex items-center justify-end">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-lg border border-gray-200"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={bookingData.date ? new Date(bookingData.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setBookingData({ ...bookingData, date: format(date, 'yyyy-MM-dd'), time: '' });
                        setIsCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      // Disable past dates and today - booking starts from tomorrow
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date <= today) return true;
                      
                      // If specific staff selected, check their availability
                      if (bookingData.staff !== 'any' && selectedStaffForTime?.schedule) {
                        return !isDateAvailable(date, selectedStaffForTime.schedule);
                      }
                      
                      // If "any staff" selected, check if any staff is available
                      if (bookingData.staff === 'any') {
                        const availableStaff = getAvailableStaff();
                        return !availableStaff.some(staffMember => 
                          staffMember.schedule && isDateAvailable(date, staffMember.schedule)
                        );
                      }
                      
                      return false;
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Horizontal Calendar */}
            <div className="w-full">
              <HorizontalCalendar
                selectedDate={bookingData.date ? new Date(bookingData.date) : undefined}
                onDateSelect={(date) => {
                  setBookingData({ ...bookingData, date: format(date, 'yyyy-MM-dd'), time: '' });
                }}
                disabledDates={(date) => {
                  // Disable past dates and today - booking starts from tomorrow
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date <= today) return true;
                  
                  // If specific staff selected, check their availability
                  if (bookingData.staff !== 'any' && selectedStaffForTime?.schedule) {
                    return !isDateAvailable(date, selectedStaffForTime.schedule);
                  }
                  
                  // If "any staff" selected, check if any staff is available
                  if (bookingData.staff === 'any') {
                    const availableStaff = getAvailableStaff();
                    return !availableStaff.some(staffMember => 
                      staffMember.schedule && isDateAvailable(date, staffMember.schedule)
                    );
                  }
                  
                  return false;
                }}
              />
            </div>

            {/* Time Selection */}
            {bookingData.date && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Available Times</h4>
                
                {finalAvailableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {finalAvailableSlots.map((timeSlot) => (
                      <Button
                        key={timeSlot}
                        variant={bookingData.time === timeSlot ? "default" : "outline"}
                        onClick={() => setBookingData({ ...bookingData, time: timeSlot })}
                        className="text-sm py-2"
                        style={{
                          backgroundColor: bookingData.time === timeSlot ? theme.primaryColor : '',
                          borderColor: theme.primaryColor
                        }}
                      >
                        {timeSlot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-2">No available times for this date</p>
                    <p className="text-sm text-gray-400">Please select a different date</p>
                  </div>
                )}

                {bookingData.time && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Selected Time: {bookingData.time}</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Duration: {totalServiceDuration} minutes 
                      (Base: {selectedServiceForTime.duration * (1 + additionalGuests)} min + Extras: {(totalServiceDuration / (1 + additionalGuests) - selectedServiceForTime.duration) * (1 + additionalGuests)} min)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5: // Information
        const selectedServiceData = services.find(s => s.id === bookingData.service);
        const serviceForm = serviceForms.find(form => form.serviceId === bookingData.service);

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Your Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={bookingData.customerEmail}
                  onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="couponCode">Coupon Code</Label>
                <Input
                  id="couponCode"
                  value={bookingData.couponCode}
                  onChange={(e) => setBookingData({ ...bookingData, couponCode: e.target.value })}
                  placeholder="Enter coupon code"
                />
                {availableCoupon && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {availableCoupon.discount.type === 'percentage' 
                      ? `${availableCoupon.discount.value}% off` 
                      : `${formatPrice(availableCoupon.discount.value)} off`}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="giftcardCode">Gift Card Code</Label>
                <Input
                  id="giftcardCode"
                  value={bookingData.giftcardCode}
                  onChange={(e) => setBookingData({ ...bookingData, giftcardCode: e.target.value })}
                  placeholder="Enter gift card code"
                />
                {availableGiftcard && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Gift card balance: {formatPrice(availableGiftcard.balance)}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>

            {/* Service Form */}
            {serviceForm && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Additional Information</h4>
                <InteractiveFormRenderer
                  formElements={serviceForm.elements}
                  responses={formResponses}
                  onResponseChange={(fieldId, value) => {
                    setFormResponses(prev => ({
                      ...prev,
                      [fieldId]: value
                    }));
                  }}
                />
              </div>
            )}

            {/* Booking Summary */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Booking Summary</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span>{selectedServiceData?.name}</span>
                </div>
                
                {additionalGuests > 0 && (
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span>
                      {additionalGuests} guest{additionalGuests > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Staff:</span>
                  <span>
                    {bookingData.staff === 'any' 
                      ? 'Any available professional' 
                      : staff.find(s => s.id === bookingData.staff)?.name
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{bookingData.date ? format(new Date(bookingData.date), 'EEE, dd MMM yyyy') : 'Not selected'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{bookingData.time || 'Not selected'}</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Service Price:</span>
                    <div className="text-right">
                      {additionalGuests > 0 && (
                        <div className="text-xs text-gray-500">
                          x{1 + additionalGuests} (you + {additionalGuests} guest{additionalGuests > 1 ? 's' : ''})
                        </div>
                      )}
                      <span className="text-green-600">{formatPrice((selectedServiceData?.price || 0) * (1 + additionalGuests))}</span>
                    </div>
                  </div>
                  
                  {selectedExtras.length > 0 && (
                    <div>
                      <span className="font-medium">Extras:</span>
                      {selectedExtras.map(extraId => {
                        const extra = selectedServiceData?.extras?.find(e => e.id === extraId);
                        if (!extra) return null;
                        return (
                          <div key={extraId} className="flex justify-between text-sm ml-4">
                            <span>+ {extra.name}</span>
                            <div className="text-right">
                              {additionalGuests > 0 && (
                                <div className="text-xs text-gray-500">
                                  x{1 + additionalGuests} (you + {additionalGuests} guest{additionalGuests > 1 ? 's' : ''})
                                </div>
                              )}
                              <span className="text-green-600">+{formatPrice(extra.price * (1 + additionalGuests))}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Guest Services */}
                  {Object.entries(guestServices).map(([guestIndex, guestServiceId]) => {
                    const guestService = services.find(s => s.id === guestServiceId);
                    if (!guestService) return null;
                    
                    return (
                      <div key={guestIndex} className="ml-4">
                        <div className="flex justify-between text-sm">
                          <span>Guest {parseInt(guestIndex) + 1}: {guestService.name}</span>
                          <span className="text-green-600">{formatPrice(guestService.price)}</span>
                        </div>
                        
                        {/* Guest Service Extras */}
                        {guestServiceExtras[parseInt(guestIndex)]?.map(extraId => {
                          const extra = guestService.extras?.find(e => e.id === extraId);
                          if (!extra) return null;
                          
                          return (
                            <div key={extraId} className="flex justify-between text-xs ml-4 text-gray-600">
                              <span>+ {extra.name}</span>
                              <span className="text-green-600">+{formatPrice(extra.price)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  
                  {(availableCoupon || availableGiftcard) && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        {availableCoupon && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Coupon ({availableCoupon.code}):</span>
                            <span>-{formatPrice(calculateDiscountAmount())}</span>
                          </div>
                        )}
                        {availableGiftcard && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Gift Card ({availableGiftcard.code}):</span>
                            <span>-{formatPrice(Math.min(availableGiftcard.balance, calculateTotalPrice() + calculateDiscountAmount()))}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(calculateTotalPrice())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Confirmation
        const selectedServiceForConfirmation = services.find(s => s.id === bookingData.service);
        const selectedStaffForConfirmation = staff.find(s => s.id === bookingData.staff);
        const selectedLocationForConfirmation = locations.find(l => l.id === bookingData.location);

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600">Your appointment has been successfully scheduled.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold">Booking Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Service:</span>
                  <p>{selectedServiceForConfirmation?.name}</p>
                </div>
                
                <div>
                  <span className="font-medium">Staff:</span>
                  <p>
                    {bookingData.staff === 'any' 
                      ? 'Any available professional' 
                      : selectedStaffForConfirmation?.name
                    }
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">Date & Time:</span>
                  <p>
                    {bookingData.date ? format(new Date(bookingData.date), 'EEE, dd MMM yyyy') : ''} at {bookingData.time}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">Location:</span>
                  <p>{selectedLocationForConfirmation?.name}</p>
                </div>
                
                <div>
                  <span className="font-medium">Customer:</span>
                  <p>{bookingData.customerName}</p>
                  <p className="text-gray-500">{bookingData.customerEmail}</p>
                  <p className="text-gray-500">{bookingData.customerPhone}</p>
                </div>
                
                <div>
                  <span className="font-medium">Total Price:</span>
                  <p className="text-lg font-semibold text-green-600">{formatPrice(calculateTotalPrice())}</p>
                </div>
              </div>
              
              {bookingData.notes && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="text-gray-600">{bookingData.notes}</p>
                </div>
              )}
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                A confirmation email will be sent to {bookingData.customerEmail}
              </p>
              
              <Button
                onClick={() => {
                  setBookingData({
                    location: locations.length === 1 ? locations[0].id : '',
                    staff: '',
                    service: '',
                    date: '',
                    time: '',
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    couponCode: '',
                    giftcardCode: '',
                    notes: ''
                  });
                  setSelectedExtras([]);
                  setFormResponses({});
                  setAdditionalGuests(0);
                  setGuestServices({});
                  setGuestServiceExtras({});
                  setGuestStaffSelections({});
                  setCurrentStep(0);
                }}
                variant="outline"
              >
                Book Another Appointment
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="text-white py-8"
        style={{ backgroundColor: theme.primaryColor }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{theme.businessName}</h1>
          <p className="text-lg opacity-90">Book Your Appointment</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={index} className="flex-1 text-center">
                <div className={`text-xs font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step}
                </div>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="flex items-center space-x-2"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span>Complete Booking</span>
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;