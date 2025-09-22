import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, Download } from 'lucide-react';
import { useAppData, Appointment } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { InteractiveFormRenderer } from '@/components/forms/InteractiveFormRenderer';
import { convertCustomFieldsForSaving, createBlobFromBase64 } from '@/utils/fileHelper';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { formatMinutesToReadable } from '@/utils/timeFormatter';

interface AppointmentFormProps {
  onCancel: () => void;
  onSave: () => void;
  appointment?: Appointment;
  initialDate?: Date | null;
  initialTime?: string | null;
}

const AppointmentForm = ({ onCancel, onSave, appointment, initialDate, initialTime }: AppointmentFormProps) => {
  const [activeTab, setActiveTab] = useState('details');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [selectedGiftcards, setSelectedGiftcards] = useState<string[]>([]);
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
  const [appointmentData, setAppointmentData] = useState({
    locationId: '',
    serviceId: '',
    staffId: '',
    customerId: '',
    date: '',
    time: '',
    status: 'Pending' as 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled' | 'Rejected' | 'No-show' | 'Emergency',
    notes: '',
    
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({});
  const [customForms, setCustomForms] = useState<any[]>([]);
  const [customerFormResponses, setCustomerFormResponses] = useState<any[]>([]);

  const { 
    locations, 
    services, 
    staff, 
    customers, 
    coupons,
    giftcards,
    taxes,
    addAppointment,
    updateAppointment,
    getServiceById,
    getAvailableStaffForService,
    isStaffAvailable
  } = useAppData();

  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  // File download handler
  const handleFileDownload = (value: any) => {
    try {
      // Handle fresh File objects
      if (value?.file && value.file instanceof File) {
        const url = URL.createObjectURL(value.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = value.file.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Handle serialized file data (base64)
      if (value?.data && typeof value.data === 'string' && value.type) {
        const blob = createBlobFromBase64(value.data, value.type);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = value.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Handle saved files with URL
      if (value?.url || value?.fileUrl) {
        const fileUrl = value.url || value.fileUrl;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = value.name || value.filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      throw new Error('No valid file data found');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Unable to download file. File data may be corrupted.",
        variant: "destructive"
      });
    }
  };

  // Function to find proper field label by searching through custom forms
  const findFieldLabel = (fieldKey: string): string => {
    // First, check if the field exists in the current applicable form
    if (applicableForm) {
      const element = applicableForm.formElements.find((el: any) => el.id === fieldKey);
      if (element && element.label) {
        return element.label;
      }
    }

    // If not found, search through all available custom forms
    const foundElement = customForms.find((form: any) => 
      form.formElements.some((el: any) => el.id === fieldKey)
    )?.formElements.find((el: any) => el.id === fieldKey);

    if (foundElement && foundElement.label) {
      return foundElement.label;
    }

    // Fallback to formatted key name
    return fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1');
  };

  // Enhanced value renderer for custom fields (similar to FormResponseViewer)
  const renderResponseValue = (elementType: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-400">No response</span>;
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>;
    }

    if (Array.isArray(value)) {
      return <span className="text-sm">{value.join(', ')}</span>;
    }

    if (typeof value === 'object' && value.name) {
      // File upload object
      return (
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">{value.name}</span>
            {value.size && (
              <span className="text-xs text-slate-500">
                ({(value.size / 1024).toFixed(1)}KB)
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileDownload(value)}
            className="h-8 w-8 p-0"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (elementType === 'date' && value) {
      try {
        return <span className="text-sm">{new Date(value).toLocaleDateString()}</span>;
      } catch {
        return <span className="text-sm">{String(value)}</span>;
      }
    }

    if (elementType === 'time' && value) {
      return <span className="text-sm">{value}</span>;
    }

    if (elementType === 'email' && value) {
      return <span className="text-sm text-blue-600">{String(value)}</span>;
    }

    if (elementType === 'phone' && value) {
      return <span className="text-sm">{String(value)}</span>;
    }

    return <span className="text-sm">{String(value)}</span>;
  };

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return '';
    
    // If already in 24-hour format, return as is
    if (time12h.match(/^\d{2}:\d{2}$/)) {
      return time12h;
    }
    
    // Convert from 12-hour format (e.g., "2:30 PM") to 24-hour format (e.g., "14:30")
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else {
      hours = modifier === 'AM' ? hours.padStart(2, '0') : String(parseInt(hours, 10) + 12);
    }
    
    return `${hours}:${minutes}`;
  };

  // Load custom forms from localStorage
  useEffect(() => {
    const savedForms = JSON.parse(localStorage.getItem('customForms') || '[]');
    // Load form elements for each form
    const formsWithElements = savedForms.map((form: any) => {
      const formElements = JSON.parse(localStorage.getItem(`customForm_${form.id}`) || '[]');
      return {
        ...form,
        formElements
      };
    });
    setCustomForms(formsWithElements);
  }, []);

  // Load customer form responses when customer changes
  useEffect(() => {
    if (appointmentData.customerId) {
      const selectedCustomer = customers.find(c => c.id === appointmentData.customerId);
      if (selectedCustomer) {
        const allFormResponses = JSON.parse(localStorage.getItem('formResponses') || '[]');
        // Filter responses by customer email
        const customerResponses = allFormResponses.filter((response: any) => 
          response.customerEmail === selectedCustomer.email
        );
        
        // Enhance responses with form names
        const responsesWithFormNames = customerResponses.map((response: any) => {
          const form = customForms.find(f => f.id === response.formId);
          return {
            ...response,
            formName: form?.name || 'Unknown Form'
          };
        });
        
        setCustomerFormResponses(responsesWithFormNames);
      } else {
        setCustomerFormResponses([]);
      }
    } else {
      setCustomerFormResponses([]);
    }
  }, [appointmentData.customerId, customers, customForms]);

  // Initialize form with appointment data if editing, or with initial date/time if creating new
  useEffect(() => {
    console.log('AppointmentForm useEffect triggered', { appointment: !!appointment, initialDate, initialTime });
    
    if (appointment) {
      console.log('Processing existing appointment');
      // Safely convert appointment.date to Date object if it's a string
      const appointmentDate = appointment.date instanceof Date 
        ? appointment.date 
        : new Date(appointment.date);
      
      // Format date as YYYY-MM-DD without timezone conversion
      const year = appointmentDate.getFullYear();
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      console.log('Setting appointment data from existing appointment');
      setAppointmentData({
        locationId: appointment.locationId,
        serviceId: appointment.serviceId,
        staffId: appointment.staffId,
        customerId: appointment.customerId,
        date: localDateString,
        time: convertTo24Hour(appointment.time),
        status: appointment.status,
        notes: appointment.notes || '',
        
      });
      setSelectedExtras(appointment.selectedExtras || []);
      setSelectedCoupons(appointment.appliedCoupons || []);
      setSelectedGiftcards(appointment.appliedGiftcards || []);
      setSelectedTaxes(appointment.appliedTaxes || []);
      
      // Load custom field values from appointment
      // Split the saved custom fields into regular fields and dynamic fields
      const savedCustomFields = appointment.customFields || {};
      const regularFields: Record<string, any> = {};
      const dynamicFields: Record<string, any> = {};
      
      // Load custom forms to identify dynamic field IDs
      const savedForms = JSON.parse(localStorage.getItem('customForms') || '[]');
      const dynamicFieldIds: Set<string> = new Set();
      
      // Collect all dynamic field IDs from conditional rules
      savedForms.forEach((form: any) => {
        if (form.formElements) {
          form.formElements.forEach((element: any) => {
            if (element.conditionalRules) {
              element.conditionalRules.forEach((rule: any) => {
                if (rule.action === 'show_field' && rule.dynamicField) {
                  dynamicFieldIds.add(rule.dynamicField.id);
                }
              });
            }
          });
        }
      });
      
      // Split the saved fields based on whether they're dynamic fields or not
      Object.entries(savedCustomFields).forEach(([key, value]) => {
        if (dynamicFieldIds.has(key)) {
          dynamicFields[key] = value;
        } else {
          regularFields[key] = value;
        }
      });
      
      
      setCustomFieldValues(regularFields);
      setDynamicFieldValues(dynamicFields);
    } else if (initialDate || initialTime) {
      console.log('Processing initial date/time for new appointment');
      // Set initial date and time for new appointments created from calendar clicks
      // Format initial date as YYYY-MM-DD without timezone conversion
      let localDateString = '';
      if (initialDate) {
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        localDateString = `${year}-${month}-${day}`;
      }
      
      console.log('Setting appointment data with initial values', { localDateString, initialTime });
      setAppointmentData(prev => {
        console.log('setAppointmentData callback with prev:', prev);
        if (!prev) {
          console.error('prev is undefined in setAppointmentData callback');
          return {
            locationId: '',
            serviceId: '',
            staffId: '',
            customerId: '',
            date: localDateString || '',
            time: initialTime || '',
            status: 'Pending' as 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled' | 'Rejected' | 'No-show' | 'Emergency',
            notes: ''
          };
        }
        return {
          ...prev,
          date: localDateString || prev.date,
          time: initialTime || prev.time
        };
      });
    }
  }, [appointment, initialDate, initialTime]);

  // Get available staff based on selected service and location
  const availableStaff = appointmentData.serviceId && appointmentData.locationId
    ? getAvailableStaffForService(appointmentData.serviceId, appointmentData.locationId)
    : [];

  // Get selected service details
  const selectedService = getServiceById(appointmentData.serviceId);

  // Get applicable custom form based on selected service
  const getApplicableCustomForm = () => {
    if (!appointmentData.serviceId) return null;
    
    const selectedService = getServiceById(appointmentData.serviceId);
    if (!selectedService) return null;
    
    // Find a form that applies to this service's category or all services
    return customForms.find(form => {
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
  };

  const applicableForm = getApplicableCustomForm();

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };

  const updateCustomFieldValue = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const updateDynamicFieldValue = (fieldId: string, value: any) => {
    setDynamicFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const toggleCoupon = (couponId: string) => {
    setSelectedCoupons(prev => 
      prev.includes(couponId) 
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  const toggleGiftcard = (giftcardId: string) => {
    setSelectedGiftcards(prev => 
      prev.includes(giftcardId) 
        ? prev.filter(id => id !== giftcardId)
        : [...prev, giftcardId]
    );
  };

  const toggleTax = (taxId: string) => {
    setSelectedTaxes(prev => 
      prev.includes(taxId) 
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    );
  };

  const updateAppointmentData = (field: string, value: string) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset staff selection if service or location changes
    if (field === 'serviceId' || field === 'locationId') {
      setAppointmentData(prev => ({
        ...prev,
        staffId: ''
      }));
    }
  };

  const calculateTotalPrice = () => {
    let total = selectedService?.price || 0;
    
    // Add extras cost
    if (selectedService?.extras) {
      selectedExtras.forEach(extraId => {
        const extra = selectedService.extras.find(e => e.id === extraId);
        if (extra) {
          total += extra.price;
        }
      });
    }
    
    // Apply coupon discounts
    selectedCoupons.forEach(couponId => {
      const coupon = coupons.find(c => c.id === couponId);
      if (coupon && coupon.discount.startsWith('$')) {
        const discount = parseFloat(coupon.discount.replace('$', ''));
        total -= discount;
      } else if (coupon && coupon.discount.endsWith('%')) {
        const discountPercent = parseFloat(coupon.discount.replace('%', ''));
        total -= (total * discountPercent / 100);
      }
    });
    
    // Apply giftcard amounts (deduct from total)
    selectedGiftcards.forEach(giftcardId => {
      const giftcard = giftcards.find(g => g.id === giftcardId);
      if (giftcard && giftcard.isActive) {
        const availableAmount = Math.min(giftcard.leftover, total);
        total -= availableAmount;
      }
    });
    
    // Add taxes (applied to the subtotal after discounts but before giftcard deductions)
    let taxAmount = 0;
    selectedTaxes.forEach(taxId => {
      const tax = taxes.find(t => t.id === taxId);
      if (tax && tax.enabled) {
        taxAmount += tax.amount;
      }
    });
    total += taxAmount;
    
    return Math.max(0, total);
  };

  const validateForm = () => {
    if (!appointmentData.customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return false;
    }
    if (!appointmentData.staffId) {
      toast({
        title: "Error", 
        description: "Please select a staff member",
        variant: "destructive"
      });
      return false;
    }
    if (!appointmentData.serviceId) {
      toast({
        title: "Error",
        description: "Please select a service",
        variant: "destructive"
      });
      return false;
    }
    if (!appointmentData.locationId) {
      toast({
        title: "Error",
        description: "Please select a location",
        variant: "destructive"
      });
      return false;
    }
    if (!appointmentData.date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return false;
    }
    if (!appointmentData.time) {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check staff availability for new appointments or when time/date changes
    const appointmentDate = new Date(appointmentData.date);
    const serviceDuration = selectedService?.duration || 60;
    
    if (!appointment || 
        (appointment.date instanceof Date ? appointment.date.toISOString().split('T')[0] : new Date(appointment.date).toISOString().split('T')[0]) !== appointmentData.date ||
        appointment.time !== appointmentData.time ||
        appointment.staffId !== appointmentData.staffId) {
      
      if (!isStaffAvailable(appointmentData.staffId, appointmentDate, appointmentData.time, serviceDuration)) {
        toast({
          title: "Error",
          description: "Selected staff member is not available at this time",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      // Merge regular custom fields and dynamic fields before saving
      const mergedCustomFields = { ...customFieldValues, ...dynamicFieldValues };
      
      // Convert file objects to serializable format before saving
      const convertedCustomFields = await convertCustomFieldsForSaving(mergedCustomFields);

      const appointmentPayload = {
        customerId: appointmentData.customerId,
        staffId: appointmentData.staffId,
        serviceId: appointmentData.serviceId,
        locationId: appointmentData.locationId,
        date: appointmentDate,
        time: appointmentData.time,
        status: appointmentData.status,
        notes: appointmentData.notes,
        selectedExtras,
        appliedCoupons: selectedCoupons,
        appliedGiftcards: selectedGiftcards,
        appliedTaxes: selectedTaxes,
        customFields: convertedCustomFields,
        totalPrice: calculateTotalPrice(),
        
      };

      if (appointment) {
        updateAppointment(appointment.id, appointmentPayload);
        toast({
          title: "Success",
          description: "Appointment updated successfully"
        });
      } else {
        addAppointment(appointmentPayload);
        toast({
          title: "Success", 
          description: "Appointment created successfully"
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: "Failed to save appointment",
        variant: "destructive"
      });
    }
  };

  const ActionButtons = () => (
    <div className="flex justify-end space-x-3 p-4 border-t bg-white">
      <Button variant="outline" onClick={onCancel}>
        CANCEL
      </Button>
      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
        {appointment ? 'UPDATE' : 'SAVE'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="details">Appointment details</TabsTrigger>
                <TabsTrigger value="extras">Extras</TabsTrigger>
                <TabsTrigger value="custom">Custom fields</TabsTrigger>
                <TabsTrigger value="coupons">Coupons & Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                      Location <span className="text-red-500">*</span>
                    </Label>
                    <Select value={appointmentData.locationId} onValueChange={(value) => updateAppointmentData('locationId', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.length === 0 ? (
                          <SelectItem value="no-locations" disabled>No locations available</SelectItem>
                        ) : (
                          locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="service" className="text-sm font-medium text-slate-700">
                      Service <span className="text-red-500">*</span>
                    </Label>
                    <Select value={appointmentData.serviceId} onValueChange={(value) => updateAppointmentData('serviceId', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.length === 0 ? (
                          <SelectItem value="no-services" disabled>No services available</SelectItem>
                        ) : (
                          services.map((service) => (
                           <SelectItem key={service.id} value={service.id}>
                               {service.name} - {formatPrice(service.price)} ({formatMinutesToReadable(service.duration)})
                             </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="staff" className="text-sm font-medium text-slate-700">
                      Staff <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={appointmentData.staffId} 
                      onValueChange={(value) => updateAppointmentData('staffId', value)}
                      disabled={!appointmentData.serviceId || !appointmentData.locationId}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={
                          !appointmentData.serviceId || !appointmentData.locationId 
                            ? "Select service and location first" 
                            : availableStaff.length === 0
                            ? "No staff available for this service/location"
                            : "Select staff member"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaff.length === 0 ? (
                          <SelectItem value="no-staff" disabled>No staff available</SelectItem>
                        ) : (
                          availableStaff.map((staffMember) => (
                            <SelectItem key={staffMember.id} value={staffMember.id}>
                              {staffMember.name} - {staffMember.role}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                        Date <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        type="date" 
                        className="mt-1"
                        value={appointmentData.date}
                        onChange={(e) => updateAppointmentData('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-sm font-medium text-slate-700">
                        Time <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        type="time" 
                        className="mt-1"
                        value={appointmentData.time}
                        onChange={(e) => updateAppointmentData('time', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customer" className="text-sm font-medium text-slate-700">
                      Customer <span className="text-red-500">*</span>
                    </Label>
                    <Select value={appointmentData.customerId} onValueChange={(value) => updateAppointmentData('customerId', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="no-customers" disabled>No customers available</SelectItem>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.firstName} {customer.lastName} - {customer.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                      Status
                    </Label>
                    <Select value={appointmentData.status} onValueChange={(value: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled' | 'Rejected' | 'No-show' | 'Emergency') => updateAppointmentData('status', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">🕐 Pending</SelectItem>
                        <SelectItem value="Confirmed">✅ Confirmed</SelectItem>
                        <SelectItem value="Cancelled">❌ Cancelled</SelectItem>
                        <SelectItem value="Completed">✓ Completed</SelectItem>
                        <SelectItem value="Rescheduled">📅 Rescheduled</SelectItem>
                        <SelectItem value="Rejected">❌ Rejected</SelectItem>
                        <SelectItem value="No-show">👻 No-show</SelectItem>
                        <SelectItem value="Emergency">🚨 Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="note" className="text-sm font-medium text-slate-700">
                      Note
                    </Label>
                    <Textarea 
                      id="note"
                      className="mt-1 min-h-[120px] resize-none"
                      value={appointmentData.notes}
                      onChange={(e) => updateAppointmentData('notes', e.target.value)}
                      placeholder="Add any notes about this appointment..."
                    />
                  </div>
                </div>
                
                {/* Bottom padding for proper scrolling */}
                <div className="pb-6"></div>
                <ActionButtons />
              </TabsContent>

              <TabsContent value="extras" className="space-y-6 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">Service Extras</h3>
                  <div className="text-sm text-slate-500">
                    {selectedExtras.length} selected
                  </div>
                </div>
                
                {selectedService?.extras && selectedService.extras.length > 0 ? (
                  <div className="space-y-3">
                    {selectedService.extras.map((extra) => (
                      <div key={extra.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                        <Checkbox
                          checked={selectedExtras.includes(extra.id)}
                          onCheckedChange={() => toggleExtra(extra.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{extra.name}</div>
                          <div className="text-sm text-slate-500">{extra.description}</div>
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatPrice(extra.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {selectedService 
                      ? "No extras available for this service" 
                      : "Select a service to see available extras"
                    }
                  </div>
                )}
                
                {selectedExtras.length > 0 && selectedService && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">
                      Selected Extras ({selectedExtras.length})
                    </div>
                     <div className="text-sm text-blue-700 mt-1">
                       Total additional cost: {formatPrice(selectedService.extras
                         .filter(extra => selectedExtras.includes(extra.id))
                         .reduce((sum, extra) => sum + extra.price, 0))}
                     </div>
                  </div>
                )}

                
                {/* Bottom padding for proper scrolling */}
                <div className="pb-6"></div>
                <ActionButtons />
              </TabsContent>

              <TabsContent value="custom" className="space-y-6 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">Custom Fields</h3>
                  <div className="text-sm text-slate-500">
                    {applicableForm ? `Current form: ${applicableForm.name}` : 'No custom form for this service'}
                  </div>
                </div>

                
                {/* Current form for this appointment */}
                {applicableForm && applicableForm.formElements && (
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-slate-900 mb-4">Current Appointment Form</h4>
                  </div>
                )}
                
                {applicableForm && applicableForm.formElements ? (
                  <div className="space-y-6">
                    {appointment && Object.keys({ ...customFieldValues, ...dynamicFieldValues }).length > 0 ? (
                      // Show saved responses in a read-only format for existing appointments
                      <div className="space-y-4">
                        {applicableForm.formElements.map((element: any) => {
                          const value = customFieldValues[element.id] || dynamicFieldValues[element.id];
                          if (!value && value !== 0 && value !== false) return null;
                          
                          return (
                            <div key={element.id} className="border rounded-lg p-4 bg-gray-50">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                {element.label} {element.required && <span className="text-red-500">*</span>}
                              </Label>
                              <div className="text-sm text-gray-900 bg-white p-3 rounded border">
                                {renderResponseValue(element.type, value)}
                              </div>
                            </div>
                          );
                        })}
                        {/* Show other saved fields that might not be in the form structure */}
                        {Object.entries({ ...customFieldValues, ...dynamicFieldValues }).map(([key, value]) => {
                          // Skip if this field is already shown above
                          const isInFormElements = applicableForm.formElements.some((el: any) => el.id === key);
                          if (isInFormElements || !value) return null;
                          
                          return (
                            <div key={key} className="border rounded-lg p-4 bg-gray-50">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                {findFieldLabel(key)}
                              </Label>
                              <div className="text-sm text-gray-900 bg-white p-3 rounded border">
                                {renderResponseValue('text', value)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Show editable form for new appointments or when no data exists
                      applicableForm.formElements.map((element: any) => (
                        <InteractiveFormRenderer
                          key={element.id}
                          element={element}
                          value={customFieldValues[element.id]}
                          onChange={(value) => updateCustomFieldValue(element.id, value)}
                          formValues={customFieldValues}
                          allElements={applicableForm.formElements}
                          onDynamicFieldChange={updateDynamicFieldValue}
                          dynamicFieldValues={dynamicFieldValues}
                        />
                      ))
                    )}
                  </div>
                ) : appointmentData.serviceId ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No custom form available for this service category.</p>
                    <p className="text-sm mt-2">
                      {selectedService ? 
                        `Service category: ${selectedService.category}` : 
                        'Select a service to see available custom fields'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Select a service to see available custom fields</p>
                  </div>
                )}
                
                {/* Bottom padding for proper scrolling */}
                <div className="pb-6"></div>
                <ActionButtons />
              </TabsContent>

              <TabsContent value="coupons" className="space-y-6 mt-0">
                {/* Coupons Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900">Coupons</h3>
                    <div className="text-sm text-slate-500">
                      {selectedCoupons.length} selected
                    </div>
                  </div>
                  
                  {coupons.filter(c => c.status === 'Active').length > 0 ? (
                    <div className="space-y-3">
                      {coupons.filter(c => c.status === 'Active').map((coupon) => (
                        <div key={coupon.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                          <Checkbox
                            checked={selectedCoupons.includes(coupon.id)}
                            onCheckedChange={() => toggleCoupon(coupon.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{coupon.code}</div>
                            <div className="text-sm text-slate-500">
                              Usage: {coupon.timesUsed}/{coupon.usageLimit}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            {coupon.discount}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No active coupons available
                    </div>
                  )}
                </div>

                {/* Gift Cards Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900">Gift Cards</h3>
                    <div className="text-sm text-slate-500">
                      {selectedGiftcards.length} selected
                    </div>
                  </div>
                  
                  {giftcards.filter(g => g.isActive && g.leftover > 0).length > 0 ? (
                    <div className="space-y-3">
                      {giftcards.filter(g => g.isActive && g.leftover > 0).map((giftcard) => (
                        <div key={giftcard.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                          <Checkbox
                            checked={selectedGiftcards.includes(giftcard.id)}
                            onCheckedChange={() => toggleGiftcard(giftcard.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{giftcard.code}</div>
                            <div className="text-sm text-slate-500">
                              Available: {formatPrice(giftcard.leftover)} of {formatPrice(giftcard.balance)}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatPrice(giftcard.leftover)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No active gift cards with balance available
                    </div>
                  )}
                </div>

                {/* Taxes Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900">Taxes</h3>
                    <div className="text-sm text-slate-500">
                      {selectedTaxes.length} selected
                    </div>
                  </div>
                  
                  {taxes.filter(t => t.enabled).length > 0 ? (
                    <div className="space-y-3">
                      {taxes.filter(t => t.enabled).map((tax) => (
                        <div key={tax.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                          <Checkbox
                            checked={selectedTaxes.includes(tax.id)}
                            onCheckedChange={() => toggleTax(tax.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{tax.name}</div>
                            <div className="text-sm text-slate-500">
                              {tax.incorporateIntoPrice ? 'Included in price' : 'Added to total'}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-red-600">
                            {formatPrice(tax.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No active taxes available
                    </div>
                  )}
                </div>

                {/* Summary Section */}
                {(selectedCoupons.length > 0 || selectedGiftcards.length > 0 || selectedTaxes.length > 0) && (
                  <div className="space-y-3">
                    {selectedCoupons.length > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm font-medium text-green-800">
                          Selected Coupons ({selectedCoupons.length})
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                          Discounts will be applied to the final amount
                        </div>
                      </div>
                    )}
                    
                    {selectedGiftcards.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          Selected Gift Cards ({selectedGiftcards.length})
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          Gift card amounts will be deducted from total
                        </div>
                      </div>
                    )}
                    
                    {selectedTaxes.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm font-medium text-red-800">
                          Selected Taxes ({selectedTaxes.length})
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          Taxes will be added to the final amount
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Bottom padding for proper scrolling */}
                <div className="pb-6"></div>
                <ActionButtons />
              </TabsContent>
            </Tabs>

            {/* Price Summary */}
            {selectedService && (
              <div className="p-4 bg-gray-50 rounded-lg border mt-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Price:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(calculateTotalPrice())}
                  </span>
                </div>
                {selectedExtras.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {(() => {
                      const basePrice = selectedService.price;
                      const extrasPrice = selectedService.extras
                        .filter(extra => selectedExtras.includes(extra.id))
                        .reduce((sum, extra) => sum + extra.price, 0);
                      
                      return `Base: ${formatPrice(basePrice)}${extrasPrice > 0 ? ` + Extras: ${formatPrice(extrasPrice)}` : ''}`;
                    })()}
                  </div>
                )}
                {selectedCoupons.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Coupons applied: {selectedCoupons.length}
                  </div>
                )}
                {selectedGiftcards.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Gift cards applied: {selectedGiftcards.length}
                  </div>
                )}
                {selectedTaxes.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Taxes applied: {selectedTaxes.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AppointmentForm;
