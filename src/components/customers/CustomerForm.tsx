
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppData, Customer } from '@/contexts/AppDataContext';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { EmailInput } from '@/components/ui/email-input';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

export const CustomerForm = ({ isOpen, onClose, customer }: CustomerFormProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
        allowLogin: true,
        portalLockEnabled: false,
    image: '',
    gender: '',
    dateOfBirth: undefined as Date | undefined,
    note: ''
  });

  const { addCustomer, updateCustomer, deleteCustomer, getCustomerAppointments, appointments, customers } = useAppData();

  // Portal lock helper functions
  const getPortalLockSettings = (email: string) => {
    if (!email) return { enabled: false };
    try {
      const stored = localStorage.getItem(`portalLock_${email}`);
      return stored ? JSON.parse(stored) : { enabled: false };
    } catch {
      return { enabled: false };
    }
  };

  // Check if customer has set up portal lock password
  const hasCustomerSetPortalLockPassword = (email: string) => {
    if (!email) return false;
    const customerPortalLockPassword = localStorage.getItem(`portal_lock_${email.toLowerCase()}`);
    const customerPortalLockEnabled = localStorage.getItem(`portal_lock_enabled_${email.toLowerCase()}`) === 'true';
    return customerPortalLockEnabled && customerPortalLockPassword && customerPortalLockPassword.trim() !== '';
  };

  const updatePortalLockSettings = (email: string, enabled: boolean) => {
    if (!email) return;
    try {
      const currentSettings = getPortalLockSettings(email);
      const newSettings = { ...currentSettings, enabled };
      localStorage.setItem(`portalLock_${email}`, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to update portal lock settings:', error);
    }
  };

  // Function to auto-fill form from recent "First Visit Customer Form" responses
  const getAutoFillDataFromFirstVisitForm = () => {
    // Get recent appointments with custom form data, sorted by most recent first
    const recentAppointments = appointments
      .filter(apt => apt.customFields && Object.keys(apt.customFields).length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const appointment of recentAppointments) {
      const customFields = appointment.customFields || {};
      
      // Look for "First Visit Customer Form" indicators in the form data
      // This could be a field that indicates it's a first visit form, or just check for customer data
      const hasFirstVisitData = Object.keys(customFields).some(key => 
        key.toLowerCase().includes('first') || 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('email')
      );

      if (hasFirstVisitData) {
        // Extract customer info from custom fields using common field names/variations
        const firstName = customFields.firstName || customFields['First Name'] || customFields.firstname || '';
        const lastName = customFields.lastName || customFields['Last Name'] || customFields.lastname || '';
        const email = customFields.email || customFields['Email'] || '';
        const phone = customFields.phone || customFields['Phone'] || customFields.phoneNumber || '';
        const gender = customFields.gender || customFields['Gender'] || '';
        const dateOfBirth = customFields.dateOfBirth || customFields['Date of Birth'] || '';
        const note = customFields.note || customFields['Note'] || customFields.notes || '';

        // Only return if we have meaningful customer data (at least first name, last name, or email)
        if ((firstName && lastName) || email) {
          // Check if a customer with this email already exists to avoid duplicates
          if (email) {
            const existingCustomer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
            if (existingCustomer) {
              continue; // Skip this data as customer already exists
            }
          }

          return {
            firstName: firstName || '',
            lastName: lastName || '',
            email: email || '',
            phone: phone || '',
            gender: gender || '',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            note: note || ''
          };
        }
      }
    }
    
    return null;
  };

  useEffect(() => {
    if (customer) {
      const portalLockSettings = getPortalLockSettings(customer.email);
      // Use saved setting from localStorage, or default to enabled if customer has password set up
      const defaultPortalLockEnabled = portalLockSettings.enabled !== undefined ? portalLockSettings.enabled : hasCustomerSetPortalLockPassword(customer.email);
      
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        allowLogin: customer.allowLogin || false,
        portalLockEnabled: defaultPortalLockEnabled,
        image: customer.image || '',
        gender: customer.gender || '',
        dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : undefined,
        note: customer.note || ''
      });
    } else {
      // Try to auto-fill from recent form submissions
      const autoFillData = getAutoFillDataFromFirstVisitForm();
      
      if (autoFillData) {
        // Check if this email has portal lock password set up
        const defaultPortalLockEnabled = hasCustomerSetPortalLockPassword(autoFillData.email);
        
        setFormData({
          firstName: autoFillData.firstName,
          lastName: autoFillData.lastName,
          email: autoFillData.email,
          phone: autoFillData.phone,
          allowLogin: true,
          portalLockEnabled: defaultPortalLockEnabled,
          image: '',
          gender: autoFillData.gender,
          dateOfBirth: autoFillData.dateOfBirth,
          note: autoFillData.note
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          allowLogin: true,
          portalLockEnabled: false,
          image: '',
          gender: '',
          dateOfBirth: undefined,
          note: ''
        });
      }
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    const customerData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      allowLogin: formData.allowLogin,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      note: formData.note
    };

    if (customer) {
      updateCustomer(customer.id, customerData);
      // Update portal lock settings
      updatePortalLockSettings(formData.email, formData.portalLockEnabled);
    } else {
      addCustomer(customerData);
      // Set initial portal lock settings for new customer
      updatePortalLockSettings(formData.email, formData.portalLockEnabled);
    }
    
    onClose();
    // Reset form for next use
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      allowLogin: true,
      portalLockEnabled: false,
      image: '',
      gender: '',
      dateOfBirth: undefined,
      note: ''
    });
  };

  const handleDelete = () => {
    if (customer && confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customer.id);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Save Portal Lock changes immediately to localStorage
    if (field === 'portalLockEnabled' && formData.email) {
      updatePortalLockSettings(formData.email, value);
    }
  };

  const customerAppointments = customer ? getCustomerAppointments(customer.id) : [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <SheetTitle className="text-xl font-semibold">
                {customer ? 'Edit Customer' : 'Add Customer'}
              </SheetTitle>
            </div>
            {customer && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Appointments ({customerAppointments.length})
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email and Phone */}
          <div className="space-y-4">
            <EmailInput
              label="Email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              placeholder="example@gmail.com"
              required
              className="w-full"
            />
            <InternationalPhoneInput
              label="Phone"
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              className="w-full"
            />
          </div>

          {/* Allow Login Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="allowLogin" className="text-sm font-medium">Allow to log in</Label>
            <Switch
              id="allowLogin"
              checked={formData.allowLogin}
              onCheckedChange={(checked) => handleInputChange('allowLogin', checked)}
            />
          </div>

          {/* Portal Lock Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="portalLockEnabled" className="text-sm font-medium">Portal Lock</Label>
              <p className="text-xs text-gray-500">
                {hasCustomerSetPortalLockPassword(formData.email) 
                  ? "Require password for customer portal access" 
                  : "Customer must set up portal lock password first"
                }
              </p>
            </div>
            <Switch
              id="portalLockEnabled"
              checked={formData.portalLockEnabled}
              onCheckedChange={(checked) => handleInputChange('portalLockEnabled', checked)}
              disabled={!formData.allowLogin || !hasCustomerSetPortalLockPassword(formData.email)}
            />
          </div>
          
          {formData.email && !hasCustomerSetPortalLockPassword(formData.email) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Portal Lock Not Available</p>
                  <p>The customer needs to enable portal lock in their Customer Portal before you can manage this setting.</p>
                </div>
              </div>
            </div>
          )}


          {/* Gender and Date of Birth */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth ? format(formData.dateOfBirth, "yyyy-MM-dd") : ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
                placeholder="YYYY/mm/dd"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium">Note</Label>
            <Textarea
              id="note"
              rows={4}
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
            />
          </div>

          {/* Customer Stats (for existing customers) */}
          {customer && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Appointments:</span>
                  <div className="font-medium">{customerAppointments.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Customer Since:</span>
                  <div className="font-medium">
                    {customerAppointments.length > 0 
                      ? format(new Date(customerAppointments[0].date), 'MMM yyyy')
                      : 'No appointments yet'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-6">
            <div>
              {customer && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  DELETE CUSTOMER
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                CANCEL
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {customer ? 'UPDATE' : 'SAVE'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
