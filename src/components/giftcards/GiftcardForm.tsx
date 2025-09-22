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
        locationFilter: 'all-locations',
        servicesFilter: 'all-services',
        staffFilter: 'all-staff',
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
        locationFilter: formData.locationFilter,
        servicesFilter: formData.servicesFilter,
        staffFilter: formData.staffFilter,
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
      <SheetContent className="w-[400px] sm:w-[400px] p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">
                {giftcard ? 'Edit Gift Card' : 'Add Gift Card'}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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

              {/* Enhanced Business Logic Fields */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900">Enhanced Business Rules</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="minimumPurchase">Minimum Purchase Amount</Label>
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
                  <Label htmlFor="maxUsagePerTransaction">Maximum Usage per Transaction</Label>
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
                  <Label htmlFor="allowCombination">Allow combination with other offers</Label>
                  <Switch
                    id="allowCombination"
                    checked={formData.allowCombination}
                    onCheckedChange={(checked) => handleInputChange('allowCombination', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Usage Limit</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    step="0.01"
                    value={formData.dailyLimit}
                    onChange={(e) => handleInputChange('dailyLimit', e.target.value)}
                    placeholder="No limit"
                    className={errors.dailyLimit ? 'border-red-500' : ''}
                  />
                  {errors.dailyLimit && (
                    <p className="text-sm text-red-600">{errors.dailyLimit}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit">Monthly Usage Limit</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    step="0.01"
                    value={formData.monthlyLimit}
                    onChange={(e) => handleInputChange('monthlyLimit', e.target.value)}
                    placeholder="No limit"
                    className={errors.monthlyLimit ? 'border-red-500' : ''}
                  />
                  {errors.monthlyLimit && (
                    <p className="text-sm text-red-600">{errors.monthlyLimit}</p>
                  )}
                </div>
              </div>

              {/* Partial Usage Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900">Partial Usage Rules</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowPartialUse">Allow Partial Use</Label>
                  <Switch
                    id="allowPartialUse"
                    checked={formData.partialUsageRules.allowPartialUse}
                    onCheckedChange={(checked) => 
                      handleInputChange('partialUsageRules', {
                        ...formData.partialUsageRules,
                        allowPartialUse: checked
                      })
                    }
                  />
                </div>

                {formData.partialUsageRules.allowPartialUse && (
                  <div className="space-y-2">
                    <Label htmlFor="minimumRemaining">Minimum Remaining Balance</Label>
                    <Input
                      id="minimumRemaining"
                      type="number"
                      step="0.01"
                      value={formData.partialUsageRules.minimumRemaining}
                      onChange={(e) => 
                        handleInputChange('partialUsageRules', {
                          ...formData.partialUsageRules,
                          minimumRemaining: e.target.value
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Transfer Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900">Transfer Rules</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowTransfer">Allow Transfer to Other Customers</Label>
                  <Switch
                    id="allowTransfer"
                    checked={formData.transferRules.allowTransfer}
                    onCheckedChange={(checked) => 
                      handleInputChange('transferRules', {
                        ...formData.transferRules,
                        allowTransfer: checked
                      })
                    }
                  />
                </div>

                {formData.transferRules.allowTransfer && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="maxTransferAmount">Maximum Transfer Amount</Label>
                      <Input
                        id="maxTransferAmount"
                        type="number"
                        step="0.01"
                        value={formData.transferRules.maxTransferAmount}
                        onChange={(e) => 
                          handleInputChange('transferRules', {
                            ...formData.transferRules,
                            maxTransferAmount: e.target.value
                          })
                        }
                        placeholder="No limit"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transferFee">Transfer Fee</Label>
                      <Input
                        id="transferFee"
                        type="number"
                        step="0.01"
                        value={formData.transferRules.transferFee}
                        onChange={(e) => 
                          handleInputChange('transferRules', {
                            ...formData.transferRules,
                            transferFee: e.target.value
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Refund Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900">Refund Rules</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRefunds">Allow Refunds</Label>
                  <Switch
                    id="allowRefunds"
                    checked={formData.refundRules.allowRefund}
                    onCheckedChange={(checked) => 
                      handleInputChange('refundRules', {
                        ...formData.refundRules,
                        allowRefund: checked
                      })
                    }
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
                        onChange={(e) => 
                          handleInputChange('refundRules', {
                            ...formData.refundRules,
                            refundFeePercentage: e.target.value
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refundDeadlineDays">Refund Deadline (days)</Label>
                      <Input
                        id="refundDeadlineDays"
                        type="number"
                        value={formData.refundRules.refundDeadlineDays}
                        onChange={(e) => 
                          handleInputChange('refundRules', {
                            ...formData.refundRules,
                            refundDeadlineDays: e.target.value
                          })
                        }
                        placeholder="30"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-slate-50">
              <Button type="submit" className="w-full">
                {giftcard ? 'Update Gift Card' : 'Add Gift Card'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};