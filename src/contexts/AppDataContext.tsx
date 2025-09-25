import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBusinessSettings } from '@/utils/businessSettings';

// Data Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth?: Date;
  note: string;
  allowLogin: boolean;
  image?: string;
  appointmentHistory: string[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  services: string[];
  locations: string[];
  avatar?: string;
  schedule: any;
  appointmentIds: string[];
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  staffIds: string[];
  extras: ServiceExtra[];
  description?: string;
  image?: string;
}

export interface ServiceExtra {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
}

export interface Location {
  id: string;
  name: string;
  phone: string;
  address: string;
  staffIds: string[];
  serviceIds: string[];
  image?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: string;
  appliesDateFrom?: string;
  appliesDateTo?: string;
  customDateFrom?: Date;
  customDateTo?: Date;
  usageLimit: string;
  oncePer?: string;
  servicesFilter?: string | string[];
  staffFilter?: string | string[];
  timesUsed: number;
  status: 'Active' | 'Inactive' | 'Expired';
  usageHistory: string[];
  minimumPurchase?: number;
  maximumDiscount?: number;
  allowCombination: boolean;
  createdAt: Date;
}

export interface GiftcardTransaction {
  id: string;
  type: 'purchase' | 'recharge' | 'transfer_in' | 'transfer_out' | 'refund' | 'void';
  amount: number;
  appointmentId?: string;
  fromGiftcardId?: string;
  toGiftcardId?: string;
  reason?: string;
  timestamp: Date;
  customerId?: string;
}

export interface Giftcard {
  id: string;
  code: string;
  balance: number;
  originalAmount: number;
  spent: number;
  leftover: number;
  usageHistory: string[];
  transactions: GiftcardTransaction[];
  servicesFilter: string | string[];
  staffFilter: string | string[];
  usageLimit: string;
  oncePer: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  // Enhanced business logic fields
  minimumPurchase?: number;
  maxUsagePerTransaction?: number;
  allowCombination: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyUsage: number;
  monthlyUsage: number;
  lastUsageDate?: Date;
  categoryRestrictions: string[];
  timeRestrictions: {
    allowedDays: string[];
    allowedHours: { start: string; end: string };
    blockPeakHours: boolean;
  };
  partialUsageRules: {
    allowPartialUse: boolean;
    minimumRemaining?: number;
  };
  transferRules: {
    allowTransfer: boolean;
    maxTransferAmount?: number;
    transferFee?: number;
  };
  refundRules: {
    allowRefund: boolean;
    refundFeePercentage?: number;
    refundDeadlineDays?: number;
  };
}

export interface Tax {
  id: string;
  name: string;
  amount: number;
  locationsFilter: string;
  servicesFilter: string;
  incorporateIntoPrice: boolean;
  enabled: boolean;
  taxType: 'vat' | 'sales-tax' | 'service-tax' | 'other';
  minimumAmount?: number;
  maximumAmount?: number;
  applyToDiscountedPrice: boolean;
  description?: string;
  createdAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  event: string;
  action: string;
  enabled: boolean;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  locationId: string;
  date: Date;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled' | 'Rejected' | 'No-show' | 'Emergency';
  notes: string;
  selectedExtras: string[];
  appliedCoupons: string[];
  appliedGiftcards?: string[];
  appliedTaxes?: string[];
  customFields: Record<string, string>;
  totalPrice: number;
  
}

interface AppDataContextType {
  // Data
  customers: Customer[];
  staff: Staff[];
  services: Service[];
  locations: Location[];
  coupons: Coupon[];
  giftcards: Giftcard[];
  taxes: Tax[];
  workflows: Workflow[];
  appointments: Appointment[];
  
  // Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'appointmentHistory'>) => string;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addStaff: (staff: Omit<Staff, 'id' | 'appointmentIds'>) => string;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  
  addService: (service: Omit<Service, 'id'>) => string;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  
  addLocation: (location: Omit<Location, 'id'>) => string;
  updateLocation: (id: string, location: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  
  addCoupon: (coupon: Omit<Coupon, 'id' | 'timesUsed' | 'usageHistory' | 'createdAt'>) => string;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  
  addGiftcard: (giftcard: Omit<Giftcard, 'id' | 'spent' | 'leftover' | 'usageHistory' | 'transactions' | 'createdAt' | 'dailyUsage' | 'monthlyUsage'>) => string;
  updateGiftcard: (id: string, giftcard: Partial<Giftcard>) => void;
  deleteGiftcard: (id: string) => void;
  rechargeGiftcard: (id: string, amount: number, reason?: string) => void;
  transferGiftcardBalance: (fromId: string, toId: string, amount: number) => void;
  refundGiftcard: (id: string, amount: number, reason?: string) => void;
  checkGiftcardCodeExists: (code: string, excludeId?: string) => boolean;
  getGiftcardStatus: (giftcard: Giftcard) => 'active' | 'inactive' | 'expired' | 'used' | 'limit-reached';
  updateExpiredGiftcards: () => void;
  
  addTax: (tax: Omit<Tax, 'id' | 'createdAt'>) => string;
  updateTax: (id: string, tax: Partial<Tax>) => void;
  deleteTax: (id: string) => void;
  checkTaxNameExists: (name: string, excludeId?: string) => boolean;
  calculateTaxAmount: (baseAmount: number, taxId: string, locationId?: string, serviceId?: string) => number;
  getApplicableTaxes: (locationId?: string, serviceId?: string) => Tax[];
  duplicateTax: (id: string) => string;
  
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => string;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  
  addAppointment: (appointment: Omit<Appointment, 'id'>) => string;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  // Helper functions
  getCustomerById: (id: string) => Customer | undefined;
  getStaffById: (id: string) => Staff | undefined;
  getServiceById: (id: string) => Service | undefined;
  getLocationById: (id: string) => Location | undefined;
  getCouponById: (id: string) => Coupon | undefined;
  getGiftcardById: (id: string) => Giftcard | undefined;
  getTaxById: (id: string) => Tax | undefined;
  getWorkflowById: (id: string) => Workflow | undefined;
  getAppointmentById: (id: string) => Appointment | undefined;
  
  getAvailableStaffForService: (serviceId: string, locationId: string) => Staff[];
  getCustomerAppointments: (customerId: string) => Appointment[];
  getStaffAppointments: (staffId: string) => Appointment[];
  isStaffAvailable: (staffId: string, date: Date, time: string, duration: number) => boolean;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  // Load data from localStorage or initialize empty
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('app-customers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('app-staff');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('app-services');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('app-locations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('app-coupons');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert date strings back to Date objects
      return parsed.map((coupon: any) => ({
        ...coupon,
        customDateFrom: coupon.customDateFrom ? new Date(coupon.customDateFrom) : undefined,
        customDateTo: coupon.customDateTo ? new Date(coupon.customDateTo) : undefined,
        createdAt: coupon.createdAt ? new Date(coupon.createdAt) : new Date()
      }));
    }
    return [];
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('app-appointments');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert date strings back to Date objects
      return parsed.map((appointment: any) => ({
        ...appointment,
        date: new Date(appointment.date)
      }));
    }
    return [];
  });
  
  const [giftcards, setGiftcards] = useState<Giftcard[]>(() => {
    const saved = localStorage.getItem('app-giftcards');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert date strings back to Date objects and handle new fields
      return parsed.map((giftcard: any) => ({
        ...giftcard,
        createdAt: new Date(giftcard.createdAt),
        expiresAt: giftcard.expiresAt ? new Date(giftcard.expiresAt) : undefined,
        lastUsageDate: giftcard.lastUsageDate ? new Date(giftcard.lastUsageDate) : undefined,
        transactions: giftcard.transactions?.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        })) || [],
        // Set defaults for new fields
        allowCombination: giftcard.allowCombination ?? true,
        dailyUsage: giftcard.dailyUsage || 0,
        monthlyUsage: giftcard.monthlyUsage || 0,
        categoryRestrictions: giftcard.categoryRestrictions || [],
        timeRestrictions: giftcard.timeRestrictions || {
          allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          allowedHours: { start: '00:00', end: '23:59' },
          blockPeakHours: false
        },
        partialUsageRules: giftcard.partialUsageRules || {
          allowPartialUse: true
        },
        transferRules: giftcard.transferRules || {
          allowTransfer: false
        },
        refundRules: giftcard.refundRules || {
          allowRefund: true,
          refundFeePercentage: 0,
          refundDeadlineDays: 30
        }
      }));
    }
    return [];
  });
  
  const [taxes, setTaxes] = useState<Tax[]>(() => {
    const saved = localStorage.getItem('app-taxes');
    return saved ? JSON.parse(saved) : [];
  });

  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    const saved = localStorage.getItem('app-workflows');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper function to safely save to localStorage with quota handling
  const safeLocalStorageSet = (key: string, data: any) => {
    try {
      const jsonString = JSON.stringify(data);
      
      // Check if data is too large (rough estimate - if string is > 4MB)
      if (jsonString.length > 4 * 1024 * 1024) {
        console.warn(`Data for ${key} is very large (${(jsonString.length / 1024 / 1024).toFixed(2)}MB), consider data cleanup`);
        
        // If it's staff data and too large, we could implement cleanup
        if (key === 'app-staff' && data.length > 50) {
          console.warn('Staff data is large, only keeping most recent 50 records');
          const trimmedData = data.slice(-50); // Keep last 50 staff records
          localStorage.setItem(key, JSON.stringify(trimmedData));
          return;
        }
      }
      
      localStorage.setItem(key, jsonString);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Quota exceeded error
        console.error(`localStorage quota exceeded for ${key}. Attempting cleanup...`);
        
        // Try to free up space by removing old data
        try {
          if (key === 'app-staff') {
            // Keep only the most recent 50 staff records if quota exceeded
            const trimmedData = data.slice(-50);
            localStorage.setItem(key, JSON.stringify(trimmedData));
            console.log(`Trimmed ${key} data to most recent 50 records`);
          } else if (key === 'app-appointments') {
            // Keep only appointments from last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const recentAppointments = data.filter((apt: Appointment) => 
              new Date(apt.date) > sixMonthsAgo
            );
            localStorage.setItem(key, JSON.stringify(recentAppointments));
            console.log(`Trimmed ${key} data to last 6 months`);
          } else {
            // For other data types, try to clear some space by removing the key temporarily
            localStorage.removeItem(key);
            localStorage.setItem(key, JSON.stringify(data.slice(-50)));
            console.log(`Trimmed ${key} data to most recent 50 records`);
          }
        } catch (secondError) {
          console.error(`Failed to save ${key} even after cleanup:`, secondError);
          // As last resort, clear the specific key
          localStorage.removeItem(key);
        }
      } else {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    safeLocalStorageSet('app-customers', customers);
  }, [customers]);
  
  useEffect(() => {
    safeLocalStorageSet('app-staff', staff);
  }, [staff]);
  
  useEffect(() => {
    safeLocalStorageSet('app-services', services);
  }, [services]);
  
  useEffect(() => {
    safeLocalStorageSet('app-locations', locations);
  }, [locations]);
  
  useEffect(() => {
    safeLocalStorageSet('app-coupons', coupons);
  }, [coupons]);
  
  useEffect(() => {
    safeLocalStorageSet('app-appointments', appointments);
  }, [appointments]);
  
  useEffect(() => {
    safeLocalStorageSet('app-giftcards', giftcards);
  }, [giftcards]);
  
  useEffect(() => {
    safeLocalStorageSet('app-taxes', taxes);
  }, [taxes]);

  useEffect(() => {
    safeLocalStorageSet('app-workflows', workflows);
  }, [workflows]);

  // Generate unique IDs
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Customer actions
  const addCustomer = (customer: Omit<Customer, 'id' | 'appointmentHistory'>) => {
    const id = generateId();
    const newCustomer: Customer = {
      ...customer,
      id,
      appointmentHistory: []
    };
    setCustomers(prev => [...prev, newCustomer]);
    return id;
  };

  const updateCustomer = (id: string, customer: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customer } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    // Keep appointments - do not delete them when customer is deleted
  };

  // Staff actions
  const addStaff = (staffData: Omit<Staff, 'id' | 'appointmentIds'>) => {
    const id = generateId();
    const newStaff: Staff = {
      ...staffData,
      id,
      appointmentIds: [],
      locations: staffData.locations || []
    };
    setStaff(prev => [...prev, newStaff]);
    
    // Update services to include this staff member
    if (staffData.services && staffData.services.length > 0) {
      setServices(prev => prev.map(service => 
        staffData.services.includes(service.id)
          ? { ...service, staffIds: [...(service.staffIds || []), id] }
          : service
      ));
    }
    
    // Update locations to include this staff member
    if (staffData.locations && staffData.locations.length > 0) {
      setLocations(prev => prev.map(location => 
        staffData.locations.includes(location.id)
          ? { ...location, staffIds: [...(location.staffIds || []), id] }
          : location
      ));
    }
    
    return id;
  };

  const updateStaff = (id: string, staffData: Partial<Staff>) => {
    const existingStaff = staff.find(s => s.id === id);
    if (!existingStaff) return;
    
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...staffData } : s));
    
    // Update services if staff services changed
    if (staffData.services !== undefined) {
      setServices(prev => prev.map(service => {
        const shouldIncludeStaff = staffData.services?.includes(service.id) || false;
        const currentlyIncludes = service.staffIds?.includes(id) || false;
        
        if (shouldIncludeStaff && !currentlyIncludes) {
          return { ...service, staffIds: [...(service.staffIds || []), id] };
        } else if (!shouldIncludeStaff && currentlyIncludes) {
          return { ...service, staffIds: (service.staffIds || []).filter(staffId => staffId !== id) };
        }
        return service;
      }));
    }
    
    // Update locations if staff locations changed
    if (staffData.locations !== undefined) {
      setLocations(prev => prev.map(location => {
        const shouldIncludeStaff = staffData.locations?.includes(location.id) || false;
        const currentlyIncludes = location.staffIds?.includes(id) || false;
        
        if (shouldIncludeStaff && !currentlyIncludes) {
          return { ...location, staffIds: [...(location.staffIds || []), id] };
        } else if (!shouldIncludeStaff && currentlyIncludes) {
          return { ...location, staffIds: (location.staffIds || []).filter(staffId => staffId !== id) };
        }
        return location;
      }));
    }
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    
    // Remove staff from services
    setServices(prev => prev.map(service => ({
      ...service,
      staffIds: (service.staffIds || []).filter(staffId => staffId !== id)
    })));
    
    // Remove staff from locations
    setLocations(prev => prev.map(location => ({
      ...location,
      staffIds: (location.staffIds || []).filter(staffId => staffId !== id)
    })));
    
    // Update appointments to remove deleted staff
    setAppointments(prev => prev.filter(a => a.staffId !== id));
  };

  // Service actions
  const addService = (service: Omit<Service, 'id'>) => {
    const id = generateId();
    const newService: Service = { ...service, id };
    setServices(prev => [...prev, newService]);
    return id;
  };

  const updateService = (id: string, service: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...service } : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    // Update appointments to remove deleted service
    setAppointments(prev => prev.filter(a => a.serviceId !== id));
  };

  // Location actions
  const addLocation = (location: Omit<Location, 'id'>) => {
    const id = generateId();
    const newLocation: Location = { ...location, id };
    setLocations(prev => [...prev, newLocation]);
    return id;
  };

  const updateLocation = (id: string, location: Partial<Location>) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...location } : l));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    // Update appointments to remove deleted location
    setAppointments(prev => prev.filter(a => a.locationId !== id));
  };

  // Coupon actions
  const addCoupon = (coupon: Omit<Coupon, 'id' | 'timesUsed' | 'usageHistory' | 'createdAt'>) => {
    const id = generateId();
    const newCoupon: Coupon = {
      ...coupon,
      id,
      timesUsed: 0,
      usageHistory: [],
      createdAt: new Date()
    };
    setCoupons(prev => [...prev, newCoupon]);
    return id;
  };

  const updateCoupon = (id: string, coupon: Partial<Coupon>) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...coupon } : c));
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  // Giftcard actions
  const checkGiftcardCodeExists = (code: string, excludeId?: string) => {
    return giftcards.some(g => g.code.toUpperCase() === code.toUpperCase() && g.id !== excludeId);
  };

  const addGiftcard = (giftcard: Omit<Giftcard, 'id' | 'spent' | 'leftover' | 'usageHistory' | 'transactions' | 'createdAt' | 'dailyUsage' | 'monthlyUsage'>) => {
    // Check for code uniqueness
    if (checkGiftcardCodeExists(giftcard.code)) {
      throw new Error('Gift card code already exists');
    }

    const id = generateId();
    const newGiftcard: Giftcard = {
      ...giftcard,
      id,
      spent: 0,
      leftover: giftcard.balance,
      usageHistory: [],
      transactions: [{
        id: generateId(),
        type: 'purchase',
        amount: giftcard.balance,
        timestamp: new Date()
      }],
      dailyUsage: 0,
      monthlyUsage: 0,
      createdAt: new Date(),
      // Set defaults for new fields if not provided
      allowCombination: giftcard.allowCombination ?? true,
      categoryRestrictions: giftcard.categoryRestrictions || [],
      timeRestrictions: giftcard.timeRestrictions || {
        allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        allowedHours: { start: '00:00', end: '23:59' },
        blockPeakHours: false
      },
      partialUsageRules: giftcard.partialUsageRules || {
        allowPartialUse: true
      },
      transferRules: giftcard.transferRules || {
        allowTransfer: false
      },
      refundRules: giftcard.refundRules || {
        allowRefund: true,
        refundFeePercentage: 0,
        refundDeadlineDays: 30
      }
    };
    setGiftcards(prev => [...prev, newGiftcard]);
    return id;
  };

  const updateGiftcard = (id: string, giftcard: Partial<Giftcard>) => {
    setGiftcards(prev => prev.map(g => {
      if (g.id === id) {
        // Check for code uniqueness if code is being changed
        if (giftcard.code && checkGiftcardCodeExists(giftcard.code, id)) {
          throw new Error('Gift card code already exists');
        }
        
        const updated = { ...g, ...giftcard };
        // Recalculate leftover when balance changes
        if (giftcard.balance !== undefined) {
          updated.leftover = giftcard.balance - updated.spent;
        }
        return updated;
      }
      return g;
    }));
  };

  const deleteGiftcard = (id: string) => {
    setGiftcards(prev => prev.filter(g => g.id !== id));
  };

  const rechargeGiftcard = (id: string, amount: number, reason?: string) => {
    setGiftcards(prev => prev.map(g => {
      if (g.id === id) {
        const transaction: GiftcardTransaction = {
          id: generateId(),
          type: 'recharge',
          amount,
          reason,
          timestamp: new Date()
        };
        
        return {
          ...g,
          balance: g.balance + amount,
          leftover: g.leftover + amount,
          transactions: [...g.transactions, transaction]
        };
      }
      return g;
    }));
  };

  const transferGiftcardBalance = (fromId: string, toId: string, amount: number) => {
    setGiftcards(prev => prev.map(g => {
      if (g.id === fromId) {
        if (g.balance < amount) {
          throw new Error('Insufficient balance for transfer');
        }
        if (!g.transferRules.allowTransfer) {
          throw new Error('Transfers not allowed for this gift card');
        }
        if (g.transferRules.maxTransferAmount && amount > g.transferRules.maxTransferAmount) {
          throw new Error(`Transfer amount exceeds maximum of ${g.transferRules.maxTransferAmount}`);
        }
        
        const fee = g.transferRules.transferFee || 0;
        const totalDeduction = amount + fee;
        
        const transaction: GiftcardTransaction = {
          id: generateId(),
          type: 'transfer_out',
          amount: totalDeduction,
          toGiftcardId: toId,
          timestamp: new Date()
        };
        
        return {
          ...g,
          balance: g.balance - totalDeduction,
          leftover: g.leftover - totalDeduction,
          spent: g.spent + totalDeduction,
          transactions: [...g.transactions, transaction]
        };
      }
      
      if (g.id === toId) {
        const transaction: GiftcardTransaction = {
          id: generateId(),
          type: 'transfer_in',
          amount,
          fromGiftcardId: fromId,
          timestamp: new Date()
        };
        
        return {
          ...g,
          balance: g.balance + amount,
          leftover: g.leftover + amount,
          transactions: [...g.transactions, transaction]
        };
      }
      
      return g;
    }));
  };

  const refundGiftcard = (id: string, amount: number, reason?: string) => {
    setGiftcards(prev => prev.map(g => {
      if (g.id === id) {
        if (!g.refundRules.allowRefund) {
          throw new Error('Refunds not allowed for this gift card');
        }
        
        // Check refund deadline
        if (g.refundRules.refundDeadlineDays) {
          const deadlineDate = new Date(g.createdAt);
          deadlineDate.setDate(deadlineDate.getDate() + g.refundRules.refundDeadlineDays);
          if (new Date() > deadlineDate) {
            throw new Error('Refund deadline has passed');
          }
        }
        
        const feePercentage = g.refundRules.refundFeePercentage || 0;
        const fee = (amount * feePercentage) / 100;
        const refundAmount = amount - fee;
        
        const transaction: GiftcardTransaction = {
          id: generateId(),
          type: 'refund',
          amount: refundAmount,
          reason,
          timestamp: new Date()
        };
        
        return {
          ...g,
          balance: Math.max(0, g.balance - amount),
          leftover: Math.max(0, g.leftover - amount),
          spent: g.spent + amount,
          transactions: [...g.transactions, transaction]
        };
      }
      return g;
    }));
  };

  const getGiftcardStatus = (giftcard: Giftcard) => {
    if (!giftcard.isActive) return 'inactive';
    if (giftcard.expiresAt && new Date(giftcard.expiresAt) < new Date()) return 'expired';
    if (giftcard.usageLimit !== 'no-limit') {
      const usageLimit = parseInt(giftcard.usageLimit);
      const timesUsed = giftcard.usageHistory?.length || 0;
      if (timesUsed >= usageLimit) return 'limit-reached';
    }
    if ((giftcard.leftover || giftcard.balance) <= 0) return 'used';
    return 'active';
  };

  const updateExpiredGiftcards = () => {
    const now = new Date();
    setGiftcards(prev => prev.map(g => {
      if (g.expiresAt && new Date(g.expiresAt) < now && g.isActive) {
        return { ...g, isActive: false };
      }
      return g;
    }));
  };

  // Tax actions
  const addTax = (tax: Omit<Tax, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newTax: Tax = {
      ...tax,
      id,
      createdAt: new Date()
    };
    setTaxes(prev => [...prev, newTax]);
    return id;
  };

  const updateTax = (id: string, tax: Partial<Tax>) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, ...tax } : t));
  };

  const deleteTax = (id: string) => {
    setTaxes(prev => prev.filter(t => t.id !== id));
  };

  const checkTaxNameExists = (name: string, excludeId?: string) => {
    return taxes.some(tax => 
      tax.name.toLowerCase() === name.toLowerCase() && 
      tax.id !== excludeId
    );
  };

  const calculateTaxAmount = (baseAmount: number, taxId: string, locationId?: string, serviceId?: string) => {
    const tax = taxes.find(t => t.id === taxId);
    if (!tax || !tax.enabled) return 0;

    // Check location filter
    if (tax.locationsFilter !== 'all-locations' && locationId && tax.locationsFilter !== locationId) {
      return 0;
    }

    // Check service filter
    if (tax.servicesFilter !== 'all-services' && serviceId && tax.servicesFilter !== serviceId) {
      return 0;
    }

    const taxAmount = (baseAmount * tax.amount) / 100;

    // Apply minimum and maximum limits
    let finalAmount = taxAmount;
    if (tax.minimumAmount && taxAmount < tax.minimumAmount) {
      finalAmount = tax.minimumAmount;
    }
    if (tax.maximumAmount && taxAmount > tax.maximumAmount) {
      finalAmount = tax.maximumAmount;
    }

    return Math.round(finalAmount * 100) / 100; // Round to 2 decimal places
  };

  const getApplicableTaxes = (locationId?: string, serviceId?: string) => {
    return taxes.filter(tax => {
      if (!tax.enabled) return false;

      // Check location filter
      if (tax.locationsFilter !== 'all-locations' && locationId && tax.locationsFilter !== locationId) {
        return false;
      }

      // Check service filter
      if (tax.servicesFilter !== 'all-services' && serviceId && tax.servicesFilter !== serviceId) {
        return false;
      }

      return true;
    });
  };

  const duplicateTax = (id: string) => {
    const originalTax = taxes.find(t => t.id === id);
    if (!originalTax) return '';

    let duplicateName = `${originalTax.name} (Copy)`;
    let counter = 1;
    
    // Ensure unique name for duplicate
    while (checkTaxNameExists(duplicateName)) {
      counter++;
      duplicateName = `${originalTax.name} (Copy ${counter})`;
    }

    const duplicateData = {
      ...originalTax,
      name: duplicateName,
      enabled: false // Disable duplicates by default for safety
    };

    // Remove id and createdAt to create new ones
    const { id: _, createdAt: __, ...taxData } = duplicateData;
    
    return addTax(taxData);
  };

  // Helper function to auto-create customer from appointment custom fields
  const autoCreateCustomerFromAppointment = (appointment: Omit<Appointment, 'id'>) => {
    const customFields = appointment.customFields || {};
    
    // Extract customer info from custom fields using common field names/variations
    const firstName = customFields.firstName || customFields['First Name'] || customFields['First-name'] || customFields['first-name'] || customFields.firstname || '';
    const lastName = customFields.lastName || customFields['Last Name'] || customFields['Last-name'] || customFields['last-name'] || customFields.lastname || '';
    const email = customFields.email || customFields['Email'] || '';
    const phone = customFields.phone || customFields['Phone'] || customFields.phoneNumber || '';
    const gender = customFields.gender || customFields['Gender'] || '';
    const dateOfBirth = customFields.dateOfBirth || customFields['Date of Birth'] || customFields['Date-of-birth'] || customFields['date-of-birth'] || '';
    const note = customFields.note || customFields['Note'] || '';

    // Only create customer if we have meaningful data (at least first name, last name, or email)
    if ((firstName && lastName) || email || phone) {
      // Enhanced duplicate detection - check multiple criteria
      const existingCustomer = customers.find(customer => {
        // Match by email (highest priority, case insensitive)
        if (email && customer.email && customer.email.toLowerCase().trim() === email.toLowerCase().trim()) {
          return true;
        }
        
        // Match by phone number (remove all non-digits for comparison)
        if (phone && customer.phone) {
          const cleanPhone = phone.replace(/\D/g, '');
          const cleanCustomerPhone = customer.phone.replace(/\D/g, '');
          if (cleanPhone && cleanCustomerPhone && cleanPhone.length >= 10 && cleanPhone === cleanCustomerPhone) {
            return true;
          }
        }
        
        // Match by full name combination (case insensitive, exact match)
        if (firstName && lastName && customer.firstName && customer.lastName) {
          const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
          const customerFullName = `${customer.firstName} ${customer.lastName}`.toLowerCase().trim();
          if (fullName === customerFullName && fullName.length > 3) { // Avoid matching very short names
            return true;
          }
        }
        
        return false;
      });

      if (existingCustomer) {
        // Update existing customer with any missing information from the form
        const updatedCustomerData: Partial<Customer> = {};
        
        if (firstName && !existingCustomer.firstName) updatedCustomerData.firstName = firstName;
        if (lastName && !existingCustomer.lastName) updatedCustomerData.lastName = lastName;
        if (email && !existingCustomer.email) updatedCustomerData.email = email;
        if (phone && !existingCustomer.phone) updatedCustomerData.phone = phone;
        if (gender && !existingCustomer.gender) updatedCustomerData.gender = gender;
        if (dateOfBirth && !existingCustomer.dateOfBirth) updatedCustomerData.dateOfBirth = new Date(dateOfBirth);
        if (note && !existingCustomer.note) updatedCustomerData.note = note;
        
        // Update the customer with new information if any missing data was found
        if (Object.keys(updatedCustomerData).length > 0) {
          updateCustomer(existingCustomer.id, updatedCustomerData);
        }
        
        return existingCustomer.id; // Return existing customer ID
      }

      // Create new customer only if no duplicates found
      const newCustomerId = addCustomer({
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        gender: gender || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        note: note || 'Auto-created from appointment booking',
        allowLogin: true
      });

      return newCustomerId;
    }
    
    return appointment.customerId; // Return original customer ID if no auto-creation
  };

  // Appointment actions
  const addAppointment = (appointment: Omit<Appointment, 'id'>) => {
    const id = generateId();
    const settings = getBusinessSettings();
    
    // Auto-create customer if appointment has customer data in custom fields
    let customerId = appointment.customerId;
    if (appointment.customFields && Object.keys(appointment.customFields).length > 0) {
      customerId = autoCreateCustomerFromAppointment(appointment);
    }
    
    // Auto-confirm booking if enabled and appointment is pending
    let status = appointment.status;
    if (settings.autoConfirmBookings && status === 'Pending') {
      status = 'Confirmed';
    }
    
    const newAppointment: Appointment = { ...appointment, id, customerId, status };
    setAppointments(prev => [...prev, newAppointment]);
    
    // Update customer appointment history
    setCustomers(prev => prev.map(c => 
      c.id === customerId 
        ? { ...c, appointmentHistory: [...c.appointmentHistory, id] }
        : c
    ));
    
    // Update staff appointment list
    setStaff(prev => prev.map(s => 
      s.id === appointment.staffId 
        ? { ...s, appointmentIds: [...s.appointmentIds, id] }
        : s
    ));

    // Update gift card usage history and balance
    if (appointment.appliedGiftcards && appointment.appliedGiftcards.length > 0) {
      setGiftcards(prev => prev.map(gc => {
        if (appointment.appliedGiftcards?.includes(gc.id)) {
          // Calculate amount used from this gift card
          const giftcardsUsed = appointment.appliedGiftcards?.length || 1;
          const amountUsed = Math.min(appointment.totalPrice / giftcardsUsed, gc.leftover);
          
          return {
            ...gc,
            spent: gc.spent + amountUsed,
            leftover: Math.max(0, gc.leftover - amountUsed),
            usageHistory: [...(gc.usageHistory || []), id]
          };
        }
        return gc;
      }));
    }

    // Update coupon usage history
    if (appointment.appliedCoupons && appointment.appliedCoupons.length > 0) {
      setCoupons(prev => prev.map(coupon => {
        if (appointment.appliedCoupons?.includes(coupon.id)) {
          return {
            ...coupon,
            timesUsed: coupon.timesUsed + 1,
            usageHistory: [...(coupon.usageHistory || []), id]
          };
        }
        return coupon;
      }));
    }
    
    return id;
  };

  const updateAppointment = (id: string, appointment: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...appointment } : a));
  };

  const deleteAppointment = (id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      // Remove from customer history
      setCustomers(prev => prev.map(c => 
        c.id === appointment.customerId 
          ? { ...c, appointmentHistory: c.appointmentHistory.filter(aId => aId !== id) }
          : c
      ));
      
      // Remove from staff appointments
      setStaff(prev => prev.map(s => 
        s.id === appointment.staffId 
          ? { ...s, appointmentIds: s.appointmentIds.filter(aId => aId !== id) }
          : s
      ));
    }
    
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // Workflow actions
  const addWorkflow = (workflow: Omit<Workflow, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: new Date()
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    return id;
  };

  const updateWorkflow = (id: string, workflow: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...workflow } : w));
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  // Helper function to normalize time string to hours and minutes
  const normalizeTimeStringToHoursMinutes = (timeString: string): { hours: number; minutes: number } | null => {
    if (!timeString) return null;

    // Handle "HH:mm" format (24-hour)
    const time24Match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (time24Match) {
      const hours = parseInt(time24Match[1], 10);
      const minutes = parseInt(time24Match[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }

    // Handle "h:mm AM/PM" format (12-hour)
    const time12Match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (time12Match) {
      let hours = parseInt(time12Match[1], 10);
      const minutes = parseInt(time12Match[2], 10);
      const period = time12Match[3].toUpperCase();

      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        return { hours, minutes };
      }
    }

    return null;
  };

  // Helper function to calculate appointment end time
  const getAppointmentEndDateTime = (appointment: Appointment): Date | null => {
    try {
      // Parse the appointment time
      const timeData = normalizeTimeStringToHoursMinutes(appointment.time);
      if (!timeData) return null;

      // Create start datetime
      const startDateTime = new Date(appointment.date);
      startDateTime.setHours(timeData.hours, timeData.minutes, 0, 0);

      // Get service to calculate total duration
      const service = getServiceById(appointment.serviceId);
      if (!service) return null;

      let totalDuration = service.duration;

      // Add duration from selected extras
      if (appointment.selectedExtras && appointment.selectedExtras.length > 0) {
        appointment.selectedExtras.forEach(extraId => {
          const extra = service.extras?.find(e => e.id === extraId);
          if (extra) {
            totalDuration += extra.duration;
          }
        });
      }

      // Calculate end time
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);
      return endDateTime;
    } catch (error) {
      console.error('Error calculating appointment end time:', error);
      return null;
    }
  };

  // Helper functions
  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getStaffById = (id: string) => staff.find(s => s.id === id);
  const getServiceById = (id: string) => services.find(s => s.id === id);
  const getLocationById = (id: string) => locations.find(l => l.id === id);
  const getCouponById = (id: string) => coupons.find(c => c.id === id);
  const getGiftcardById = (id: string) => giftcards.find(g => g.id === id);
  const getTaxById = (id: string) => taxes.find(t => t.id === id);
  const getWorkflowById = (id: string) => workflows.find(w => w.id === id);
  const getAppointmentById = (id: string) => appointments.find(a => a.id === id);

  const getAvailableStaffForService = (serviceId: string, locationId: string) => {
    console.log('Getting available staff for service:', serviceId, 'and location:', locationId);
    
    if (!serviceId || !locationId) {
      console.log('Missing serviceId or locationId');
      return [];
    }
    
    const service = getServiceById(serviceId);
    const location = getLocationById(locationId);
    
    console.log('Found service:', service);
    console.log('Found location:', location);
    
    if (!service || !location) {
      console.log('Service or location not found');
      return [];
    }
    
    // Filter staff that are assigned to both the service and location
    const availableStaff = staff.filter(s => {
      const isInService = s.services?.includes(serviceId) || service.staffIds?.includes(s.id);
      const isInLocation = s.locations?.includes(locationId) || location.staffIds?.includes(s.id);
      
      console.log(`Staff ${s.name}: isInService=${isInService}, isInLocation=${isInLocation}`);
      
      return isInService && isInLocation;
    });
    
    console.log('Available staff:', availableStaff);
    return availableStaff;
  };

  const getCustomerAppointments = (customerId: string) => {
    return appointments.filter(a => a.customerId === customerId);
  };

  const getStaffAppointments = (staffId: string) => {
    return appointments.filter(a => a.staffId === staffId);
  };

  const isStaffAvailable = (staffId: string, date: Date, time: string, duration: number) => {
    const staffAppointments = getStaffAppointments(staffId);
    const appointmentDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const appointmentEnd = new Date(appointmentDateTime.getTime() + duration * 60000);
    
    return !staffAppointments.some(appointment => {
      const existingDateTime = new Date(appointment.date);
      const [existingHours, existingMinutes] = appointment.time.split(':').map(Number);
      existingDateTime.setHours(existingHours, existingMinutes, 0, 0);
      
      const service = getServiceById(appointment.serviceId);
      const existingEnd = new Date(existingDateTime.getTime() + (service?.duration || 60) * 60000);
      
      return (appointmentDateTime < existingEnd && appointmentEnd > existingDateTime);
    });
  };

  // Auto-complete past appointments
  useEffect(() => {
    const markPastAppointments = () => {
      const settings = getBusinessSettings();
      
      // Exit early if auto-complete is disabled
      if (!settings.autoCompleteBookings) {
        return;
      }

      const now = new Date();
      let hasChanges = false;

      const updatedAppointments = appointments.map(appointment => {
        // Skip appointments that are already in final states
        const finalStatuses = ['Cancelled', 'Rejected', 'Completed', 'No-show', 'Emergency'];
        if (finalStatuses.includes(appointment.status)) {
          return appointment;
        }

        // Only auto-complete Confirmed and Rescheduled appointments
        if (appointment.status === 'Confirmed' || appointment.status === 'Rescheduled') {
          const endDateTime = getAppointmentEndDateTime(appointment);
          
          if (endDateTime && endDateTime <= now) {
            hasChanges = true;
            return { ...appointment, status: 'Completed' as const };
          }
        }

        return appointment;
      });

      // Only update if there were actual changes
      if (hasChanges) {
        setAppointments(updatedAppointments);
      }
    };

    // Mark past appointments immediately
    markPastAppointments();

    // Set up interval to check every minute
    const interval = setInterval(markPastAppointments, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [appointments, services]); // Include services in dependencies since we need them to calculate end times

  const value: AppDataContextType = {
    customers,
    staff,
    services,
    locations,
    coupons,
    giftcards,
    taxes,
    workflows,
    appointments,
    
    addCustomer,
    updateCustomer,
    deleteCustomer,
    
    addStaff,
    updateStaff,
    deleteStaff,
    
    addService,
    updateService,
    deleteService,
    
    addLocation,
    updateLocation,
    deleteLocation,
    
    addCoupon,
    updateCoupon,
    deleteCoupon,
    
    addGiftcard,
    updateGiftcard,
    deleteGiftcard,
    rechargeGiftcard,
    transferGiftcardBalance,
    refundGiftcard,
    checkGiftcardCodeExists,
    getGiftcardStatus,
    updateExpiredGiftcards,
    
    addTax,
    updateTax,
    deleteTax,
    checkTaxNameExists,
    calculateTaxAmount,
    getApplicableTaxes,
    duplicateTax,
    
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    
    addAppointment,
    updateAppointment,
    deleteAppointment,
    
    getCustomerById,
    getStaffById,
    getServiceById,
    getLocationById,
    getCouponById,
    getGiftcardById,
    getTaxById,
    getWorkflowById,
    getAppointmentById,
    
    getAvailableStaffForService,
    getCustomerAppointments,
    getStaffAppointments,
    isStaffAvailable,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};
