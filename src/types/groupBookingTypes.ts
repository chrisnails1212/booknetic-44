export interface GroupBookingMember {
  id: string;
  name: string;
  serviceId: string;
  staffId: string;
  extras: string[];
  isPrimary: boolean;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface GroupBookingData {
  groupId: string;
  members: GroupBookingMember[];
  location: string;
  date: string;
  time: string;
  sameStaff: boolean;
  primaryStaffId: string;
  totalDuration: number;
  totalPrice: number;
}

export interface GroupAvailabilitySlot {
  time: string;
  available: boolean;
  conflictingStaff?: string[];
  duration: number;
}

export type BookingType = 'individual' | 'group';

export interface StaffServicePair {
  staffId: string;
  serviceId: string;
  duration: number;
  memberId: string;
}