import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, User } from 'lucide-react';
import { GroupBookingMember } from '@/types/groupBookingTypes';
import { Service, Staff } from '@/contexts/AppDataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface GroupBookingManagerProps {
  services: Service[];
  staff: Staff[];
  locationId: string;
  primaryServiceId: string;
  primaryStaffId: string;
  members: GroupBookingMember[];
  onMembersChange: (members: GroupBookingMember[]) => void;
  maxAdditionalGuests: number;
}

export const GroupBookingManager: React.FC<GroupBookingManagerProps> = ({
  services,
  staff,
  locationId,
  primaryServiceId,
  primaryStaffId,
  members,
  onMembersChange,
  maxAdditionalGuests
}) => {
  const [newMemberName, setNewMemberName] = useState('');

  const getAvailableStaffForService = (serviceId: string) => {
    return staff.filter(s => 
      s.services.includes(serviceId) && 
      s.locations.includes(locationId)
    );
  };

  const addMember = () => {
    if (newMemberName.trim() && members.length < maxAdditionalGuests) {
      const newMember: GroupBookingMember = {
        id: `member-${Date.now()}`,
        name: newMemberName.trim(),
        serviceId: primaryServiceId, // Default to same service
        staffId: '',
        staffPreference: 'same',
        selectedExtras: []
      };
      
      onMembersChange([...members, newMember]);
      setNewMemberName('');
    }
  };

  const updateMember = (memberId: string, updates: Partial<GroupBookingMember>) => {
    const updatedMembers = members.map(member => 
      member.id === memberId ? { ...member, ...updates } : member
    );
    onMembersChange(updatedMembers);
  };

  const removeMember = (memberId: string) => {
    onMembersChange(members.filter(m => m.id !== memberId));
  };

  const handleStaffPreferenceChange = (memberId: string, preference: 'same' | 'different') => {
    updateMember(memberId, { 
      staffPreference: preference,
      staffId: preference === 'same' ? primaryStaffId : ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Member */}
      {members.length < maxAdditionalGuests && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Group Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="memberName">Name</Label>
                <Input
                  id="memberName"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter member name"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addMember} disabled={!newMemberName.trim()}>
                  Add Member
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Members */}
      {members.map((member, index) => {
        const selectedService = services.find(s => s.id === member.serviceId);
        const availableStaff = getAvailableStaffForService(member.serviceId);
        
        return (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Group Member {index + 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeMember(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Member Name */}
              <div>
                <Label>Name</Label>
                <Input
                  value={member.name}
                  onChange={(e) => updateMember(member.id, { name: e.target.value })}
                  placeholder="Member name"
                />
              </div>

              {/* Email (optional) */}
              <div>
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={member.email || ''}
                  onChange={(e) => updateMember(member.id, { email: e.target.value })}
                  placeholder="Member email"
                />
              </div>

              {/* Service Selection */}
              <div>
                <Label>Service</Label>
                <Select
                  value={member.serviceId}
                  onValueChange={(value) => updateMember(member.id, { 
                    serviceId: value, 
                    selectedExtras: [],
                    staffId: member.staffPreference === 'same' ? primaryStaffId : ''
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter(s => s.staffIds.some(staffId => 
                        staff.find(st => st.id === staffId)?.locations.includes(locationId)
                      ))
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ${service.price} ({service.duration} min)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Preference */}
              <div>
                <Label>Staff Preference</Label>
                <RadioGroup
                  value={member.staffPreference}
                  onValueChange={(value: 'same' | 'different') => 
                    handleStaffPreferenceChange(member.id, value)
                  }
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="same" id={`same-${member.id}`} />
                    <Label htmlFor={`same-${member.id}`}>
                      Same staff as primary booking
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="different" id={`different-${member.id}`} />
                    <Label htmlFor={`different-${member.id}`}>
                      Choose different staff
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Staff Selection (only if different staff selected) */}
              {member.staffPreference === 'different' && (
                <div>
                  <Label>Staff Member</Label>
                  <Select
                    value={member.staffId}
                    onValueChange={(value) => updateMember(member.id, { staffId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaff.map((staffMember) => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Service Extras */}
              {selectedService?.extras && selectedService.extras.length > 0 && (
                <div>
                  <Label>Service Extras</Label>
                  <div className="space-y-2 mt-2">
                    {selectedService.extras.map((extra) => (
                      <div key={extra.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${member.id}-extra-${extra.id}`}
                          checked={member.selectedExtras.includes(extra.id)}
                          onCheckedChange={(checked) => {
                            const updatedExtras = checked
                              ? [...member.selectedExtras, extra.id]
                              : member.selectedExtras.filter(id => id !== extra.id);
                            updateMember(member.id, { selectedExtras: updatedExtras });
                          }}
                        />
                        <Label 
                          htmlFor={`${member.id}-extra-${extra.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {extra.name} - ${extra.price} (+{extra.duration} min)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={member.notes || ''}
                  onChange={(e) => updateMember(member.id, { notes: e.target.value })}
                  placeholder="Special requests or notes"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {members.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No additional group members added yet.</p>
          <p>Add members above to create a group booking.</p>
        </div>
      )}

      {members.length >= maxAdditionalGuests && (
        <div className="text-center py-4 text-muted-foreground">
          <p>Maximum number of group members ({maxAdditionalGuests}) reached.</p>
        </div>
      )}
    </div>
  );
};
