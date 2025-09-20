export interface GroupMember {
  id: string;
  name: string;
  serviceId: string;
  selectedExtras: string[];
  staffId?: string;
}

export interface GroupBookingData {
  members: GroupMember[];
  staffPreference: 'same' | 'different' | 'any';
  selectedDate: string;
  selectedTime: string;
  totalDuration: number;
  totalPrice: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  notes: string;
}

export type BookingType = 'individual' | 'group';