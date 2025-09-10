
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useAppData, Tax } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

interface TaxFormProps {
  isOpen: boolean;
  onClose: () => void;
  tax?: Tax | null;
}

export const TaxForm = ({ isOpen, onClose, tax }: TaxFormProps) => {
  const { addTax, updateTax, locations, services } = useAppData();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    locationsFilter: 'all-locations',
    servicesFilter: 'all-services',
    incorporateIntoPrice: false,
    enabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tax) {
      setFormData({
        name: tax.name || '',
        amount: tax.amount?.toString() || '',
        locationsFilter: tax.locationsFilter || 'all-locations',
        servicesFilter: tax.servicesFilter || 'all-services',
        incorporateIntoPrice: tax.incorporateIntoPrice || false,
        enabled: tax.enabled ?? true,
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        locationsFilter: 'all-locations',
        servicesFilter: 'all-services',
        incorporateIntoPrice: false,
        enabled: true,
      });
    }
    setErrors({});
  }, [tax, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tax name is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Tax amount is required';
    } else {
      const amountValue = parseFloat(formData.amount);
      if (isNaN(amountValue) || amountValue < 0) {
        newErrors.amount = 'Tax amount must be a positive number';
      }
      if (amountValue > 100) {
        newErrors.amount = 'Tax amount cannot exceed 100%';
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
      const taxData = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        locationsFilter: formData.locationsFilter,
        servicesFilter: formData.servicesFilter,
        incorporateIntoPrice: formData.incorporateIntoPrice,
        enabled: formData.enabled,
      };

      if (tax) {
        updateTax(tax.id, taxData);
        toast.success('Tax updated successfully');
      } else {
        addTax(taxData);
        toast.success('Tax added successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save tax');
      console.error('Error saving tax:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">+</span>
                </div>
                <SheetTitle className="text-lg font-semibold">
                  {tax ? 'Edit Tax' : 'New Tax'}
                </SheetTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
              {/* Name and Amount Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Tax name"
                    className={errors.name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount (%) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0"
                      className={`pr-8 ${errors.amount ? 'border-red-500' : ''}`}
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                      %
                    </span>
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>
              </div>

              {/* Locations Filter */}
              <div className="space-y-2">
                <Label>Locations filter</Label>
                <Select 
                  value={formData.locationsFilter} 
                  onValueChange={(value) => handleInputChange('locationsFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-locations">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Services Filter */}
              <div className="space-y-2">
                <Label>Services filter</Label>
                <Select 
                  value={formData.servicesFilter} 
                  onValueChange={(value) => handleInputChange('servicesFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-services">All Services</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Incorporate Tax Toggle */}
              <div className="flex items-center justify-between py-4">
                <Label htmlFor="incorporate-tax" className="text-sm font-medium">
                  Incorporate Tax into the Service Price
                </Label>
                <Switch
                  id="incorporate-tax"
                  checked={formData.incorporateIntoPrice}
                  onCheckedChange={(checked) => handleInputChange('incorporateIntoPrice', checked)}
                />
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center space-x-3 pt-4">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                />
                <Label className="text-sm font-medium text-green-600">
                  Enabled
                </Label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                CANCEL
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {tax ? 'UPDATE' : 'CREATE'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
