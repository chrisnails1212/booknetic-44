import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User } from 'lucide-react';
import { GroupMember } from '@/types/groupBookingTypes';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GroupMemberManagerProps {
  members: GroupMember[];
  onMembersChange: (members: GroupMember[]) => void;
  locationId: string;
}

export const GroupMemberManager: React.FC<GroupMemberManagerProps> = ({
  members,
  onMembersChange,
  locationId
}) => {
  const { services, staff } = useAppData();
  const { formatPrice } = useCurrency();
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const availableServices = services.filter(service => 
    staff.some(s => s.services.includes(service.id) && s.locations.includes(locationId))
  );

  const addMember = () => {
    if (!newMemberName.trim()) return;
    
    const newMember: GroupMember = {
      id: Date.now().toString(),
      name: newMemberName,
      serviceId: '',
      extras: [],
      isPrimary: false
    };
    
    onMembersChange([...members, newMember]);
    setNewMemberName('');
    setShowAddMember(false);
  };

  const removeMember = (memberId: string) => {
    onMembersChange(members.filter(m => m.id !== memberId));
  };

  const updateMember = (memberId: string, updates: Partial<GroupMember>) => {
    onMembersChange(members.map(m => 
      m.id === memberId ? { ...m, ...updates } : m
    ));
  };

  const toggleExtra = (memberId: string, extraId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const updatedExtras = member.extras.includes(extraId)
      ? member.extras.filter(id => id !== extraId)
      : [...member.extras, extraId];
    
    updateMember(memberId, { extras: updatedExtras });
  };

  const calculateMemberTotal = (member: GroupMember) => {
    const service = services.find(s => s.id === member.serviceId);
    if (!service) return 0;

    let total = service.price;
    member.extras.forEach(extraId => {
      const extra = service.extras?.find(e => e.id === extraId);
      if (extra) total += extra.price;
    });

    return total;
  };

  const calculateGroupTotal = () => {
    return members.reduce((total, member) => total + calculateMemberTotal(member), 0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Group Members & Services</h2>
        <p className="text-gray-600">Add members and select their services</p>
      </div>

      {/* Primary Member (Me) */}
      {members.length > 0 && members[0].isPrimary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">M</span>
              </div>
              <span>Me</span>
              <Badge variant="secondary">Primary</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={members[0].serviceId}
                  onValueChange={(value) => updateMember(members[0].id, { serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{service.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Service Extras */}
            {members[0].serviceId && (
              <div className="space-y-2">
                <Label>Service Extras</Label>
                <div className="space-y-2">
                  {services.find(s => s.id === members[0].serviceId)?.extras?.map(extra => (
                    <div key={extra.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`primary-extra-${extra.id}`}
                        checked={members[0].extras.includes(extra.id)}
                        onCheckedChange={() => toggleExtra(members[0].id, extra.id)}
                      />
                      <Label htmlFor={`primary-extra-${extra.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <span>{extra.name}</span>
                          <span className="text-sm text-gray-500">{formatPrice(extra.price)}</span>
                        </div>
                      </Label>
                    </div>
                  )) || <p className="text-sm text-gray-500">No extras available for this service</p>}
                </div>
              </div>
            )}

            <div className="text-right">
              <span className="text-lg font-medium">
                Total: {formatPrice(calculateMemberTotal(members[0]))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Members */}
      {members.filter(m => !m.isPrimary).map((member, index) => (
        <Card key={member.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <span>{member.name}</span>
                <Badge variant="outline">Guest {index + 1}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMember(member.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={member.serviceId}
                  onValueChange={(value) => updateMember(member.id, { serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{service.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Service Extras */}
            {member.serviceId && (
              <div className="space-y-2">
                <Label>Service Extras</Label>
                <div className="space-y-2">
                  {services.find(s => s.id === member.serviceId)?.extras?.map(extra => (
                    <div key={extra.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`member-${member.id}-extra-${extra.id}`}
                        checked={member.extras.includes(extra.id)}
                        onCheckedChange={() => toggleExtra(member.id, extra.id)}
                      />
                      <Label htmlFor={`member-${member.id}-extra-${extra.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <span>{extra.name}</span>
                          <span className="text-sm text-gray-500">{formatPrice(extra.price)}</span>
                        </div>
                      </Label>
                    </div>
                  )) || <p className="text-sm text-gray-500">No extras available for this service</p>}
                </div>
              </div>
            )}

            <div className="text-right">
              <span className="text-lg font-medium">
                Total: {formatPrice(calculateMemberTotal(member))}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Member Section */}
      {showAddMember ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-member-name">Guest Name</Label>
                <Input
                  id="new-member-name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter guest name"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={addMember} disabled={!newMemberName.trim()}>
                  Add Guest
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAddMember(false);
                  setNewMemberName('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAddMember(true)}
            className="w-full max-w-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add guest
          </Button>
        </div>
      )}

      {/* Group Total */}
      {members.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Group Total ({members.length} member{members.length > 1 ? 's' : ''})</span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(calculateGroupTotal())}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};