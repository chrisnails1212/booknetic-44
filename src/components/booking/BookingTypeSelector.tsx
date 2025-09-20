import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import { BookingType } from '@/types/groupBookingTypes';

interface BookingTypeSelectorProps {
  onSelect: (type: BookingType) => void;
}

export const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Your Appointment</h1>
        <p className="text-muted-foreground">Choose your booking type to get started</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Book an Appointment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Schedule a personal appointment with one of our service providers. Perfect for individual treatments and consultations.
            </p>
            <Button 
              onClick={() => onSelect('individual')} 
              className="w-full"
              size="lg"
            >
              Continue Individual Booking
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Group Appointment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Book appointments for multiple people with individual service selection. Coordinate schedules for friends, family, or colleagues.
            </p>
            <Button 
              onClick={() => onSelect('group')} 
              className="w-full"
              size="lg"
            >
              Continue Group Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};