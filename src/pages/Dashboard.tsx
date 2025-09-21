
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { AppointmentStats } from '@/components/dashboard/AppointmentStats';
import { ActivityGraph } from '@/components/dashboard/ActivityGraph';

import { Users, Clock, DollarSign, UserPlus } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFilter } from '@/hooks/useDateFilter';

const Dashboard = () => {
  const { appointments, customers, services } = useAppData();
  const { formatPrice } = useCurrency();
  const { 
    activeFilter, 
    setActiveFilter, 
    filteredAppointments 
  } = useDateFilter(appointments);

  // Calculate statistics based on filtered appointments
  const totalRevenue = filteredAppointments
    .filter(apt => apt.status === 'Completed')
    .reduce((sum, apt) => sum + apt.totalPrice, 0);

  const totalDuration = filteredAppointments
    .filter(apt => apt.status === 'Completed')
    .reduce((sum, apt) => {
      const service = services.find(s => s.id === apt.serviceId);
      let baseDuration = service?.duration || 0;
      
      // Add extras duration
      if (apt.selectedExtras && apt.selectedExtras.length > 0) {
        apt.selectedExtras.forEach(extraId => {
          const extra = service?.extras?.find(e => e.id === extraId);
          if (extra) baseDuration += extra.duration || 0;
        });
      }
      
      
      return sum + baseDuration;
    }, 0);

  // Get new customers based on the selected date filter
  const { start: filterStart, end: filterEnd } = (() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (activeFilter) {
      case 'Today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'Yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'This week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
      default:
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return { start: thirtyDaysAgo, end: now };
    }
  })();

  const newCustomers = customers.filter(customer => {
    const customerAppointments = appointments.filter(apt => apt.customerId === customer.id);
    if (customerAppointments.length === 0) return false;
    
    const firstAppointment = customerAppointments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    
    const firstAppointmentDate = new Date(firstAppointment.date);
    return firstAppointmentDate >= filterStart && firstAppointmentDate <= filterEnd;
  }).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        
        <DateFilter 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Appointments"
            value={filteredAppointments.length.toString()}
            icon={Users}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-100"
          />
          <StatsCard
            title="Durations"
            value={`${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`}
            icon={Clock}
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
          />
          <StatsCard
            title="Revenue"
            value={formatPrice(totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatsCard
            title="New Customers"
            value={newCustomers.toString()}
            icon={UserPlus}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-100"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AppointmentStats />
          <ActivityGraph />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
