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
import { Calendar, Clock, User, MapPin, Gift, CheckCircle, CalendarIcon, Plus, Minus, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useBookingTheme } from '@/contexts/BookingThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAppData } from '@/contexts/AppDataContext';
import { format, parse, addMinutes, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatMinutesToReadable } from '@/utils/timeFormatter';
import { InteractiveFormRenderer } from '@/components/forms/InteractiveFormRenderer';
import { getAvailableTimeSlotsForDate, isDateAvailable, formatTimeSlot, findNextAvailableDate } from '@/utils/availabilityHelper';
import { convertCustomFieldsForSaving } from '@/utils/fileHelper';
import { CustomerSelfServicePanel } from '@/components/customers/CustomerSelfServicePanel';


const BookingPage = () => {
  const { businessSlug } = useParams();
  const { toast } = useToast();
  const { theme } = useBookingTheme();
  const { formatPrice, currency } = useCurrency();
  console.log('BookingPage: Current theme is', theme);
  const { locations, staff, services, coupons, giftcards, taxes, customers, appointments, addCustomer, updateCustomer, addAppointment } = useAppData();
  // Auto-select location if only one exists and start from service step
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
  
  

  const steps = [
    'Location',
    'Service',
    'Service Extras',
    'Staff', 
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


    let totalDiscount = 0;

    // Apply coupon discount
    if (availableCoupon) {
      let discountAmount = 0;
      
      if (availableCoupon.discount.includes('%')) {
        const percentage = parseFloat(availableCoupon.discount.replace('%', ''));
        discountAmount = subtotal * (percentage / 100);
      } else {
        // Remove any currency symbol from the start of the discount string
        const discountValue = parseFloat(availableCoupon.discount.replace(/^[^\d.]+/, ''));
        if (!isNaN(discountValue)) {
          discountAmount = discountValue;
        }
      }
      
      // Apply maximum discount limit if specified
      if (availableCoupon.maximumDiscount && discountAmount > availableCoupon.maximumDiscount) {
        discountAmount = availableCoupon.maximumDiscount;
      }
      
      totalDiscount += discountAmount;
    }

    // Apply gift card
    if (availableGiftcard) {
      let giftcardAmount = availableGiftcard.balance;
      
      // Apply maximum usage per transaction limit
      if (availableGiftcard.maxUsagePerTransaction) {
        giftcardAmount = Math.min(giftcardAmount, availableGiftcard.maxUsagePerTransaction);
      }
      
      // Apply partial usage rules minimum remaining
      if (availableGiftcard.partialUsageRules?.minimumRemaining) {
        const maxUsableAmount = availableGiftcard.balance - availableGiftcard.partialUsageRules.minimumRemaining;
        if (maxUsableAmount > 0) {
          giftcardAmount = Math.min(giftcardAmount, maxUsableAmount);
        } else {
          giftcardAmount = 0; // Cannot use if it would violate minimum remaining
        }
      }
      
      totalDiscount += Math.min(subtotal - totalDiscount, giftcardAmount);
    }

    return totalDiscount;
  };

  // Calculate total price with taxes, coupons, and gift cards
  const calculateTotal = () => {
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
      let discountAmount = 0;
      
      if (availableCoupon.discount.includes('%')) {
        const percentage = parseFloat(availableCoupon.discount.replace('%', ''));
        discountAmount = subtotal * (percentage / 100);
      } else {
        // Remove any currency symbol from the start of the discount string
        const discountValue = parseFloat(availableCoupon.discount.replace(/^[^\d.]+/, ''));
        if (!isNaN(discountValue)) {
          discountAmount = discountValue;
        }
      }
      
      // Apply maximum discount limit if specified
      if (availableCoupon.maximumDiscount && discountAmount > availableCoupon.maximumDiscount) {
        discountAmount = availableCoupon.maximumDiscount;
      }
      
      subtotal -= discountAmount;
    }

    // Apply gift card
    if (availableGiftcard) {
      let giftcardAmount = availableGiftcard.balance;
      
      // Apply maximum usage per transaction limit
      if (availableGiftcard.maxUsagePerTransaction) {
        giftcardAmount = Math.min(giftcardAmount, availableGiftcard.maxUsagePerTransaction);
      }
      
      // Apply partial usage rules minimum remaining
      if (availableGiftcard.partialUsageRules?.minimumRemaining) {
        const maxUsableAmount = availableGiftcard.balance - availableGiftcard.partialUsageRules.minimumRemaining;
        if (maxUsableAmount > 0) {
          giftcardAmount = Math.min(giftcardAmount, maxUsableAmount);
        } else {
          giftcardAmount = 0; // Cannot use if it would violate minimum remaining
        }
      }
      
      subtotal = Math.max(0, subtotal - giftcardAmount);
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

  const validateStep = () => {
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

  const handleNext = () => {
    if (validateStep() && currentStep < steps.length) {
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

  const handleBack = () => {
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

  const validateCouponUsage = (coupon: any, customerId?: string) => {
    console.log('Validating coupon:', coupon.code);
    console.log('Coupon appliesDateFrom:', coupon.appliesDateFrom);
    console.log('Coupon appliesDateTo:', coupon.appliesDateTo);
    console.log('Coupon customDateFrom:', coupon.customDateFrom, typeof coupon.customDateFrom);
    console.log('Coupon customDateTo:', coupon.customDateTo, typeof coupon.customDateTo);
    
    // Check if coupon is active
    if (coupon.status !== 'Active') {
      return { valid: false, reason: "Coupon is inactive." };
    }

    // Check date range restrictions
    const currentDate = new Date();
    // Set current date to start of day for accurate comparison
    currentDate.setHours(0, 0, 0, 0);
    console.log('Current date:', currentDate);
    
    if (coupon.appliesDateFrom === 'Custom' && coupon.customDateFrom) {
      const fromDate = new Date(coupon.customDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      console.log('From date after processing:', fromDate);
      if (currentDate < fromDate) {
        console.log('Coupon not yet active');
        return { valid: false, reason: "Coupon is not yet active." };
      }
    }
    
    if (coupon.appliesDateTo === 'Custom' && coupon.customDateTo) {
      const toDate = new Date(coupon.customDateTo);
      toDate.setHours(23, 59, 59, 999); // End of the day
      console.log('To date after processing:', toDate);
      if (currentDate > toDate) {
        console.log('Coupon has expired');
        return { valid: false, reason: "Coupon has expired." };
      }
    }

    // Check service filter
    if (coupon.servicesFilter && Array.isArray(coupon.servicesFilter)) {
      if (coupon.servicesFilter.length > 0 && !coupon.servicesFilter.includes(bookingData.service)) {
        return { valid: false, reason: "This coupon does not apply to the selected service." };
      }
    } else if (coupon.servicesFilter && coupon.servicesFilter !== 'all-services') {
      if (coupon.servicesFilter !== bookingData.service) {
        return { valid: false, reason: "This coupon does not apply to the selected service." };
      }
    }

    // Check staff filter
    if (coupon.staffFilter && Array.isArray(coupon.staffFilter)) {
      if (coupon.staffFilter.length > 0 && !coupon.staffFilter.includes(bookingData.staff)) {
        return { valid: false, reason: "This coupon does not apply to the selected staff member." };
      }
    } else if (coupon.staffFilter && coupon.staffFilter !== 'all-staff') {
      if (coupon.staffFilter !== bookingData.staff) {
        return { valid: false, reason: "This coupon does not apply to the selected staff member." };
      }
    }

    // Calculate current booking total for minimum purchase validation
    const selectedService = services.find(s => s.id === bookingData.service);
    let bookingSubtotal = selectedService ? selectedService.price : 0;
    
    // Add extras to subtotal
    selectedExtras.forEach(extraId => {
      const extra = selectedService?.extras?.find(e => e.id === extraId);
      if (extra) bookingSubtotal += extra.price;
    });

    // Check minimum purchase requirement
    if (coupon.minimumPurchase && bookingSubtotal < coupon.minimumPurchase) {
      return { 
        valid: false, 
        reason: `Minimum purchase of ${currency.symbol}${coupon.minimumPurchase.toFixed(2)} required.` 
      };
    }

    // Check usage limit
    if (coupon.usageLimit !== 'No limit') {
      const usageLimit = parseInt(coupon.usageLimit);
      if (coupon.timesUsed >= usageLimit) {
        return { valid: false, reason: "Coupon has reached its usage limit." };
      }
    }

    // Check "once per" restrictions
    if (coupon.oncePer && customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        return { valid: false, reason: "Customer not found." };
      }

      if (coupon.oncePer === 'customer') {
        // Check if this customer has used this coupon before
        const customerAppointments = appointments.filter(apt => 
          apt.customerId === customerId && apt.appliedCoupons?.includes(coupon.id)
        );
        if (customerAppointments.length > 0) {
          return { valid: false, reason: "This coupon can only be used once per customer." };
        }
      } else if (coupon.oncePer === 'day') {
        // Check if this customer has used this coupon today
        const today = new Date().toDateString();
        const todaysAppointments = appointments.filter(apt => 
          apt.customerId === customerId && 
          apt.appliedCoupons?.includes(coupon.id) &&
          new Date(apt.date).toDateString() === today
        );
        if (todaysAppointments.length > 0) {
          return { valid: false, reason: "This coupon can only be used once per day." };
        }
      }
      // 'booking' restriction is automatically enforced since we only allow one coupon per booking
    }

    return { valid: true };
  };

  const handleCouponValidation = () => {
    const coupon = coupons.find(c => 
      c.code.toLowerCase() === bookingData.couponCode.toLowerCase()
    );
    
    if (!coupon) {
      toast({
        title: "Invalid Coupon",
        description: "The coupon code does not exist.",
        variant: "destructive"
      });
      return;
    }

    // Find or create customer ID for validation
    let customerId = '';
    if (bookingData.customerEmail) {
      const existingCustomer = customers.find(c => c.email === bookingData.customerEmail);
      customerId = existingCustomer?.id || '';
    }

    const validation = validateCouponUsage(coupon, customerId);
    
    if (validation.valid) {
      setAvailableCoupon(coupon);
      toast({
        title: "Coupon Applied!",
        description: `${coupon.discount} discount applied.`,
      });
    } else {
      toast({
        title: "Coupon Not Available",
        description: validation.reason,
        variant: "destructive"
      });
    }
  };

  const validateGiftcardUsage = (giftcard: any, customerId?: string) => {
    // Check if gift card is active and has balance
    if (!giftcard.isActive || giftcard.leftover <= 0) {
      return { valid: false, reason: "Gift card is inactive or has no remaining balance." };
    }

    // Check expiration
    if (giftcard.expiresAt && new Date(giftcard.expiresAt) < new Date()) {
      return { valid: false, reason: "Gift card has expired." };
    }

    // Check location filter
    if (giftcard.locationFilter !== 'all-locations' && giftcard.locationFilter !== bookingData.location) {
      const location = locations.find(l => l.id === bookingData.location);
      return { valid: false, reason: `Gift card is only valid at ${locations.find(l => l.id === giftcard.locationFilter)?.name || 'specific locations'}.` };
    }

    // Check service filter
    if (giftcard.servicesFilter !== 'all-services' && giftcard.servicesFilter !== bookingData.service) {
      const service = services.find(s => s.id === bookingData.service);
      return { valid: false, reason: `Gift card is only valid for ${services.find(s => s.id === giftcard.servicesFilter)?.name || 'specific services'}.` };
    }

    // Check staff filter
    if (giftcard.staffFilter !== 'all-staff' && giftcard.staffFilter !== bookingData.staff) {
      const staffMember = staff.find(s => s.id === bookingData.staff);
      return { valid: false, reason: `Gift card is only valid with ${staff.find(s => s.id === giftcard.staffFilter)?.name || 'specific staff members'}.` };
    }

    // Calculate current booking total for minimum purchase and max usage validation
    const selectedService = services.find(s => s.id === bookingData.service);
    let bookingSubtotal = selectedService ? selectedService.price : 0;
    
    // Add extras to subtotal
    selectedExtras.forEach(extraId => {
      const extra = selectedService?.extras?.find(e => e.id === extraId);
      if (extra) bookingSubtotal += extra.price;
    });

    // Check minimum purchase requirement
    if (giftcard.minimumPurchase && bookingSubtotal < giftcard.minimumPurchase) {
      return { 
        valid: false, 
        reason: `Minimum purchase of ${currency.symbol}${giftcard.minimumPurchase.toFixed(2)} required to use this gift card.` 
      };
    }

    // Check maximum usage per transaction
    if (giftcard.maxUsagePerTransaction && giftcard.maxUsagePerTransaction < bookingSubtotal) {
      return { 
        valid: false, 
        reason: `This gift card can only be used for purchases up to ${currency.symbol}${giftcard.maxUsagePerTransaction.toFixed(2)} per transaction.` 
      };
    }

    // Check time restrictions
    if (giftcard.timeRestrictions) {
      const currentDate = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[currentDate.getDay()];
      const currentTime = currentDate.toTimeString().slice(0, 5); // HH:MM format
      
      // Check allowed days
      if (giftcard.timeRestrictions.allowedDays && 
          !giftcard.timeRestrictions.allowedDays.includes(currentDay)) {
        return { 
          valid: false, 
          reason: "This gift card cannot be used on this day of the week." 
        };
      }
      
      // Check allowed hours
      if (giftcard.timeRestrictions.allowedHours) {
        const { start, end } = giftcard.timeRestrictions.allowedHours;
        if (currentTime < start || currentTime > end) {
          return { 
            valid: false, 
            reason: `This gift card can only be used between ${start} and ${end}.` 
          };
        }
      }
    }

    // Check daily limit
    if (giftcard.dailyLimit) {
      const today = new Date().toDateString();
      const todayUsage = appointments.filter(apt => {
        const aptDate = new Date(apt.date).toDateString();
        return apt.appliedGiftcards?.includes(giftcard.id) && aptDate === today;
      });
      
      const todayTotalUsage = todayUsage.reduce((total, apt) => {
        // Calculate how much of the gift card was used in this appointment
        const giftcardUsage = Math.min(giftcard.leftover, apt.totalPrice || 0);
        return total + giftcardUsage;
      }, 0);
      
      if (todayTotalUsage >= giftcard.dailyLimit) {
        return { 
          valid: false, 
          reason: `Daily usage limit of ${currency.symbol}${giftcard.dailyLimit.toFixed(2)} reached for this gift card.` 
        };
      }
    }

    // Check monthly limit
    if (giftcard.monthlyLimit) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyUsage = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return apt.appliedGiftcards?.includes(giftcard.id) && 
               aptDate.getMonth() === currentMonth && 
               aptDate.getFullYear() === currentYear;
      });
      
      const monthlyTotalUsage = monthlyUsage.reduce((total, apt) => {
        const giftcardUsage = Math.min(giftcard.leftover, apt.totalPrice || 0);
        return total + giftcardUsage;
      }, 0);
      
      if (monthlyTotalUsage >= giftcard.monthlyLimit) {
        return { 
          valid: false, 
          reason: `Monthly usage limit of ${currency.symbol}${giftcard.monthlyLimit.toFixed(2)} reached for this gift card.` 
        };
      }
    }

    // Check category restrictions
    if (giftcard.categoryRestrictions && giftcard.categoryRestrictions.length > 0) {
      const selectedService = services.find(s => s.id === bookingData.service);
      if (selectedService && !giftcard.categoryRestrictions.includes(selectedService.category)) {
        return { 
          valid: false, 
          reason: "This gift card cannot be used for the selected service category." 
        };
      }
    }

    // Check usage limit
    if (giftcard.usageLimit !== 'no-limit') {
      const usageLimit = parseInt(giftcard.usageLimit);
      const timesUsed = giftcard.usageHistory?.length || 0;
      
      if (timesUsed >= usageLimit) {
        return { valid: false, reason: `Gift card has reached its usage limit of ${usageLimit} times.` };
      }
    }

    // Check "once per" restrictions
    if (giftcard.oncePer && customerId) {
      const customerEmail = customFormData.email || customFormData['Email'] || '';
      const today = new Date().toDateString();
      
      switch (giftcard.oncePer) {
        case 'customer':
          // Check if this customer has already used this gift card
          const customerUsage = appointments.filter(apt => 
            apt.appliedGiftcards?.includes(giftcard.id) && 
            (apt.customerId === customerId || 
             (customers.find(c => c.id === apt.customerId)?.email.toLowerCase() === customerEmail.toLowerCase()))
          );
          if (customerUsage.length > 0) {
            return { valid: false, reason: "You have already used this gift card. This gift card can only be used once per customer." };
          }
          break;
          
        case 'booking':
          // This is handled automatically since each booking is separate
          break;
          
        case 'day':
          // Check if this customer has used this gift card today
          const todayUsage = appointments.filter(apt => {
            const aptDate = new Date(apt.date).toDateString();
            const aptCustomer = customers.find(c => c.id === apt.customerId);
            return apt.appliedGiftcards?.includes(giftcard.id) && 
                   aptDate === today &&
                   (apt.customerId === customerId || 
                    (aptCustomer?.email.toLowerCase() === customerEmail.toLowerCase()));
          });
          if (todayUsage.length > 0) {
            return { valid: false, reason: "You have already used this gift card today. This gift card can only be used once per day." };
          }
          break;
      }
    }

    return { valid: true };
  };

  const handleGiftcardValidation = () => {
    const giftcard = giftcards.find(g => 
      g.code.toLowerCase() === giftcardCode.toLowerCase()
    );
    
    if (!giftcard) {
      toast({
        title: "Invalid Gift Card",
        description: "The gift card code was not found.",
        variant: "destructive"
      });
      return;
    }

    // Get customer email for validation
    const customerEmail = customFormData.email || customFormData['Email'] || '';
    const existingCustomer = customers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase());
    
    const validation = validateGiftcardUsage(giftcard, existingCustomer?.id);
    
    if (validation.valid) {
      setAvailableGiftcard(giftcard);
      toast({
        title: "Gift Card Applied!",
        description: `${currency.symbol}${giftcard.leftover.toFixed(2)} gift card balance applied.`,
      });
    } else {
      toast({
        title: "Gift Card Cannot Be Used",
        description: validation.reason,
        variant: "destructive"
      });
    }
  };

  const handleBookingSubmit = async () => {
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
      // Simulate API call - in real app, this would send to your backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract customer information from custom form data for later use
      const firstName = customFormData.firstName || customFormData['First Name'] || '';
      const lastName = customFormData.lastName || customFormData['Last Name'] || '';
      const email = customFormData.email || customFormData['Email'] || '';
      const note = customFormData.note || customFormData['Note'] || '';

      // Customer will be auto-created from appointment custom fields in AppDataContext
      // No need to manually create customer here - let addAppointment handle it

      // Merge custom form data and dynamic field values before saving
      const mergedCustomFields = { ...customFormData, ...dynamicFieldValues };
      
      // Convert file objects to serializable format before saving
      const convertedCustomFields = await convertCustomFieldsForSaving(mergedCustomFields);

      // Create appointment record with "confirmed" status
      // Pass empty customerId - let addAppointment auto-create customer from customFields
      const appointmentId = addAppointment({
        customerId: '', // Will be auto-generated from customFields
        staffId: bookingData.staff,
        serviceId: bookingData.service,
        locationId: bookingData.location,
        date: new Date(bookingData.date),
        time: bookingData.time,
        status: 'Pending',
        notes: note,
        selectedExtras,
        appliedCoupons: availableCoupon ? [availableCoupon.id] : [],
        appliedGiftcards: availableGiftcard ? [availableGiftcard.id] : [],
        appliedTaxes: taxes.filter(tax => 
          tax.enabled && 
          (tax.locationsFilter === 'all-locations' || tax.locationsFilter === bookingData.location) &&
          (tax.servicesFilter === 'all-services' || tax.servicesFilter === bookingData.service)
        ).map(tax => tax.id),
        customFields: convertedCustomFields,
        totalPrice: calculateTotal(),
      });

      console.log('Booking submitted:', {
        appointmentId,
        ...bookingData,
        selectedExtras,
        customFormData,
        appliedCoupon: availableCoupon?.id,
        appliedGiftcard: availableGiftcard?.id,
        totalPrice: calculateTotal(),
        businessSlug,
        timestamp: new Date().toISOString()
      });

      // Save form responses for custom forms
      const selectedService = services.find(s => s.id === bookingData.service);
      const applicableCustomForms = serviceForms.filter(form => {
        if (form.id === 'first-visit-form') return false; // Skip the first visit form for custom responses
        if (form.services === 'All Services' || form.services === 'all') {
          return true;
        }
        if (selectedService && form.services) {
          const serviceCategoryLower = selectedService.category.toLowerCase();
          const formServicesLower = form.services.toLowerCase();
          return serviceCategoryLower === formServicesLower;
        }
        return false;
      });

      // Save responses for all applicable custom forms
      applicableCustomForms.forEach(form => {
        const existingResponses = JSON.parse(localStorage.getItem('formResponses') || '[]');
        const mergedFormData = { ...customFormData, ...dynamicFieldValues };
        const newResponse = {
          id: `response_${Date.now()}_${Math.random()}`,
          formId: form.id,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`.trim(),
          submittedAt: new Date().toISOString(),
          responses: mergedFormData,
          appointmentId: appointmentId
        };
        
        existingResponses.push(newResponse);
        localStorage.setItem('formResponses', JSON.stringify(existingResponses));
      });

      setCurrentStep(8); // Move to confirmation step
      
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked!",
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Location</h3>
            <div className="space-y-3">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className={`cursor-pointer transition-all ${
                    bookingData.location === location.id
                      ? 'ring-2 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  style={{
                    borderColor: bookingData.location === location.id ? theme.activeColor : undefined,
                    '--tw-ring-color': theme.activeColor
                  } as React.CSSProperties}
                  onClick={() => setBookingData({ ...bookingData, location: location.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {location.image ? (
                        <img
                          src={location.image}
                          alt={location.name}
                          className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-gray-600">{location.address}</p>
                        <p className="text-sm text-gray-500">{location.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        const availableServices = services.filter(service =>
          !bookingData.location || service.staffIds?.some(staffId => 
            staff.find(s => s.id === staffId)?.locations.includes(bookingData.location)
          )
        );

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Service</h3>
            <div className="space-y-3">
              {availableServices.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    bookingData.service === service.id
                      ? 'ring-2 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  style={{
                    borderColor: bookingData.service === service.id ? theme.activeColor : undefined,
                    '--tw-ring-color': theme.activeColor
                  } as React.CSSProperties}
                  onClick={() => setBookingData({ ...bookingData, service: service.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {service.image && (
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.category}</p>
                            <p className="text-sm text-gray-500">{formatMinutesToReadable(service.duration)}</p>
                            {service.description && (
                              <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                            )}
                          </div>
                           <div className="text-right">
                             <span className="text-lg font-semibold">{formatPrice(service.price)}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                 </Card>
               ))}
             </div>
             
             {/* Group Booking UI */}
             {(() => {
               const selectedService = services.find(s => s.id === bookingData.service);
               return null; // Group booking removed
               
             })()}
           </div>
         );

      case 3:
        const selectedService = services.find(s => s.id === bookingData.service);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Service Extras</h3>
            {selectedService?.extras && selectedService.extras.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Add any extras to enhance your service (optional)</p>
                {selectedService.extras.map((extra) => (
                  <Card key={extra.id} className="p-3">
                    <div className="flex items-center justify-between">
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
                          <h5 className="font-medium">{extra.name}</h5>
                          <p className="text-sm text-gray-600">{extra.description}</p>
                          <p className="text-sm text-gray-500">{formatMinutesToReadable(extra.duration || 30)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">+{formatPrice(extra.price)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No extras available for this service.</p>
                <p className="text-sm text-gray-400 mt-2">Click Next to continue with staff selection.</p>
              </div>
            )}
          </div>
        );

      case 4:
        const availableStaff = getAvailableStaff();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Staff</h3>
            <div className="space-y-3">
              <Card
                className={`cursor-pointer transition-all ${
                  bookingData.staff === 'any' ? 'ring-2 bg-blue-50' : 'hover:shadow-md'
                }`}
                style={{
                  borderColor: bookingData.staff === 'any' ? theme.activeColor : undefined,
                  '--tw-ring-color': theme.activeColor
                } as React.CSSProperties}
                onClick={() => setBookingData({ ...bookingData, staff: 'any' })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Any Available Staff</h4>
                      <p className="text-sm text-gray-600">First available appointment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {availableStaff.map((staffMember) => (
                <Card
                  key={staffMember.id}
                  className={`cursor-pointer transition-all ${
                    bookingData.staff === staffMember.id
                      ? 'ring-2 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  style={{
                    borderColor: bookingData.staff === staffMember.id ? theme.activeColor : undefined,
                    '--tw-ring-color': theme.activeColor
                  } as React.CSSProperties}
                  onClick={() => setBookingData({ ...bookingData, staff: staffMember.id })}
                >
                   <CardContent className="p-4">
                     <div className="flex items-center space-x-3">
                       <Avatar className="w-12 h-12">
                         {staffMember.avatar ? (
                           <AvatarImage src={staffMember.avatar} alt={staffMember.name} className="object-cover" />
                         ) : (
                           <AvatarFallback 
                             className="text-white font-semibold"
                             style={{ backgroundColor: theme.primaryColor }}
                           >
                             {staffMember.name.split(' ').map(n => n[0]).join('')}
                           </AvatarFallback>
                         )}
                       </Avatar>
                       <div>
                         <h4 className="font-medium">{staffMember.name}</h4>
                         <p className="text-sm text-gray-600">{staffMember.role}</p>
                         <p className="text-sm text-gray-500">{staffMember.department}</p>
                       </div>
                     </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        const selectedServiceForTime = services.find(s => s.id === bookingData.service);
        const selectedStaffForTime = staff.find(s => s.id === bookingData.staff);
        
        // Calculate total service duration
        let totalServiceDuration = selectedServiceForTime?.duration || 60;
        selectedExtras.forEach(extraId => {
          const extra = selectedServiceForTime?.extras?.find(e => e.id === extraId);
          if (extra) totalServiceDuration += extra.duration || 30;
        });
        

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
            
            {/* Top Row: Staff Selector and Calendar Icon */}
            <div className="flex items-center justify-between">
              {/* Staff Selection */}
              <Select 
                value={bookingData.staff} 
                onValueChange={(value) => {
                  const newBookingData = { ...bookingData, staff: value };
                  
                  // If a date is already selected and we're changing staff
                  if (bookingData.date && value !== bookingData.staff) {
                    const selectedService = services.find(s => s.id === bookingData.service);
                    if (!selectedService) {
                      setBookingData(newBookingData);
                      return;
                    }
                    
                    const totalServiceDuration = selectedService.duration + 
                      selectedExtras.reduce((total, extraId) => {
                        const extra = selectedService.extras?.find(e => e.id === extraId);
                        return total + (extra?.duration || 0);
                      }, 0);

                    // Get booked appointments for availability checking
                    const bookedAppointments = appointments.map(appointment => {
                      const appointmentService = services.find(s => s.id === appointment.serviceId);
                      const baseDuration = appointmentService?.duration || 60;
                      const extrasDuration = appointment.selectedExtras.reduce((total, extraId) => {
                        const extra = appointmentService?.extras?.find(e => e.id === extraId);
                        return total + (extra?.duration || 0);
                      }, 0);
                      const appointmentDuration = baseDuration + extrasDuration;
                      
                      return {
                        id: appointment.id,
                        staffId: appointment.staffId,
                        serviceId: appointment.serviceId,
                        date: appointment.date,
                        time: appointment.time,
                        duration: appointmentDuration
                      };
                    });

                    // Check if new staff is available on the currently selected date
                    let isCurrentDateAvailable = false;
                    
                    if (value === 'any') {
                      // Check if any staff is available on current date
                      const availableStaff = getAvailableStaff();
                      isCurrentDateAvailable = availableStaff.some(staffMember => 
                        staffMember.schedule && isDateAvailable(new Date(bookingData.date), staffMember.schedule)
                      );
                    } else {
                      // Check if specific staff is available on current date
                      const selectedStaff = staff.find(s => s.id === value);
                      if (selectedStaff?.schedule) {
                        isCurrentDateAvailable = isDateAvailable(new Date(bookingData.date), selectedStaff.schedule);
                        
                        // Also check if they have available time slots
                        if (isCurrentDateAvailable) {
                          const availableSlots = getAvailableTimeSlotsForDate(
                            new Date(bookingData.date),
                            selectedStaff.schedule,
                            totalServiceDuration,
                            bookedAppointments,
                            value
                          );
                          isCurrentDateAvailable = availableSlots.length > 0;
                        }
                      }
                    }

                    if (isCurrentDateAvailable) {
                      // Staff is available on current date, keep the date but clear time
                      setBookingData({ ...newBookingData, time: '' });
                    } else {
                      // Staff is not available on current date, find next available date
                      let nextAvailableDate: Date | null = null;

                      if (value === 'any') {
                        const availableStaff = getAvailableStaff();
                        const staffSchedules = availableStaff
                          .map(s => s.schedule)
                          .filter(schedule => schedule != null);
                        
                        if (staffSchedules.length > 0) {
                          nextAvailableDate = findNextAvailableDate(
                            new Date(bookingData.date),
                            staffSchedules,
                            totalServiceDuration,
                            bookedAppointments
                          );
                        }
                      } else {
                        const selectedStaff = staff.find(s => s.id === value);
                        if (selectedStaff?.schedule) {
                          nextAvailableDate = findNextAvailableDate(
                            new Date(bookingData.date),
                            [selectedStaff.schedule],
                            totalServiceDuration,
                            bookedAppointments
                          );
                        }
                      }

                      if (nextAvailableDate) {
                        setBookingData({ 
                          ...newBookingData, 
                          date: format(nextAvailableDate, 'yyyy-MM-dd'), 
                          time: '' 
                        });
                        toast({
                          title: "Date Updated",
                          description: `Moved to next available date: ${format(nextAvailableDate, 'EEE, dd MMM')}`,
                        });
                      } else {
                        // No available dates found, clear date and time
                        setBookingData({ ...newBookingData, date: '', time: '' });
                        toast({
                          title: "No Available Dates",
                          description: "This staff member has no available dates in the next 30 days.",
                          variant: "destructive"
                        });
                      }
                    }
                  } else {
                    // No date selected yet or same staff, just update staff and clear date/time if first selection
                    if (!bookingData.date) {
                      setBookingData({ ...newBookingData, date: '', time: '' });
                    } else {
                      setBookingData({ ...newBookingData, time: '' });
                    }
                  }
                }}
              >
                <SelectTrigger className="w-auto min-w-[200px] bg-gray-50 border-gray-200 rounded-full px-4">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Any professional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-500" />
                      </div>
                      <span>Any professional</span>
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

              {/* Calendar Icon */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-lg border border-gray-200"
                  >
                    <CalendarIcon className="h-5 w-5" />
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
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Available Times *</Label>
              {bookingData.date ? (
                finalAvailableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {finalAvailableSlots.map((timeSlot) => (
                      <Button
                        key={timeSlot}
                        variant={bookingData.time === formatTimeSlot(timeSlot) ? "default" : "outline"}
                        onClick={() => setBookingData({ ...bookingData, time: formatTimeSlot(timeSlot) })}
                        className="h-10"
                        style={{
                          backgroundColor: bookingData.time === formatTimeSlot(timeSlot) ? theme.primaryColor : 'transparent',
                          borderColor: bookingData.time === formatTimeSlot(timeSlot) ? theme.primaryColor : undefined
                        }}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTimeSlot(timeSlot)}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Selected professional is fully booked on this date</h4>
                      {(() => {
                        // Find next available date
                        const selectedService = services.find(s => s.id === bookingData.service);
                        if (!selectedService) return null;
                        
                        const totalServiceDuration = selectedService.duration + 
                          selectedExtras.reduce((total, extraId) => {
                            const extra = selectedService.extras?.find(e => e.id === extraId);
                            return total + (extra?.duration || 0);
                          }, 0);

                        // Get booked appointments for availability checking
                        const bookedAppointments = appointments.map(appointment => {
                          // Calculate appointment duration from service and extras
                          const appointmentService = services.find(s => s.id === appointment.serviceId);
                          const baseDuration = appointmentService?.duration || 60;
                          const extrasDuration = appointment.selectedExtras.reduce((total, extraId) => {
                            const extra = appointmentService?.extras?.find(e => e.id === extraId);
                            return total + (extra?.duration || 0);
                          }, 0);
                          const appointmentDuration = baseDuration + extrasDuration;
                          
                          return {
                            id: appointment.id,
                            staffId: appointment.staffId,
                            serviceId: appointment.serviceId,
                            date: appointment.date,
                            time: appointment.time,
                            duration: appointmentDuration
                          };
                        });

                        let nextAvailableDate: Date | null = null;

                        if (bookingData.staff === 'any') {
                          // Check all available staff for next available date
                          const availableStaff = getAvailableStaff();
                          const staffSchedules = availableStaff
                            .map(s => s.schedule)
                            .filter(schedule => schedule != null);
                          
                          if (staffSchedules.length > 0) {
                            nextAvailableDate = findNextAvailableDate(
                              new Date(bookingData.date),
                              staffSchedules,
                              totalServiceDuration,
                              bookedAppointments
                            );
                          }
                        } else {
                          // Check specific staff member
                          const selectedStaff = staff.find(s => s.id === bookingData.staff);
                          if (selectedStaff?.schedule) {
                            nextAvailableDate = findNextAvailableDate(
                              new Date(bookingData.date),
                              [selectedStaff.schedule],
                              totalServiceDuration,
                              bookedAppointments
                            );
                          }
                        }
                        
                        if (nextAvailableDate) {
                          const nextAvailableDateStr = format(nextAvailableDate, 'EEE, dd MMM');
                          return (
                            <p className="text-sm text-gray-500">Available from {nextAvailableDateStr}</p>
                          );
                        } else {
                          return (
                            <p className="text-sm text-gray-500">No available dates in the next 30 days</p>
                          );
                        }
                      })()}
                    </div>
                    
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Find and go to next available date
                          const selectedService = services.find(s => s.id === bookingData.service);
                          if (!selectedService) return;
                          
                          const totalServiceDuration = selectedService.duration + 
                            selectedExtras.reduce((total, extraId) => {
                              const extra = selectedService.extras?.find(e => e.id === extraId);
                              return total + (extra?.duration || 0);
                            }, 0);

                          // Get booked appointments for availability checking
                          const bookedAppointments = appointments.map(appointment => {
                            const appointmentService = services.find(s => s.id === appointment.serviceId);
                            const baseDuration = appointmentService?.duration || 60;
                            const extrasDuration = appointment.selectedExtras.reduce((total, extraId) => {
                              const extra = appointmentService?.extras?.find(e => e.id === extraId);
                              return total + (extra?.duration || 0);
                            }, 0);
                            const appointmentDuration = baseDuration + extrasDuration;
                            
                            return {
                              id: appointment.id,
                              staffId: appointment.staffId,
                              serviceId: appointment.serviceId,
                              date: appointment.date,
                              time: appointment.time,
                              duration: appointmentDuration
                            };
                          });

                          let nextAvailableDate: Date | null = null;

                          if (bookingData.staff === 'any') {
                            // Check all available staff for next available date
                            const availableStaff = getAvailableStaff();
                            const staffSchedules = availableStaff
                              .map(s => s.schedule)
                              .filter(schedule => schedule != null);
                            
                            if (staffSchedules.length > 0) {
                              nextAvailableDate = findNextAvailableDate(
                                new Date(bookingData.date),
                                staffSchedules,
                                totalServiceDuration,
                                bookedAppointments
                              );
                            }
                          } else {
                            // Check specific staff member
                            const selectedStaff = staff.find(s => s.id === bookingData.staff);
                            if (selectedStaff?.schedule) {
                              nextAvailableDate = findNextAvailableDate(
                                new Date(bookingData.date),
                                [selectedStaff.schedule],
                                totalServiceDuration,
                                bookedAppointments
                              );
                            }
                          }
                          
                          if (nextAvailableDate) {
                            setBookingData({ 
                              ...bookingData, 
                              date: format(nextAvailableDate, 'yyyy-MM-dd'), 
                              time: '' 
                            });
                          } else {
                            toast({
                              title: "No Available Dates",
                              description: "No available dates found in the next 30 days.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="px-4 py-2"
                      >
                        Go to next available date
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Join Waitlist",
                            description: "Waitlist functionality coming soon!",
                          });
                        }}
                        className="px-4 py-2"
                      >
                        Join waitlist
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please select a date first.</p>
                </div>
              )}
            </div>
            
            {selectedServiceForTime && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Service Duration:</strong> {formatMinutesToReadable(totalServiceDuration)}
                  {selectedExtras.length > 0 && (
                    <span className="block mt-1">
                      ({selectedServiceForTime.name}: {formatMinutesToReadable(selectedServiceForTime.duration)} + {selectedExtras.map(extraId => {
                        const extra = selectedServiceForTime.extras?.find(e => e.id === extraId);
                        return extra ? `${extra.name}: ${formatMinutesToReadable(extra.duration || 30)}` : '';
                      }).filter(Boolean).join(' + ')})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        );

      case 6:
        const selectedServiceForForm = services.find(s => s.id === bookingData.service);
        
        // Get all forms - first visit form first, then other applicable forms
        const firstVisitForm = serviceForms.find(form => form.id === 'first-visit-form');
        const otherApplicableForms = serviceForms.filter(form => {
          if (form.id === 'first-visit-form') return false; // Skip first visit form here
          
          // Check if form applies to all services
          if (form.services === 'All Services' || form.services === 'all') {
            return true;
          }
          
          // Check if form applies to the selected service's category
          if (selectedServiceForForm && form.services) {
            const serviceCategoryLower = selectedServiceForForm.category.toLowerCase();
            const formServicesLower = form.services.toLowerCase();
            return serviceCategoryLower === formServicesLower;
          }
          
          return false;
        });

        // Combine forms in order: first visit form first, then others
        const allApplicableForms = [];
        if (firstVisitForm) allApplicableForms.push(firstVisitForm);
        allApplicableForms.push(...otherApplicableForms);

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            
            <div className="space-y-6">
              {allApplicableForms.length > 0 ? (
                allApplicableForms.map((form, formIndex) => {
                  // Load form elements from localStorage
                  let formElements: any[] = [];
                  const savedFormElements = localStorage.getItem(`customForm_${form.id}`);
                  if (savedFormElements) {
                    try {
                      formElements = JSON.parse(savedFormElements);
                    } catch (error) {
                      console.error('Error parsing form elements:', error);
                    }
                  }

                  if (formElements.length === 0) return null;

                  return (
                    <div key={form.id} className="space-y-4">
                      {formIndex > 0 && <hr className="border-gray-200" />}
                      
                      {formElements.map((element: any) => (
                        <InteractiveFormRenderer
                          key={element.id}
                          element={element}
                          value={customFormData[element.id]}
                          onChange={(value) => setCustomFormData({
                            ...customFormData,
                            [element.id]: value
                          })}
                          formValues={customFormData}
                          allElements={formElements}
                          onDynamicFieldChange={(fieldId, value) => setDynamicFieldValues({
                            ...dynamicFieldValues,
                            [fieldId]: value
                          })}
                          dynamicFieldValues={dynamicFieldValues}
                        />
                      ))}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No custom forms available for this service.</p>
                  <p className="text-sm text-gray-400 mt-2">Please create a custom form in the Custom Forms section.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        const selectedServiceData = services.find(s => s.id === bookingData.service);
        const selectedStaffData = staff.find(s => s.id === bookingData.staff);
        const selectedLocationData = locations.find(l => l.id === bookingData.location);
        
        // Find applicable custom form for step 7
        const applicableFormStep7 = serviceForms.find(form => {
          if (form.services === 'All Services' || form.services === 'all') {
            return true;
          }
          if (selectedServiceData && form.services) {
            const serviceCategoryLower = selectedServiceData.category.toLowerCase();
            const formServicesLower = form.services.toLowerCase();
            return serviceCategoryLower === formServicesLower;
          }
          return false;
        });
        
        const total = calculateTotal();
        const applicableTaxes = taxes.filter(tax => 
          tax.enabled && 
          (tax.locationsFilter === 'all-locations' || tax.locationsFilter === bookingData.location) &&
          (tax.servicesFilter === 'all-services' || tax.servicesFilter === bookingData.service)
        );

        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Confirm Details</h3>
            
            {/* Booking Summary Header */}
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span 
                    className="font-medium"
                    style={{ color: theme.primaryColor }}
                  >Location: </span>
                  <span className="font-bold text-gray-900">{locations.find(l => l.id === bookingData.location)?.name}</span>
                </div>
                <div>
                  <span 
                    className="font-medium"
                    style={{ color: theme.primaryColor }}
                  >Service: </span>
                  <span className="font-bold text-gray-900">{selectedServiceData?.name}</span>
                </div>
                {selectedExtras.length > 0 && (
                  <div>
                    <span 
                      className="font-medium"
                      style={{ color: theme.primaryColor }}
                    >Extra Service: </span>
                    <span className="font-bold text-gray-900">
                      {selectedExtras.map(extraId => {
                        const extra = selectedServiceData?.extras?.find(e => e.id === extraId);
                        return extra?.name;
                      }).join(', ')}
                    </span>
                  </div>
                )}
                <div>
                  <span 
                    className="font-medium"
                    style={{ color: theme.primaryColor }}
                  >Staff: </span>
                  <span className="font-bold text-gray-900">
                    {bookingData.staff === 'any' ? 'Any Available' : staff.find(s => s.id === bookingData.staff)?.name}
                  </span>
                </div>
                <div>
                  <span 
                    className="font-medium"
                    style={{ color: theme.primaryColor }}
                  >Date & Time: </span>
                  <span className="font-bold text-gray-900">
                    {bookingData.date ? format(new Date(bookingData.date), 'EEEE dd MMMM yyyy') : ''} / {(() => {
                      console.log('Confirm Details - Time calculation debug:', {
                        bookingDataTime: bookingData.time,
                        selectedServiceData: selectedServiceData,
                        selectedExtras: selectedExtras,
                      });
                      
                      if (!bookingData.time || !selectedServiceData?.duration) {
                        console.log('Confirm Details - Early return: missing time or duration');
                        return bookingData.time;
                      }
                      
                      try {
                        // Validate time format (should be HH:mm)
                        console.log('Confirm Details - Time format test:', !/^\d{1,2}:\d{2}$/.test(bookingData.time));
                        if (!/^\d{1,2}:\d{2}$/.test(bookingData.time)) {
                          console.log('Confirm Details - Invalid time format');
                          return bookingData.time;
                        }
                        
                        // Calculate total duration including extras and group booking
                        let totalDuration = selectedServiceData.duration;
                        selectedExtras.forEach(extraId => {
                          const extra = selectedServiceData.extras?.find(e => e.id === extraId);
                          if (extra) totalDuration += extra.duration || 30;
                        });
                        
                        console.log('Confirm Details - Total duration calculated:', totalDuration);
                        
                        // Parse start time and calculate end time
                        const startTime = parse(bookingData.time, 'HH:mm', new Date());
                        
                        // Check if parsing was successful
                        if (!isValid(startTime)) {
                          console.log('Confirm Details - Invalid parsed time');
                          return bookingData.time;
                        }
                        
                        const endTime = addMinutes(startTime, totalDuration);
                        const result = `${bookingData.time} - ${format(endTime, 'HH:mm')}`;
                        
                        console.log('Confirm Details - Final result:', result);
                        return result;
                      } catch (error) {
                        console.log('Confirm Details - Error caught:', error);
                        // Return original time if any error occurs
                        return bookingData.time;
                      }
                    })()}
                  </span>
                </div>
                {selectedServiceData?.duration && (
                  <div>
                    <span 
                      className="font-medium"
                      style={{ color: theme.primaryColor }}
                    >Duration: </span>
                    <span className="font-bold text-gray-900">
                      {(() => {
                        let totalDuration = selectedServiceData.duration;
                        selectedExtras.forEach(extraId => {
                          const extra = selectedServiceData.extras?.find(e => e.id === extraId);
                          if (extra) totalDuration += extra.duration || 30;
                        });
                        return totalDuration;
                      })()} <span className="text-xs text-gray-500">({formatMinutesToReadable((() => {
                        let totalDuration = selectedServiceData.duration;
                        selectedExtras.forEach(extraId => {
                          const extra = selectedServiceData.extras?.find(e => e.id === extraId);
                          if (extra) totalDuration += extra.duration || 30;
                        });
                        return totalDuration;
                      })())})</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Details and Pricing */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Service with Price */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-medium text-gray-900">
                      {selectedServiceData?.name}
                    </span>
                     <span className="text-lg font-bold text-green-600">
                       {formatPrice(selectedServiceData?.price || 0)}
                     </span>
                  </div>
                  
                  {/* Extras */}
                  {selectedExtras.length > 0 && selectedExtras.map(extraId => {
                    const extra = selectedServiceData?.extras?.find(e => e.id === extraId);
                    return extra ? (
                      <div key={extra.id} className="flex justify-between items-center py-1 text-gray-600">
                        <span>
                          {extra.name}
                        </span>
                        <span className="text-green-600">+{formatPrice(extra.price)}</span>
                      </div>
                    ) : null;
                  })}

                  {/* Tax */}
                  {applicableTaxes.length > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-red-600 font-medium">TAX</span>
                      <span className="text-red-600 font-bold">+{currency.symbol}{applicableTaxes.reduce((total, tax) => 
                        total + ((selectedServiceData?.price || 0) + selectedExtras.reduce((extraTotal, extraId) => {
                          const extra = selectedServiceData?.extras?.find(e => e.id === extraId);
                          return extraTotal + (extra?.price || 0);
                        }, 0)) * tax.amount / 100, 0).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Discount */}
                  {(availableCoupon || availableGiftcard) && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-orange-600 font-medium">Discount</span>
                      <span className="text-orange-600 font-bold">-{currency.symbol}{calculateDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                </div>


                {/* Coupon Input */}
                <div className="mt-6">
                  <div className="flex space-x-2">
                    <Input
                      value={bookingData.couponCode}
                      onChange={(e) => setBookingData({ ...bookingData, couponCode: e.target.value })}
                      placeholder="Coupon"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleCouponValidation}
                      style={{ backgroundColor: theme.completedColor }}
                      className="hover:opacity-90 text-white px-6"
                    >
                      OK
                    </Button>
                  </div>
                  
                  {/* Gift Card Input */}
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={giftcardCode}
                      onChange={(e) => setGiftcardCode(e.target.value)}
                      placeholder="Gift Card Code"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleGiftcardValidation}
                      style={{ backgroundColor: theme.completedColor }}
                      className="hover:opacity-90 text-white px-6"
                    >
                      OK
                    </Button>
                  </div>
                </div>

                {/* Total Price */}
                <div 
                  className="mt-6 rounded-lg p-4"
                  style={{ backgroundColor: `${theme.completedColor}20` }}
                >
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-lg font-medium"
                      style={{ color: theme.completedColor }}
                    >Total price</span>
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: theme.completedColor }}
                    >{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 8:
        const finalService = services.find(s => s.id === bookingData.service);
        const finalLocation = locations.find(l => l.id === bookingData.location);
        const finalStaff = staff.find(s => s.id === bookingData.staff);
        const finalTotal = calculateTotal();
        
        return (
          <div className="space-y-6 max-w-2xl mx-auto text-center">
            {/* Success Icon and Message */}
            <div className="space-y-4">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-green-100"
              >
                <CheckCircle 
                  className="w-8 h-8 text-green-600"
                />
              </div>
              
              <div className="space-y-2">
                <h2 
                  className="text-2xl font-bold text-black"
                >Booking Confirmed!</h2>
                <p className="text-gray-600">Your appointment has been successfully booked</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div 
              className="rounded-lg p-6 text-left"
              style={{ backgroundColor: `${theme.completedColor}15` }}
            >
              <h3 className="text-xl font-bold text-center mb-6">Appointment Details</h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold">{finalService?.name}</h4>
                  <p className="text-gray-600">{bookingData.date} at {(() => {
                    console.log('Confirmation - Time calculation debug:', {
                      bookingDataTime: bookingData.time,
                      finalService: finalService,
                      selectedExtras: selectedExtras,
                      
                    });
                    
                    if (!bookingData.time || !finalService?.duration) {
                      console.log('Confirmation - Early return: missing time or duration');
                      return bookingData.time;
                    }
                    
                    try {
                      // Validate time format (should be HH:mm)
                      console.log('Confirmation - Time format test:', !/^\d{1,2}:\d{2}$/.test(bookingData.time));
                      if (!/^\d{1,2}:\d{2}$/.test(bookingData.time)) {
                        console.log('Confirmation - Invalid time format');
                        return bookingData.time;
                      }
                      
                      // Calculate total duration including extras and group booking
                      let totalDuration = finalService.duration;
                      selectedExtras.forEach(extraId => {
                        const extra = finalService.extras?.find(e => e.id === extraId);
                        if (extra) totalDuration += extra.duration || 30;
                      });
                      
                      console.log('Confirmation - Total duration calculated:', totalDuration);
                      
                      // Parse start time and calculate end time
                      const startTime = parse(bookingData.time, 'HH:mm', new Date());
                      
                      // Check if parsing was successful
                      if (!isValid(startTime)) {
                        console.log('Confirmation - Invalid parsed time');
                        return bookingData.time;
                      }
                      
                      const endTime = addMinutes(startTime, totalDuration);
                      const result = `${bookingData.time} - ${format(endTime, 'HH:mm')}`;
                      
                      console.log('Confirmation - Final result:', result);
                      return result;
                    } catch (error) {
                      console.log('Confirmation - Error caught:', error);
                      // Return original time if any error occurs
                      return bookingData.time;
                    }
                  })()}</p>
                  <p className="text-gray-600">{finalLocation?.name}</p>
                  {finalStaff && finalStaff.id !== 'any' && (
                    <p className="text-gray-600">with {finalStaff.name}</p>
                  )}
                </div>
                
                <div className="text-center">
                  <p 
                    className="text-3xl font-bold"
                    style={{ color: theme.completedColor }}
                  >{currency.symbol}{finalTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>


            {/* Confirmation Message */}
            <div className="text-center text-gray-600">
              <p>A confirmation email has been sent to {bookingData.customerEmail}. You will receive a reminder 24 hours before your appointment.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <span className="text-gray-600">Add to calendar</span>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const startDate = new Date(`${bookingData.date}T${bookingData.time}`);
                    const endDate = new Date(startDate.getTime() + (finalService?.duration || 60) * 60000);
                    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(finalService?.name || 'Appointment')}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(`Appointment with ${theme.businessName}`)}`;
                    window.open(googleUrl, '_blank');
                  }}
                  className="h-10 w-10 p-1 hover:bg-gray-100 rounded-lg"
                  title="Add to Google Calendar"
                >
                  <img 
                    src="/lovable-uploads/23ced204-643c-4892-93e0-5298c2eefa5f.png" 
                    alt="Google Calendar" 
                    className="w-full h-full object-contain rounded"
                  />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const startDate = new Date(`${bookingData.date}T${bookingData.time}`);
                    const endDate = new Date(startDate.getTime() + (finalService?.duration || 60) * 60000);
                    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(finalService?.name || 'Appointment')}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(`Appointment with ${theme.businessName}`)}`;
                    window.open(outlookUrl, '_blank');
                  }}
                  className="h-10 w-10 p-1 hover:bg-gray-100 rounded-lg"
                  title="Add to Microsoft Outlook"
                >
                  <img 
                    src="/lovable-uploads/00503310-62db-4ba2-b071-0a966f4ac6bd.png" 
                    alt="Microsoft Outlook" 
                    className="w-full h-full object-contain rounded"
                  />
                </Button>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                className="px-8"
                onClick={() => window.location.href = '/customer-portal'}
              >
                See My bookings
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full">
        {/* Progress Bar */}
        {theme.showBookingProcess && (
          <div className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {steps.filter(step => step !== 'Service Extras' && (step !== 'Location' || locations.length > 1)).map((step, index) => {
                  // Calculate the actual step number considering the hidden steps
                  const actualIndex = steps.indexOf(step);
                  const displayNumber = actualIndex > 2 ? index + 1 : index + 1;
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white`}
                        style={{
                          backgroundColor: actualIndex + 1 <= currentStep ? (actualIndex + 1 === currentStep ? theme.activeColor : theme.completedColor) : '#e5e7eb'
                        }}
                      >
                        {displayNumber}
                      </div>
                      <span className="ml-2 text-sm font-medium hidden md:inline">{step}</span>
                      {index < steps.filter(s => s !== 'Service Extras' && (s !== 'Location' || locations.length > 1)).length - 1 && (
                        <div className="w-8 h-0.5 bg-gray-200 mx-4 hidden md:block" />
                      )}
                    </div>
                  );
                })}
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
          {currentStep < 8 && (
            <div className="flex justify-between mt-6">
              {currentStep > (locations.length === 1 ? 2 : 1) && (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
              )}
              <div className="ml-auto">
                {currentStep < 7 ? (
                  <Button 
                    onClick={handleNext}
                    disabled={!validateStep() || isSubmitting}
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleBookingSubmit} 
                    disabled={isSubmitting}
                    style={{ backgroundColor: theme.activeColor }}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;