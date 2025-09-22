
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { ConditionalRule } from '@/types/formTypes';
import { validateEmail } from '@/utils/emailValidation';

interface DynamicFieldRendererProps {
  dynamicField: NonNullable<ConditionalRule['dynamicField']>;
  value?: any;
  onChange: (value: any) => void;
}

export const DynamicFieldRenderer = ({ dynamicField, value, onChange }: DynamicFieldRendererProps) => {
  const [emailError, setEmailError] = React.useState<string>('');
  const renderField = () => {
    switch (dynamicField.type) {
      case 'text-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={dynamicField.placeholder || 'Enter text...'}
              className="w-full"
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={dynamicField.placeholder || 'Enter text...'}
              className="w-full min-h-[80px]"
            />
          </div>
        );

      case 'number-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={dynamicField.placeholder || 'Enter number...'}
              className="w-full"
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={dynamicField.placeholder || 'Select an option...'} />
              </SelectTrigger>
              <SelectContent>
                {dynamicField.options?.filter(option => option && option.trim() !== '').map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={dynamicField.id}
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
            />
            <Label htmlFor={dynamicField.id} className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'date-input':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full"
            />
          </div>
        );

      case 'email':
        const handleEmailChange = (newValue: string) => {
          onChange(newValue);
          
          // Validate email format if there's a value
          if (newValue && newValue.trim()) {
            const validation = validateEmail(newValue.trim());
            setEmailError(validation.isValid ? '' : validation.error || '');
          } else {
            setEmailError('');
          }
        };

        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="email"
              value={value || ''}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={dynamicField.placeholder || 'example@email.com'}
              className={`w-full ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {dynamicField.label}
              {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <PhoneInput
              value={value || ''}
              onChange={(phoneValue) => onChange(phoneValue)}
              placeholder={dynamicField.placeholder || 'Enter phone number'}
              className="w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="w-full">{renderField()}</div>;
};
