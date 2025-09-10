
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAppData } from '@/contexts/AppDataContext';

const yearOptions = ['2021', '2022', '2023', '2024', '2025'];

export const ActivityGraph = () => {
  const { appointments } = useAppData();
  const [selectedPeriod, setSelectedPeriod] = useState('Last 1 year');

  const generateGraphData = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (selectedPeriod === 'Last 1 year') {
      // Generate last 12 months data
      const data = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const appointmentCount = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= monthStart && aptDate <= monthEnd;
        }).length;
        
        data.push({
          month: monthNames[date.getMonth()],
          appointments: appointmentCount
        });
      }
      return data;
    } else {
      // Generate data for specific year
      const year = parseInt(selectedPeriod);
      const data = [];
      
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        const appointmentCount = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= monthStart && aptDate <= monthEnd;
        }).length;
        
        data.push({
          month: monthNames[month],
          appointments: appointmentCount
        });
      }
      return data;
    }
  }, [appointments, selectedPeriod]);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-slate-800">Graph</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={selectedPeriod === 'Last 1 year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('Last 1 year')}
            className={selectedPeriod === 'Last 1 year' ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}
          >
            Last 1 year
          </Button>
          {yearOptions.map((year) => (
            <Button
              key={year}
              variant={selectedPeriod === year ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(year)}
              className={selectedPeriod === year ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}
            >
              {year}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={generateGraphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
