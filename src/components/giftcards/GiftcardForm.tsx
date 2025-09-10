
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useAppData, Giftcard } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface GiftcardFormProps {
  isOpen: boolean;
  onClose: () => void;
  giftcard?: Giftcard | null;
}

export const GiftcardForm = ({ isOpen, onClose, giftcard }: GiftcardFormProps) => {
  const { addGiftcard, updateGiftcard, locations, services, staff } = useAppData();
  const { currency } = useCurrency();

  const [formData, setFormData] = useState({
    code: '',
    balance: '',
    locationFilter: 'all-locations',
    servicesFilter: 'all-services',
    staffFilter: 'all-staff',
    usageLimit: 'no-limit',
    oncePer: 'customer',
    isActive: true,
    expiresAt: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (giftcard) {
      setFormData({
        code: giftcard.code || '',
        balance: giftcard.balance?.toString() || '',
        locationFilter: giftcard.locationFilter || 'all-locations',
        servicesFilter: giftcard.servicesFilter || 'all-services',
        staffFilter: giftcard.staffFilter || 'all-staff',
        usageLimit: giftcard.usageLimit || 'no-limit',
        oncePer: giftcard.oncePer || 'customer',
        isActive: giftcard.isActive ?? true,
        expiresAt: giftcard.expiresAt ? giftcard.expiresAt.toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        code: '',
        balance: '',
        locationFilter: 'all-locations',
        servicesFilter: 'all-services',
        staffFilter: 'all-staff',
        usageLimit: 'no-limit',
        oncePer: 'customer',
        isActive: true,
        expiresAt: ''
      });
    }
    setErrors({});
  }, [giftcard, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Gift card code is required';
    }

    if (!formData.balance.trim()) {
      newErrors.balance = 'Balance amount is required';
    } else {
      const balanceValue = parseFloat(formData.balance);
      if (isNaN(balanceValue) || balanceValue <= 0) {
        newErrors.balance = 'Balance must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const giftcardData = {
        code: formData.code.trim().toUpperCase(),
        balance: parseFloat(formData.balance),
        originalAmount: parseFloat(formData.balance),
        locationFilter: formData.locationFilter,
        servicesFilter: formData.servicesFilter,
        staffFilter: formData.staffFilter,
        usageLimit: formData.usageLimit,
        oncePer: formData.oncePer,
        isActive: formData.isActive,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
      };

      if (giftcard) {
        updateGiftcard(giftcard.id, giftcardData);
        toast.success('Gift card updated successfully');
      } else {
        addGiftcard(giftcardData);
        toast.success('Gift card added successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save gift card');
      console.error('Error saving gift card:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('code', result);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {giftcard ? 'Edit Gift Card' : 'Add Gift Card'}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Enter gift card code"
                    className={errors.code ? 'border-red-500' : ''}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateRandomCode}
                    className="px-3"
                  >
                    Generate
                  </Button>
                </div>
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">
                  Balance ({currency.symbol}) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                  placeholder="0.00"
                  className={errors.balance ? 'border-red-500' : ''}
                  required
                />
                {errors.balance && (
                  <p className="text-sm text-red-600">{errors.balance}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationFilter">Location Filter</Label>
                <Select value={formData.locationFilter} onValueChange={(value) => handleInputChange('locationFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="all-locations">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servicesFilter">Services Filter</Label>
                <Select value={formData.servicesFilter} onValueChange={(value) => handleInputChange('servicesFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select services..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="all-services">All Services</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffFilter">Staff Filter</Label>
                <Select value={formData.staffFilter} onValueChange={(value) => handleInputChange('staffFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="all-staff">All Staff</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage limit</Label>
                <Select value={formData.usageLimit} onValueChange={(value) => handleInputChange('usageLimit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select usage limit..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="no-limit">No limit</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oncePer">Once per</Label>
                <Select value={formData.oncePer} onValueChange={(value) => handleInputChange('oncePer', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Status</Label>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${formData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </div>
            </form>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t bg-white">
            <Button type="button" variant="outline" onClick={onClose}>
              CANCEL
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSubmit}
            >
              {giftcard ? 'UPDATE GIFT CARD' : 'ADD GIFT CARD'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
