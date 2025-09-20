import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HorizontalCalendar } from '@/components/booking/HorizontalCalendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, MapPin, Gift, CheckCircle, CalendarIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useBookingTheme } from '@/contexts/BookingThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAppData } from '@/contexts/AppDataContext';
import { format, parse, addMinutes, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { InteractiveFormRenderer } from '@/components/forms/InteractiveFormRenderer';
import { getAvailableTimeSlotsForDate, isDateAvailable, formatTimeSlot, getGroupAvailableTimeSlots, getGroupBookingDuration, StaffServicePair } from '@/utils/availabilityHelper';
import { convertCustomFieldsForSaving } from '@/utils/fileHelper';
import { CustomerSelfServicePanel } from '@/components/customers/CustomerSelfServicePanel';
import { BookingTypeSelector } from '@/components/booking/BookingTypeSelector';
import { GroupBookingManager } from '@/components/booking/GroupBookingManager';
import { BookingType, GroupBookingMember } from '@/types/groupBookingTypes';

const BookingPage = () => {
  const { businessSlug } = useParams();
  const { toast } = useToast();
  const { theme } = useBookingTheme();
  const { formatPrice } = useCurrency();
  const { locations, staff, services, coupons, giftcards, taxes, customers, appointments, addCustomer, updateCustomer, addAppointment } = useAppData();
  
  // Booking type state
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  
  // Individual booking states
  const initialStep = locations.length === 1 ? 2 : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [giftcardCode, setGiftcardCode] = useState('');
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({});
  const [availableGiftcard, setAvailableGiftcard] = useState<any>(null);
  const [availableCoupon, setAvailableCoupon] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  // Group booking states
  const [groupCurrentStep, setGroupCurrentStep] = useState(1);
  const [groupMembers, setGroupMembers] = useState<GroupBookingMember[]>([]);
  const [sameStaff, setSameStaff] = useState(true);
  const [groupBookingData, setGroupBookingData] = useState({
    location: locations.length === 1 ? locations[0].id : '',
    date: '',
    time: '',
    notes: ''
  });

  const individualSteps = [
    'Location',
    'Service',
    'Service Extras',
    'Staff', 
    'Date & Time',
    'Information',
    'Confirmation'
  ];

  const groupSteps = [
    'Location',
    'Group Setup',
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

  // Initialize primary member when switching to group booking
  useEffect(() => {
    if (bookingType === 'group' && groupMembers.length === 0) {
      const primaryMember: GroupBookingMember = {
        id: 'primary-member',
        name: '',
        serviceId: '',
        staffId: '',
        extras: [],
        isPrimary: true
      };
      setGroupMembers([primaryMember]);
    }
  }, [bookingType, groupMembers.length]);

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

  // Calculate discount amount (Individual booking only)
  const calculateDiscountAmount = () => {
    if (bookingType === 'group') return 0;

    const selectedService = services.find(s => s.id === bookingData.service);
    if (!selectedService) return 0;

    let subtotal = selectedService.price;
    
    // Add extras
    selectedExtras.forEach(extraId => {
      const extra = selectedService.extras?.find(e => e.id === extraId);
      if (extra) subtotal += extra.price;
    });

    let totalDiscount = 0;

    // Apply coupon discount
    if (availableCoupon) {
      if (availableCoupon.discount.includes('%')) {
        const percentage = parseFloat(availableCoupon.discount.replace('%', ''));
        totalDiscount += subtotal * (percentage / 100);
      } else {
        totalDiscount += parseFloat(availableCoupon.discount.replace('$', ''));
      }
    }

    // Apply gift card
    if (availableGiftcard) {
      totalDiscount += Math.min(subtotal - totalDiscount, availableGiftcard.balance);
    }

    return totalDiscount;
  };

  // Calculate total price with taxes, coupons, and gift cards
  const calculateTotal = () => {
    if (bookingType === 'group') {
      return calculateGroupTotal();
    }

    const selectedService = services.find(s => s.id === bookingData.service);
    if (!selectedService) return 0;

    let subtotal = selectedService.price;
    
    // Add extras
    selectedExtras.forEach(extraId => {
      const extra = selectedService.extras?.find(e => e.id === extraId);
      if (extra) subtotal += extra.price;
    });

    // Apply coupon discount
    if (availableCoupon) {
      if (availableCoupon.discount.includes('%')) {
        const percentage = parseFloat(availableCoupon.discount.replace('%', ''));
        subtotal = subtotal * (1 - percentage / 100);
      } else {
        subtotal -= parseFloat(availableCoupon.discount.replace('$', ''));
      }
    }

    // Apply gift card
    if (availableGiftcard) {
      subtotal = Math.max(0, subtotal - availableGiftcard.balance);
    }

    // Add applicable taxes
    const applicableTaxes = taxes.filter(tax => 
      tax.enabled && 
      (tax.locationsFilter === 'all-locations' || tax.locationsFilter === bookingData.location) &&
      (tax.servicesFilter === 'all-services' || tax.servicesFilter === bookingData.service)
    );

    let taxAmount = 0;
    applicableTaxes.forEach(tax => {
      taxAmount += (subtotal * tax.amount) / 100;
    });

    return subtotal + taxAmount;
  };

  // Calculate group booking total
  const calculateGroupTotal = () => {
    return groupMembers.reduce((total, member) => {
      const service = services.find(s => s.id === member.serviceId);
      if (!service) return total;
      
      let memberTotal = service.price;
      
      // Add extras
      member.extras.forEach(extraId => {
        const extra = service.extras?.find(e => e.id === extraId);
        if (extra) memberTotal += extra.price;
      });
      
      return total + memberTotal;
    }, 0);
  };

  const validateStep = () => {
    if (bookingType === 'group') {
      return validateGroupStep();
    }

    switch (currentStep) {
      case 1:
        return bookingData.location !== '';
      case 2:
        return bookingData.service !== '';
      case 3:
        return true; // Service extras step - no required selection
      case 4:
        return bookingData.staff !== '';
      case 5:
        return bookingData.date !== '' && bookingData.time !== '';
      case 6:
        // Validate only custom form fields
        const selectedServiceForValidation = services.find(s => s.id === bookingData.service);
        const applicableFormForValidation = serviceForms.find(form => {
          if (form.services === 'All Services' || form.services === 'all') {
            return true;
          }
          if (selectedServiceForValidation && form.services) {
            const serviceCategoryLower = selectedServiceForValidation.category.toLowerCase();
            const formServicesLower = form.services.toLowerCase();
            return serviceCategoryLower === formServicesLower;
          }
          return false;
        });
        
        // Load form elements for validation
        let validationFormElements: any[] = [];
        if (applicableFormForValidation) {
          const savedFormElements = localStorage.getItem(`customForm_${applicableFormForValidation.id}`);
          if (savedFormElements) {
            try {
              validationFormElements = JSON.parse(savedFormElements);
            } catch (error) {
              console.error('Error parsing form elements for validation:', error);
            }
          }
        }
        
        if (validationFormElements.length > 0) {
          for (const element of validationFormElements) {
            if (element.required) {
              const value = customFormData[element.id];
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                return false;
              }
            }
          }
        }
        
        return true;
      default:
        return true;
    }
  };

  const validateGroupStep = () => {
    switch (groupCurrentStep) {
      case 1:
        return groupBookingData.location !== '';
      case 2:
        return groupMembers.length > 0 && 
               groupMembers.every(m => m.name && m.serviceId && (sameStaff || m.staffId));
      case 3:
        return groupBookingData.date !== '' && groupBookingData.time !== '';
      case 4:
        return true; // Information step
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (bookingType === 'group') {
      return handleGroupNext();
    }

    if (validateStep() && currentStep < individualSteps.length) {
      let nextStep = currentStep + 1;
      
      // Skip Service Extras step if no extras are available
      if (currentStep === 2) { // Coming from Service selection
        const selectedService = services.find(s => s.id === bookingData.service);
        if (!selectedService?.extras || selectedService.extras.length === 0) {
          nextStep = 4; // Skip to Staff selection
        }
      }
      
      setCurrentStep(nextStep);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Make sure all required information is filled in before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handleGroupNext = () => {
    if (validateGroupStep() && groupCurrentStep < groupSteps.length) {
      setGroupCurrentStep(groupCurrentStep + 1);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Make sure all required information is filled in before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (bookingType === 'group') {
      return handleGroupBack();
    }

    const minStep = locations.length === 1 ? 2 : 1;
    if (currentStep > minStep) {
      let previousStep = currentStep - 1;
      
      // Skip Service Extras step when going back if no extras are available
      if (currentStep === 4) { // Going back from Staff selection
        const selectedService = services.find(s => s.id === bookingData.service);
        if (!selectedService?.extras || selectedService.extras.length === 0) {
          previousStep = 2; // Go back to Service selection
        }
      }
      
      // Skip location step if only one location
      if (previousStep === 1 && locations.length === 1) {
        previousStep = 2;
      }
      
      setCurrentStep(previousStep);
    }
  };

  const handleGroupBack = () => {
    const minStep = locations.length === 1 ? 2 : 1;
    if (groupCurrentStep > minStep) {
      setGroupCurrentStep(groupCurrentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (bookingType === 'group') {
      return handleGroupBookingSubmit();
    }
    return handleIndividualBookingSubmit();
  };

  const handleIndividualBookingSubmit = async () => {
    if (!validateStep()) {
      toast({
        title: "Please complete all required fields",
        description: "Make sure all required information is filled in.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find or create customer
      let customerId = '';
      const existingCustomer = customers.find(c => c.email === customFormData.email || c.email === customFormData['Email']);
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const newCustomer = {
          firstName: customFormData.firstName || customFormData['First Name'] || bookingData.customerName || '',
          lastName: customFormData.lastName || customFormData['Last Name'] || '',
          email: customFormData.email || customFormData['Email'] || bookingData.customerEmail || '',
          phone: customFormData.phone || customFormData['Phone'] || bookingData.customerPhone || '',
          gender: customFormData.gender || customFormData['Gender'] || '',
          dateOfBirth: customFormData.dateOfBirth ? new Date(customFormData.dateOfBirth) : undefined,
          note: customFormData.notes || bookingData.notes || '',
          allowLogin: false
        };
        customerId = addCustomer(newCustomer);
      }

      // Convert custom form data for saving
      const convertedCustomFields = await convertCustomFieldsForSaving(customFormData);

      // Get applicable taxes
      const applicableTaxes = taxes.filter(tax => 
        tax.enabled && 
        (tax.locationsFilter === 'all-locations' || tax.locationsFilter === bookingData.location) &&
        (tax.servicesFilter === 'all-services' || tax.servicesFilter === bookingData.service)
      );

      const appointmentData = {
        customerId: customerId,
        staffId: bookingData.staff,
        serviceId: bookingData.service,
        locationId: bookingData.location,
        date: new Date(bookingData.date),
        time: bookingData.time,
        status: 'Confirmed' as const,
        notes: bookingData.notes,
        selectedExtras: selectedExtras,
        appliedCoupons: availableCoupon ? [availableCoupon.id] : [],
        appliedGiftcards: availableGiftcard ? [availableGiftcard.id] : [],
        appliedTaxes: applicableTaxes.map(tax => tax.id),
        customFields: convertedCustomFields,
        totalPrice: calculateTotal(),
        additionalGuests: 0 // Set to 0 for individual bookings
      };

      addAppointment(appointmentData);
      setBookingConfirmed(true);

      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked.",
      });

    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupBookingSubmit = async () => {
    if (!validateGroupStep()) {
      toast({
        title: "Please complete all required fields",
        description: "Make sure all required information is filled in.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const groupId = `group-${Date.now()}`;
      
      // Create appointments for each group member
      for (const member of groupMembers) {
        const service = services.find(s => s.id === member.serviceId);
        if (!service) continue;

        // Find or create customer for this member
        let customerId = '';
        if (member.customerEmail) {
          const existingCustomer = customers.find(c => c.email === member.customerEmail);
          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            customerId = addCustomer({
              firstName: member.name.split(' ')[0] || '',
              lastName: member.name.split(' ').slice(1).join(' ') || '',
              email: member.customerEmail,
              phone: member.customerPhone || '',
              gender: '',
              note: member.notes || '',
              allowLogin: false
            });
          }
        } else {
          // Create customer with just name
          customerId = addCustomer({
            firstName: member.name.split(' ')[0] || '',
            lastName: member.name.split(' ').slice(1).join(' ') || '',
            email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: '',
            gender: '',
            note: member.notes || '',
            allowLogin: false
          });
        }

        const appointmentData = {
          customerId,
          staffId: sameStaff ? groupMembers[0].staffId : member.staffId,
          serviceId: member.serviceId,
          locationId: groupBookingData.location,
          date: new Date(groupBookingData.date),
          time: groupBookingData.time,
          status: 'Confirmed' as const,
          notes: `Group booking ${groupId}. ${member.notes || ''}`,
          selectedExtras: member.extras,
          appliedCoupons: [],
          appliedGiftcards: [],
          appliedTaxes: [],
          customFields: { groupBookingId: groupId, memberName: member.name },
          additionalGuests: 0, // Set to 0 for group bookings (each member is a separate appointment)
          totalPrice: service.price + member.extras.reduce((sum, extraId) => {
            const extra = service.extras?.find(e => e.id === extraId);
            return sum + (extra?.price || 0);
          }, 0)
        };

        addAppointment(appointmentData);
      }

      setBookingConfirmed(true);

      toast({
        title: "Group Booking Confirmed!",
        description: `Successfully booked appointments for ${groupMembers.length} members.`,
      });

    } catch (error) {
      console.error('Error submitting group booking:', error);
      toast({
        title: "Group Booking Failed",
        description: "There was an error processing your group booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show booking type selector if not selected
  if (!bookingType) {
    return <BookingTypeSelector onSelect={setBookingType} />;
  }

  // Show booking confirmed state
  if (bookingConfirmed) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-green-500 mb-2">Booking Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          {bookingType === 'group' 
            ? `Your group booking for ${groupMembers.length} members has been successfully created.`
            : 'Your appointment has been successfully booked. You will receive a confirmation email shortly.'
          }
        </p>
        <Button 
          onClick={() => {
            setBookingConfirmed(false);
            setBookingType(null);
            setCurrentStep(initialStep);
            setGroupCurrentStep(1);
            setGroupMembers([]);
          }}
          className="w-full"
        >
          Book Another Appointment
        </Button>
      </div>
    );
  }

  const currentStepData = bookingType === 'group' ? groupSteps : individualSteps;
  const currentStepIndex = bookingType === 'group' ? groupCurrentStep : currentStep;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">
            {bookingType === 'group' ? 'Group Booking' : 'Book Appointment'}
          </h1>
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex} of {currentStepData.length}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all" 
            style={{ width: `${(currentStepIndex / currentStepData.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {currentStepData.map((step, index) => (
            <span
              key={step}
              className={cn(
                "text-xs",
                index + 1 === currentStepIndex
                  ? "text-primary font-medium"
                  : index + 1 < currentStepIndex
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              )}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Render individual or group booking steps */}
      {bookingType === 'individual' ? renderIndividualBookingSteps() : renderGroupBookingSteps()}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={
            (bookingType === 'individual' && currentStep <= (locations.length === 1 ? 2 : 1)) ||
            (bookingType === 'group' && groupCurrentStep <= (locations.length === 1 ? 2 : 1))
          }
        >
          Back
        </Button>
        
        <Button
          onClick={
            (bookingType === 'individual' && currentStep === individualSteps.length) ||
            (bookingType === 'group' && groupCurrentStep === groupSteps.length)
              ? handleSubmit
              : handleNext
          }
          disabled={!validateStep() || isSubmitting}
        >
          {isSubmitting
            ? "Processing..."
            : (bookingType === 'individual' && currentStep === individualSteps.length) ||
              (bookingType === 'group' && groupCurrentStep === groupSteps.length)
            ? "Confirm Booking"
            : "Next"
          }
        </Button>
      </div>
    </div>
  );

  // Individual booking step renderer
  function renderIndividualBookingSteps() {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={bookingData.location}
                onValueChange={(value) => setBookingData({ ...bookingData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 2:
        const availableServices = services.filter(service => 
          service.staffIds.some(staffId => 
            staff.find(s => s.id === staffId)?.locations.includes(bookingData.location)
          )
        );

        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      bookingData.service === service.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setBookingData({ ...bookingData, service: service.id, staff: '' })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold">{formatPrice(service.price)}</div>
                        <div className="text-sm text-muted-foreground">{service.duration} min</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        const selectedService = services.find(s => s.id === bookingData.service);
        if (!selectedService?.extras || selectedService.extras.length === 0) {
          return <div>No extras available for this service.</div>;
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle>Service Extras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedService.extras.map((extra) => (
                  <div key={extra.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={extra.id}
                      checked={selectedExtras.includes(extra.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedExtras([...selectedExtras, extra.id]);
                        } else {
                          setSelectedExtras(selectedExtras.filter(id => id !== extra.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={extra.id} className="font-medium cursor-pointer">
                        {extra.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{extra.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(extra.price)}</div>
                      <div className="text-sm text-muted-foreground">+{extra.duration} min</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        const availableStaff = getAvailableStaff();

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Staff Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {availableStaff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      bookingData.staff === staffMember.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setBookingData({ ...bookingData, staff: staffMember.id })}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={staffMember.avatar} />
                        <AvatarFallback>
                          {staffMember.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{staffMember.name}</h3>
                        <p className="text-sm text-muted-foreground">{staffMember.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !bookingData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bookingData.date ? format(new Date(bookingData.date), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <HorizontalCalendar
                        selectedDate={bookingData.date ? new Date(bookingData.date) : undefined}
                        onDateSelect={(date) => {
                          setBookingData({ ...bookingData, date: format(date, 'yyyy-MM-dd'), time: '' });
                          setIsCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {bookingData.date && (
                  <div>
                    <Label htmlFor="time">Select Time</Label>
                    <Select
                      value={bookingData.time}
                      onValueChange={(value) => setBookingData({ ...bookingData, time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const selectedStaff = staff.find(s => s.id === bookingData.staff);
                          const selectedSvc = services.find(s => s.id === bookingData.service);
                          if (!selectedStaff || !selectedSvc) return [];

                          const availableSlots = getAvailableTimeSlotsForDate(
                            new Date(bookingData.date),
                            selectedStaff.schedule,
                            selectedSvc.duration,
                            appointments.map(apt => ({
                              id: apt.id,
                              staffId: apt.staffId,
                              serviceId: apt.serviceId,
                              date: apt.date,
                              time: apt.time,
                              duration: services.find(s => s.id === apt.serviceId)?.duration || 60
                            })),
                            bookingData.staff
                          );

                          return availableSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>
                              {formatTimeSlot(slot)}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={bookingData.customerName}
                      onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                      placeholder="Enter your full name"
                      required
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
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={bookingData.customerPhone}
                    onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    placeholder="Any additional notes or special requests"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        const finalService = services.find(s => s.id === bookingData.service);
        const finalStaff = staff.find(s => s.id === bookingData.staff);
        const finalLocation = locations.find(l => l.id === bookingData.location);

        return (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Your Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Service Details</h3>
                    <p><strong>Service:</strong> {finalService?.name}</p>
                    <p><strong>Duration:</strong> {finalService?.duration} minutes</p>
                    <p><strong>Price:</strong> {formatPrice(finalService?.price || 0)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Appointment Details</h3>
                    <p><strong>Date:</strong> {bookingData.date ? format(new Date(bookingData.date), 'PPP') : ''}</p>
                    <p><strong>Time:</strong> {formatTimeSlot(bookingData.time)}</p>
                    <p><strong>Staff:</strong> {finalStaff?.name}</p>
                    <p><strong>Location:</strong> {finalLocation?.name}</p>
                  </div>
                </div>
                
                {selectedExtras.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Selected Extras</h3>
                    {selectedExtras.map(extraId => {
                      const extra = finalService?.extras?.find(e => e.id === extraId);
                      return extra ? (
                        <p key={extraId}>{extra.name} - {formatPrice(extra.price)}</p>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  }

  // Group booking step renderer
  function renderGroupBookingSteps() {
    switch (groupCurrentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={groupBookingData.location}
                onValueChange={(value) => setGroupBookingData({ ...groupBookingData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 2:
        const primaryMember = groupMembers.find(m => m.isPrimary) || groupMembers[0];
        return (
          <GroupBookingManager
            locationId={groupBookingData.location}
            primaryMember={primaryMember}
            members={groupMembers}
            onMembersChange={setGroupMembers}
            onSameStaffChange={setSameStaff}
            sameStaff={sameStaff}
          />
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="groupDate">Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !groupBookingData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {groupBookingData.date ? format(new Date(groupBookingData.date), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={groupBookingData.date ? new Date(groupBookingData.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setGroupBookingData({ 
                              ...groupBookingData, 
                              date: format(date, 'yyyy-MM-dd'), 
                              time: '' 
                            });
                          }
                        }}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {groupBookingData.date && (
                  <div>
                    <Label htmlFor="groupTime">Select Time</Label>
                    <Select
                      value={groupBookingData.time}
                      onValueChange={(value) => setGroupBookingData({ ...groupBookingData, time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          // Create staff-service pairs for availability checking
                          const staffServicePairs: StaffServicePair[] = groupMembers
                            .filter(m => m.serviceId && (sameStaff || m.staffId))
                            .map(member => ({
                              staffId: sameStaff ? groupMembers[0].staffId : member.staffId,
                              serviceId: member.serviceId,
                              duration: services.find(s => s.id === member.serviceId)?.duration || 60,
                              memberId: member.id
                            }));

                          if (staffServicePairs.length === 0) return [];

                          // Get staff schedules
                          const staffSchedules: Record<string, any> = {};
                          staffServicePairs.forEach(pair => {
                            const staffMember = staff.find(s => s.id === pair.staffId);
                            if (staffMember && staffMember.schedule) {
                              staffSchedules[pair.staffId] = staffMember.schedule;
                            }
                          });

                          const availableSlots = getGroupAvailableTimeSlots(
                            new Date(groupBookingData.date),
                            staffServicePairs,
                            staffSchedules,
                            appointments.map(apt => ({
                              id: apt.id,
                              staffId: apt.staffId,
                              serviceId: apt.serviceId,
                              date: apt.date,
                              time: apt.time,
                              duration: services.find(s => s.id === apt.serviceId)?.duration || 60
                            })),
                            sameStaff
                          );

                          return availableSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>
                              {formatTimeSlot(slot)}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="groupNotes">Notes</Label>
                <Textarea
                  id="groupNotes"
                  value={groupBookingData.notes}
                  onChange={(e) => setGroupBookingData({ ...groupBookingData, notes: e.target.value })}
                  placeholder="Any additional notes for the group booking"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        const finalLocation = locations.find(l => l.id === groupBookingData.location);

        return (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Group Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Booking Details</h3>
                  <p><strong>Date:</strong> {groupBookingData.date ? format(new Date(groupBookingData.date), 'PPP') : ''}</p>
                  <p><strong>Time:</strong> {formatTimeSlot(groupBookingData.time)}</p>
                  <p><strong>Location:</strong> {finalLocation?.name}</p>
                  <p><strong>Staff Assignment:</strong> {sameStaff ? 'Same staff for all members' : 'Individual staff selection'}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Group Members ({groupMembers.length})</h3>
                  <div className="space-y-2">
                    {groupMembers.map((member, index) => {
                      const service = services.find(s => s.id === member.serviceId);
                      const staffMember = staff.find(s => s.id === (sameStaff ? groupMembers[0].staffId : member.staffId));
                      return (
                        <div key={member.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{member.name} {member.isPrimary && '(Primary)'}</p>
                              <p className="text-sm text-muted-foreground">
                                {service?.name} • {service?.duration} min • {staffMember?.name}
                              </p>
                            </div>
                            <p className="font-semibold">{formatPrice(service?.price || 0)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Group Price:</span>
                    <span>{formatPrice(calculateGroupTotal())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  }
};

export default BookingPage;