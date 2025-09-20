import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingType } from '@/types/groupBookingTypes';

interface BookingTypeSelectorProps {
  selectedType: BookingType | null;
  onTypeSelect: (type: BookingType) => void;
}

export const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
}) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Book</h1>
      
      <div className="space-y-4">
        <Card 
          className={cn(
            "cursor-pointer transition-colors hover:bg-accent/50",
            selectedType === 'individual' && "ring-2 ring-primary"
          )}
          onClick={() => onTypeSelect('individual')}
        >
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Book an appointment</h3>
              <p className="text-muted-foreground">Schedule services for yourself</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-colors hover:bg-accent/50",
            selectedType === 'group' && "ring-2 ring-primary"
          )}
          onClick={() => onTypeSelect('group')}
        >
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Group appointment</h3>
              <p className="text-muted-foreground">For yourself and others</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};