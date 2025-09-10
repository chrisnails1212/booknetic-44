import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { downloadChartAsImage } from '@/utils/downloadChart';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ReportFilters, FilterState } from '@/components/reports/ReportFilters';
import { useReportData } from '@/hooks/useReportData';

const Reports = () => {
  const { appointments, staff, services, locations } = useAppData();
  const { currency, formatPrice } = useCurrency();
  
  const [filters, setFilters] = useState<FilterState>({
    serviceId: '',
    locationId: '',
    staffId: '',
    status: '',
    dateRange: 'DAILY'
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const { chartData, locationEarnings, staffEarnings, totalStats } = useReportData(
    appointments,
    staff,
    services,
    locations,
    filters
  );

  const handleDownloadReport = (reportId: string, reportName: string) => {
    downloadChartAsImage(reportId, reportName);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            Reports
            <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">4</span>
          </h1>
        </div>


        {/* Main Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports by Number of Appointments */}
          <Card className="bg-white" id="appointments-report">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                  REPORTS BY THE NUMBER OF APPOINTMENTS
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport('appointments-report', 'appointments-report')}
                    className="text-slate-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Filter Row */}
              <div className="pt-4">
                <ReportFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  services={services}
                  locations={locations}
                  staff={staff}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Reports by Appointment Earnings */}
          <Card className="bg-white" id="earnings-report">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                  REPORTS BY APPOINTMENT EARNINGS ({currency.symbol})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport('earnings-report', 'earnings-report')}
                    className="text-slate-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Filter Row */}
              <div className="pt-4">
                <ReportFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  services={services}
                  locations={locations}
                  staff={staff}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Earning Locations */}
          <Card className="bg-white" id="locations-report">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                  MOST EARNING LOCATIONS
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport('locations-report', 'most-earning-locations')}
                    className="text-slate-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationEarnings.length > 0 ? (
                  locationEarnings.map((location, index) => (
                    <div key={location.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium text-slate-900">{location.name}</span>
                      </div>
                      <span className="font-bold text-green-600">{formatPrice(location.earnings)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Most Earning Staffs */}
          <Card className="bg-white" id="staff-report">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                  MOST EARNING STAFFS
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport('staff-report', 'most-earning-staff')}
                    className="text-slate-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffEarnings.length > 0 ? (
                  staffEarnings.map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium text-slate-900">{member.name}</span>
                      </div>
                      <span className="font-bold text-green-600">{formatPrice(member.earnings)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
