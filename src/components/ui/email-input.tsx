import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const validateEmail = (email: string): boolean => {
  if (!email) return true; // Empty is valid (required validation handled separately)
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const EmailInput: React.FC<EmailInputProps> = ({
  value = '',
  onChange,
  placeholder = 'example@email.com',
  className,
  label,
  required = false,
  disabled = false
}) => {
  const isValid = useMemo(() => validateEmail(value), [value]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full',
          !isValid && value && 'border-red-500 focus:border-red-500'
        )}
      />
      {!isValid && value && (
        <p className="text-xs text-red-500 mt-1">
          Please enter a valid email address (example@domain.com)
        </p>
      )}
    </div>
  );
};