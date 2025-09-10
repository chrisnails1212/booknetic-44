
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusColors, getStatusIcon } from '@/utils/appointmentColors';

const statuses = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
  { key: 'no-show', label: 'No Show' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'rescheduled', label: 'Rescheduled' },
  { key: 'rejected', label: 'Rejected' }
];

export const ColorLegend = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-medium text-slate-900 mb-3">Status Legend</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const colors = getStatusColors(status.key);
          const icon = getStatusIcon(status.key);
          
          return (
            <Badge
              key={status.key}
              variant="outline"
              className={`${colors.background} ${colors.text} border-transparent`}
            >
              <span className="mr-1">{icon}</span>
              {status.label}
            </Badge>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Color variations indicate different staff members
      </p>
    </div>
  );
};
