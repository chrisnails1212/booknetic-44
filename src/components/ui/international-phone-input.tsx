import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
  example: string;
}

const countries: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '(###) ###-####', example: '(555) 123-4567' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: '#### ### ####', example: '7911 123456' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '(###) ###-####', example: '(555) 123-4567' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', format: '#### ### ###', example: '0412 345 678' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', format: '#### ########', example: '0176 12345678' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '## ## ## ## ##', example: '06 12 34 56 78' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', format: '### ### ####', example: '347 123 4567' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', format: '### ### ###', example: '612 345 678' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', format: '## ########', example: '06 12345678' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', format: '###-####-####', example: '090-1234-5678' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', format: '###-####-####', example: '010-1234-5678' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', format: '### #### ####', example: '138 0013 8000' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', format: '##### #####', example: '98765 43210' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', format: '(##) #####-####', example: '(11) 99999-9999' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', format: '### ### ####', example: '55 1234 5678' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', format: '### ###-##-##', example: '495 123-45-67' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', format: '## ### ####', example: '82 123 4567' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', format: '### ### ####', example: '100 123 4567' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', format: '### ### ####', example: '802 123 4567' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', format: '### ### ####', example: '532 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', format: '## ### ####', example: '50 123 4567' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', format: '## ### ####', example: '50 123 4567' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', format: '#### ####', example: '9123 4567' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', format: '##-### ####', example: '12-345 6789' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', format: '##-###-####', example: '08-123-4567' },
];

interface InternationalPhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

// Auto-detect country from browser locale and timezone
const detectCountryFromLocale = (): Country => {
  try {
    // Try to get country from locale
    const locale = navigator.language || 'en-US';
    const countryCode = locale.split('-')[1];
    
    if (countryCode) {
      const country = countries.find(c => c.code === countryCode);
      if (country) return country;
    }
    
    // Try to get timezone and map to country
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Toronto': 'CA',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'NL',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Shanghai': 'CN',
      'Asia/Kolkata': 'IN',
      'Australia/Sydney': 'AU',
      'America/Sao_Paulo': 'BR',
      'America/Mexico_City': 'MX',
      'Europe/Moscow': 'RU',
      'Africa/Johannesburg': 'ZA',
      'Africa/Cairo': 'EG',
      'Africa/Lagos': 'NG',
      'Europe/Istanbul': 'TR',
      'Asia/Riyadh': 'SA',
      'Asia/Dubai': 'AE',
      'Asia/Singapore': 'SG',
      'Asia/Kuala_Lumpur': 'MY',
      'Asia/Bangkok': 'TH',
    };
    
    const detectedCountry = timezoneCountryMap[timezone];
    if (detectedCountry) {
      const country = countries.find(c => c.code === detectedCountry);
      if (country) return country;
    }
  } catch (error) {
    console.warn('Failed to detect country from locale/timezone:', error);
  }
  
  // Fallback to US
  return countries[0];
};

export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
  value = '',
  onChange,
  placeholder,
  className,
  label,
  required = false,
  disabled = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(detectCountryFromLocale());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse existing value to extract country and number
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.slice(country.dialCode.length).trim());
      }
    } else if (value) {
      setPhoneNumber(value);
    }
  }, [value]);

  // Convert to E.164 format for storage
  const toE164Format = (phone: string, country: Country): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return '';
    return `${country.dialCode}${cleaned}`;
  };

  const formatPhoneNumber = (number: string, format: string): string => {
    const cleaned = number.replace(/\D/g, '');
    let formatted = '';
    let numberIndex = 0;
    
    for (let i = 0; i < format.length && numberIndex < cleaned.length; i++) {
      if (format[i] === '#') {
        formatted += cleaned[numberIndex];
        numberIndex++;
      } else {
        formatted += format[i];
      }
    }
    
    return formatted;
  };

  const handlePhoneChange = (inputValue: string) => {
    const cleaned = inputValue.replace(/\D/g, '');
    const formatted = formatPhoneNumber(cleaned, selectedCountry.format);
    setPhoneNumber(formatted);
    
    // Output E.164 format for storage
    const e164Number = toE164Format(formatted, selectedCountry);
    onChange(e164Number);
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setCountryPopoverOpen(false);
      setSearchQuery('');
      
      // Output E.164 format for storage
      const e164Number = phoneNumber ? toE164Format(phoneNumber, country) : '';
      onChange(e164Number);
    }
  };

  const isValidPhoneNumber = (phone: string, country: Country): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    const expectedLength = country.format.split('#').length - 1;
    return cleaned.length >= expectedLength - 2 && cleaned.length <= expectedLength + 2;
  };

  const isValid = useMemo(() => {
    if (!phoneNumber) return true;
    return isValidPhoneNumber(phoneNumber, selectedCountry);
  }, [phoneNumber, selectedCountry]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryPopoverOpen}
              className="w-48 justify-between"
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search countries..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-9"
              />
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                <CommandList className="max-h-[200px] overflow-auto">
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.code}
                      onSelect={() => handleCountryChange(country.code)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span>{country.flag}</span>
                      <span className="flex-1 text-sm font-medium">{country.name}</span>
                      <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                      <Check 
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1">
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={placeholder || selectedCountry.example}
              disabled={disabled}
              className={cn(
                'w-full transition-colors',
                !isValid && phoneNumber && 'border-red-500 focus:border-red-500 ring-red-200',
                isValid && phoneNumber && 'border-green-500 focus:border-green-500 ring-green-200'
              )}
            />
            <div className="min-h-[1rem]">
              {!isValid && phoneNumber && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Please enter a valid phone number for {selectedCountry.name}
                </p>
              )}
              {isValid && phoneNumber && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                  Valid phone number (E.164: {toE164Format(phoneNumber, selectedCountry)})
                </p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};