import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBookingTheme } from '@/contexts/BookingThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAppData } from '@/contexts/AppDataContext';
import { BookingTypeSelector } from '@/components/booking/BookingTypeSelector';
import { GroupMemberManager } from '@/components/booking/GroupMemberManager';
import { StaffPreferenceSelector } from '@/components/booking/StaffPreferenceSelector';
import { BookingType, GroupMember, GroupBookingData } from '@/types/groupBookingTypes';
import { HorizontalCalendar } from '@/components/booking/HorizontalCalendar';
import { getAvailableTimeSlotsForDate, formatTimeSlot } from '@/utils/availabilityHelper';

const BookingPage = () => {
  const { businessSlug } = useParams();
  const { toast } = useToast();
  const { theme } = useBookingTheme();
  const { formatPrice } = useCurrency();
  const { locations, staff, services, addAppointment } = useAppData();
  
  // Load general settings for group booking
  const [generalSettings, setGeneralSettings] = useState({
    enableGroupBooking: false
  });
  
  useEffect(() => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setGeneralSettings({
          enableGroupBooking: settings.enableGroupBooking || false
        });
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, []);

  // Booking type state
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Individual booking states
  const [individualStep, setIndividualStep] = useState(locations.length === 1 ? 2 : 1);
  const [individualData, setIndividualData] = useState({
    location: locations.length === 1 ? locations[0].id : '',
    service: '',
    selectedExtras: [] as string[],
    staff: '',
    date: '',
    time: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  });
  
  // Group booking states
  const [groupStep, setGroupStep] = useState(locations.length === 1 ? 2 : 1);
  const [groupData, setGroupData] = useState<GroupBookingData>({
    members: [],
    staffPreference: 'any',
    selectedDate: '',
    selectedTime: '',
    totalDuration: 0,
    totalPrice: 0,
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    },
    notes: ''
  });
  const [groupLocation, setGroupLocation] = useState(locations.length === 1 ? locations[0].id : '');

  const individualSteps = ['Location', 'Service', 'Service Extras', 'Staff', 'Date & Time', 'Information', 'Confirmation'];
  const groupSteps = ['Location', 'Services & Members', 'Staff Preference', 'Date & Time', 'Information', 'Confirmation'];

  // Reset booking type selection
  const resetBookingType = () => {
    setBookingType(null);
    setBookingConfirmed(false);
  };

  // Individual booking functions
  const handleIndividualNext = () => {
    if (validateIndividualStep()) {
      if (individualStep === 2) {
        const selectedService = services.find(s => s.id === individualData.service);
        if (!selectedService?.extras || selectedService.extras.length === 0) {
          setIndividualStep(4); // Skip extras step
          return;
        }
      }
      setIndividualStep(prev => prev + 1);
    }
  };

  const handleIndividualBack = () => {
    if (individualStep === 4) {
      const selectedService = services.find(s => s.id === individualData.service);
      if (!selectedService?.extras || selectedService.extras.length === 0) {
        setIndividualStep(2); // Skip back to service step
        return;
      }
    }
    setIndividualStep(prev => Math.max(1, prev - 1));
  };

  const validateIndividualStep = () => {
    switch (individualStep) {
      case 1: return individualData.location !== '';
      case 2: return individualData.service !== '';
      case 3: return true; // Extras are optional
      case 4: return individualData.staff !== '';
      case 5: return individualData.date !== '' && individualData.time !== '';
      case 6: return individualData.customerName !== '' && individualData.customerEmail !== '';
      default: return true;
    }
  };

  // Group booking functions
  const handleGroupNext = () => {
    if (validateGroupStep()) {
      setGroupStep(prev => prev + 1);
    }
  };

  const handleGroupBack = () => {
    setGroupStep(prev => Math.max(1, prev - 1));
  };

  const validateGroupStep = () => {
    switch (groupStep) {
      case 1: return groupLocation !== '';
      case 2: return groupData.members.length > 0 && groupData.members.every(m => m.serviceId !== '');
      case 3: return true; // Staff preference is optional
      case 4: return groupData.selectedDate !== '' && groupData.selectedTime !== '';
      case 5: return groupData.customerInfo.name !== '' && groupData.customerInfo.email !== '';
      default: return true;
    }
  };

  // Calculate group booking totals
  const calculateGroupTotals = () => {
    let totalPrice = 0;
    let totalDuration = 0;

    groupData.members.forEach(member => {
      const service = services.find(s => s.id === member.serviceId);
      if (service) {
        totalPrice += service.price;
        totalDuration += service.duration;
        
        member.selectedExtras.forEach(extraId => {
          const extra = service.extras?.find(e => e.id === extraId);
          if (extra) {
            totalPrice += extra.price;
            totalDuration += extra.duration || 0;
          }
        });
      }
    });

    return { totalPrice, totalDuration };
  };

  // Get available time slots for individual booking
  const getIndividualTimeSlots = () => {
    if (!individualData.date || !individualData.service || !individualData.staff) return [];
    
    const selectedService = services.find(s => s.id === individualData.service);
    const selectedStaff = staff.find(s => s.id === individualData.staff);
    if (!selectedService || !selectedStaff) return [];

    return getAvailableTimeSlotsForDate(
      new Date(individualData.date),
      selectedStaff.schedule || { workingHours: {}, holidays: [], specialDays: [], breaks: [] },
      selectedService.duration,
      [],
      selectedStaff.id
    );
  };

  // Submit individual booking
  const submitIndividualBooking = async () => {
    setIsSubmitting(true);
    try {
      const selectedService = services.find(s => s.id === individualData.service);
      if (!selectedService) return;

      let totalPrice = selectedService.price;
      individualData.selectedExtras.forEach(extraId => {
        const extra = selectedService.extras?.find(e => e.id === extraId);
        if (extra) totalPrice += extra.price;
      });

      const appointment = {
        customerId: Date.now().toString(),
        customerName: individualData.customerName,
        customerEmail: individualData.customerEmail,
        customerPhone: individualData.customerPhone,
        serviceId: individualData.service,
        serviceName: selectedService.name,
        staffId: individualData.staff,
        staffName: staff.find(s => s.id === individualData.staff)?.name || '',
        locationId: individualData.location,
        date: new Date(individualData.date),
        time: individualData.time,
        duration: selectedService.duration,
        price: totalPrice,
        status: 'Confirmed' as const,
        notes: individualData.notes,
        selectedExtras: individualData.selectedExtras,
        additionalGuests: 0,
        totalPrice,
        appliedCoupons: [],
        customFields: {}
      };

      addAppointment(appointment);
      setBookingConfirmed(true);
      
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked.",
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit group booking
  const submitGroupBooking = async () => {
    setIsSubmitting(true);
    try {
      const { totalPrice, totalDuration } = calculateGroupTotals();
      
      // Create appointments for each member
      groupData.members.forEach((member, index) => {
        const service = services.find(s => s.id === member.serviceId);
        if (!service) return;

        let memberPrice = service.price;
        member.selectedExtras.forEach(extraId => {
          const extra = service.extras?.find(e => e.id === extraId);
          if (extra) memberPrice += extra.price;
        });

        const appointment = {
          customerId: Date.now().toString(),
          customerName: index === 0 ? groupData.customerInfo.name : member.name,
          customerEmail: groupData.customerInfo.email,
          customerPhone: groupData.customerInfo.phone,
          serviceId: member.serviceId,
          serviceName: service.name,
          staffId: member.staffId || '',
          staffName: member.staffId ? staff.find(s => s.id === member.staffId)?.name || '' : '',
          locationId: groupLocation,
          date: new Date(groupData.selectedDate),
          time: groupData.selectedTime,
          duration: service.duration,
          price: memberPrice,
          status: 'Confirmed' as const,
          notes: groupData.notes,
          selectedExtras: member.selectedExtras,
          additionalGuests: 0,
          totalPrice: memberPrice,
          appliedCoupons: [],
          customFields: {}
        };

        addAppointment(appointment);
      });

      setBookingConfirmed(true);
      
      toast({
        title: "Group Booking Confirmed!",
        description: "Your group appointment has been successfully booked.",
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your group booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If booking is confirmed, show confirmation page
  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              {bookingType === 'group' 
                ? 'Your group appointment has been successfully booked.'
                : 'Your appointment has been successfully booked.'
              }
            </p>
            <Button onClick={resetBookingType} className="w-full">
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no booking type selected and group booking is enabled, show selector
  if (!bookingType && generalSettings.enableGroupBooking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <BookingTypeSelector
              selectedType={bookingType}
              onTypeSelect={(type) => setBookingType(type)}
            />
            {bookingType && (
              <div className="mt-6">
                <Button 
                  onClick={() => {
                    // Initialize first step after type selection
                    if (bookingType === 'individual') {
                      setIndividualStep(locations.length === 1 ? 2 : 1);
                    } else {
                      setGroupStep(locations.length === 1 ? 2 : 1);
                    }
                  }}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If group booking is disabled or individual booking is selected, proceed with individual booking
  const isGroupBooking = bookingType === 'group';
  const currentStep = isGroupBooking ? groupStep : individualStep;
  const stepsArray = isGroupBooking ? groupSteps : individualSteps;
  const maxSteps = stepsArray.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header with back button if booking type was selected */}
          {generalSettings.enableGroupBooking && (
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetBookingType}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">
                {isGroupBooking ? 'Group Booking' : 'Book Appointment'}
              </h1>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {maxSteps}
              </span>
              <span className="text-sm font-medium">
                {stepsArray[currentStep - 1]}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / maxSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {stepsArray[currentStep - 1]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Individual booking steps */}
              {!isGroupBooking && (
                <>
                  {/* Location step */}
                  {individualStep === 1 && (
                    <div className="space-y-4">
                      <Label>Select Location</Label>
                      <Select
                        value={individualData.location}
                        onValueChange={(value) => setIndividualData(prev => ({ ...prev, location: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Service step */}
                  {individualStep === 2 && (
                    <div className="space-y-4">
                      <Label>Select Service</Label>
                      <div className="grid gap-3">
                        {services.map(service => (
                          <Card 
                            key={service.id}
                            className={`cursor-pointer transition-colors ${
                              individualData.service === service.id ? 'ring-2 ring-primary' : 'hover:bg-accent/50'
                            }`}
                            onClick={() => setIndividualData(prev => ({ ...prev, service: service.id }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{service.name}</h3>
                                  <p className="text-sm text-muted-foreground">{service.description}</p>
                                  <p className="text-sm text-muted-foreground">{service.duration} minutes</p>
                                </div>
                                <p className="font-semibold">{formatPrice(service.price)}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Extras step */}
                  {individualStep === 3 && (
                    <div className="space-y-4">
                      <Label>Service Extras (Optional)</Label>
                      {(() => {
                        const selectedService = services.find(s => s.id === individualData.service);
                        if (!selectedService?.extras?.length) {
                          return <p className="text-muted-foreground">No extras available for this service.</p>;
                        }
                        return (
                          <div className="space-y-3">
                            {selectedService.extras.map(extra => (
                              <div key={extra.id} className="flex items-center space-x-3 p-3 border rounded">
                                <Checkbox
                                  checked={individualData.selectedExtras.includes(extra.id)}
                                  onCheckedChange={(checked) => {
                                    setIndividualData(prev => ({
                                      ...prev,
                                      selectedExtras: checked
                                        ? [...prev.selectedExtras, extra.id]
                                        : prev.selectedExtras.filter(id => id !== extra.id)
                                    }));
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{extra.name}</p>
                                  <p className="text-sm text-muted-foreground">{extra.description}</p>
                                </div>
                                <p className="font-semibold">{formatPrice(extra.price)}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* Group booking steps */}
              {isGroupBooking && (
                <>
                  {groupStep === 1 && (
                    <div className="space-y-4">
                      <Label>Select Location</Label>
                      <Select
                        value={groupLocation}
                        onValueChange={setGroupLocation}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {groupStep === 2 && (
                    <GroupMemberManager
                      members={groupData.members}
                      onMembersChange={(members) => setGroupData(prev => ({ ...prev, members }))}
                      locationId={groupLocation}
                    />
                  )}

                  {groupStep === 3 && (
                    <StaffPreferenceSelector
                      value={groupData.staffPreference}
                      onValueChange={(value) => setGroupData(prev => ({ ...prev, staffPreference: value }))}
                    />
                  )}
                </>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={isGroupBooking ? handleGroupBack : handleIndividualBack}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                
                {currentStep < maxSteps ? (
                  <Button
                    onClick={isGroupBooking ? handleGroupNext : handleIndividualNext}
                    disabled={isGroupBooking ? !validateGroupStep() : !validateIndividualStep()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={isGroupBooking ? submitGroupBooking : submitIndividualBooking}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;