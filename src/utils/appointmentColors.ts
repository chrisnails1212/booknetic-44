
import type { Appointment } from '@/contexts/AppDataContext';

// Status-based color mapping
export const getStatusColors = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return {
        background: 'bg-yellow-100',
        border: 'border-l-4 border-yellow-500',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500'
      };
    case 'confirmed':
      return {
        background: 'bg-green-100',
        border: 'border-l-4 border-green-500',
        text: 'text-green-800',
        dot: 'bg-green-500'
      };
    case 'cancelled':
      return {
        background: 'bg-red-100',
        border: 'border-l-4 border-red-500',
        text: 'text-red-800',
        dot: 'bg-red-500'
      };
    case 'completed':
      return {
        background: 'bg-blue-100',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-800',
        dot: 'bg-blue-500'
      };
    case 'no-show':
      return {
        background: 'bg-purple-100',
        border: 'border-l-4 border-purple-500',
        text: 'text-purple-800',
        dot: 'bg-purple-500'
      };
    case 'emergency':
      return {
        background: 'bg-red-200',
        border: 'border-l-4 border-red-700',
        text: 'text-red-900',
        dot: 'bg-red-700'
      };
    case 'rescheduled':
      return {
        background: 'bg-yellow-100',
        border: 'border-l-4 border-yellow-500',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500'
      };
    case 'rejected':
      return {
        background: 'bg-gray-100',
        border: 'border-l-4 border-gray-500',
        text: 'text-gray-800',
        dot: 'bg-gray-500'
      };
    default:
      return {
        background: 'bg-blue-100',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-800',
        dot: 'bg-blue-500'
      };
  }
};

// Generate staff color variant based on staff ID
export const getStaffColorVariant = (staffId: string, baseColors: ReturnType<typeof getStatusColors>) => {
  // Simple hash function to generate consistent color variations
  const hash = staffId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const variant = hash % 3;
  
  // Return different opacity/saturation variants
  switch (variant) {
    case 0:
      return baseColors; // Normal intensity
    case 1:
      // Slightly more saturated
      return {
        ...baseColors,
        background: baseColors.background.replace('100', '200'),
        text: baseColors.text.replace('800', '900')
      };
    case 2:
      // Slightly less saturated
      return {
        ...baseColors,
        background: baseColors.background.replace('100', '50'),
        text: baseColors.text.replace('800', '700')
      };
    default:
      return baseColors;
  }
};

// Get appointment colors combining status and staff variations
export const getAppointmentColors = (appointment: Appointment) => {
  const statusColors = getStatusColors(appointment.status);
  return getStaffColorVariant(appointment.staffId, statusColors);
};

// Status icon mapping
export const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '⏳';
    case 'confirmed':
      return '✅';
    case 'cancelled':
      return '❌';
    case 'completed':
      return '✓';
    case 'no-show':
      return '👻';
    case 'emergency':
      return '🚨';
    case 'rescheduled':
      return '📅';
    case 'rejected':
      return '❌';
    default:
      return '📅';
  }
};
