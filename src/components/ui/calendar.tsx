import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className="bg-[hsl(var(--calendar-background))] border border-[hsl(var(--calendar-border))] rounded-lg shadow-lg shadow-[hsl(var(--calendar-shadow))]/10">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-6", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-6",
          caption: "flex justify-center pt-1 relative items-center mb-4",
          caption_label: "text-lg font-semibold text-foreground",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 bg-transparent p-0 text-muted-foreground hover:bg-[hsl(var(--calendar-hover))] hover:text-[hsl(var(--calendar-hover-foreground))] transition-all duration-200 rounded-full"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex mb-2",
          head_cell:
            "text-muted-foreground rounded-md w-10 h-10 font-medium text-sm flex items-center justify-center",
          row: "flex w-full mt-1",
          cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(
            "h-10 w-10 p-0 font-medium rounded-full transition-all duration-200 hover:bg-[hsl(var(--calendar-hover))] hover:text-[hsl(var(--calendar-hover-foreground))] aria-selected:opacity-100 flex items-center justify-center"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-[hsl(var(--calendar-selected))] text-[hsl(var(--calendar-selected-foreground))] hover:bg-[hsl(var(--calendar-selected))] hover:text-[hsl(var(--calendar-selected-foreground))] focus:bg-[hsl(var(--calendar-selected))] focus:text-[hsl(var(--calendar-selected-foreground))] font-semibold",
          day_today: "bg-[hsl(var(--calendar-today))] text-[hsl(var(--calendar-today-foreground))] font-semibold border-2 border-[hsl(var(--calendar-selected))]",
          day_outside:
            "day-outside text-muted-foreground opacity-40 aria-selected:bg-[hsl(var(--calendar-hover))]/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
          day_range_middle:
            "aria-selected:bg-[hsl(var(--calendar-hover))] aria-selected:text-[hsl(var(--calendar-hover-foreground))]",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
