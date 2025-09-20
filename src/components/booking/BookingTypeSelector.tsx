import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Users } from 'lucide-react';

interface BookingTypeSelectorProps {
  onSelect: (type: 'individual' | 'group') => void;
  groupBookingEnabled: boolean;
}

export const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({ 
  onSelect, 
  groupBookingEnabled 
}) => {
  if (!groupBookingEnabled) {
    // If group booking is disabled, auto-select individual booking
    React.useEffect(() => {
      onSelect('individual');
    }, [onSelect]);
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book</h1>
        <p className="text-gray-600">Choose your booking type</p>
      </div>
      
      <div className="space-y-4 max-w-md mx-auto">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
          onClick={() => onSelect('individual')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Book an appointment</h3>
                <p className="text-sm text-gray-500">Schedule services for yourself</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
          onClick={() => onSelect('group')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Group appointment</h3>
                <p className="text-sm text-gray-500">For yourself and others</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};