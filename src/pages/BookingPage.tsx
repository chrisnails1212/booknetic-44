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
import { getAvailableTimeSlotsForDate, isDateAvailable, formatTimeSlot, findNextAvailableDate } from '@/utils/availabilityHelper';
import { convertCustomFieldsForSaving } from '@/utils/fileHelper';
import { CustomerSelfServicePanel } from '@/components/customers/CustomerSelfServicePanel';

// New components
import { BookingTypeSelector } from '@/components/booking/BookingTypeSelector';
import { GroupMemberManager } from '@/components/booking/GroupMemberManager';
import { StaffPreferenceSelector } from '@/components/booking/StaffPreferenceSelector';
import { BookingType, GroupMember, GroupBookingData } from '@/types/groupBookingTypes';

const BookingPage = () => {
  const { businessSlug } = useParams();
  const { toast } = useToast();
  const { theme } = useBookingTheme();
  const { formatPrice } = useCurrency();
  const { locations, staff, services, coupons, giftcards, taxes, customers, appointments, addCustomer, updateCustomer, addAppointment } = useAppData();
  
  // Booking type state
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [groupBookingEnabled, setGroupBookingEnabled] = useState(true); // Get from settings later
  
  // Individual booking state
  const [individualBookingData, setIndividualBookingData] = useState({
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
  
  // Group booking state
  const [groupBookingData, setGroupBookingData] = useState<GroupBookingData>({
    members: [],
    staffPreference: 'any',
    primaryStaffId: ''
  });
  
  const [selectedLocation, setSelectedLocation] = useState(locations.length === 1 ? locations[0].id : '');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [giftcardCode, setGiftcardCode] = useState('');
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({});
  const [availableGiftcard, setAvailableGiftcard] = useState<any>(null);
  const [availableCoupon, setAvailableCoupon] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Booking flow state
  const [currentStep, setCurrentStep] = useState(0); // 0 = booking type selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Get service forms data
  const [serviceForms, setServiceForms] = useState<any[]>([]);

  useEffect(() => {
    const savedForms = JSON.parse(localStorage.getItem('customForms') || '[]');
    setServiceForms(savedForms);
  }, []);

  // Load group booking settings from general settings
  useEffect(() => {
    const generalSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    setGroupBookingEnabled(generalSettings.enableGroupBooking || false);
  }, []);

  // Individual booking steps
  const individualSteps = [
    'Booking Type',
    ...(locations.length > 1 ? ['Location'] : []),
    'Service',
    'Service Extras', 
    'Staff',
    'Date & Time',
    'Information',
    'Confirmation'
  ];

  // Group booking steps
  const groupSteps = [
    'Booking Type',
    ...(locations.length > 1 ? ['Location'] : []),
    'Group Members',
    'Staff Selection',
    'Date & Time', 
    'Information',
    'Confirmation'
  ];

  const getCurrentSteps = () => bookingType === 'group' ? groupSteps : individualSteps;

  const handleBookingTypeSelect = (type: BookingType) => {
    setBookingType(type);
    setCurrentStep(1);
    
    // Initialize group booking data if group type selected
    if (type === 'group') {
      setGroupBookingData({
        members: [{
          id: 'primary',
          name: 'Me',
          serviceId: '',
          extras: [],
          isPrimary: true
        }],
        staffPreference: 'any',
        primaryStaffId: ''
      });
    }
  };

  // Individual booking logic (existing logic simplified)
  const calculateIndividualTotal = () => {
    const selectedService = services.find(s => s.id === individualBookingData.service);
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
      (tax.locationsFilter === 'all-locations' || tax.locationsFilter === selectedLocation) &&
      (tax.servicesFilter === 'all-services' || tax.servicesFilter === individualBookingData.service)
    );

    let taxAmount = 0;
    applicableTaxes.forEach(tax => {
      taxAmount += (subtotal * tax.amount) / 100;
    });

    return subtotal + taxAmount;
  };

  // Group booking logic
  const calculateGroupTotal = () => {
    let total = 0;
    
    groupBookingData.members.forEach(member => {
      const service = services.find(s => s.id === member.serviceId);
      if (service) {
        total += service.price;
        member.extras.forEach(extraId => {
          const extra = service.extras?.find(e => e.id === extraId);
          if (extra) total += extra.price;
        });
      }
    });

    return total;
  };

  const calculateGroupDuration = () => {
    let totalDuration = 0;
    
    if (groupBookingData.staffPreference === 'same') {
      // Sequential - sum all durations
      groupBookingData.members.forEach(member => {
        const service = services.find(s => s.id === member.serviceId);
        if (service) {
          totalDuration += service.duration;
          member.extras.forEach(extraId => {
            const extra = service.extras?.find(e => e.id === extraId);
            if (extra) totalDuration += (extra.duration || 0);
          });
        }
      });
    } else {
      // Parallel - find maximum duration
      groupBookingData.members.forEach(member => {
        const service = services.find(s => s.id === member.serviceId);
        if (service) {
          let memberDuration = service.duration;
          member.extras.forEach(extraId => {
            const extra = service.extras?.find(e => e.id === extraId);
            if (extra) memberDuration += (extra.duration || 0);
          });
          totalDuration = Math.max(totalDuration, memberDuration);
        }
      });
    }
    
    return totalDuration;
  };

  const validateCurrentStep = () => {
    const steps = getCurrentSteps();
    const currentStepName = steps[currentStep];
    
    switch (currentStepName) {
      case 'Booking Type':
        return bookingType !== null;
      case 'Location':
        return selectedLocation !== '';
      case 'Service':
        return bookingType === 'individual' ? individualBookingData.service !== '' : false;
      case 'Group Members':
        return groupBookingData.members.every(m => m.serviceId !== '') && groupBookingData.members.length > 0;
      case 'Staff Selection':
        if (groupBookingData.staffPreference === 'same') {
          return groupBookingData.primaryStaffId !== '';
        } else if (groupBookingData.staffPreference === 'different') {
          return groupBookingData.members.every(m => m.staffId !== undefined && m.staffId !== '');
        }
        return true; // For 'any' preference
      case 'Staff':
        return individualBookingData.staff !== '';
      case 'Date & Time':
        return bookingType === 'individual' 
          ? individualBookingData.date !== '' && individualBookingData.time !== ''
          : selectedLocation !== ''; // Will be implemented
      case 'Information':
        return true; // Custom form validation would go here
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < getCurrentSteps().length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Make sure all required information is filled in before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    const steps = getCurrentSteps();
    const currentStepName = steps[currentStep];
    
    switch (currentStepName) {
      case 'Booking Type':
        return (
          <BookingTypeSelector 
            onSelect={handleBookingTypeSelect}
            groupBookingEnabled={groupBookingEnabled}
          />
        );
        
      case 'Location':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Select Location</h2>
              <p className="text-gray-600">Choose your preferred location</p>
            </div>
            <div className="space-y-3">
              {locations.map(location => (
                <Card 
                  key={location.id}
                  className={`cursor-pointer transition-all ${
                    selectedLocation === location.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedLocation(location.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{location.name}</h3>
                        <p className="text-sm text-gray-600">{location.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 'Service':
        // Individual service selection (existing logic)
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Select Service</h2>
              <p className="text-gray-600">Choose the service you'd like to book</p>
            </div>
            <div className="space-y-3">
              {services.filter(service => 
                staff.some(s => s.services.includes(service.id) && s.locations.includes(selectedLocation))
              ).map(service => (
                <Card 
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    individualBookingData.service === service.id
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setIndividualBookingData(prev => ({ ...prev, service: service.id }))}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-green-600">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 'Group Members':
        return (
          <GroupMemberManager
            members={groupBookingData.members}
            onMembersChange={(members) => setGroupBookingData(prev => ({ ...prev, members }))}
            locationId={selectedLocation}
          />
        );
        
      case 'Staff Selection':
        return (
          <StaffPreferenceSelector
            members={groupBookingData.members}
            staffPreference={groupBookingData.staffPreference}
            primaryStaffId={groupBookingData.primaryStaffId}
            onStaffPreferenceChange={(preference) => 
              setGroupBookingData(prev => ({ ...prev, staffPreference: preference }))
            }
            onPrimaryStaffChange={(staffId) => 
              setGroupBookingData(prev => ({ ...prev, primaryStaffId: staffId }))
            }
            onMemberStaffChange={(memberId, staffId) => {
              const updatedMembers = groupBookingData.members.map(m => 
                m.id === memberId ? { ...m, staffId } : m
              );
              setGroupBookingData(prev => ({ ...prev, members: updatedMembers }));
            }}
            locationId={selectedLocation}
          />
        );
        
      case 'Confirmation':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600">
                Your {bookingType} booking has been successfully confirmed.
              </p>
            </div>
            
            {/* Display booking summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                {bookingType === 'individual' ? (
                  <div className="space-y-2 text-left">
                    <p><strong>Service:</strong> {services.find(s => s.id === individualBookingData.service)?.name}</p>
                    <p><strong>Date:</strong> {individualBookingData.date}</p>
                    <p><strong>Time:</strong> {individualBookingData.time}</p>
                    <p><strong>Total:</strong> {formatPrice(calculateIndividualTotal())}</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-left">
                    <p><strong>Group Members:</strong> {groupBookingData.members.length}</p>
                    <p><strong>Total Duration:</strong> {calculateGroupDuration()} minutes</p>
                    <p><strong>Total Cost:</strong> {formatPrice(calculateGroupTotal())}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Step Under Development</h2>
            <p className="text-gray-600">This step is being implemented...</p>
          </div>
        );
    }
  };

  const handleBookingSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (bookingType === 'individual') {
        // Create individual appointment
        const appointmentData = {
          customerId: 'temp-customer',
          staffId: individualBookingData.staff,
          serviceId: individualBookingData.service,
          locationId: selectedLocation,
          date: new Date(individualBookingData.date),
          time: individualBookingData.time,
          status: 'Confirmed' as const,
          notes: individualBookingData.notes,
          selectedExtras: selectedExtras,
          appliedCoupons: availableCoupon ? [availableCoupon.id] : [],
          appliedGiftcards: availableGiftcard ? [availableGiftcard.id] : [],
          customFields: customFormData,
          totalPrice: calculateIndividualTotal(),
          additionalGuests: 0
        };
        
        addAppointment(appointmentData);
      } else {
        // Create group appointments
        const groupId = Date.now().toString();
        
        groupBookingData.members.forEach((member, index) => {
          const appointmentData = {
            customerId: member.isPrimary ? 'temp-customer' : 'temp-guest-' + index,
            staffId: member.staffId || groupBookingData.primaryStaffId || '',
            serviceId: member.serviceId,
            locationId: selectedLocation,
            date: new Date('2024-01-01'), // Would be selected in date/time step
            time: '10:00', // Would be selected in date/time step
            status: 'Confirmed' as const,
            notes: `Group booking member ${index + 1}${member.isPrimary ? ' (Primary)' : ''}`,
            selectedExtras: member.extras,
            appliedCoupons: [],
            customFields: member.isPrimary ? customFormData : { name: member.name },
            totalPrice: calculateGroupTotal() / groupBookingData.members.length,
            additionalGuests: 0
          };
          
          addAppointment(appointmentData);
        });
      }
      
      setBookingConfirmed(true);
      setCurrentStep(getCurrentSteps().length - 1);
      
      toast({
        title: "Booking Confirmed!",
        description: `Your ${bookingType} booking has been successfully created.`,
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full">
        {/* Progress Bar */}
        {theme.showBookingProcess && currentStep > 0 && (
          <div className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {getCurrentSteps().slice(1).map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                        index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden md:inline">{step}</span>
                    {index < getCurrentSteps().slice(1).length - 1 && (
                      <div className="w-8 h-0.5 bg-gray-200 mx-4 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          {!bookingConfirmed && (
            <div className="flex justify-between mt-6">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
              )}
              <div className="ml-auto">
                {currentStep < getCurrentSteps().length - 1 && currentStep > 0 ? (
                  <Button 
                    onClick={handleNext}
                    disabled={!validateCurrentStep() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                  </Button>
                ) : currentStep > 0 && currentStep === getCurrentSteps().length - 2 ? (
                  <Button 
                    onClick={handleBookingSubmit} 
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;