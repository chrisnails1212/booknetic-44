interface BusinessSettings {
  timezone: string;
  dateFormat: string;
  allowCancellation: boolean;
  requireConfirmation: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  cancellationCutoff: string;
  rescheduleCutoff: string;
  autoConfirmBookings: boolean;
  autoCompleteBookings: boolean;
}

const defaultSettings: BusinessSettings = {
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  allowCancellation: true,
  requireConfirmation: false,
  emailNotifications: true,
  smsNotifications: false,
  cancellationCutoff: '24h',
  rescheduleCutoff: '24h',
  autoConfirmBookings: false,
  autoCompleteBookings: false
};

export const getBusinessSettings = (): BusinessSettings => {
  try {
    const stored = localStorage.getItem('businessSettings');
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading business settings:', error);
  }
  return defaultSettings;
};

export const updateBusinessSettings = (settings: Partial<BusinessSettings>): void => {
  try {
    const current = getBusinessSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('businessSettings', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving business settings:', error);
  }
};

export const getCutoffHours = (cutoff: string): number => {
  switch (cutoff) {
    case '6h': return 6;
    case '12h': return 12;
    case '24h': return 24;
    case '48h': return 48;
    case 'no-limit': return 0;
    default: return 24;
  }
};

export const canCancelAppointment = (appointmentDate: Date, appointmentTime: string): { allowed: boolean; reason?: string } => {
  const settings = getBusinessSettings();
  
  if (!settings.allowCancellation) {
    return { allowed: false, reason: 'Cancellations are not allowed' };
  }

  const cutoffHours = getCutoffHours(settings.cancellationCutoff);
  
  if (cutoffHours === 0) {
    return { allowed: true };
  }

  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(parseInt(appointmentTime.split(':')[0]), parseInt(appointmentTime.split(':')[1]));
  
  const now = new Date();
  const timeDifferenceMs = appointmentDateTime.getTime() - now.getTime();
  const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

  if (timeDifferenceHours < cutoffHours) {
    const cutoffText = settings.cancellationCutoff === 'no-limit' ? 'any time' : 
      `at least ${getCutoffHours(settings.cancellationCutoff)} hours in advance`;
    return { 
      allowed: false, 
      reason: `Appointments can only be cancelled ${cutoffText}` 
    };
  }

  return { allowed: true };
};

export const canRescheduleAppointment = (appointmentDate: Date, appointmentTime: string): { allowed: boolean; reason?: string } => {
  const settings = getBusinessSettings();
  
  const cutoffHours = getCutoffHours(settings.rescheduleCutoff);
  
  if (cutoffHours === 0) {
    return { allowed: true };
  }

  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(parseInt(appointmentTime.split(':')[0]), parseInt(appointmentTime.split(':')[1]));
  
  const now = new Date();
  const timeDifferenceMs = appointmentDateTime.getTime() - now.getTime();
  const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

  if (timeDifferenceHours < cutoffHours) {
    const cutoffText = settings.rescheduleCutoff === 'no-limit' ? 'any time' : 
      `at least ${getCutoffHours(settings.rescheduleCutoff)} hours in advance`;
    return { 
      allowed: false, 
      reason: `Appointments can only be rescheduled ${cutoffText}` 
    };
  }

  return { allowed: true };
};

export type { BusinessSettings };