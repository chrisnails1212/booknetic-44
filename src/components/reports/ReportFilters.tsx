import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export interface FilterState {
  serviceId: string;
  locationId: string; 
  staffId: string;
  status: string;
  dateRange: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface ReportFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  services: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Completed', label: 'Completed' },
  { value: 'No-show', label: 'No-show' },
  { value: 'Emergency', label: 'Emergency' }
];

const dateRangeOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' }
];

export const ReportFilters = ({ 
  filters, 
  onFilterChange, 
  services, 
  locations, 
  staff 
}: ReportFiltersProps) => {
  const FilterDropdown = ({ 
    label, 
    value, 
    options, 
    onSelect 
  }: { 
    label: string; 
    value: string; 
    options: Array<{ value: string; label: string }>;
    onSelect: (value: string) => void;
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-slate-600">
          {value ? options.find(opt => opt.value === value)?.label : label}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuItem 
            key={option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const DateRangeDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-slate-600">
          {filters.dateRange} <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {dateRangeOptions.map((option) => (
          <DropdownMenuItem 
            key={option.value}
            onClick={() => onFilterChange('dateRange', option.value as FilterState['dateRange'])}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex flex-wrap gap-2">
      <FilterDropdown
        label="Service filter"
        value={filters.serviceId}
        options={[
          { value: '', label: 'All Services' },
          ...services.map(service => ({ value: service.id, label: service.name }))
        ]}
        onSelect={(value) => onFilterChange('serviceId', value)}
      />
      <FilterDropdown
        label="Location filter"
        value={filters.locationId}
        options={[
          { value: '', label: 'All Locations' },
          ...locations.map(location => ({ value: location.id, label: location.name }))
        ]}
        onSelect={(value) => onFilterChange('locationId', value)}
      />
      <FilterDropdown
        label="Staff filter"
        value={filters.staffId}
        options={[
          { value: '', label: 'All Staff' },
          ...staff.map(member => ({ value: member.id, label: member.name }))
        ]}
        onSelect={(value) => onFilterChange('staffId', value)}
      />
      <FilterDropdown
        label="Status filter"
        value={filters.status}
        options={statusOptions}
        onSelect={(value) => onFilterChange('status', value)}
      />
      <DateRangeDropdown />
    </div>
  );
};