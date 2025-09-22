import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Common country codes and their phone number patterns
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', prefix: '+1', format: '(###) ###-####', maxLength: 14 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', prefix: '+1', format: '(###) ###-####', maxLength: 14 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', prefix: '+44', format: '#### ######', maxLength: 11 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', prefix: '+49', format: '### ########', maxLength: 11 },
  { code: 'FR', name: 'France', flag: '🇫🇷', prefix: '+33', format: '# ## ## ## ##', maxLength: 11 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', prefix: '+39', format: '### ### ####', maxLength: 11 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', prefix: '+34', format: '### ### ###', maxLength: 9 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', prefix: '+61', format: '#### ### ###', maxLength: 11 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', prefix: '+81', format: '##-####-####', maxLength: 12 },
  { code: 'CN', name: 'China', flag: '🇨🇳', prefix: '+86', format: '### #### ####', maxLength: 13 },
  { code: 'IN', name: 'India', flag: '🇮🇳', prefix: '+91', format: '##### #####', maxLength: 10 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', prefix: '+55', format: '(##) #####-####', maxLength: 14 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', prefix: '+52', format: '### ### ####', maxLength: 11 },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', prefix: '+7', format: '### ###-##-##', maxLength: 12 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', prefix: '+27', format: '## ### ####', maxLength: 10 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', prefix: '+82', format: '##-####-####', maxLength: 12 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', prefix: '+65', format: '#### ####', maxLength: 8 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', prefix: '+31', format: '## ########', maxLength: 10 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', prefix: '+46', format: '##-### ## ##', maxLength: 11 },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', prefix: '+47', format: '### ## ###', maxLength: 8 },
];

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
}

const formatPhoneNumber = (value: string, country: typeof COUNTRIES[0]): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Apply country-specific formatting
  let formatted = digits;
  const format = country.format;
  let formatIndex = 0;
  let result = '';
  
  for (let i = 0; i < format.length && formatIndex < digits.length; i++) {
    if (format[i] === '#') {
      result += digits[formatIndex];
      formatIndex++;
    } else {
      result += format[i];
    }
  }
  
  return result;
};

const parsePhoneNumber = (fullNumber: string): { countryCode: string; number: string } => {
  if (!fullNumber.startsWith('+')) {
    return { countryCode: 'US', number: fullNumber };
  }
  
  // Find matching country by prefix
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const country of sortedCountries) {
    if (fullNumber.startsWith(country.prefix)) {
      return {
        countryCode: country.code,
        number: fullNumber.slice(country.prefix.length)
      };
    }
  }
  
  return { countryCode: 'US', number: fullNumber.slice(1) };
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, defaultCountry = 'US', ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    
    // Parse initial value
    const parsed = parsePhoneNumber(value);
    const [selectedCountry, setSelectedCountry] = React.useState(() => 
      COUNTRIES.find(c => c.code === parsed.countryCode) || COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
    );
    
    const [phoneNumber, setPhoneNumber] = React.useState(() => 
      parsed.number ? formatPhoneNumber(parsed.number, selectedCountry) : ''
    );

    const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
      setSelectedCountry(country);
      setOpen(false);
      
      // Format existing number with new country
      const formattedNumber = formatPhoneNumber(phoneNumber.replace(/\D/g, ''), country);
      setPhoneNumber(formattedNumber);
      
      // Call onChange with full international format
      const fullNumber = formattedNumber ? `${country.prefix}${formattedNumber.replace(/\D/g, '')}` : '';
      onChange?.(fullNumber);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const digits = newValue.replace(/\D/g, '');
      
      // Limit to country's max length
      if (digits.length <= selectedCountry.maxLength) {
        const formatted = formatPhoneNumber(digits, selectedCountry);
        setPhoneNumber(formatted);
        
        // Call onChange with full international format
        const fullNumber = digits ? `${selectedCountry.prefix}${digits}` : '';
        onChange?.(fullNumber);
      }
    };

    // Update when value prop changes externally
    React.useEffect(() => {
      if (value !== undefined) {
        const parsed = parsePhoneNumber(value);
        const country = COUNTRIES.find(c => c.code === parsed.countryCode) || selectedCountry;
        setSelectedCountry(country);
        setPhoneNumber(parsed.number ? formatPhoneNumber(parsed.number, country) : '');
      }
    }, [value]);

    return (
      <div className="flex">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-auto justify-between rounded-r-none border-r-0 px-3"
            >
              <span className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm font-mono">{selectedCountry.prefix}</span>
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <Command>
              <CommandInput placeholder="Search countries..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.prefix}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                        <span className="text-sm font-mono text-muted-foreground">
                          {country.prefix}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <input
          {...props}
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder={selectedCountry.format.replace(/#/g, '0')}
          className={cn(
            "flex h-10 w-full rounded-md rounded-l-none border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };