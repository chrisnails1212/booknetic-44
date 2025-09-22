import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common country codes and their data
const countries = [
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
];

// Auto-detect user's country
const detectUserCountry = (): string => {
  try {
    // Try to get from browser locale
    const locale = navigator.language || navigator.languages?.[0];
    if (locale && locale.includes('-')) {
      const countryCode = locale.split('-')[1]?.toUpperCase();
      if (countries.find(c => c.code === countryCode)) {
        return countryCode;
      }
    }
    
    // Fallback based on timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'NL',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Seoul': 'KR',
      'Asia/Kolkata': 'IN',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
    };
    
    if (timezoneCountryMap[timezone]) {
      return timezoneCountryMap[timezone];
    }
  } catch (error) {
    console.warn('Country detection failed:', error);
  }
  
  return 'US'; // Default fallback
};

// Basic phone number validation
const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  if (!phone) return false;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Basic validation by country
  const validationRules: Record<string, { min: number; max: number }> = {
    'US': { min: 10, max: 10 },
    'CA': { min: 10, max: 10 },
    'GB': { min: 10, max: 11 },
    'DE': { min: 10, max: 12 },
    'FR': { min: 9, max: 10 },
    'IT': { min: 9, max: 11 },
    'ES': { min: 9, max: 9 },
    'IN': { min: 10, max: 10 },
    'CN': { min: 11, max: 11 },
    'JP': { min: 10, max: 11 },
    'BR': { min: 10, max: 11 },
    'AU': { min: 9, max: 9 },
  };
  
  const rule = validationRules[countryCode] || { min: 7, max: 15 };
  return digits.length >= rule.min && digits.length <= rule.max;
};

// Format phone number for display
const formatPhoneNumber = (phone: string, countryCode: string): string => {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  // Format based on country
  switch (countryCode) {
    case 'US':
    case 'CA':
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;
    case 'GB':
      if (digits.length === 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      } else if (digits.length === 11) {
        return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      }
      break;
    default:
      // Basic formatting for other countries
      if (digits.length > 6) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      } else if (digits.length > 3) {
        return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      }
  }
  
  return phone;
};

// Convert to E.164 format
const toE164Format = (phone: string, dialCode: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return `${dialCode}${digits}`;
};

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter phone number',
  className,
  disabled = false 
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState(() => {
    // Try to detect country from existing value
    if (value && value.startsWith('+')) {
      const country = countries.find(c => value.startsWith(c.dial));
      if (country) return country;
    }
    
    // Auto-detect user's country
    const detectedCode = detectUserCountry();
    return countries.find(c => c.code === detectedCode) || countries[0];
  });
  
  const [localValue, setLocalValue] = useState(() => {
    // Extract local number from E.164 format
    if (value && value.startsWith(selectedCountry.dial)) {
      return value.slice(selectedCountry.dial.length);
    }
    return value;
  });
  
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Update local value when external value changes
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const country = countries.find(c => value.startsWith(c.dial));
      if (country) {
        setSelectedCountry(country);
        setLocalValue(value.slice(country.dial.length));
      }
    } else if (!value) {
      setLocalValue('');
    }
  }, [value]);

  const handlePhoneChange = (newValue: string) => {
    // Only allow digits, spaces, dashes, parentheses
    const sanitized = newValue.replace(/[^\d\s\-\(\)]/g, '');
    setLocalValue(sanitized);
    
    // Validate
    const valid = validatePhoneNumber(sanitized, selectedCountry.code);
    setIsValid(valid);
    
    // Convert to E.164 and call onChange
    if (onChange) {
      if (sanitized && valid) {
        const e164 = toE164Format(sanitized, selectedCountry.dial);
        onChange(e164);
      } else {
        onChange(sanitized);
      }
    }
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setOpen(false);
    
    // Re-validate with new country
    if (localValue) {
      const valid = validatePhoneNumber(localValue, country.code);
      setIsValid(valid);
      
      if (onChange) {
        if (valid) {
          const e164 = toE164Format(localValue, country.dial);
          onChange(e164);
        } else {
          onChange(localValue);
        }
      }
    }
  };

  const displayValue = formatPhoneNumber(localValue, selectedCountry.code);

  return (
    <div className={cn("flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[140px] justify-between rounded-r-none border-r-0"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dial}</span>
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandList className="max-h-[200px]">
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.code} ${country.dial}`}
                    onSelect={() => handleCountrySelect(country)}
                  >
                    <span className="mr-2 text-base">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-sm text-muted-foreground">{country.dial}</span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Input
        value={displayValue}
        onChange={(e) => handlePhoneChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "rounded-l-none",
          !isValid && localValue && "border-red-500 focus-visible:ring-red-500"
        )}
        disabled={disabled}
      />
    </div>
  );
};