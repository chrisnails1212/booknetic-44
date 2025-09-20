import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GroupMember } from '@/types/groupBookingTypes';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface GroupMemberManagerProps {
  members: GroupMember[];
  onMembersChange: (members: GroupMember[]) => void;
  locationId: string;
}

export const GroupMemberManager: React.FC<GroupMemberManagerProps> = ({
  members,
  onMembersChange,
  locationId,
}) => {
  const { services, staff } = useAppData();
  const { formatPrice } = useCurrency();
  const [openMembers, setOpenMembers] = useState<string[]>([]);

  const availableServices = services;

  const addMember = () => {
    if (members.length === 0) {
      // Add main member (Me)
      const newMember: GroupMember = {
        id: 'main',
        name: 'Me',
        serviceId: '',
        selectedExtras: [],
        staffId: undefined,
      };
      onMembersChange([newMember]);
    } else {
      // Add guest
      const newMember: GroupMember = {
        id: Date.now().toString(),
        name: `Guest ${members.length}`,
        serviceId: '',
        selectedExtras: [],
        staffId: undefined,
      };
      onMembersChange([...members, newMember]);
    }
  };

  const removeMember = (memberId: string) => {
    if (memberId === 'main') return; // Can't remove main member
    onMembersChange(members.filter(m => m.id !== memberId));
  };

  const updateMember = (memberId: string, updates: Partial<GroupMember>) => {
    onMembersChange(
      members.map(m => m.id === memberId ? { ...m, ...updates } : m)
    );
  };

  const toggleMemberOpen = (memberId: string) => {
    setOpenMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getServicePrice = (serviceId: string, extras: string[]) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 0;
    
    let total = service.price;
    extras.forEach(extraId => {
      const extra = service.extras?.find(e => e.id === extraId);
      if (extra) total += extra.price;
    });
    
    return total;
  };

  const getTotalPrice = () => {
    return members.reduce((total, member) => {
      return total + getServicePrice(member.serviceId, member.selectedExtras);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const selectedService = services.find(s => s.id === member.serviceId);
        const isOpen = openMembers.includes(member.id);
        
        return (
          <Card key={member.id} className="overflow-hidden">
            <Collapsible open={isOpen} onOpenChange={() => toggleMemberOpen(member.id)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      {selectedService && (
                        <p className="text-sm text-muted-foreground">
                          {selectedService.name} - {formatPrice(getServicePrice(member.serviceId, member.selectedExtras))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.id !== 'main' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMember(member.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {selectedService ? 'Options' : 'Select Service'}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service</label>
                    <Select
                      value={member.serviceId}
                      onValueChange={(value) => updateMember(member.id, { 
                        serviceId: value, 
                        selectedExtras: [] // Reset extras when service changes
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{service.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedService?.extras && selectedService.extras.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Extras</label>
                      <div className="space-y-2">
                        {selectedService.extras.map((extra) => (
                          <div key={extra.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={member.selectedExtras.includes(extra.id)}
                              onCheckedChange={(checked) => {
                                const newExtras = checked
                                  ? [...member.selectedExtras, extra.id]
                                  : member.selectedExtras.filter(id => id !== extra.id);
                                updateMember(member.id, { selectedExtras: newExtras });
                              }}
                            />
                            <div className="flex-1 flex justify-between">
                              <span className="text-sm">{extra.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatPrice(extra.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {members.length === 0 ? (
        <Button onClick={addMember} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      ) : (
        <Button onClick={addMember} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add guest
        </Button>
      )}

      {members.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total:</span>
            <span>{formatPrice(getTotalPrice())}</span>
          </div>
        </div>
      )}
    </div>
  );
};