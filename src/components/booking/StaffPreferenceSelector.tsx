import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, User, Shuffle } from 'lucide-react';
import { GroupMember } from '@/types/groupBookingTypes';
import { useAppData } from '@/contexts/AppDataContext';

interface StaffPreferenceSelectorProps {
  members: GroupMember[];
  staffPreference: 'same' | 'different' | 'any';
  primaryStaffId?: string;
  onStaffPreferenceChange: (preference: 'same' | 'different' | 'any') => void;
  onPrimaryStaffChange: (staffId: string) => void;
  onMemberStaffChange: (memberId: string, staffId: string) => void;
  locationId: string;
}

export const StaffPreferenceSelector: React.FC<StaffPreferenceSelectorProps> = ({
  members,
  staffPreference,
  primaryStaffId,
  onStaffPreferenceChange,
  onPrimaryStaffChange,
  onMemberStaffChange,
  locationId
}) => {
  const { staff, services } = useAppData();

  // Get staff who can provide services for all members (for same staff option)
  const getStaffForAllServices = () => {
    const allServiceIds = members.map(m => m.serviceId).filter(Boolean);
    if (allServiceIds.length === 0) return [];

    return staff.filter(s => 
      s.locations.includes(locationId) &&
      allServiceIds.every(serviceId => s.services.includes(serviceId))
    );
  };

  // Get staff who can provide a specific service
  const getStaffForService = (serviceId: string) => {
    return staff.filter(s => 
      s.locations.includes(locationId) &&
      s.services.includes(serviceId)
    );
  };

  const staffForAllServices = getStaffForAllServices();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Staff Selection</h2>
        <p className="text-gray-600">Choose how you'd like to assign staff members</p>
      </div>

      {/* Staff Preference Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            staffPreference === 'same' 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:shadow-md'
          }`}
          onClick={() => onStaffPreferenceChange('same')}
        >
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-medium mb-2">Same Staff</h3>
            <p className="text-sm text-gray-600">One staff member for all services</p>
            {staffForAllServices.length === 0 && (
              <p className="text-xs text-red-500 mt-2">No staff available for all selected services</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            staffPreference === 'different' 
              ? 'ring-2 ring-green-500 bg-green-50' 
              : 'hover:shadow-md'
          }`}
          onClick={() => onStaffPreferenceChange('different')}
        >
          <CardContent className="p-6 text-center">
            <User className="w-8 h-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-medium mb-2">Different Staff</h3>
            <p className="text-sm text-gray-600">Choose individual staff for each member</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            staffPreference === 'any' 
              ? 'ring-2 ring-purple-500 bg-purple-50' 
              : 'hover:shadow-md'
          }`}
          onClick={() => onStaffPreferenceChange('any')}
        >
          <CardContent className="p-6 text-center">
            <Shuffle className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-medium mb-2">Any Staff</h3>
            <p className="text-sm text-gray-600">System will assign available staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Selection Based on Preference */}
      {staffPreference === 'same' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select
                value={primaryStaffId || ''}
                onValueChange={onPrimaryStaffChange}
                disabled={staffForAllServices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffForAllServices.map(staffMember => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      <div className="flex items-center space-x-2">
                        <span>{staffMember.name}</span>
                        <span className="text-sm text-gray-500">({staffMember.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {staffForAllServices.length === 0 && (
                <p className="text-sm text-red-500">
                  No staff member can provide all selected services. Please choose "Different Staff" option.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {staffPreference === 'different' && (
        <div className="space-y-4">
          {members.map((member, index) => {
            const availableStaff = member.serviceId ? getStaffForService(member.serviceId) : [];
            
            return (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {member.isPrimary ? 'Me' : member.name} - Staff Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Staff Member</Label>
                    <Select
                      value={member.staffId || ''}
                      onValueChange={(value) => onMemberStaffChange(member.id, value)}
                      disabled={availableStaff.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaff.map(staffMember => (
                          <SelectItem key={staffMember.id} value={staffMember.id}>
                            <div className="flex items-center space-x-2">
                              <span>{staffMember.name}</span>
                              <span className="text-sm text-gray-500">({staffMember.role})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {member.serviceId && availableStaff.length === 0 && (
                      <p className="text-sm text-red-500">
                        No staff available for {services.find(s => s.id === member.serviceId)?.name}
                      </p>
                    )}
                    {!member.serviceId && (
                      <p className="text-sm text-gray-500">
                        Select a service first
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {staffPreference === 'any' && (
        <Card className="bg-purple-50">
          <CardContent className="p-6">
            <div className="text-center">
              <Shuffle className="w-12 h-12 mx-auto mb-3 text-purple-600" />
              <h3 className="font-medium mb-2">Automatic Staff Assignment</h3>
              <p className="text-sm text-gray-600">
                The system will automatically assign available staff members based on service requirements and availability.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};