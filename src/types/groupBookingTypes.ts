export interface GroupMember {
  id: string;
  name: string;
  serviceId: string;
  extras: string[];
  staffId?: string;
  isPrimary: boolean;
}

export interface GroupBookingData {
  members: GroupMember[];
  staffPreference: 'same' | 'different' | 'any';
  primaryStaffId?: string;
}

export type BookingType = 'individual' | 'group';