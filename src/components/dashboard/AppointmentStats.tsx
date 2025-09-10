
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppData } from '@/contexts/AppDataContext';

export const AppointmentStats = () => {
  const { appointments } = useAppData();

  // Calculate stats based on actual appointment data
  const stats = {
    Approved: appointments.filter(apt => apt.status === 'Confirmed').length,
    Pending: appointments.filter(apt => apt.status === 'Pending').length,
    Rescheduled: appointments.filter(apt => apt.status === 'Rescheduled').length,
    Canceled: appointments.filter(apt => apt.status === 'Cancelled').length,
    Rejected: appointments.filter(apt => apt.status === 'Rejected').length,
    Completed: appointments.filter(apt => apt.status === 'Completed').length,
    'No-show': appointments.filter(apt => apt.status === 'No-show').length,
    Emergency: appointments.filter(apt => apt.status === 'Emergency').length,
  };

  const appointmentStatuses = [
    { status: 'Approved', count: stats.Approved, color: 'text-green-600', bgColor: 'bg-green-100' },
    { status: 'Pending', count: stats.Pending, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { status: 'Rescheduled', count: stats.Rescheduled, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { status: 'Canceled', count: stats.Canceled, color: 'text-red-600', bgColor: 'bg-red-100' },
    { status: 'Rejected', count: stats.Rejected, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { status: 'Completed', count: stats.Completed, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { status: 'No-show', count: stats['No-show'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { status: 'Emergency', count: stats.Emergency, color: 'text-red-800', bgColor: 'bg-red-200' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">Appointment's Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointmentStatuses.map((item) => (
          <div key={item.status} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${item.bgColor}`}></div>
              <span className="text-sm font-medium text-slate-700">{item.status}</span>
            </div>
            <span className={`text-sm font-semibold ${item.color}`}>{item.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
