
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useBookingTheme } from '@/contexts/BookingThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BookingLinkPreviewProps {
  businessSlug: string;
}

export const BookingLinkPreview = ({ businessSlug }: BookingLinkPreviewProps) => {
  const { theme } = useBookingTheme();
  const { formatPrice } = useCurrency();
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Business Header */}
        <div className="text-white p-6 text-center" style={{ backgroundColor: theme.panelBackground }}>
          <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="font-bold text-xl" style={{ color: theme.panelBackground }}>B</span>
          </div>
          <h2 className="text-xl font-bold">Sample Business</h2>
          <p className="opacity-90">Book your appointment</p>
        </div>

        {/* Booking Steps */}
        <div className="p-6 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">1. Select Service</h3>
              <div className="space-y-2">
                <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✂️</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span>Haircut</span>
                      <span className="font-semibold">{formatPrice(30)}</span>
                    </div>
                    <span className="text-sm text-gray-500">45 min</span>
                  </div>
                </div>
                <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎨</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span>Hair Coloring</span>
                      <span className="font-semibold">{formatPrice(80)}</span>
                    </div>
                    <span className="text-sm text-gray-500">120 min</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">2. Select Staff (Optional)</h3>
              <div className="space-y-2">
                <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  Any Available Staff
                </div>
                <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  John Smith - Senior Stylist
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">3. Select Date & Time</h3>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="p-2 text-center border rounded hover:bg-gray-50 cursor-pointer">
                  Today
                </div>
                <div className="p-2 text-center border rounded hover:bg-gray-50 cursor-pointer">
                  Tomorrow
                </div>
                <div className="p-2 text-center border rounded hover:bg-gray-50 cursor-pointer">
                  Wed
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 text-center border rounded hover:bg-gray-50 cursor-pointer text-sm">
                  9:00 AM
                </div>
                <div className="p-2 text-center border rounded hover:bg-gray-50 cursor-pointer text-sm">
                  10:30 AM
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">4. Your Details</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-2 border rounded"
                  disabled
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-2 border rounded"
                  disabled
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <button 
            className="w-full text-white py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: theme.panelBackground }}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};
