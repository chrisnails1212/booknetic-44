import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, UserCheck, Shuffle } from 'lucide-react';

interface StaffPreferenceSelectorProps {
  value: 'same' | 'different' | 'any';
  onValueChange: (value: 'same' | 'different' | 'any') => void;
}

export const StaffPreferenceSelector: React.FC<StaffPreferenceSelectorProps> = ({
  value,
  onValueChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Staff Preference</h3>
      
      <RadioGroup value={value} onValueChange={onValueChange} className="space-y-3">
        <Card className="relative">
          <CardContent className="flex items-center space-x-4 p-4">
            <RadioGroupItem value="same" id="same" />
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-full">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="same" className="font-medium cursor-pointer">
                  Same Staff Member
                </Label>
                <p className="text-sm text-muted-foreground">
                  One staff member for all services
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="flex items-center space-x-4 p-4">
            <RadioGroupItem value="different" id="different" />
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="different" className="font-medium cursor-pointer">
                  Different Staff Members
                </Label>
                <p className="text-sm text-muted-foreground">
                  Each person can choose their own staff member
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="flex items-center space-x-4 p-4">
            <RadioGroupItem value="any" id="any" />
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shuffle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="any" className="font-medium cursor-pointer">
                  Any Available Staff
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically assign available staff members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );
};