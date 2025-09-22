import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppData, Coupon } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface CouponFormProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon | null;
}

export const CouponForm: React.FC<CouponFormProps> = ({
  isOpen,
  onClose,
  coupon
}) => {
  const { addCoupon, updateCoupon, services, staff, coupons } = useAppData();
  const { currency } = useCurrency();
  
  const [formData, setFormData] = useState<{
    code: string;
    discount: string;
    discountType: string;
    appliesDateFrom: string;
    appliesDateTo: string;
    customDateFrom: Date | undefined;
    customDateTo: Date | undefined;
    usageLimit: string;
    oncePer: string;
    servicesFilter: string;
    staffFilter: string;
    status: 'Active' | 'Inactive';
    minimumPurchase: string;
    maximumDiscount: string;
    allowCombination: boolean;
  }>({
    code: '',
    discount: '',
    discountType: '%',
    appliesDateFrom: 'Life time',
    appliesDateTo: 'Life time',
    customDateFrom: undefined,
    customDateTo: undefined,
    usageLimit: 'No limit',
    oncePer: '',
    servicesFilter: 'all-services',
    staffFilter: 'all-staff',
    status: 'Active',
    minimumPurchase: '',
    maximumDiscount: '',
    allowCombination: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (coupon) {
      // Parse existing discount to extract value and type
      const discountMatch = coupon.discount.match(/^(\d+(?:\.\d+)?)(.*?)$/);
      const discountValue = discountMatch ? discountMatch[1] : '';
      const discountType = discountMatch ? (discountMatch[2] === '%' ? '%' : currency.symbol) : '%';
      
      setFormData({
        code: coupon.code || '',
        discount: discountValue,
        discountType: discountType,
        appliesDateFrom: coupon.appliesDateFrom || 'Life time',
        appliesDateTo: coupon.appliesDateTo || 'Life time',
        customDateFrom: coupon.customDateFrom,
        customDateTo: coupon.customDateTo,
        usageLimit: coupon.usageLimit || 'No limit',
        oncePer: coupon.oncePer || '',
        servicesFilter: coupon.servicesFilter || 'all-services',
        staffFilter: coupon.staffFilter || 'all-staff',
        status: coupon.status === 'Expired' ? 'Inactive' : coupon.status || 'Active',
        minimumPurchase: coupon.minimumPurchase?.toString() || '',
        maximumDiscount: coupon.maximumDiscount?.toString() || '',
        allowCombination: coupon.allowCombination ?? true
      });
    } else {
      setFormData({
        code: '',
        discount: '',
        discountType: '%',
        appliesDateFrom: 'Life time',
        appliesDateTo: 'Life time',
        customDateFrom: undefined,
        customDateTo: undefined,
        usageLimit: 'No limit',
        oncePer: '',
        servicesFilter: 'all-services',
        staffFilter: 'all-staff',
        status: 'Active',
        minimumPurchase: '',
        maximumDiscount: '',
        allowCombination: true
      });
    }
    setErrors({});
  }, [coupon, isOpen, currency.symbol]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Coupon code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else {
      // Check for uniqueness (exclude current coupon if editing)
      const existingCoupon = coupons.find(c => 
        c.code.toUpperCase() === formData.code.trim().toUpperCase() && 
        c.id !== coupon?.id
      );
      if (existingCoupon) {
        newErrors.code = 'This coupon code already exists';
      }
    }

    // Discount validation
    if (!formData.discount.trim()) {
      newErrors.discount = 'Discount amount is required';
    } else {
      const discountValue = parseFloat(formData.discount);
      if (isNaN(discountValue) || discountValue <= 0) {
        newErrors.discount = 'Discount must be a positive number';
      }
      if (formData.discountType === '%' && discountValue > 100) {
        newErrors.discount = 'Percentage discount cannot exceed 100%';
      }
    }

    // Date validation
    if (formData.appliesDateFrom === 'Custom' && formData.appliesDateTo === 'Custom') {
      if (formData.customDateFrom && formData.customDateTo) {
        if (formData.customDateFrom >= formData.customDateTo) {
          newErrors.customDateTo = 'End date must be after start date';
        }
      }
    }

    // Minimum purchase validation
    if (formData.minimumPurchase && formData.minimumPurchase.trim()) {
      const minPurchase = parseFloat(formData.minimumPurchase);
      if (isNaN(minPurchase) || minPurchase < 0) {
        newErrors.minimumPurchase = 'Minimum purchase must be a valid number';
      }
    }

    // Maximum discount validation
    if (formData.maximumDiscount && formData.maximumDiscount.trim()) {
      const maxDiscount = parseFloat(formData.maximumDiscount);
      if (isNaN(maxDiscount) || maxDiscount <= 0) {
        newErrors.maximumDiscount = 'Maximum discount must be a positive number';
      }
    }

    // Usage limit validation
    if (formData.usageLimit !== 'No limit') {
      const usageLimit = parseInt(formData.usageLimit);
      if (isNaN(usageLimit) || usageLimit <= 0) {
        newErrors.usageLimit = 'Usage limit must be a positive number';
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
      const couponData = {
        code: formData.code.trim().toUpperCase(),
        discount: formData.discountType === '%' 
          ? `${formData.discount}%` 
          : `${currency.symbol}${formData.discount}`,
        appliesDateFrom: formData.appliesDateFrom,
        appliesDateTo: formData.appliesDateTo,
        customDateFrom: formData.customDateFrom,
        customDateTo: formData.customDateTo,
        usageLimit: formData.usageLimit,
        oncePer: formData.oncePer || undefined,
        servicesFilter: formData.servicesFilter,
        staffFilter: formData.staffFilter,
        status: formData.status,
        minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : undefined,
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : undefined,
        allowCombination: formData.allowCombination
      };

      if (coupon) {
        updateCoupon(coupon.id, couponData);
        toast.success('Coupon updated successfully');
      } else {
        addCoupon(couponData);
        toast.success('Coupon added successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save coupon');
      console.error('Error saving coupon:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:w-[600px] sm:max-w-[600px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between pb-6">
          <SheetTitle className="text-xl font-semibold">
            {coupon ? 'Edit Coupon' : 'Add Coupon'}
          </SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Code and Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Enter unique coupon code"
                  className={errors.code ? 'border-red-500' : ''}
                  required
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">
                  Discount <span className="text-red-500">*</span>
                </Label>
                <div className="flex">
                  <Input
                    id="discount"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', e.target.value)}
                    placeholder="0"
                    className={`rounded-r-none ${errors.discount ? 'border-red-500' : ''}`}
                    required
                  />
                  <Select value={formData.discountType} onValueChange={(value) => handleInputChange('discountType', value)}>
                    <SelectTrigger className="w-16 rounded-l-none border-l-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value={currency.symbol}>{currency.symbol}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.discount && (
                  <p className="text-sm text-red-600">{errors.discount}</p>
                )}
              </div>
            </div>

            {/* Minimum Purchase and Maximum Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumPurchase">
                  Minimum Purchase ({currency.symbol})
                  <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                </Label>
                <Input
                  id="minimumPurchase"
                  type="number"
                  step="0.01"
                  min="0"
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
                <Label htmlFor="maximumDiscount">
                  Maximum Discount ({currency.symbol})
                  <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                </Label>
                <Input
                  id="maximumDiscount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maximumDiscount}
                  onChange={(e) => handleInputChange('maximumDiscount', e.target.value)}
                  placeholder="No limit"
                  className={errors.maximumDiscount ? 'border-red-500' : ''}
                />
                {errors.maximumDiscount && (
                  <p className="text-sm text-red-600">{errors.maximumDiscount}</p>
                )}
                <p className="text-xs text-gray-500">Leave empty for no limit</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appliesDateFrom">Applies date from</Label>
                <Select value={formData.appliesDateFrom} onValueChange={(value) => handleInputChange('appliesDateFrom', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Life time">Life time</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {formData.appliesDateFrom === 'Custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.customDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.customDateFrom ? format(formData.customDateFrom, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.customDateFrom}
                        onSelect={(date) => setFormData(prev => ({ ...prev, customDateFrom: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="appliesDateTo">Applies date to</Label>
                <Select value={formData.appliesDateTo} onValueChange={(value) => handleInputChange('appliesDateTo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Life time">Life time</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {formData.appliesDateTo === 'Custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.customDateTo && "text-muted-foreground",
                          errors.customDateTo && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.customDateTo ? format(formData.customDateTo, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.customDateTo}
                        onSelect={(date) => setFormData(prev => ({ ...prev, customDateTo: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {errors.customDateTo && (
                  <p className="text-sm text-red-600">{errors.customDateTo}</p>
                )}
              </div>
            </div>

            {/* Usage Limit and Once Per */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage limit</Label>
                <Select value={formData.usageLimit} onValueChange={(value) => handleInputChange('usageLimit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="No limit">No limit</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                {errors.usageLimit && (
                  <p className="text-sm text-red-600">{errors.usageLimit}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="oncePer">
                  Once per 
                  <span className="ml-1 text-xs text-gray-500 bg-gray-100 px-1 rounded">i</span>
                </Label>
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
            </div>

            {/* Services Filter */}
            <div className="space-y-2">
              <Label htmlFor="servicesFilter">Services filter</Label>
              <Select value={formData.servicesFilter} onValueChange={(value) => handleInputChange('servicesFilter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
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

            {/* Staff Filter */}
            <div className="space-y-2">
              <Label htmlFor="staffFilter">Staff filter</Label>
              <Select value={formData.staffFilter} onValueChange={(value) => handleInputChange('staffFilter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
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

            {/* Combination Rules */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="allowCombination">Allow combination with other offers</Label>
                <p className="text-sm text-gray-500">
                  When disabled, this coupon cannot be used with other coupons or promotions
                </p>
              </div>
              <Checkbox
                id="allowCombination"
                checked={formData.allowCombination}
                onCheckedChange={(checked) => handleInputChange('allowCombination', checked as boolean)}
              />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Status</Label>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${formData.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                  {formData.status}
                </span>
                <Switch
                  checked={formData.status === 'Active'}
                  onCheckedChange={(checked) => handleInputChange('status', checked ? 'Active' : 'Inactive')}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t bg-background">
          <Button type="button" variant="outline" onClick={onClose}>
            CANCEL
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            {coupon ? 'UPDATE COUPON' : 'ADD COUPON'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};