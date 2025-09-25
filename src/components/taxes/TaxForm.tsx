
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
  const { addTax, updateTax, locations, services, checkTaxNameExists } = useAppData();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    locationsFilter: 'all-locations',
    servicesFilter: 'all-services',
    incorporateIntoPrice: false,
    enabled: true,
    taxType: 'sales-tax' as 'vat' | 'sales-tax' | 'service-tax' | 'other',
    minimumAmount: '',
    maximumAmount: '',
    applyToDiscountedPrice: true,
    description: '',
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
        taxType: tax.taxType || 'sales-tax',
        minimumAmount: tax.minimumAmount?.toString() || '',
        maximumAmount: tax.maximumAmount?.toString() || '',
        applyToDiscountedPrice: tax.applyToDiscountedPrice ?? true,
        description: tax.description || '',
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        locationsFilter: 'all-locations',
        servicesFilter: 'all-services',
        incorporateIntoPrice: false,
        enabled: true,
        taxType: 'sales-tax',
        minimumAmount: '',
        maximumAmount: '',
        applyToDiscountedPrice: true,
        description: '',
      });
    }
    setErrors({});
  }, [tax, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tax name is required';
    } else if (checkTaxNameExists(formData.name, tax?.id)) {
      newErrors.name = 'A tax with this name already exists';
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

    // Validate minimum amount
    if (formData.minimumAmount && formData.minimumAmount.trim()) {
      const minValue = parseFloat(formData.minimumAmount);
      if (isNaN(minValue) || minValue < 0) {
        newErrors.minimumAmount = 'Minimum amount must be a positive number';
      }
    }

    // Validate maximum amount
    if (formData.maximumAmount && formData.maximumAmount.trim()) {
      const maxValue = parseFloat(formData.maximumAmount);
      if (isNaN(maxValue) || maxValue < 0) {
        newErrors.maximumAmount = 'Maximum amount must be a positive number';
      }
      
      // Check if max is greater than min
      if (formData.minimumAmount && formData.minimumAmount.trim()) {
        const minValue = parseFloat(formData.minimumAmount);
        if (!isNaN(minValue) && maxValue <= minValue) {
          newErrors.maximumAmount = 'Maximum amount must be greater than minimum amount';
        }
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
        taxType: formData.taxType,
        minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : undefined,
        maximumAmount: formData.maximumAmount ? parseFloat(formData.maximumAmount) : undefined,
        applyToDiscountedPrice: formData.applyToDiscountedPrice,
        description: formData.description.trim(),
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

  const getTaxTypeLabel = (type: string) => {
    switch (type) {
      case 'vat': return 'VAT (Value Added Tax)';
      case 'sales-tax': return 'Sales Tax';
      case 'service-tax': return 'Service Tax';
      case 'other': return 'Other Tax';
      default: return 'Sales Tax';
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
            <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
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

              {/* Tax Type */}
              <div className="space-y-2">
                <Label>Tax Type</Label>
                <Select 
                  value={formData.taxType} 
                  onValueChange={(value) => handleInputChange('taxType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vat">VAT (Value Added Tax)</SelectItem>
                    <SelectItem value="sales-tax">Sales Tax</SelectItem>
                    <SelectItem value="service-tax">Service Tax</SelectItem>
                    <SelectItem value="other">Other Tax</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional tax description"
                />
              </div>

              {/* Min/Max Amount Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Amount</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    value={formData.minimumAmount}
                    onChange={(e) => handleInputChange('minimumAmount', e.target.value)}
                    placeholder="0.00"
                    className={errors.minimumAmount ? 'border-red-500' : ''}
                  />
                  {errors.minimumAmount && (
                    <p className="text-sm text-red-600">{errors.minimumAmount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Maximum Amount</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.01"
                    value={formData.maximumAmount}
                    onChange={(e) => handleInputChange('maximumAmount', e.target.value)}
                    placeholder="No limit"
                    className={errors.maximumAmount ? 'border-red-500' : ''}
                  />
                  {errors.maximumAmount && (
                    <p className="text-sm text-red-600">{errors.maximumAmount}</p>
                  )}
                </div>
              </div>

              {/* Incorporate Tax Toggle */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="incorporate-tax" className="text-sm font-medium">
                  Incorporate Tax into the Service Price
                </Label>
                <Switch
                  id="incorporate-tax"
                  checked={formData.incorporateIntoPrice}
                  onCheckedChange={(checked) => handleInputChange('incorporateIntoPrice', checked)}
                />
              </div>

              {/* Apply to Discounted Price Toggle */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="apply-discount" className="text-sm font-medium">
                  Apply Tax to Discounted Price
                </Label>
                <Switch
                  id="apply-discount"
                  checked={formData.applyToDiscountedPrice}
                  onCheckedChange={(checked) => handleInputChange('applyToDiscountedPrice', checked)}
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
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
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
