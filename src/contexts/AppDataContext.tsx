import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  servicesFilter?: string;
  staffFilter?: string;
  timesUsed: number;
  status: 'Active' | 'Inactive';
  usageHistory: string[];
}

export interface Giftcard {
  id: string;
  code: string;
  balance: number;
  originalAmount: number;
  spent: number;
  leftover: number;
  usageHistory: string[];
  locationFilter: string;
  servicesFilter: string;
  staffFilter: string;
  usageLimit: string;
  oncePer: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Tax {
  id: string;
  name: string;
  amount: number;
  locationsFilter: string;
  servicesFilter: string;
  incorporateIntoPrice: boolean;
  enabled: boolean;
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
  
  addCoupon: (coupon: Omit<Coupon, 'id' | 'timesUsed' | 'usageHistory'>) => string;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  
  addGiftcard: (giftcard: Omit<Giftcard, 'id' | 'spent' | 'leftover' | 'usageHistory' | 'createdAt'>) => string;
  updateGiftcard: (id: string, giftcard: Partial<Giftcard>) => void;
  deleteGiftcard: (id: string) => void;
  
  addTax: (tax: Omit<Tax, 'id' | 'createdAt'>) => string;
  updateTax: (id: string, tax: Partial<Tax>) => void;
  deleteTax: (id: string) => void;
  
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
    return saved ? JSON.parse(saved) : [];
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
      // Convert date strings back to Date objects
      return parsed.map((giftcard: any) => ({
        ...giftcard,
        createdAt: new Date(giftcard.createdAt),
        expiresAt: giftcard.expiresAt ? new Date(giftcard.expiresAt) : undefined
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
  const addCoupon = (coupon: Omit<Coupon, 'id' | 'timesUsed' | 'usageHistory'>) => {
    const id = generateId();
    const newCoupon: Coupon = {
      ...coupon,
      id,
      timesUsed: 0,
      usageHistory: []
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
  const addGiftcard = (giftcard: Omit<Giftcard, 'id' | 'spent' | 'leftover' | 'usageHistory' | 'createdAt'>) => {
    const id = generateId();
    const newGiftcard: Giftcard = {
      ...giftcard,
      id,
      spent: 0,
      leftover: giftcard.balance,
      usageHistory: [],
      createdAt: new Date()
    };
    setGiftcards(prev => [...prev, newGiftcard]);
    return id;
  };

  const updateGiftcard = (id: string, giftcard: Partial<Giftcard>) => {
    setGiftcards(prev => prev.map(g => {
      if (g.id === id) {
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
    
    // Auto-create customer if appointment has customer data in custom fields
    let customerId = appointment.customerId;
    if (appointment.customFields && Object.keys(appointment.customFields).length > 0) {
      customerId = autoCreateCustomerFromAppointment(appointment);
    }
    
    // Get business settings for auto-approve logic
    const businessSettings = (() => {
      try {
        const stored = localStorage.getItem('businessSettings');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading business settings:', error);
      }
      return {};
    })();
    
    // Auto-approve logic: if enabled, new bookings go from Pending to Confirmed
    let initialStatus = appointment.status || 'Pending';
    if (businessSettings.autoApproveBookings && initialStatus === 'Pending') {
      initialStatus = 'Confirmed';
    }
    
    const newAppointment: Appointment = { 
      ...appointment, 
      id, 
      customerId,
      status: initialStatus
    };
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

  // Auto-complete past appointments and handle auto-booking rules
  useEffect(() => {
    const processBookingRules = () => {
      const now = new Date();
      let hasChanges = false;

      // Get business settings for auto-booking rules
      const businessSettings = (() => {
        try {
          const stored = localStorage.getItem('businessSettings');
          if (stored) {
            return JSON.parse(stored);
          }
        } catch (error) {
          console.error('Error loading business settings:', error);
        }
        return {};
      })();

      const updatedAppointments = appointments.map(appointment => {
        // Skip appointments that are already in final states for completion
        const finalStatuses = ['Cancelled', 'Rejected', 'Completed', 'No-show', 'Emergency'];
        
        // Auto-Complete Logic (only if enabled)
        if (businessSettings.autoCompleteBookings !== false) { // Default is true
          if (appointment.status === 'Confirmed' || appointment.status === 'Rescheduled') {
            const endDateTime = getAppointmentEndDateTime(appointment);
            
            if (endDateTime && endDateTime <= now) {
              hasChanges = true;
              return { ...appointment, status: 'Completed' as const };
            }
          }
        }

        // Auto-No-Show Detection Logic (only if enabled)
        if (businessSettings.autoNoShowDetection && !finalStatuses.includes(appointment.status)) {
          if (appointment.status === 'Confirmed' || appointment.status === 'Rescheduled') {
            const appointmentDateTime = new Date(appointment.date);
            const [hours, minutes] = appointment.time.split(':').map(Number);
            appointmentDateTime.setHours(hours, minutes, 0, 0);
            
            const noShowHours = businessSettings.noShowHours || 2;
            const noShowDeadline = new Date(appointmentDateTime.getTime() + (noShowHours * 60 * 60 * 1000));
            
            if (now >= noShowDeadline) {
              hasChanges = true;
              return { ...appointment, status: 'No-show' as const };
            }
          }
        }

        return appointment;
      });

      // Only update if there were actual changes
      if (hasChanges) {
        setAppointments(updatedAppointments);
      }
    };

    // Process booking rules immediately
    processBookingRules();

    // Set up interval to check every minute
    const interval = setInterval(processBookingRules, 60000);

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
    
    addTax,
    updateTax,
    deleteTax,
    
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
