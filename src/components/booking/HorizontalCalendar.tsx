import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBookingTheme } from '@/contexts/BookingThemeContext';

interface HorizontalCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

export const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({
  selectedDate,
  onDateSelect,
  disabledDates,
  className
}) => {
  const { theme } = useBookingTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() => {
    const weekStart = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
    // Ensure we never show past weeks
    return weekStart < today ? startOfWeek(today, { weekStartsOn: 1 }) : weekStart;
  });

  // Update current week when selectedDate changes
  React.useEffect(() => {
    if (selectedDate) {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      // Ensure we never show past weeks
      setCurrentWeekStart(weekStart < today ? startOfWeek(today, { weekStartsOn: 1 }) : weekStart);
    }
  }, [selectedDate]);

  // Generate 7 days starting from current week start, but only show dates from today onwards
  const allWeekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekDays = allWeekDays.filter(date => date >= today);

  const handlePrevWeek = () => {
    const newWeekStart = addDays(currentWeekStart, -7);
    // Prevent going to weeks that would show past dates
    if (newWeekStart >= startOfWeek(today, { weekStartsOn: 1 })) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const isDateDisabled = (date: Date) => {
    if (isPast(date) && !isToday(date)) return true;
    return disabledDates ? disabledDates(date) : false;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Month/Year header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {format(currentWeekStart, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevWeek}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal date selector */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {weekDays.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentToday = isToday(date);
          const isDisabled = isDateDisabled(date);
          const isWeekendDate = isWeekend(date);

          return (
            <div
              key={date.toISOString()}
              className="flex flex-col items-center min-w-[60px] flex-1"
            >
              <button
                onClick={() => !isDisabled && onDateSelect(date)}
                disabled={isDisabled}
                className={cn(
                  "flex flex-col items-center py-3 px-2 rounded-lg transition-all duration-200 w-full",
                  "focus:outline-none border-0",
                  {
                    // Disabled state
                    "opacity-40 cursor-not-allowed": isDisabled,
                  }
                )}
                style={{
                  // Selected state styling
                  backgroundColor: isSelected ? theme.primaryColor : 'transparent',
                  color: isSelected ? 'white' : undefined,
                  // Today state styling (not selected)
                  border: isCurrentToday && !isSelected ? `2px solid ${theme.primaryColor}` : 'none',
                  // Hover effect for non-selected, non-disabled dates
                  ...((!isSelected && !isDisabled) && {
                    '--hover-bg': `${theme.primaryColor}20`,
                  }),
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.backgroundColor = `${theme.primaryColor}20`;
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <span
                  className={cn(
                    "text-2xl font-semibold mb-1",
                    {
                      "text-primary-foreground": isSelected,
                      "text-muted-foreground": isWeekendDate && !isSelected && !isCurrentToday,
                      "text-foreground": !isWeekendDate && !isSelected && !isCurrentToday,
                    }
                  )}
                >
                  {format(date, 'd')}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    {
                      "text-primary-foreground": isSelected,
                      "text-muted-foreground": isWeekendDate && !isSelected && !isCurrentToday,
                      "text-foreground": !isWeekendDate && !isSelected && !isCurrentToday,
                    }
                  )}
                >
                  {format(date, 'EEE')}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};