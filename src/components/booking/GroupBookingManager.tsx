import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, User, Users } from 'lucide-react';
import { GroupBookingMember } from '@/types/groupBookingTypes';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GroupBookingManagerProps {
  locationId: string;
  primaryMember: GroupBookingMember;
  members: GroupBookingMember[];
  onMembersChange: (members: GroupBookingMember[]) => void;
  onSameStaffChange: (sameStaff: boolean) => void;
  sameStaff: boolean;
}

export const GroupBookingManager: React.FC<GroupBookingManagerProps> = ({
  locationId,
  primaryMember,
  members,
  onMembersChange,
  onSameStaffChange,
  sameStaff
}) => {
  const { services, staff } = useAppData();
  const { formatPrice } = useCurrency();

  const getAvailableServices = () => {
    return services.filter(service => 
      service.staffIds.some(staffId => 
        staff.find(s => s.id === staffId)?.locations.includes(locationId)
      )
    );
  };

  const getAvailableStaffForService = (serviceId: string) => {
    return staff.filter(s => 
      s.services.includes(serviceId) && 
      s.locations.includes(locationId)
    );
  };

  const addMember = () => {
    const newMember: GroupBookingMember = {
      id: `member-${Date.now()}`,
      name: '',
      serviceId: '',
      staffId: '',
      extras: [],
      isPrimary: false
    };
    onMembersChange([...members, newMember]);
  };

  const removeMember = (memberId: string) => {
    onMembersChange(members.filter(m => m.id !== memberId));
  };

  const updateMember = (memberId: string, updates: Partial<GroupBookingMember>) => {
    onMembersChange(members.map(m => 
      m.id === memberId ? { ...m, ...updates } : m
    ));
  };

  const handleServiceChange = (memberId: string, serviceId: string) => {
    updateMember(memberId, { serviceId, staffId: '' }); // Reset staff when service changes
  };

  const calculateTotalPrice = () => {
    return members.reduce((total, member) => {
      const service = services.find(s => s.id === member.serviceId);
      if (!service) return total;
      
      let memberTotal = service.price;
      
      // Add extras
      member.extras.forEach(extraId => {
        const extra = service.extras?.find(e => e.id === extraId);
        if (extra) memberTotal += extra.price;
      });
      
      return total + memberTotal;
    }, 0);
  };

  const canUseSameStaff = () => {
    if (members.length === 0) return false;
    
    const allServices = members.map(m => m.serviceId).filter(Boolean);
    if (allServices.length === 0) return false;
    
    // Find staff who can provide ALL selected services
    const availableStaff = staff.filter(s => 
      s.locations.includes(locationId) &&
      allServices.every(serviceId => s.services.includes(serviceId))
    );
    
    return availableStaff.length > 0;
  };

  useEffect(() => {
    // If same staff is selected but no staff can provide all services, switch to different staff
    if (sameStaff && !canUseSameStaff()) {
      onSameStaffChange(false);
    }
  }, [members, sameStaff]);

  const availableServices = getAvailableServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Group Members ({members.length})
        </h3>
        <Button onClick={addMember} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="grid gap-4">
        {members.map((member, index) => (
          <Card key={member.id} className={member.isPrimary ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {member.isPrimary ? (
                    <>
                      <User className="w-4 h-4" />
                      Primary Member
                    </>
                  ) : (
                    <>
                      Member {index}
                    </>
                  )}
                </CardTitle>
                {!member.isPrimary && (
                  <Button
                    onClick={() => removeMember(member.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {member.isPrimary && (
                <Badge variant="secondary" className="w-fit">
                  Main Contact
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${member.id}`}>Name *</Label>
                  <Input
                    id={`name-${member.id}`}
                    value={member.name}
                    onChange={(e) => updateMember(member.id, { name: e.target.value })}
                    placeholder="Enter member name"
                  />
                </div>
                <div>
                  <Label htmlFor={`service-${member.id}`}>Service *</Label>
                  <Select
                    value={member.serviceId}
                    onValueChange={(serviceId) => handleServiceChange(member.id, serviceId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{service.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {formatPrice(service.price)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {member.serviceId && !sameStaff && (
                <div>
                  <Label htmlFor={`staff-${member.id}`}>Staff Member *</Label>
                  <Select
                    value={member.staffId}
                    onValueChange={(staffId) => updateMember(member.id, { staffId })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStaffForService(member.serviceId).map(staffMember => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {member.serviceId && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Service Price:</span>
                    <span className="font-medium">
                      {formatPrice(services.find(s => s.id === member.serviceId)?.price || 0)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">How would you like to assign staff?</Label>
              <div className="grid gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="same-staff"
                    checked={sameStaff}
                    onChange={(e) => onSameStaffChange(e.target.checked)}
                    disabled={!canUseSameStaff()}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="same-staff" className={!canUseSameStaff() ? 'text-muted-foreground' : ''}>
                    Same staff member for all services
                    {!canUseSameStaff() && (
                      <span className="text-xs block text-muted-foreground">
                        No staff member can provide all selected services
                      </span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="different-staff"
                    checked={!sameStaff}
                    onChange={(e) => onSameStaffChange(!e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="different-staff">
                    Different staff members (individual selection)
                  </Label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Group Price:</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(calculateTotalPrice())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};