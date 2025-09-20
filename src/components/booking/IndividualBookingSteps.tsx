import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Calendar, Clock, Gift } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { HorizontalCalendar } from './HorizontalCalendar';
import { InteractiveFormRenderer } from '../forms/InteractiveFormRenderer';

export const renderLocationStep = (locations: any[], bookingData: any, setBookingData: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Select Location
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Select
        value={bookingData.location}
        onValueChange={(value) => setBookingData({ ...bookingData, location: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              <div>
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-muted-foreground">{location.address}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardContent>
  </Card>
);

export const renderServiceStep = (services: any[], bookingData: any, setBookingData: any, formatPrice: any) => {
  const availableServices = services.filter(service => 
    service.staffIds.some((staffId: string) => 
      // This would need to be filtered by location as well
      true // Simplified for now
    )
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Service</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {availableServices.map((service) => (
            <div
              key={service.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                bookingData.service === service.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setBookingData({ ...bookingData, service: service.id, staff: '' })}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold">{formatPrice(service.price)}</div>
                  <div className="text-sm text-muted-foreground">{service.duration} min</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};