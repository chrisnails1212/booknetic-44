export interface GroupBookingMember {
  id: string;
  name: string;
  email?: string;
  serviceId: string;
  staffId: string;
  staffPreference: 'same' | 'different';
  selectedExtras: string[];
  notes?: string;
}

export interface GroupBookingData {
  primaryMember: {
    serviceId: string;
    staffId: string;
    selectedExtras: string[];
  };
  additionalMembers: GroupBookingMember[];
  bookingPreferences: {
    concurrent: boolean; // true = same time, false = sequential
    sameStaff: boolean;
  };
}

export interface GroupAvailabilitySlot {
  time: string;
  duration: number;
  staffAvailability: Array<{
    staffId: string;
    serviceId: string;
    available: boolean;
  }>;
  allStaffAvailable: boolean;
}

export interface GroupBookingAppointment {
  id: string;
  groupBookingId: string;
  memberId?: string; // undefined for primary member
  customerId: string;
  staffId: string;
  serviceId: string;
  locationId: string;
  date: Date;
  time: string;
  endTime: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled' | 'Rejected' | 'No-show' | 'Emergency';
  notes: string;
  selectedExtras: string[];
  appliedCoupons: string[];
  appliedGiftcards?: string[];
  appliedTaxes?: string[];
  customFields: Record<string, string>;
  totalPrice: number;
  isPrimaryMember: boolean;
}