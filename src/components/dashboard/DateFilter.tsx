
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateFilterType } from '@/hooks/useDateFilter';

const dateOptions: DateFilterType[] = [
  'Today', 'Yesterday', 'Tomorrow', 'This week', 'Last week', 'This month', 'This year', 'Custom'
];

interface DateFilterProps {
  activeFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
}

export const DateFilter = ({ activeFilter, onFilterChange }: DateFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {dateOptions.map((option) => (
        <Button
          key={option}
          variant={activeFilter === option ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(option)}
          className={cn(
            "text-sm",
            activeFilter === option 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  );
};
