
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
    locationFilter: [] as string[],
    servicesFilter: [] as string[],
    staffFilter: [] as string[],
    usageLimit: 'no-limit',
    oncePer: 'customer',
    isActive: true,
    expiresAt: '',
    minimumPurchase: '',
    maxUsagePerTransaction: '',
    allowCombination: true,
    dailyLimit: '',
    monthlyLimit: '',
    categoryRestrictions: [] as string[],
    timeRestrictions: {
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      allowedHours: { start: '00:00', end: '23:59' },
      blockPeakHours: false
    },
    partialUsageRules: {
      allowPartialUse: true,
      minimumRemaining: ''
    },
    transferRules: {
      allowTransfer: false,
      maxTransferAmount: '',
      transferFee: ''
    },
    refundRules: {
      allowRefund: true,
      refundFeePercentage: '',
      refundDeadlineDays: '30'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter services and staff based on selected locations
  const filteredServices = useMemo(() => {
    if (formData.locationFilter.length === 0) return services; // Show all if no locations selected
    return services.filter(service => 
      locations.some(location => 
        formData.locationFilter.includes(location.id) && 
        location.serviceIds.includes(service.id)
      )
    );
  }, [services, locations, formData.locationFilter]);

  const filteredStaff = useMemo(() => {
    if (formData.locationFilter.length === 0 && formData.servicesFilter.length === 0) return staff; // Show all if nothing selected
    
    return staff.filter(member => {
      // Check location filter
      const locationMatch = formData.locationFilter.length === 0 || 
        formData.locationFilter.some(locationId => member.locations.includes(locationId));
      
      // Check service filter
      const serviceMatch = formData.servicesFilter.length === 0 || 
        formData.servicesFilter.some(serviceId => member.services.includes(serviceId));
      
      return locationMatch && serviceMatch;
    });
  }, [staff, formData.locationFilter, formData.servicesFilter]);

  const handleMultiSelectChange = (field: 'locationFilter' | 'servicesFilter' | 'staffFilter', value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value);
      
      // If changing locations, reset services and staff filters to maintain consistency
      if (field === 'locationFilter') {
        return {
          ...prev,
          [field]: newValues,
          servicesFilter: [],
          staffFilter: []
        };
      }
      
      // If changing services, reset staff filter to maintain consistency
      if (field === 'servicesFilter') {
        return {
          ...prev,
          [field]: newValues,
          staffFilter: []
        };
      }
      
      return { ...prev, [field]: newValues };
    });
  };

  useEffect(() => {
    if (giftcard) {
      setFormData({
        code: giftcard.code || '',
        balance: giftcard.balance?.toString() || '',
        locationFilter: Array.isArray(giftcard.locationFilter) ? giftcard.locationFilter : (giftcard.locationFilter === 'all-locations' ? [] : [giftcard.locationFilter]),
        servicesFilter: Array.isArray(giftcard.servicesFilter) ? giftcard.servicesFilter : (giftcard.servicesFilter === 'all-services' ? [] : [giftcard.servicesFilter]),
        staffFilter: Array.isArray(giftcard.staffFilter) ? giftcard.staffFilter : (giftcard.staffFilter === 'all-staff' ? [] : [giftcard.staffFilter]),
        usageLimit: giftcard.usageLimit || 'no-limit',
        oncePer: giftcard.oncePer || 'customer',
        isActive: giftcard.isActive ?? true,
        expiresAt: giftcard.expiresAt ? (giftcard.expiresAt instanceof Date ? giftcard.expiresAt.toISOString().split('T')[0] : new Date(giftcard.expiresAt).toISOString().split('T')[0]) : '',
        minimumPurchase: giftcard.minimumPurchase?.toString() || '',
        maxUsagePerTransaction: giftcard.maxUsagePerTransaction?.toString() || '',
        allowCombination: giftcard.allowCombination ?? true,
        dailyLimit: giftcard.dailyLimit?.toString() || '',
        monthlyLimit: giftcard.monthlyLimit?.toString() || '',
        categoryRestrictions: giftcard.categoryRestrictions || [],
        timeRestrictions: giftcard.timeRestrictions || {
          allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          allowedHours: { start: '00:00', end: '23:59' },
          blockPeakHours: false
        },
        partialUsageRules: {
          allowPartialUse: giftcard.partialUsageRules?.allowPartialUse ?? true,
          minimumRemaining: giftcard.partialUsageRules?.minimumRemaining?.toString() || ''
        },
        transferRules: {
          allowTransfer: giftcard.transferRules?.allowTransfer ?? false,
          maxTransferAmount: giftcard.transferRules?.maxTransferAmount?.toString() || '',
          transferFee: giftcard.transferRules?.transferFee?.toString() || ''
        },
        refundRules: {
          allowRefund: giftcard.refundRules?.allowRefund ?? true,
          refundFeePercentage: giftcard.refundRules?.refundFeePercentage?.toString() || '',
          refundDeadlineDays: giftcard.refundRules?.refundDeadlineDays?.toString() || '30'
        }
      });
    } else {
      setFormData({
        code: '',
        balance: '',
        locationFilter: [],
        servicesFilter: [],
        staffFilter: [],
        usageLimit: 'no-limit',
        oncePer: 'customer',
        isActive: true,
        expiresAt: '',
        minimumPurchase: '',
        maxUsagePerTransaction: '',
        allowCombination: true,
        dailyLimit: '',
        monthlyLimit: '',
        categoryRestrictions: [],
        timeRestrictions: {
          allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          allowedHours: { start: '00:00', end: '23:59' },
          blockPeakHours: false
        },
        partialUsageRules: {
          allowPartialUse: true,
          minimumRemaining: ''
        },
        transferRules: {
          allowTransfer: false,
          maxTransferAmount: '',
          transferFee: ''
        },
        refundRules: {
          allowRefund: true,
          refundFeePercentage: '',
          refundDeadlineDays: '30'
        }
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

    // Validate numeric fields
    if (formData.minimumPurchase && formData.minimumPurchase.trim()) {
      const minPurchase = parseFloat(formData.minimumPurchase);
      if (isNaN(minPurchase) || minPurchase < 0) {
        newErrors.minimumPurchase = 'Minimum purchase must be a positive number';
      }
    }

    if (formData.maxUsagePerTransaction && formData.maxUsagePerTransaction.trim()) {
      const maxUsage = parseFloat(formData.maxUsagePerTransaction);
      if (isNaN(maxUsage) || maxUsage <= 0) {
        newErrors.maxUsagePerTransaction = 'Maximum usage per transaction must be a positive number';
      }
    }

    if (formData.dailyLimit && formData.dailyLimit.trim()) {
      const dailyLimit = parseFloat(formData.dailyLimit);
      if (isNaN(dailyLimit) || dailyLimit <= 0) {
        newErrors.dailyLimit = 'Daily limit must be a positive number';
      }
    }

    if (formData.monthlyLimit && formData.monthlyLimit.trim()) {
      const monthlyLimit = parseFloat(formData.monthlyLimit);
      if (isNaN(monthlyLimit) || monthlyLimit <= 0) {
        newErrors.monthlyLimit = 'Monthly limit must be a positive number';
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
        locationFilter: formData.locationFilter.length === 0 ? 'all-locations' : formData.locationFilter,
        servicesFilter: formData.servicesFilter.length === 0 ? 'all-services' : formData.servicesFilter,
        staffFilter: formData.staffFilter.length === 0 ? 'all-staff' : formData.staffFilter,
        usageLimit: formData.usageLimit,
        oncePer: formData.oncePer,
        isActive: formData.isActive,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
        minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : undefined,
        maxUsagePerTransaction: formData.maxUsagePerTransaction ? parseFloat(formData.maxUsagePerTransaction) : undefined,
        allowCombination: formData.allowCombination,
        dailyLimit: formData.dailyLimit ? parseFloat(formData.dailyLimit) : undefined,
        monthlyLimit: formData.monthlyLimit ? parseFloat(formData.monthlyLimit) : undefined,
        categoryRestrictions: formData.categoryRestrictions,
        timeRestrictions: formData.timeRestrictions,
        partialUsageRules: {
          ...formData.partialUsageRules,
          minimumRemaining: formData.partialUsageRules.minimumRemaining ? parseFloat(formData.partialUsageRules.minimumRemaining) : undefined
        },
        transferRules: {
          ...formData.transferRules,
          maxTransferAmount: formData.transferRules.maxTransferAmount ? parseFloat(formData.transferRules.maxTransferAmount) : undefined,
          transferFee: formData.transferRules.transferFee ? parseFloat(formData.transferRules.transferFee) : undefined
        },
        refundRules: {
          ...formData.refundRules,
          refundFeePercentage: formData.refundRules.refundFeePercentage ? parseFloat(formData.refundRules.refundFeePercentage) : undefined,
          refundDeadlineDays: formData.refundRules.refundDeadlineDays ? parseInt(formData.refundRules.refundDeadlineDays) : undefined
        }
      };

      if (giftcard) {
        updateGiftcard(giftcard.id, giftcardData);
        toast.success('Gift card updated successfully');
      } else {
        addGiftcard(giftcardData);
        toast.success('Gift card added successfully');
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save gift card');
      console.error('Error saving gift card:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | object) => {
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
                <Label>Location Filter</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={formData.locationFilter.includes(location.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('locationFilter', location.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`location-${location.id}`} className="text-sm font-normal">
                        {location.name}
                      </Label>
                    </div>
                  ))}
                  {formData.locationFilter.length === 0 && (
                    <p className="text-xs text-muted-foreground">No locations selected - applies to all locations</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Services Filter</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.servicesFilter.includes(service.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('servicesFilter', service.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm font-normal">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                  {filteredServices.length === 0 && formData.locationFilter.length > 0 && (
                    <p className="text-xs text-muted-foreground">No services available for selected locations</p>
                  )}
                  {formData.servicesFilter.length === 0 && (
                    <p className="text-xs text-muted-foreground">No services selected - applies to all services</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Staff Filter</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {filteredStaff.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`staff-${member.id}`}
                        checked={formData.staffFilter.includes(member.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('staffFilter', member.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`staff-${member.id}`} className="text-sm font-normal">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                  {filteredStaff.length === 0 && (formData.locationFilter.length > 0 || formData.servicesFilter.length > 0) && (
                    <p className="text-xs text-muted-foreground">No staff available for selected filters</p>
                  )}
                  {formData.staffFilter.length === 0 && (
                    <p className="text-xs text-muted-foreground">No staff selected - applies to all staff</p>
                  )}
                </div>
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

              {/* Enhanced Business Logic Fields */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Enhanced Business Rules</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="minimumPurchase">Minimum Purchase Amount ({currency.symbol})</Label>
                  <Input
                    id="minimumPurchase"
                    type="number"
                    step="0.01"
                    value={formData.minimumPurchase}
                    onChange={(e) => handleInputChange('minimumPurchase', e.target.value)}
                    placeholder="0.00"
                    className={errors.minimumPurchase ? 'border-red-500' : ''}
                  />
                  {errors.minimumPurchase && (
                    <p className="text-sm text-red-600">{errors.minimumPurchase}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsagePerTransaction">Max Usage Per Transaction ({currency.symbol})</Label>
                  <Input
                    id="maxUsagePerTransaction"
                    type="number"
                    step="0.01"
                    value={formData.maxUsagePerTransaction}
                    onChange={(e) => handleInputChange('maxUsagePerTransaction', e.target.value)}
                    placeholder="0.00"
                    className={errors.maxUsagePerTransaction ? 'border-red-500' : ''}
                  />
                  {errors.maxUsagePerTransaction && (
                    <p className="text-sm text-red-600">{errors.maxUsagePerTransaction}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowCombination">Allow Combination with Other Gift Cards</Label>
                  <Switch
                    id="allowCombination"
                    checked={formData.allowCombination}
                    onCheckedChange={(checked) => handleInputChange('allowCombination', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Spending Limit ({currency.symbol})</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    step="0.01"
                    value={formData.dailyLimit}
                    onChange={(e) => handleInputChange('dailyLimit', e.target.value)}
                    placeholder="0.00"
                    className={errors.dailyLimit ? 'border-red-500' : ''}
                  />
                  {errors.dailyLimit && (
                    <p className="text-sm text-red-600">{errors.dailyLimit}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit">Monthly Spending Limit ({currency.symbol})</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    step="0.01"
                    value={formData.monthlyLimit}
                    onChange={(e) => handleInputChange('monthlyLimit', e.target.value)}
                    placeholder="0.00"
                    className={errors.monthlyLimit ? 'border-red-500' : ''}
                  />
                  {errors.monthlyLimit && (
                    <p className="text-sm text-red-600">{errors.monthlyLimit}</p>
                  )}
                </div>
              </div>

              {/* Partial Usage Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Partial Usage Rules</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowPartialUse">Allow Partial Use</Label>
                  <Switch
                    id="allowPartialUse"
                    checked={formData.partialUsageRules.allowPartialUse}
                    onCheckedChange={(checked) => handleInputChange('partialUsageRules', { ...formData.partialUsageRules, allowPartialUse: checked })}
                  />
                </div>

                {formData.partialUsageRules.allowPartialUse && (
                  <div className="space-y-2">
                    <Label htmlFor="minimumRemaining">Minimum Remaining Balance ({currency.symbol})</Label>
                    <Input
                      id="minimumRemaining"
                      type="number"
                      step="0.01"
                      value={formData.partialUsageRules.minimumRemaining}
                      onChange={(e) => handleInputChange('partialUsageRules', { ...formData.partialUsageRules, minimumRemaining: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Transfer Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Transfer Rules</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowTransfer">Allow Balance Transfer</Label>
                  <Switch
                    id="allowTransfer"
                    checked={formData.transferRules.allowTransfer}
                    onCheckedChange={(checked) => handleInputChange('transferRules', { ...formData.transferRules, allowTransfer: checked })}
                  />
                </div>

                {formData.transferRules.allowTransfer && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="maxTransferAmount">Max Transfer Amount ({currency.symbol})</Label>
                      <Input
                        id="maxTransferAmount"
                        type="number"
                        step="0.01"
                        value={formData.transferRules.maxTransferAmount}
                        onChange={(e) => handleInputChange('transferRules', { ...formData.transferRules, maxTransferAmount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transferFee">Transfer Fee ({currency.symbol})</Label>
                      <Input
                        id="transferFee"
                        type="number"
                        step="0.01"
                        value={formData.transferRules.transferFee}
                        onChange={(e) => handleInputChange('transferRules', { ...formData.transferRules, transferFee: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Refund Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Refund Rules</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRefund">Allow Refunds</Label>
                  <Switch
                    id="allowRefund"
                    checked={formData.refundRules.allowRefund}
                    onCheckedChange={(checked) => handleInputChange('refundRules', { ...formData.refundRules, allowRefund: checked })}
                  />
                </div>

                {formData.refundRules.allowRefund && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="refundFeePercentage">Refund Fee (%)</Label>
                      <Input
                        id="refundFeePercentage"
                        type="number"
                        step="0.01"
                        value={formData.refundRules.refundFeePercentage}
                        onChange={(e) => handleInputChange('refundRules', { ...formData.refundRules, refundFeePercentage: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refundDeadlineDays">Refund Deadline (Days)</Label>
                      <Input
                        id="refundDeadlineDays"
                        type="number"
                        value={formData.refundRules.refundDeadlineDays}
                        onChange={(e) => handleInputChange('refundRules', { ...formData.refundRules, refundDeadlineDays: e.target.value })}
                        placeholder="30"
                      />
                    </div>
                  </>
                )}
               </div>
          
          <div className="flex justify-end pt-4 border-t mt-6">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSubmit}
            >
              {giftcard ? 'UPDATE GIFT CARD' : 'ADD GIFT CARD'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
